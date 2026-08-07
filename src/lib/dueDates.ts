// Calcul de la prochaine échéance à partir d'un « jour du mois » (1-31).

/** Prochaine occurrence du jour d'échéance `dueDay`, à partir d'aujourd'hui. */
export function nextDueDate(dueDay: number, from = new Date()): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  const today = new Date(y, m, from.getDate());

  const lastThisMonth = new Date(y, m + 1, 0).getDate();
  let due = new Date(y, m, Math.min(dueDay, lastThisMonth));

  if (due < today) {
    const lastNextMonth = new Date(y, m + 2, 0).getDate();
    due = new Date(y, m + 1, Math.min(dueDay, lastNextMonth));
  }
  return due;
}

/** Nombre de jours (entiers) entre aujourd'hui et `date`. */
export function daysUntil(date: Date, from = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
