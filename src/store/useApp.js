import { create } from 'zustand';
import { loadFarm, loadAccount as fetchAccount, createFarmAccount, insert, update, remove } from '../lib/data';

// One shared store for app state. Screens read what they need and call actions to change it.
export const useApp = create((set, get) => {
  const after = async (p) => { await p; await get().refresh(); };
  return {
    tab: 'home', selectedPond: null, farm: null, loading: true, error: null,
    account: undefined, accountError: null,   // account: undefined = loading, then { profile, farm }
    setTab: (tab) => set({ tab }),
    selectPond: (id) => set({ selectedPond: id }),
    refresh: async () => {
      try { set({ farm: await loadFarm(), error: null, loading: false }); }
      catch (e) { set({ error: e.message, loading: false }); }
    },
    reset: () => set({ tab: 'home', selectedPond: null, farm: null, loading: true, error: null, account: undefined, accountError: null }),
    loadAccount: async () => {
      set({ account: undefined, accountError: null });
      try { set({ account: await fetchAccount() }); } catch (e) { set({ accountError: e.message }); }
    },
    saveOnboarding: async (v) => { await createFarmAccount(v); await get().loadAccount(); }, // on log out

    addPond: (row) => after(insert('ponds', { ...row, farm_id: get().account?.farm?.id })),
    updatePond: (id, row) => after(update('ponds', id, row)),
    addSchedule: (row) => after(insert('feeding_schedules', row)),
    toggleSchedule: (s) => after(update('feeding_schedules', s.id, { active: !s.active })),
    removeSchedule: (id) => after(remove('feeding_schedules', id)),
    resolveAlert: (id) => after(update('alerts', id, { status: 'resolved' })),
    // No feeder hardware yet: the event is recorded as pending, then marked "simulated" (never "confirmed").
    feedNow: async (pondId, qty) => {
      const ev = await insert('feeding_events', { pond_id: pondId, quantity_g: qty, status: 'pending' });
      await get().refresh();
      await new Promise((r) => setTimeout(r, 1500));
      try { await update('feeding_events', ev.id, { status: 'simulated' }); }
      catch (e) { await update('feeding_events', ev.id, { status: 'failed' }); }
      await get().refresh();
    },
    // Writes a labeled simulated reading (and an alert if it is below the pond's levels).
    simulateReading: async (pond) => {
      const d = +(3 + Math.random() * 4.5).toFixed(1), t = +(27 + Math.random() * 3).toFixed(1);
      await insert('sensor_readings', { pond_id: pond.id, do_mgl: d, temp_c: t, source: 'simulated' });
      if (d < pond.do_warning) await insert('alerts', { pond_id: pond.id, type: 'Low dissolved oxygen', severity: d < pond.do_critical ? 'critical' : 'warning', message: `DO read ${d} mg/L (simulated reading).`, status: 'active' });
      await get().refresh();
    },
  };
});
