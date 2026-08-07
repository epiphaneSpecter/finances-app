// Types partagés du module Finances.
// (Ils reflètent le schéma SQL de supabase/migrations/0001_init_finances.sql.)

export type ExpenseCategory =
  | 'logement'
  | 'assurances'
  | 'abonnements'
  | 'autres';

export type Frequency = 'once' | 'weekly' | 'monthly' | 'yearly' | 'irregular';

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  label: string;
  source: string | null;
  amount: number;
  frequency: Frequency;
  received_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  frequency: Frequency;
  due_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  label: string;
  lender: string | null;
  balance: number;
  credit_limit: number | null;
  interest_rate: number | null;
  minimum_payment: number;
  due_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlySnapshot {
  id: string;
  user_id: string;
  /** Premier jour du mois concerné (YYYY-MM-01). */
  month: string;
  real_income: number;
  real_expenses: number;
  real_debt_payments: number;
  note: string | null;
  created_at: string;
}
