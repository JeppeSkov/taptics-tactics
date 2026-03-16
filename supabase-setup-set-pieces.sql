-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.
-- One row per user: full set pieces state (scenarios, routines, kit) in JSONB.

create table if not exists public.set_pieces (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create or replace function public.set_set_pieces_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_pieces_updated_at on public.set_pieces;
create trigger trg_set_pieces_updated_at
  before update on public.set_pieces
  for each row
  execute procedure public.set_set_pieces_updated_at();

alter table public.set_pieces enable row level security;

drop policy if exists "Set pieces readable by owner" on public.set_pieces;
create policy "Set pieces readable by owner"
  on public.set_pieces for select
  using (auth.uid() = user_id);

drop policy if exists "Set pieces insertable by owner" on public.set_pieces;
create policy "Set pieces insertable by owner"
  on public.set_pieces for insert
  with check (auth.uid() = user_id);

drop policy if exists "Set pieces updatable by owner" on public.set_pieces;
create policy "Set pieces updatable by owner"
  on public.set_pieces for update
  using (auth.uid() = user_id);

drop policy if exists "Set pieces deletable by owner" on public.set_pieces;
create policy "Set pieces deletable by owner"
  on public.set_pieces for delete
  using (auth.uid() = user_id);
