import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Glass from '../ui/Glass';
import Chip from '../ui/Chip';
import Header from '../ui/Header';
import { Btn, Input, Msg, Tag } from '../ui/Controls';
import { C } from '../ui/theme';
import { useApp } from '../store/useApp';
import { isSample } from '../lib/data';
import { pondStatus, readingState, ago, STATUS } from '../lib/status';

const num = (v) => (v.trim() === '' ? NaN : Number(v));
function validate(f) {
  const name = f.name.trim(), w = num(f.w), c = num(f.c);
  if (!name) return 'Enter a pond name.';
  if (name.length > 40) return 'Pond name must be 40 characters or fewer.';
  if (f.species.trim().length > 30) return 'Species must be 30 characters or fewer.';
  if (!(w > 0 && w <= 20) || !(c > 0 && c <= 20)) return 'Enter oxygen levels between 0 and 20 mg/L.';
  if (c >= w) return 'The critical level must be lower than the warning level.';
  return null;
}
const sensorOf = (r) => { const s = readingState(r); return s === 'live' ? { l: 'Sensor connected', c: STATUS.normal.color, i: '✓' } : s === 'stale' ? { l: 'Sensor data stale', c: STATUS.warning.color, i: '▲' } : { l: 'No valid reading', c: STATUS.unavailable.color, i: '?' }; };
const BLANK = { name: '', species: '', w: '5.0', c: '3.5' };

