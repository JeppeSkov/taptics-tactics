-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.
-- Creates the players table and RLS so logged-in users can read/write their own rows.
-- If you already have the table with integer columns, run the migration below first.

-- Migration: if players table exists with integer condition/sharpness/role_familiarity/role_ability, run:
-- alter table public.players alter column condition type real using condition::real;
-- alter table public.players alter column sharpness type real using sharpness::real;
-- alter table public.players alter column role_familiarity type real using role_familiarity::real;
-- alter table public.players alter column role_ability type real using role_ability::real;

create table if not exists public.players (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  number integer,
  natural_position text,
  best_role text,
  condition real,
  sharpness real,
  role_familiarity real,
  role_ability real,
  status text,
  assigned_slot text,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create or replace function public.set_players_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at
  before update on public.players
  for each row
  execute procedure public.set_players_updated_at();

alter table public.players enable row level security;

drop policy if exists "Players are readable by owner" on public.players;
create policy "Players are readable by owner"
  on public.players for select
  using (auth.uid() = user_id);

drop policy if exists "Players are insertable by owner" on public.players;
create policy "Players are insertable by owner"
  on public.players for insert
  with check (auth.uid() = user_id);

drop policy if exists "Players are updatable by owner" on public.players;
create policy "Players are updatable by owner"
  on public.players for update
  using (auth.uid() = user_id);

drop policy if exists "Players are deletable by owner" on public.players;
create policy "Players are deletable by owner"
  on public.players for delete
  using (auth.uid() = user_id);
