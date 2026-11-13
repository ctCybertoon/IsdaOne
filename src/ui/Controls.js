import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { C } from './theme';
export const Btn = ({ t, onPress, kind, disabled, busy, style }) => (
  <Pressable onPress={onPress} disabled={disabled || busy} accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || busy) }}
    style={[s.btn, kind === 'ghost' && s.ghost, (disabled || busy) && { opacity: 0.55 }, style]}>
    {busy ? <ActivityIndicator color={kind === 'ghost' ? C.ocean : '#fff'} /> : <Text style={[s.bt, kind === 'ghost' && { color: C.ocean }]}>{t}</Text>}
  </Pressable>
);
export const Input = ({ label, hint, ...p }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={C.muted} autoCorrect={false} style={s.input} {...p} />
    {hint ? <Text style={s.hint}>{hint}</Text> : null}
  </View>
);
export const Pick = ({ options, value, onChange }) => (
  <View style={s.pick}>{options.map((o) => (
    <Pressable key={o.v} onPress={() => onChange(o.v)} accessibilityRole="button" accessibilityState={{ selected: value === o.v }} style={[s.pill, value === o.v && s.pillOn]}>
      <Text style={[s.pt, value === o.v && { color: '#fff' }]}>{o.l}</Text>
    </Pressable>))}</View>
);
export const Tag = ({ label, color, icon }) => (
  <View style={[s.tag, { borderColor: color, backgroundColor: color + '26' }]}><Text style={{ color, fontWeight: '800', fontSize: 12 }}>{icon}</Text><Text style={s.tt}>{label}</Text></View>
);
export const Msg = ({ err, children }) => (children ? <Text accessibilityLiveRegion="polite" style={[s.msg, err ? s.err : s.ok]}>{err ? '✕  ' : '✓  '}{children}</Text> : null);
const s = StyleSheet.create({
  btn: { backgroundColor: C.ocean, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 }, bt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.ocean },
  label: { color: C.navy, fontWeight: '600', marginBottom: 6, fontSize: 14 }, hint: { color: C.muted, fontSize: 12.5, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#9CC4E0', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.navy },
  pick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: '#9CC4E0', backgroundColor: '#fff', minHeight: 40, justifyContent: 'center' }, pillOn: { backgroundColor: C.ocean, borderColor: C.ocean }, pt: { color: C.navy, fontWeight: '600', fontSize: 14 },
  tag: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1 }, tt: { color: C.navy, fontSize: 12.5, fontWeight: '600' },
  msg: { padding: 10, borderRadius: 12, marginBottom: 10, overflow: 'hidden', fontSize: 14 }, err: { backgroundColor: '#FEE2E2', color: '#7F1D1D' }, ok: { backgroundColor: '#DCFCE7', color: '#14532D' },
});
