import { View, Text, StyleSheet } from 'react-native';
import { STATUS } from '../lib/status';
import { C } from './theme';
export default function Chip({ s }) {
  const col = STATUS[s.key].color;
  return (
    <View style={[st.chip, { borderColor: col, backgroundColor: col + '26' }]}>
      <Text style={{ color: col, fontWeight: '800', fontSize: 12 }}>{STATUS[s.key].icon}</Text>
      <Text style={st.t}>{s.label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  chip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  t: { color: C.navy, fontSize: 12.5, fontWeight: '600' },
});
