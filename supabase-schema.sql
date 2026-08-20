-- call-eval — Supabase schema
-- One table. RLS is wide open (no auth for this exercise).

create extension if not exists "pgcrypto";

create table if not exists public.evaluations (
  id          uuid primary key default gen_random_uuid(),
  call_type   text not null check (call_type in ('kickoff', 'coaching')),
  transcript  text not null,
  status      text not null default 'pending'
              check (status in ('pending', 'processing', 'completed', 'failed')),
  error       text,
  result      jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- keep updated_at fresh on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_evaluations_updated_at on public.evaluations;
create trigger trg_evaluations_updated_at
  before update on public.evaluations
  for each row execute function public.set_updated_at();

-- RLS wide open (no auth in this exercise). The server uses the service-role key
-- and bypasses RLS anyway; these policies just make anon access harmless too.
alter table public.evaluations enable row level security;

drop policy if exists "evaluations_all_access" on public.evaluations;
create policy "evaluations_all_access"
  on public.evaluations
  for all
  using (true)
  with check (true);
