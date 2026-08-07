import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatMonth, toMonthly } from '@/lib/format';
import { RecordModal, type FieldDef } from '@/components/RecordModal';
import {
  addSnapshot,
  updateSnapshot,
  deleteSnapshot,
} from '@/app/finances/actions';
import type { Debt, Expense, Income, MonthlySnapshot } from '@/lib/types';

export const metadata = { title: 'Suivi mensuel — Finances' };

function snapshotFields(defaultMonth: string): FieldDef[] {
  return [
    { name: 'month', label: 'Mois', type: 'month', required: true, defaultValue: defaultMonth },
    { name: 'real_income', label: 'Revenu réel ($)', type: 'number', step: '0.01', min: '0' },
    { name: 'real_expenses', label: 'Dépenses réelles ($)', type: 'number', step: '0.01', min: '0' },
    {
      name: 'real_debt_payments',
      label: 'Paiements de dettes réels ($)',
      type: 'number',
      step: '0.01',
      min: '0',
    },
    { name: 'note', label: 'Note (optionnel)', type: 'text', placeholder: 'Mois plus calme…' },
  ];
}

export default async function SuiviPage() {
  const supabase = await createClient();

  const [incomesRes, expensesRes, debtsRes, snapsRes] = await Promise.all([
    supabase.from('incomes').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('debts').select('*'),
    supabase
      .from('monthly_snapshots')
      .select('*')
      .order('month', { ascending: false }),
  ]);

  const incomes = (incomesRes.data ?? []) as Income[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const debts = (debtsRes.data ?? []) as Debt[];
  const snapshots = (snapsRes.data ?? []) as MonthlySnapshot[];

  // --- Plan mensuel (référence, calculé depuis Revenus/Dépenses/Dettes) ----
  const planIncome = incomes.reduce(
    (s, i) => s + toMonthly(Number(i.amount), i.frequency),
    0,
  );
  const planExpenses = expenses.reduce(
    (s, e) => s + toMonthly(Number(e.amount), e.frequency),
    0,
  );
  const planDebt = debts.reduce((s, d) => s + Number(d.minimum_payment), 0);
  const planAvailable = planIncome - planExpenses - planDebt;

  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, '0')}`;
  const FIELDS = snapshotFields(defaultMonth);

  return (
    <div>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Suivi mensuel réel
      </h2>

      {/* Plan mensuel de référence */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="stat-label">Plan mensuel (d&apos;après tes données)</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            marginTop: '0.5rem',
          }}
        >
          <span>
            Revenu <strong>{formatCurrency(planIncome)}</strong>
          </span>
          <span>
            Dépenses <strong>{formatCurrency(planExpenses)}</strong>
          </span>
          <span>
            Dettes <strong>{formatCurrency(planDebt)}</strong>
          </span>
          <span>
            Solde{' '}
            <strong className={planAvailable >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(planAvailable)}
            </strong>
          </span>
        </div>
      </div>

      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        Saisis chaque mois ce que tu as <em>réellement</em> gagné, dépensé et
        remboursé, pour comparer avec ton plan.
      </p>

      {snapshots.length === 0 ? (
        <div className="empty">
          Aucun mois enregistré. Ajoute ton premier mois avec le bouton « + ».
        </div>
      ) : (
        <div className="list">
          {snapshots.map((s) => {
            const solde =
              Number(s.real_income) -
              Number(s.real_expenses) -
              Number(s.real_debt_payments);
            const vsPlan = solde - planAvailable;
            return (
              <div key={s.id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong style={{ textTransform: 'capitalize' }}>
                    {formatMonth(s.month)}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`amount ${solde >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(solde)}
                    </span>
                    <RecordModal
                      trigger="edit"
                      title="Modifier le mois"
                      action={updateSnapshot}
                      fields={FIELDS}
                      values={s}
                    />
                    <form action={deleteSnapshot}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="btn ghost" aria-label="Supprimer">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
                <div className="meta">
                  Revenu {formatCurrency(Number(s.real_income))} · Dépenses{' '}
                  {formatCurrency(Number(s.real_expenses))} · Dettes{' '}
                  {formatCurrency(Number(s.real_debt_payments))}
                </div>
                <div className="meta" style={{ marginTop: '0.25rem' }}>
                  {vsPlan >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(vsPlan))}{' '}
                  {vsPlan >= 0 ? 'de mieux' : 'de moins'} que le plan
                </div>
                {s.note && (
                  <div className="meta" style={{ marginTop: '0.25rem' }}>
                    « {s.note} »
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RecordModal
        trigger="fab"
        title="Ajouter un mois"
        action={addSnapshot}
        fields={FIELDS}
      />
    </div>
  );
}
