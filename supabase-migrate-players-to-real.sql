-- Run this once in Supabase SQL Editor if you already created players with integer columns.
-- Fixes: "invalid input syntax for type integer: 3.5" by allowing decimals (e.g. role_ability 3.5).

alter table public.players alter column condition type real using condition::real;
alter table public.players alter column sharpness type real using sharpness::real;
alter table public.players alter column role_familiarity type real using role_familiarity::real;
alter table public.players alter column role_ability type real using role_ability::real;
