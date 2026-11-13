import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Glass from '../ui/Glass';
import Chip from '../ui/Chip';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';
import { useApp } from '../store/useApp';
import { pondStatus, worst, ago, STATUS } from '../lib/status';

const RANK = { critical: 3, warning: 2, unavailable: 1, normal: 0 };
const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function Home() {
  const farm = useApp((st) => st.farm);
  const selPond = useApp((st) => st.selectedPond);
  const onSelectPond = useApp((st) => st.selectPond);
  const go = useApp((st) => st.setTab);
  const rows = farm.ponds.map((p) => ({ p, s: pondStatus(p, p.reading) }));
  if (!rows.length) return <Empty text="No ponds yet. Add your first pond in the Ponds tab." />;
  const overall = worst(rows.map((r) => r.s));
  const focus = rows.find((r) => r.p.id === selPond) || [...rows].sort((a, b) => RANK[b.s.key] - RANK[a.s.key])[0];
  const { p, s } = focus, r = p.reading, live = s.key !== 'unavailable';
  const aer = farm.aerators[p.id]?.state ?? 'unknown';
  const msg = { normal: 'All ponds are normal', warning: 'A pond needs attention', critical: 'A pond needs action now', unavailable: 'Some readings are unavailable' }[overall.key];
  const oc = STATUS[overall.key].color;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
      <View style={st.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Logo size={44} /><View><Text style={st.muted}>{hello()}</Text><Text style={st.h1}>IsdaOne</Text></View></View>
        <Pressable onPress={() => go('alerts')} accessibilityLabel={`Alerts, ${farm.alerts.length} active`} style={st.bell}>
          <Ionicons name="notifications-outline" size={22} color={C.navy} />
          {farm.alerts.length > 0 && <View style={st.badge}><Text style={st.badgeT}>{farm.alerts.length}</Text></View>}
        </Pressable>
      </View>
      <Glass style={[st.banner, { borderLeftColor: oc, borderLeftWidth: 6 }]}>
        <View style={[st.dot, { backgroundColor: oc }]}><Text style={st.dotT}>{STATUS[overall.key].icon}</Text></View>
        <Text style={st.bannerT}>{msg}</Text>
      </Glass>
      <Glass solid style={{ padding: 20, marginTop: 14 }}>
        <View style={st.row}><Text style={st.muted}>{p.name} · {p.species ?? ''}</Text><Chip s={s} /></View>
        <Text style={st.big}>{live ? Number(r.do_mgl).toFixed(1) : '--'}<Text style={st.unit}> mg/L</Text></Text>
        <Text style={st.muted}>Dissolved oxygen · {r ? (live ? 'updated ' : 'last reading ') + ago(r.recorded_at) : 'no reading yet'}{r?.source === 'simulated' ? ' · simulated' : ''}</Text>
        {!live && <Text style={st.note}>This reading can’t be trusted. Check the sensor.</Text>}
      </Glass>
      <View style={[st.row, { gap: 12, marginTop: 12 }]}>
        <Glass solid style={st.mini}><Text style={st.muted}>Water temperature</Text><Text style={st.miniV}>{r?.temp_c != null && live ? Number(r.temp_c).toFixed(1) + ' °C' : '--'}</Text></Glass>
        <Glass solid style={st.mini}><Text style={st.muted}>Aerator</Text><Text style={st.miniV}>{{ on: 'Running', off: 'Off', unknown: 'No status' }[aer] ?? aer}</Text></Glass>
      </View>
      <Text style={st.h2}>Ponds</Text>
      {rows.map(({ p, s }) => (
        <Pressable key={p.id} onPress={() => onSelectPond(p.id)} accessibilityRole="button">
          <Glass solid style={[st.row, st.item]}>
            <View><Text style={st.itemT}>{p.name}</Text><Text style={st.muted}>{p.species ?? ''}</Text></View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={st.itemT}>{p.reading && s.key !== 'unavailable' ? Number(p.reading.do_mgl).toFixed(1) + ' mg/L' : '--'}</Text>
              <Chip s={s} />
            </View>
          </Glass>
        </Pressable>
      ))}
      <Text style={st.h2}>Active alerts</Text>
      {farm.alerts.length === 0 ? <Glass solid style={{ padding: 20 }}><Text style={[st.muted, { textAlign: 'center' }]}>No active alerts.</Text></Glass>
        : farm.alerts.map((a) => {
          const col = STATUS[a.severity]?.color ?? '#3882F6';
          return (
            <Pressable key={a.id} onPress={() => go('alerts')}>
              <Glass solid style={[st.item, { flexDirection: 'row', gap: 12, alignItems: 'center', borderLeftColor: col, borderLeftWidth: 6 }]}>
                <View style={[st.dot, { backgroundColor: col }]}><Text style={st.dotT}>{STATUS[a.severity]?.icon ?? 'i'}</Text></View>
                <View style={{ flex: 1 }}><Text style={st.itemT}>{a.type}</Text><Text style={st.muted}>{farm.ponds.find((x) => x.id === a.pond_id)?.name ?? ''} · {ago(a.created_at)}</Text></View>
              </Glass>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}
export const Empty = ({ text }) => <View style={{ padding: 16 }}><Glass solid style={{ padding: 22 }}><Text style={[st.muted, { textAlign: 'center', lineHeight: 22 }]}>{text}</Text></Glass></View>;

const st = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  muted: { color: C.muted, fontSize: 13.5 }, h1: { fontSize: 32, fontWeight: '700', color: C.navy, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700', color: C.navy, marginTop: 22, marginBottom: 10 },
  bell: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  badgeT: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 16 },
  bannerT: { fontWeight: '600', color: C.navy, fontSize: 15 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, dotT: { color: '#fff', fontWeight: '800', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  big: { fontSize: 76, fontWeight: '700', color: C.ocean, letterSpacing: -2, marginTop: 6 }, unit: { fontSize: 19, color: C.muted, fontWeight: '600', letterSpacing: 0 },
  note: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: '#FFF3D6', color: C.navy, overflow: 'hidden' },
  mini: { flex: 1, padding: 14, gap: 4 }, miniV: { fontSize: 20, fontWeight: '700', color: C.navy },
  item: { padding: 14, paddingHorizontal: 16, marginBottom: 10, minHeight: 64 }, itemT: { fontSize: 16, fontWeight: '600', color: C.navy },
});
