import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, toMonthly } from '@/lib/format';
import type { Debt, Expense, Income } from '@/lib/types';

export const metadata = { title: 'Tableau de bord — Finances' };

export default async function DashboardPage() {
  const supabase = await createClient();

  const [incomesRes, expensesRes, debtsRes] = await Promise.all([
    supabase.from('incomes').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('debts').select('*'),
  ]);

  const incomes = (incomesRes.data ?? []) as Income[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const debts = (debtsRes.data ?? []) as Debt[];

  // --- Indicateurs (repris du fichier Excel) ------------------------------
  const monthlyIncome = incomes.reduce(
    (sum, i) => sum + toMonthly(Number(i.amount), i.frequency),
    0,
  );
  const monthlyExpenses = expenses.reduce(
    (sum, e) => sum + toMonthly(Number(e.amount), e.frequency),
    0,
  );
  const monthlyDebtPayments = debts.reduce(
    (sum, d) => sum + Number(d.minimum_payment),
    0,
  );
  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0);

  // Solde disponible = revenus - dépenses - paiements de dettes (base mensuelle)
  const available = monthlyIncome - monthlyExpenses - monthlyDebtPayments;

  // --- Alertes ------------------------------------------------------------
  const alerts: { level: 'warning' | 'danger'; text: string }[] = [];

  if (available < 0) {
    alerts.push({
      level: 'danger',
      text: `Budget mensuel négatif : il manque ${formatCurrency(
        Math.abs(available),
      )} pour couvrir dépenses et dettes.`,
    });
  }

  for (const d of debts) {
    if (d.credit_limit && Number(d.balance) > Number(d.credit_limit)) {
      alerts.push({
        level: 'danger',
        text: `« ${d.label} » dépasse sa limite de crédit (${formatCurrency(
          Number(d.balance),
        )} / ${formatCurrency(Number(d.credit_limit))}).`,
      });
    } else if (
      d.credit_limit &&
      Number(d.balance) > Number(d.credit_limit) * 0.9
    ) {
      alerts.push({
        level: 'warning',
        text: `« ${d.label} » approche de sa limite (${Math.round(
          (Number(d.balance) / Number(d.credit_limit)) * 100,
        )} %).`,
      });
    }
  }

  const hasData = incomes.length + expenses.length + debts.length > 0;

  return (
    <div>
      {alerts.length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          {alerts.map((a, i) => (
            <div key={i} className={`alert ${a.level}`}>
              <span aria-hidden>{a.level === 'danger' ? '⚠️' : '🔔'}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </section>
      )}

      <section className="grid">
        <div className="card">
          <div className="stat-label">Dettes totales</div>
          <div className="stat-value">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Paiements mensuels (dettes)</div>
          <div className="stat-value">
            {formatCurrency(monthlyDebtPayments)}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Revenus mensuels (est.)</div>
          <div className="stat-value">{formatCurrency(monthlyIncome)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Solde disponible</div>
          <div
            className={`stat-value ${available >= 0 ? 'positive' : 'negative'}`}
          >
            {formatCurrency(available)}
          </div>
        </div>
      </section>

      {!hasData && (
        <div className="empty" style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Rien à afficher pour l&apos;instant. Commence par ajouter tes
            revenus, tes dépenses et tes dettes.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link className="btn secondary" href="/finances/revenus">
              + Revenu
            </Link>
            <Link className="btn secondary" href="/finances/depenses">
              + Dépense
            </Link>
            <Link className="btn secondary" href="/finances/dettes">
              + Dette
            </Link>
          </div>
        </div>
      )}

      {hasData && (
        <>
          <h2 className="section-title">Aperçu du mois</h2>
          <div className="list">
            <div className="list-item">
              <div>
                <div>Revenus estimés</div>
                <div className="meta">{incomes.length} source(s)</div>
              </div>
              <span className="amount positive">
                +{formatCurrency(monthlyIncome)}
              </span>
            </div>
            <div className="list-item">
              <div>
                <div>Dépenses</div>
                <div className="meta">{expenses.length} poste(s)</div>
              </div>
              <span className="amount negative">
                −{formatCurrency(monthlyExpenses)}
              </span>
            </div>
            <div className="list-item">
              <div>
                <div>Paiements de dettes</div>
                <div className="meta">{debts.length} dette(s)</div>
              </div>
              <span className="amount negative">
                −{formatCurrency(monthlyDebtPayments)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
