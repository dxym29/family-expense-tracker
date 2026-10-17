-- Run this in Supabase SQL Editor for this project.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  expense_date date not null default current_date,
  amount bigint not null check (amount > 0),
  note text check (char_length(note) <= 300),
  category text not null check (category in ('ကိုကိုသန့်', 'ထိပ်ထိပ်', 'အိမ်စရိတ်')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_owner_date_idx
  on public.expenses (owner_id, expense_date desc, created_at desc);

alter table public.expenses enable row level security;

drop policy if exists "Users can read their own expenses" on public.expenses;
create policy "Users can read their own expenses"
  on public.expenses for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can add their own expenses" on public.expenses;
create policy "Users can add their own expenses"
  on public.expenses for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own expenses" on public.expenses;
create policy "Users can update their own expenses"
  on public.expenses for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own expenses" on public.expenses;
create policy "Users can delete their own expenses"
  on public.expenses for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.expenses to authenticated;
