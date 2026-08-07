'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return { supabase, user };
}

function num(formData: FormData, key: string): number {
  const v = Number(formData.get(key));
  return Number.isFinite(v) ? v : 0;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optStr(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v === '' ? null : v;
}

function optInt(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (raw === '') return null;
  const v = parseInt(raw, 10);
  return Number.isFinite(v) ? v : null;
}

// --- Revenus ---------------------------------------------------------------
export async function addIncome(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from('incomes').insert({
    user_id: user.id,
    label: str(formData, 'label'),
    source: optStr(formData, 'source'),
    amount: num(formData, 'amount'),
    frequency: str(formData, 'frequency') || 'monthly',
    received_on: optStr(formData, 'received_on'),
  });
  revalidatePath('/finances/revenus');
  revalidatePath('/finances');
}

export async function deleteIncome(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('incomes').delete().eq('id', str(formData, 'id'));
  revalidatePath('/finances/revenus');
  revalidatePath('/finances');
}

// --- Dépenses --------------------------------------------------------------
export async function addExpense(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from('expenses').insert({
    user_id: user.id,
    label: str(formData, 'label'),
    category: str(formData, 'category') || 'autres',
    amount: num(formData, 'amount'),
    frequency: str(formData, 'frequency') || 'monthly',
    due_day: optInt(formData, 'due_day'),
  });
  revalidatePath('/finances/depenses');
  revalidatePath('/finances');
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('expenses').delete().eq('id', str(formData, 'id'));
  revalidatePath('/finances/depenses');
  revalidatePath('/finances');
}

// --- Dettes ----------------------------------------------------------------
export async function addDebt(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from('debts').insert({
    user_id: user.id,
    label: str(formData, 'label'),
    lender: optStr(formData, 'lender'),
    balance: num(formData, 'balance'),
    credit_limit: str(formData, 'credit_limit') === ''
      ? null
      : num(formData, 'credit_limit'),
    interest_rate: str(formData, 'interest_rate') === ''
      ? null
      : num(formData, 'interest_rate'),
    minimum_payment: num(formData, 'minimum_payment'),
    due_day: optInt(formData, 'due_day'),
  });
  revalidatePath('/finances/dettes');
  revalidatePath('/finances');
}

export async function deleteDebt(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from('debts').delete().eq('id', str(formData, 'id'));
  revalidatePath('/finances/dettes');
  revalidatePath('/finances');
}
