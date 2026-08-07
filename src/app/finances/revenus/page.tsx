import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatFrequency } from '@/lib/format';
import { RecordModal, type FieldDef } from '@/components/RecordModal';
import { addIncome, updateIncome, deleteIncome } from '@/app/finances/actions';
import type { Income } from '@/lib/types';

export const metadata = { title: 'Revenus — Finances' };

const FIELDS: FieldDef[] = [
  { name: 'label', label: 'Nom', type: 'text', required: true, placeholder: 'Contrat consulting' },
  { name: 'source', label: 'Source (optionnel)', type: 'text', placeholder: 'Consulting, Uber…' },
  { name: 'amount', label: 'Montant ($)', type: 'number', required: true, step: '0.01', min: '0' },
  {
    name: 'frequency',
    label: 'Fréquence',
    type: 'select',
    defaultValue: 'monthly',
    options: [
      { value: 'monthly', label: 'Mensuel' },
      { value: 'weekly', label: 'Hebdomadaire' },
      { value: 'once', label: 'Ponctuel' },
      { value: 'irregular', label: 'Irrégulier' },
    ],
  },
  { name: 'received_on', label: 'Reçu le (optionnel)', type: 'date' },
];

export default async function RevenusPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('incomes')
    .select('*')
    .order('created_at', { ascending: false });
  const incomes = (data ?? []) as Income[];

  return (
    <div>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Revenus
      </h2>

      {incomes.length === 0 ? (
        <div className="empty">
          Aucun revenu. Ajoute tes sources (consulting, Uber, livraison, ménage…)
          avec le bouton « + ».
        </div>
      ) : (
        <div className="list">
          {incomes.map((i) => (
            <div key={i.id} className="list-item">
              <div>
                <div>{i.label}</div>
                <div className="meta">
                  {i.source ? `${i.source} · ` : ''}
                  {formatFrequency(i.frequency)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="amount positive">
                  {formatCurrency(Number(i.amount))}
                </span>
                <RecordModal
                  trigger="edit"
                  title="Modifier le revenu"
                  action={updateIncome}
                  fields={FIELDS}
                  values={i}
                />
                <form action={deleteIncome}>
                  <input type="hidden" name="id" value={i.id} />
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
        title="Ajouter un revenu"
        action={addIncome}
        fields={FIELDS}
      />
    </div>
  );
}
