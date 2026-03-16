-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.
-- One row per user: full Drills state (drill bank + training sessions) in JSONB.

create table if not exists public.drills (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create or replace function public.set_drills_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_drills_updated_at on public.drills;
create trigger trg_drills_updated_at
  before update on public.drills
  for each row
  execute procedure public.set_drills_updated_at();

alter table public.drills enable row level security;

drop policy if exists "Drills readable by owner" on public.drills;
create policy "Drills readable by owner"
  on public.drills for select
  using (auth.uid() = user_id);

drop policy if exists "Drills insertable by owner" on public.drills;
create policy "Drills insertable by owner"
  on public.drills for insert
  with check (auth.uid() = user_id);

drop policy if exists "Drills updatable by owner" on public.drills;
create policy "Drills updatable by owner"
  on public.drills for update
  using (auth.uid() = user_id);

drop policy if exists "Drills deletable by owner" on public.drills;
create policy "Drills deletable by owner"
  on public.drills for delete
  using (auth.uid() = user_id);

