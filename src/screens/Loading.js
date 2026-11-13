import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';
export default function Loading({ label = 'Loading…' }) {
  return (
    <View style={s.wrap} accessibilityLiveRegion="polite">
      <Logo size={96} />
      <ActivityIndicator size="large" color={C.ocean} style={{ marginTop: 18 }} />
      <Text style={s.t}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({ wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, t: { marginTop: 12, color: C.muted, fontSize: 15, fontWeight: '600' } });
