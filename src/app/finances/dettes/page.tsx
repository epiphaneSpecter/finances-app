import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import { FormModal } from '@/components/FormModal';
import { addDebt, deleteDebt } from '@/app/finances/actions';
import type { Debt } from '@/lib/types';

export const metadata = { title: 'Dettes — Finances' };

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

      <FormModal title="Ajouter une dette" action={addDebt}>
        <div className="field">
          <label htmlFor="label">Nom</label>
          <input id="label" name="label" required placeholder="Carte Visa" />
        </div>
        <div className="field">
          <label htmlFor="lender">Créancier (optionnel)</label>
          <input id="lender" name="lender" placeholder="Banque, prêteur…" />
        </div>
        <div className="field">
          <label htmlFor="balance">Solde dû ($)</label>
          <input id="balance" name="balance" type="number" step="0.01" min="0" required />
        </div>
        <div className="field">
          <label htmlFor="credit_limit">Limite de crédit ($, optionnel)</label>
          <input id="credit_limit" name="credit_limit" type="number" step="0.01" min="0" />
        </div>
        <div className="field">
          <label htmlFor="minimum_payment">Paiement mensuel minimum ($)</label>
          <input
            id="minimum_payment"
            name="minimum_payment"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="interest_rate">Taux d&apos;intérêt annuel (%, optionnel)</label>
          <input id="interest_rate" name="interest_rate" type="number" step="0.01" min="0" />
        </div>
        <div className="field">
          <label htmlFor="due_day">Jour d&apos;échéance (1-31, optionnel)</label>
          <input id="due_day" name="due_day" type="number" min="1" max="31" />
        </div>
      </FormModal>
    </div>
  );
}
