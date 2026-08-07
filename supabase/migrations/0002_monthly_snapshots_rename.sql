-- ============================================================================
-- Suivi mensuel réel — clarification des noms de colonnes de monthly_snapshots.
-- Renomme total_income/total_expenses/total_debt en real_income/
-- real_expenses/real_debt_payments (valeurs RÉELLES saisies chaque mois).
-- Sûr à exécuter plusieurs fois (chaque renommage est conditionnel).
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'monthly_snapshots'
      and column_name = 'total_income'
  ) then
    alter table public.monthly_snapshots rename column total_income to real_income;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'monthly_snapshots'
      and column_name = 'total_expenses'
  ) then
    alter table public.monthly_snapshots rename column total_expenses to real_expenses;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'monthly_snapshots'
      and column_name = 'total_debt'
  ) then
    alter table public.monthly_snapshots rename column total_debt to real_debt_payments;
  end if;
end;
$$;
