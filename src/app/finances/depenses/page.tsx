import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatFrequency } from '@/lib/format';
import { RecordModal, type FieldDef } from '@/components/RecordModal';
import { addExpense, updateExpense, deleteExpense } from '@/app/finances/actions';
import type { Expense } from '@/lib/types';

export const metadata = { title: 'Dépenses — Finances' };

const CATEGORY_LABELS: Record<string, string> = {
  logement: 'Logement',
  assurances: 'Assurances',
  abonnements: 'Abonnements',
  autres: 'Autres',
};

const FIELDS: FieldDef[] = [
  { name: 'label', label: 'Nom', type: 'text', required: true, placeholder: 'Loyer' },
  {
    name: 'category',
    label: 'Catégorie',
    type: 'select',
    defaultValue: 'autres',
    options: [
      { value: 'logement', label: 'Logement' },
      { value: 'assurances', label: 'Assurances' },
      { value: 'abonnements', label: 'Abonnements' },
      { value: 'autres', label: 'Autres' },
    ],
  },
  { name: 'amount', label: 'Montant ($)', type: 'number', required: true, step: '0.01', min: '0' },
  {
    name: 'frequency',
    label: 'Fréquence',
    type: 'select',
    defaultValue: 'monthly',
    options: [
      { value: 'monthly', label: 'Mensuel' },
      { value: 'weekly', label: 'Hebdomadaire' },
      { value: 'yearly', label: 'Annuel' },
      { value: 'once', label: 'Ponctuel' },
    ],
  },
  {
    name: 'due_day',
    label: 'Jour du prélèvement (1-31, optionnel)',
    type: 'number',
    min: '1',
    max: '31',
  },
];

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="amount negative">
                  {formatCurrency(Number(e.amount))}
                </span>
                <RecordModal
                  trigger="edit"
                  title="Modifier la dépense"
                  action={updateExpense}
                  fields={FIELDS}
                  values={e}
                />
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

      <RecordModal
        trigger="fab"
        title="Ajouter une dépense"
        action={addExpense}
        fields={FIELDS}
      />
    </div>
  );
}
