import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatFrequency } from '@/lib/format';
import { FormModal } from '@/components/FormModal';
import { addExpense, deleteExpense } from '@/app/finances/actions';
import type { Expense } from '@/lib/types';

export const metadata = { title: 'Dépenses — Finances' };

const CATEGORY_LABELS: Record<string, string> = {
  logement: 'Logement',
  assurances: 'Assurances',
  abonnements: 'Abonnements',
  autres: 'Autres',
};

export default async function DepensesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('expenses')
    .select('*')
    .order('category', { ascending: true });
  const expenses = (data ?? []) as Expense[];

  return (
    <div>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Dépenses
      </h2>

      {expenses.length === 0 ? (
        <div className="empty">
          Aucune dépense. Ajoute tes postes (logement, assurances, abonnements…)
          avec le bouton « + ».
        </div>
      ) : (
        <div className="list">
          {expenses.map((e) => (
            <div key={e.id} className="list-item">
              <div>
                <div>{e.label}</div>
                <div className="meta">
                  {CATEGORY_LABELS[e.category] ?? e.category} ·{' '}
                  {formatFrequency(e.frequency)}
                  {e.due_day ? ` · le ${e.due_day}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="amount negative">
                  {formatCurrency(Number(e.amount))}
                </span>
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="btn ghost" aria-label="Supprimer">
                    ✕
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal title="Ajouter une dépense" action={addExpense}>
        <div className="field">
          <label htmlFor="label">Nom</label>
          <input id="label" name="label" required placeholder="Loyer" />
        </div>
        <div className="field">
          <label htmlFor="category">Catégorie</label>
          <select id="category" name="category" defaultValue="autres">
            <option value="logement">Logement</option>
            <option value="assurances">Assurances</option>
            <option value="abonnements">Abonnements</option>
            <option value="autres">Autres</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Montant ($)</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div className="field">
          <label htmlFor="frequency">Fréquence</label>
          <select id="frequency" name="frequency" defaultValue="monthly">
            <option value="monthly">Mensuel</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="yearly">Annuel</option>
            <option value="once">Ponctuel</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="due_day">Jour du prélèvement (1-31, optionnel)</label>
          <input id="due_day" name="due_day" type="number" min="1" max="31" />
        </div>
      </FormModal>
    </div>
  );
}
