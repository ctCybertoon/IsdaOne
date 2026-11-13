-- Run once in Supabase SQL Editor: only signed-in users can read or write farm data.
-- Prototype note: every signed-in user sees the same farm. Per-user ownership comes later.
do $$ declare t text; begin
  foreach t in array array['ponds','sensor_readings','devices','feeding_schedules','feeding_events','alerts'] loop
    execute format('drop policy if exists "demo open access" on %I', t);
    execute format('drop policy if exists "signed-in access" on %I', t);
    execute format('create policy "signed-in access" on %I for all to authenticated using (true) with check (true)', t);
  end loop; end $$;
