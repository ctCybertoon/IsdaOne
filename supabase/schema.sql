-- Run in Supabase: SQL Editor > New query. PROTOTYPE ONLY: open anon policies, no login.
create table ponds (id bigint generated always as identity primary key, name text not null, species text,
  do_warning numeric not null default 5.0, do_critical numeric not null default 3.5, created_at timestamptz default now());
create table sensor_readings (id bigint generated always as identity primary key, pond_id bigint references ponds on delete cascade,
  do_mgl numeric, temp_c numeric, valid boolean default true, source text default 'simulated', recorded_at timestamptz default now());
create table devices (id bigint generated always as identity primary key, pond_id bigint references ponds on delete cascade,
  kind text check (kind in ('aerator','feeder','sensor')), reported_state text, last_seen timestamptz);
create table feeding_schedules (id bigint generated always as identity primary key, pond_id bigint references ponds on delete cascade,
  feed_time time not null, quantity_g int not null, active boolean default true);
create table feeding_events (id bigint generated always as identity primary key, pond_id bigint references ponds on delete cascade,
  quantity_g int, status text check (status in ('pending','confirmed','failed','simulated')) default 'pending', created_at timestamptz default now());
create table alerts (id bigint generated always as identity primary key, pond_id bigint references ponds on delete cascade,
  type text, severity text check (severity in ('info','warning','critical')), message text,
  status text default 'active', created_at timestamptz default now());
create index on sensor_readings (pond_id, recorded_at desc);
do $$ declare t text; begin
  foreach t in array array['ponds','sensor_readings','devices','feeding_schedules','feeding_events','alerts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "demo open access" on %I for all to anon using (true) with check (true)', t);
  end loop; end $$;
-- Seed data (simulated)
insert into ponds (name,species,do_warning,do_critical) values ('Pond 01','Tilapia',5.0,3.5),('Pond 02','Tilapia',5.0,3.5),('Pond 03','Bangus',4.5,3.0);
insert into sensor_readings (pond_id,do_mgl,temp_c,recorded_at) values (1,5.8,28.4,now()),(2,4.4,29.1,now()),(3,5.2,28.0,now()-interval '42 minutes');
insert into devices (pond_id,kind,reported_state,last_seen) values (1,'aerator','off',now()),(2,'aerator','on',now());
insert into alerts (pond_id,type,severity,message) values (2,'Low dissolved oxygen','warning','DO is below the warning level. Aerator turned on.'),
 (3,'Sensor reading stale','critical','No new reading for 42 minutes. Check the sensor and controller.');
