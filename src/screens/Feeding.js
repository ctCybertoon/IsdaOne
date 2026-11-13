import { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, Alert, StyleSheet } from 'react-native';
import Glass from '../ui/Glass';
import Header from '../ui/Header';
import { Btn, Input, Pick, Msg, Tag } from '../ui/Controls';
import { C } from '../ui/theme';
import { useApp } from '../store/useApp';
import { pondStatus, ago, STATUS } from '../lib/status';

const T12 = (t) => { const [h, m] = t.slice(0, 5).split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
function nextOf(schedules) {
  const now = new Date(); let best = null;
  for (const s of schedules.filter((x) => x.active)) {
    const [h, m] = s.feed_time.split(':').map(Number), d = new Date(now); d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    if (!best || d < best.d) best = { s, d };
  }
  return best;
}
const EV = { pending: ['Sending…', STATUS.unavailable.color, '…'], simulated: ['Simulated', '#3882F6', 'i'], confirmed: ['Confirmed', STATUS.normal.color, '✓'], failed: ['Failed', STATUS.critical.color, '✕'] };
const qtyOk = (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5000;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function Feeding() {
  const farm = useApp((s) => s.farm), feedNow = useApp((s) => s.feedNow), addSchedule = useApp((s) => s.addSchedule), toggle = useApp((s) => s.toggleSchedule), removeSchedule = useApp((s) => s.removeSchedule);
  const first = farm.ponds[0]?.id ?? null;
  const [pondId, setPondId] = useState(first), [qty, setQty] = useState('200');
  const [adding, setAdding] = useState(false), [sf, setSf] = useState({ pond: first, time: '16:00', qty: '200' });
  const [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const name = (id) => farm.ponds.find((p) => p.id === id)?.name ?? 'Pond';
  const pond = farm.ponds.find((p) => p.id === pondId) ?? farm.ponds[0];
  const critical = pond && pondStatus(pond, pond.reading).key === 'critical';
  const pending = farm.events.some((e) => e.status === 'pending');
  const next = nextOf(farm.schedules);
  const opts = farm.ponds.map((p) => ({ v: p.id, l: p.name }));
  const run = async (fn, okText, done) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ t: okText }); done?.(); } catch (e) { setMsg({ err: true, t: 'That didn’t work. Check your connection and try again.' }); }
    setBusy(false);
  };
  const feed = () => {
    if (!pond) return setMsg({ err: true, t: 'Add a pond first.' });
    if (!qtyOk(qty)) return setMsg({ err: true, t: 'Enter a quantity from 1 to 5000 g.' });
    Alert.alert('Feed now?', `${qty} g to ${pond.name}.\nNo feeder is connected yet, so this will be simulated.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Feed', onPress: () => run(() => feedNow(pond.id, Number(qty)), 'Feeding recorded as simulated. No real feeder ran.') },
    ]);
  };
  const save = () => {
    if (!sf.pond) return setMsg({ err: true, t: 'Add a pond first.' });
    if (!TIME.test(sf.time.trim())) return setMsg({ err: true, t: 'Enter the time as 24-hour HH:MM, for example 16:00.' });
    if (!qtyOk(sf.qty)) return setMsg({ err: true, t: 'Enter a quantity from 1 to 5000 g.' });
    run(() => addSchedule({ pond_id: sf.pond, feed_time: sf.time.trim(), quantity_g: Number(sf.qty), active: true }), 'Schedule saved.', () => setAdding(false));
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
      <Header title="Feeding" subtitle="Schedules and manual feeding" />
      <Glass solid style={{ padding: 20 }}>
        <Text style={st.muted}>Next feeding</Text>
        {next ? (<>
          <Text style={st.big}>{T12(next.s.feed_time)}</Text>
          <Text style={st.val}>{name(next.s.pond_id)} · {next.s.quantity_g} g</Text>
          <Text style={st.muted}>{next.d.toDateString() === new Date().toDateString() ? 'Today' : 'Tomorrow'}</Text>
        </>) : <Text style={[st.val, { marginTop: 6 }]}>No active schedule</Text>}
      </Glass>
      <Msg err={msg?.err}>{msg?.t}</Msg>

      <Text style={st.h2}>Feed now</Text>
      <Glass solid style={{ padding: 16 }}>
        <Pick options={opts} value={pond?.id} onChange={setPondId} />
        <Input label="Quantity (g)" value={qty} onChangeText={setQty} keyboardType="number-pad" maxLength={4} />
        {critical && <Msg err>Feeding is paused for {pond.name} because dissolved oxygen is critical. Fix the oxygen problem first.</Msg>}
        <Btn t={pending ? 'Sending…' : 'Feed now'} onPress={feed} disabled={critical || pending} busy={busy && pending} />
        <Text style={[st.muted, { marginTop: 8 }]}>Simulated: no feeder is connected yet.</Text>
      </Glass>

      <View style={[st.row, { marginTop: 22, marginBottom: 10 }]}><Text style={[st.h2, { margin: 0 }]}>Schedules</Text>
        <Btn kind="ghost" t={adding ? 'Close' : 'Add schedule'} onPress={() => { setAdding(!adding); setMsg(null); }} style={{ paddingVertical: 8, minHeight: 40 }} /></View>
      {adding && (
        <Glass solid style={{ padding: 16, marginBottom: 10 }}>
          <Pick options={opts} value={sf.pond} onChange={(v) => setSf({ ...sf, pond: v })} />
          <Input label="Time (24-hour HH:MM)" value={sf.time} onChangeText={(v) => setSf({ ...sf, time: v })} maxLength={5} keyboardType="numbers-and-punctuation" />
          <Input label="Quantity (g)" value={sf.qty} onChangeText={(v) => setSf({ ...sf, qty: v })} keyboardType="number-pad" maxLength={4} />
          <Btn t="Save schedule" onPress={save} busy={busy} />
        </Glass>
      )}
      {farm.schedules.length === 0 && <Glass solid style={{ padding: 18 }}><Text style={[st.muted, { textAlign: 'center' }]}>No schedules yet.</Text></Glass>}
      {farm.schedules.map((s) => (
        <Glass solid key={s.id} style={[st.row, { padding: 14, marginBottom: 10 }]}>
          <View style={{ flex: 1 }}><Text style={st.val}>{T12(s.feed_time)} · {name(s.pond_id)}</Text><Text style={st.muted}>{s.quantity_g} g · {s.active ? 'Active' : 'Paused'}</Text></View>
          <Switch value={s.active} onValueChange={() => run(() => toggle(s), s.active ? 'Schedule paused.' : 'Schedule resumed.')} accessibilityLabel={`${name(s.pond_id)} schedule`} />
          <Pressable onPress={() => run(() => removeSchedule(s.id), 'Schedule removed.')} accessibilityRole="button" style={{ padding: 10 }}><Text style={{ color: STATUS.critical.color, fontWeight: '600' }}>Remove</Text></Pressable>
        </Glass>
      ))}

      <Text style={st.h2}>Recent feeding</Text>
      {farm.events.length === 0 && <Glass solid style={{ padding: 18 }}><Text style={[st.muted, { textAlign: 'center' }]}>No feedings yet.</Text></Glass>}
      {farm.events.slice(0, 6).map((e) => { const [l, c, i] = EV[e.status] ?? EV.pending; return (
        <Glass solid key={e.id} style={[st.row, { padding: 14, marginBottom: 10 }]}>
          <View><Text style={st.val}>{name(e.pond_id)} · {e.quantity_g} g</Text><Text style={st.muted}>{ago(e.created_at)}</Text></View>
          <Tag label={l} color={c} icon={i} />
        </Glass>); })}
    </ScrollView>
  );
}
const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  muted: { color: C.muted, fontSize: 13.5 }, val: { fontSize: 16, fontWeight: '700', color: C.navy }, h2: { fontSize: 18, fontWeight: '700', color: C.navy, marginTop: 22, marginBottom: 10 },
  big: { fontSize: 54, fontWeight: '700', color: C.ocean, letterSpacing: -1.5, marginVertical: 2 },
});
