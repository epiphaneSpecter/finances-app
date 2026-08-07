import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatFrequency } from '@/lib/format';
import { FormModal } from '@/components/FormModal';
import { addIncome, deleteIncome } from '@/app/finances/actions';
import type { Income } from '@/lib/types';

export const metadata = { title: 'Revenus — Finances' };

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="amount positive">
                  {formatCurrency(Number(i.amount))}
                </span>
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

      <FormModal title="Ajouter un revenu" action={addIncome}>
        <div className="field">
          <label htmlFor="label">Nom</label>
          <input id="label" name="label" required placeholder="Contrat consulting" />
        </div>
        <div className="field">
          <label htmlFor="source">Source (optionnel)</label>
          <input id="source" name="source" placeholder="Consulting, Uber…" />
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
            <option value="once">Ponctuel</option>
            <option value="irregular">Irrégulier</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="received_on">Reçu le (optionnel)</label>
          <input id="received_on" name="received_on" type="date" />
        </div>
      </FormModal>
    </div>
  );
}
