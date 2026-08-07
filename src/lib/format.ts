// Helpers de formatage (montants, fréquences) — locale québécoise (fr-CA).

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
  }).format(amount || 0);
}

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'ponctuel',
  weekly: 'hebdomadaire',
  monthly: 'mensuel',
  yearly: 'annuel',
  irregular: 'irrégulier',
};

export function formatFrequency(frequency: string): string {
  return FREQUENCY_LABELS[frequency] ?? frequency;
}

const MONTHLY_DIVISORS: Record<string, number> = {
  once: 0, // non récurrent → n'entre pas dans le total mensuel
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
  irregular: 1,
};

/**
 * Ramène un montant à son équivalent mensuel selon sa fréquence.
 * Utilisé pour comparer revenus/dépenses sur une base commune.
 */
export function toMonthly(amount: number, frequency: string): number {
  const factor = MONTHLY_DIVISORS[frequency] ?? 1;
  return (amount || 0) * factor;
}
