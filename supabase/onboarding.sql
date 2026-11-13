-- Run once in Supabase SQL Editor, AFTER schema.sql and auth-policies.sql.
-- Adds profiles + farms, links ponds to farms, and makes every table private to its owner.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null, phone text, created_at timestamptz default now());
create table if not exists farms (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, municipality text, barangay text, main_species text, created_at timestamptz default now());
alter table ponds add column if not exists farm_id bigint references farms on delete cascade;
-- Removes the old shared sample ponds (and their readings, alerts and schedules). Each farmer now creates their own.
delete from ponds where farm_id is null;
alter table profiles enable row level security;
alter table farms enable row level security;
do $$ declare t text; begin
  foreach t in array array['ponds','sensor_readings','devices','feeding_schedules','feeding_events','alerts'] loop
    execute format('drop policy if exists "signed-in access" on %I', t);
    execute format('drop policy if exists "demo open access" on %I', t);
    execute format('drop policy if exists "owner access" on %I', t);
  end loop; end $$;
drop policy if exists "own profile" on profiles;
drop policy if exists "own farms" on farms;
create policy "own profile" on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own farms" on farms for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner access" on ponds for all to authenticated
  using (farm_id in (select id from farms)) with check (farm_id in (select id from farms));
-- Child tables: a row is visible only if its pond is visible to the signed-in user.
do $$ declare t text; begin
  foreach t in array array['sensor_readings','devices','feeding_schedules','feeding_events','alerts'] loop
    execute format('create policy "owner access" on %I for all to authenticated using (pond_id in (select id from ponds)) with check (pond_id in (select id from ponds))', t);
  end loop; end $$;