export default function Ponds() {
  const farm = useApp((s) => s.farm), addPond = useApp((s) => s.addPond), updatePond = useApp((s) => s.updatePond), simulate = useApp((s) => s.simulateReading);
  const [view, setView] = useState('list'); // list | form | detail
  const [id, setId] = useState(null);
  const [f, setF] = useState(BLANK);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const pond = farm.ponds.find((p) => p.id === id);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const open = (v, p) => { setMsg(null); setId(p?.id ?? null); setF(p ? { name: p.name, species: p.species ?? '', w: String(p.do_warning), c: String(p.do_critical) } : BLANK); setView(v); };
  const run = async (fn, okText, done) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (okText) setMsg({ t: okText }); done?.(); } catch (e) { setMsg({ err: true, t: 'That didn’t work. Check your connection and try again.' }); }
    setBusy(false);
  };
  const save = () => {
    const bad = validate(f); if (bad) return setMsg({ err: true, t: bad });
    const row = { name: f.name.trim(), species: f.species.trim() || null, do_warning: num(f.w), do_critical: num(f.c) };
    run(() => (id ? updatePond(id, row) : addPond(row)), null, () => setView(id ? 'detail' : 'list'));
  };
  const wrap = { padding: 16, paddingBottom: 130 };

  if (view === 'form') return (
    <ScrollView contentContainerStyle={wrap} keyboardShouldPersistTaps="handled">
      <Header title={id ? 'Edit pond' : 'Add pond'} />
      <Glass solid style={{ padding: 20 }}>
        <Input label="Pond name" value={f.name} onChangeText={set('name')} maxLength={40} />
        <Input label="Fish species (optional)" value={f.species} onChangeText={set('species')} maxLength={30} />
        <Input label="Warning level (mg/L)" value={f.w} onChangeText={set('w')} keyboardType="decimal-pad" hint="Oxygen levels depend on the species and farm conditions. Set them using local aquaculture guidance." />
        <Input label="Critical level (mg/L)" value={f.c} onChangeText={set('c')} keyboardType="decimal-pad" />
        <Msg err={msg?.err}>{msg?.t}</Msg>
        <Btn t="Save pond" onPress={save} busy={busy} />
        <Btn kind="ghost" t="Cancel" onPress={() => setView(id ? 'detail' : 'list')} style={{ marginTop: 10 }} />
      </Glass>
    </ScrollView>
  );

  if (view === 'detail' && pond) {
    const s = pondStatus(pond, pond.reading), r = pond.reading, live = s.key !== 'unavailable', sn = sensorOf(r);
    const aer = farm.aerators[pond.id]?.state ?? 'unknown';
    return (
      <ScrollView contentContainerStyle={wrap}>
        <Header title={pond.name} subtitle={pond.species ?? 'Pond details'} />
        <Glass solid style={{ padding: 20 }}>
          <View style={st.row}><Text style={st.muted}>Dissolved oxygen</Text><Chip s={s} /></View>
          <Text style={st.big}>{live ? Number(r.do_mgl).toFixed(1) : '--'}<Text style={st.unit}> mg/L</Text></Text>
          <Text style={st.muted}>{r ? `${live ? 'Updated' : 'Last reading'} ${ago(r.recorded_at)}${r.source === 'simulated' ? ' · simulated' : ''}` : 'No reading yet'}</Text>
        </Glass>
        <Glass solid style={{ padding: 16, marginTop: 12, gap: 10 }}>
          <Row k="Water temperature" v={r?.temp_c != null && live ? `${Number(r.temp_c).toFixed(1)} °C` : '--'} />
          <Row k="Aerator" v={{ on: 'Running', off: 'Off', unknown: 'No status' }[aer] ?? aer} />
          <Row k="Warning level" v={`${pond.do_warning} mg/L`} />
          <Row k="Critical level" v={`${pond.do_critical} mg/L`} />
          <View style={st.row}><Text style={st.muted}>Sensor</Text><Tag label={sn.l} color={sn.c} icon={sn.i} /></View>
        </Glass>
        <View style={{ marginTop: 14, gap: 10 }}>
          <Msg err={msg?.err}>{msg?.t}</Msg>
          {!isSample && <Btn t="Add simulated reading" onPress={() => run(() => simulate(pond), 'Simulated reading added.')} busy={busy} />}
          <Btn kind="ghost" t="Edit pond" onPress={() => open('form', pond)} />
          <Btn kind="ghost" t="Back to ponds" onPress={() => { setMsg(null); setView('list'); }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={wrap}>
      <Header title="Ponds" subtitle={`${farm.ponds.length} managed`} />
      <Btn t="Add pond" onPress={() => open('form')} style={{ marginBottom: 14 }} />
      {farm.ponds.length === 0 && <Glass solid style={{ padding: 22 }}><Text style={[st.muted, { textAlign: 'center' }]}>No ponds yet. Tap “Add pond” to create your first one.</Text></Glass>}
      {farm.ponds.map((p) => {
        const s = pondStatus(p, p.reading), r = p.reading, live = s.key !== 'unavailable', sn = sensorOf(r);
        return (
          <Pressable key={p.id} onPress={() => open('detail', p)} accessibilityRole="button" accessibilityLabel={`${p.name}, ${s.label}`}>
            <Glass solid style={{ padding: 16, marginBottom: 10, gap: 8 }}>
              <View style={st.row}><View><Text style={st.name}>{p.name}</Text><Text style={st.muted}>{p.species ?? 'No species set'}</Text></View><Chip s={s} /></View>
              <View style={st.row}>
                <Text style={st.val}>{live ? Number(r.do_mgl).toFixed(1) : '--'} <Text style={st.muted}>mg/L</Text></Text>
                <Text style={st.val}>{r?.temp_c != null && live ? `${Number(r.temp_c).toFixed(1)} °C` : '-- °C'}</Text>
              </View>
              <View style={st.row}><Tag label={sn.l} color={sn.c} icon={sn.i} /><Text style={st.muted}>{r ? ago(r.recorded_at) : 'no data'}</Text></View>
            </Glass>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const Row = ({ k, v }) => <View style={st.row}><Text style={st.muted}>{k}</Text><Text style={st.val}>{v}</Text></View>;
const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { color: C.muted, fontSize: 13.5 }, name: { fontSize: 18, fontWeight: '700', color: C.navy }, val: { fontSize: 16, fontWeight: '700', color: C.navy },
  big: { fontSize: 64, fontWeight: '700', color: C.ocean, letterSpacing: -2, marginTop: 4 }, unit: { fontSize: 18, color: C.muted, fontWeight: '600', letterSpacing: 0 },
});
