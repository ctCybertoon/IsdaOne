import { View, Text, StyleSheet } from 'react-native';
import Logo from './Logo';
import { C } from './theme';
// Shared page header: logo + title (+ optional subtitle). Use at the top of every tab.
export default function Header({ title, subtitle }) {
  return (
    <View style={s.row}>
      <Logo size={44} />
      <View>{subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}<Text style={s.h1} accessibilityRole="header">{title}</Text></View>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  h1: { fontSize: 32, fontWeight: '700', color: C.navy, letterSpacing: -0.5 }, sub: { color: C.muted, fontSize: 13.5 },
});
