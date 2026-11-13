import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Glass from '../ui/Glass';
import Header from '../ui/Header';
import { Btn, Pick, Msg, Tag } from '../ui/Controls';
import { C } from '../ui/theme';
import { useApp } from '../store/useApp';
import { ago, STATUS } from '../lib/status';

const FILTERS = [{ v: 'all', l: 'All' }, { v: 'warning', l: 'Warnings' }, { v: 'critical', l: 'Errors' }, { v: 'info', l: 'Info' }];
const SEV = { critical: ['Critical', STATUS.critical.color, '✕'], warning: ['Warning', STATUS.warning.color, '▲'], info: ['Info', '#3882F6', 'i'] };
const nextStep = (t = '') => /oxygen/i.test(t) ? 'Check the aerator and the pond’s recent readings.' : /sensor/i.test(t) ? 'Check the sensor’s power and its connection to the controller.' : /feeder/i.test(t) ? 'Check the feeder hopper and its connection.' : '';

export default function Alerts() {
  const farm = useApp((s) => s.farm), resolve = useApp((s) => s.resolveAlert);
  const [filter, setFilter] = useState('all'), [msg, setMsg] = useState(null), [busy, setBusy] = useState(null);
  const pondName = (id) => farm.ponds.find((p) => p.id === id)?.name ?? '';
  const list = farm.alertLog.filter((a) => filter === 'all' || a.severity === filter).sort((a, b) => (b.status === 'active') - (a.status === 'active'));
  const done = async (id) => {
    setBusy(id); setMsg(null);
    try { await resolve(id); } catch (e) { setMsg('Couldn’t update the alert. Check your connection and try again.'); }
    setBusy(null);
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
      <Header title="Alerts" subtitle={`${farm.alerts.length} active`} />
      <Pick options={FILTERS} value={filter} onChange={setFilter} />
      <Msg err>{msg}</Msg>
      {list.length === 0 && <Glass solid style={{ padding: 22 }}><Text style={[st.muted, { textAlign: 'center' }]}>No alerts here.</Text></Glass>}
      {list.map((a) => {
        const [label, col, icon] = SEV[a.severity] ?? SEV.info, active = a.status === 'active', step = nextStep(a.type);
        return (
          <Glass solid key={a.id} style={{ padding: 16, marginBottom: 10, gap: 6, borderLeftWidth: 6, borderLeftColor: col, opacity: active ? 1 : 0.8 }}>
            <View style={st.row}><Tag label={label} color={col} icon={icon} /><Text style={[st.state, { color: active ? col : C.muted }]}>{active ? 'Active' : 'Resolved'}</Text></View>
            <Text style={st.title}>{a.type}</Text>
            <Text style={st.muted}>{pondName(a.pond_id)} · {ago(a.created_at)}</Text>
            {a.message ? <Text style={st.body}>{a.message}</Text> : null}
            {active && step ? <Text style={st.step}>Next step: {step}</Text> : null}
            {active && <Btn kind="ghost" t="Mark resolved" onPress={() => done(a.id)} busy={busy === a.id} style={{ marginTop: 6, minHeight: 44, paddingVertical: 9 }} />}
          </Glass>
        );
      })}
    </ScrollView>
  );
}
const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, muted: { color: C.muted, fontSize: 13.5 },
  title: { fontSize: 17, fontWeight: '700', color: C.navy }, body: { color: C.navy, fontSize: 15, lineHeight: 21 }, state: { fontWeight: '700', fontSize: 13 },
  step: { color: C.navy, fontSize: 14, backgroundColor: C.ice, padding: 8, borderRadius: 10, overflow: 'hidden' },
});
