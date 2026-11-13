import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL, key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }) : null;
export const isSample = !supabase;

const min = (m) => new Date(Date.now() - m * 60000).toISOString();
let nid = 100;
// Sample-mode "database" (memory only). Edits work until the app restarts. Readings are regenerated fresh on each load.
const mem = {
  ponds: [
    { id: 1, name: 'Pond 01', species: 'Tilapia', do_warning: 5.0, do_critical: 3.5 },
    { id: 2, name: 'Pond 02', species: 'Tilapia', do_warning: 5.0, do_critical: 3.5 },
    { id: 3, name: 'Pond 03', species: 'Bangus', do_warning: 4.5, do_critical: 3.0 },
  ],
  schedules: [
    { id: 1, pond_id: 1, feed_time: '16:00', quantity_g: 200, active: true },
    { id: 2, pond_id: 2, feed_time: '07:00', quantity_g: 150, active: true },
  ],
  events: [
    { id: 1, pond_id: 2, quantity_g: 150, status: 'simulated', created_at: min(600) },
    { id: 2, pond_id: 1, quantity_g: 200, status: 'simulated', created_at: min(1100) },
  ],
  alerts: [
    { id: 1, pond_id: 2, type: 'Low dissolved oxygen', severity: 'warning', message: 'DO is below the warning level. Aerator turned on.', status: 'active', created_at: min(6) },
    { id: 2, pond_id: 3, type: 'Sensor reading stale', severity: 'critical', message: 'No new reading for 42 minutes.', status: 'active', created_at: min(37) },
    { id: 3, pond_id: 1, type: 'Aerator status change', severity: 'info', message: 'Aerator turned off after DO recovered.', status: 'resolved', created_at: min(300) },
  ],
  aerators: { 1: 'off', 2: 'on' },
};
const SEED = { 1: [5.8, 28.4, 1], 2: [4.4, 29.1, 2], 3: [5.2, 28.0, 42] };
const sampleReading = (id) => { const [d, t, m] = SEED[id] ?? [6.0, 28.5, 1]; return { do_mgl: d, temp_c: t, valid: true, source: 'simulated', recorded_at: min(m) }; };
const byNew = (a, b) => new Date(b.created_at) - new Date(a.created_at);

export async function loadFarm() {
  if (!supabase) {
    return {
      ponds: mem.ponds.map((p) => ({ ...p, reading: sampleReading(p.id) })),
      aerators: Object.fromEntries(mem.ponds.map((p) => [p.id, { state: mem.aerators[p.id] ?? 'unknown' }])),
      alerts: mem.alerts.filter((a) => a.status === 'active').sort(byNew), alertLog: [...mem.alerts].sort(byNew),
      schedules: [...mem.schedules], events: [...mem.events].sort(byNew),
    };
  }
  const [p, r, a, d, sc, ev] = await Promise.all([
    supabase.from('ponds').select('*').order('name'),
    supabase.from('sensor_readings').select('*').order('recorded_at', { ascending: false }).limit(200),
    supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('devices').select('*'),
    supabase.from('feeding_schedules').select('*').order('feed_time'),
    supabase.from('feeding_events').select('*').order('created_at', { ascending: false }).limit(20),
  ]);
  const err = p.error || r.error || a.error || d.error || sc.error || ev.error;
  if (err) throw err;
  return {
    ponds: p.data.map((x) => ({ ...x, reading: r.data.find((y) => y.pond_id === x.id) || null })),
    aerators: Object.fromEntries(d.data.filter((x) => x.kind === 'aerator').map((x) => [x.pond_id, { state: x.reported_state }])),
    alerts: a.data.filter((x) => x.status === 'active'), alertLog: a.data, schedules: sc.data, events: ev.data,
  };
}

// Writes. Same calls work against Supabase or the sample-mode memory.
const MEM = { ponds: 'ponds', feeding_schedules: 'schedules', feeding_events: 'events', alerts: 'alerts' };
const ok = (r) => { if (r.error) throw r.error; return r.data; };
export async function insert(table, row) {
  if (supabase) return ok(await supabase.from(table).insert(row).select().single());
  const r = { id: ++nid, created_at: new Date().toISOString(), ...row }; mem[MEM[table]]?.push(r); return r;
}
export async function update(table, id, patch) {
  if (supabase) return ok(await supabase.from(table).update(patch).eq('id', id));
  Object.assign(mem[MEM[table]].find((x) => x.id === id), patch);
}
export async function remove(table, id) {
  if (supabase) return ok(await supabase.from(table).delete().eq('id', id));
  mem[MEM[table]] = mem[MEM[table]].filter((x) => x.id !== id);
}

// Account: the signed-in farmer's profile and farm. Sample mode has no accounts.
export async function loadAccount() {
  if (!supabase) return { profile: null, farm: { id: null, name: 'Sample farm' } };
  const [p, f] = await Promise.all([
    supabase.from('profiles').select('*').maybeSingle(),
    supabase.from('farms').select('*').order('created_at').limit(1).maybeSingle(),
  ]);
  if (p.error || f.error) throw p.error || f.error;
  return { profile: p.data, farm: f.data };
}
export async function createFarmAccount(v) {
  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue || !user) throw ue || new Error('Not signed in');
  ok(await supabase.from('profiles').upsert({ id: user.id, full_name: v.fullName, phone: v.phone }));
  const farm = ok(await supabase.from('farms').insert({ name: v.farmName, municipality: v.municipality, barangay: v.barangay, main_species: v.species }).select().single());
  if (v.pondName) { try { ok(await supabase.from('ponds').insert({ farm_id: farm.id, name: v.pondName, species: v.species, do_warning: 5.0, do_critical: 3.5 })); } catch (e) { /* farm is saved; the farmer can add ponds later */ } }
}
