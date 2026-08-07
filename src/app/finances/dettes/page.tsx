import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import { RecordModal, type FieldDef } from '@/components/RecordModal';
import { addDebt, updateDebt, deleteDebt } from '@/app/finances/actions';
import type { Debt } from '@/lib/types';

export const metadata = { title: 'Dettes — Finances' };

const FIELDS: FieldDef[] = [
  { name: 'label', label: 'Nom', type: 'text', required: true, placeholder: 'Carte Visa' },
  { name: 'lender', label: 'Créancier (optionnel)', type: 'text', placeholder: 'Banque, prêteur…' },
  { name: 'balance', label: 'Solde dû ($)', type: 'number', required: true, step: '0.01', min: '0' },
  {
    name: 'credit_limit',
    label: 'Limite de crédit ($, optionnel)',
    type: 'number',
    step: '0.01',
    min: '0',
  },
  {
    name: 'minimum_payment',
    label: 'Paiement mensuel minimum ($)',
    type: 'number',
    required: true,
    step: '0.01',
    min: '0',
  },
  {
    name: 'interest_rate',
    label: "Taux d'intérêt annuel (%, optionnel)",
    type: 'number',
    step: '0.01',
    min: '0',
  },
  {
    name: 'due_day',
    label: "Jour d'échéance (1-31, optionnel)",
    type: 'number',
    min: '1',
    max: '31',
  },
];

export default async function DettesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('debts')
    .select('*')
    .order('balance', { ascending: false });
  const debts = (data ?? []) as Debt[];

  return (
    <div>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Dettes
      </h2>

      {debts.length === 0 ? (
        <div className="empty">
          Aucune dette enregistrée. Ajoute tes cartes, prêts ou marges de crédit
          avec le bouton « + ».
        </div>
      ) : (
        <div className="list">
          {debts.map((d) => {
            const overLimit =
              d.credit_limit != null && Number(d.balance) > Number(d.credit_limit);
            return (
              <div key={d.id} className="list-item">
                <div>
                  <div>{d.label}</div>
                  <div className="meta">
                    {d.lender ? `${d.lender} · ` : ''}
                    min. {formatCurrency(Number(d.minimum_payment))}/mois
                    {d.interest_rate ? ` · ${d.interest_rate} %` : ''}
                    {d.due_day ? ` · le ${d.due_day}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className={`amount ${overLimit ? 'negative' : ''}`}
                    title={
                      d.credit_limit
                        ? `Limite : ${formatCurrency(Number(d.credit_limit))}`
                        : undefined
                    }
                  >
                    {formatCurrency(Number(d.balance))}
                  </span>
                  <RecordModal
                    trigger="edit"
                    title="Modifier la dette"
                    action={updateDebt}
                    fields={FIELDS}
                    values={d}
                  />
                  <form action={deleteDebt}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="btn ghost" aria-label="Supprimer">
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecordModal
        trigger="fab"
        title="Ajouter une dette"
        action={addDebt}
        fields={FIELDS}
      />
    </div>
  );
}
