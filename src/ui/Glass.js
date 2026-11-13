import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
// Frosted panel for layout. `solid` = more opaque, used behind numbers and controls for readability.
export default function Glass({ solid, style, children }) {
  if (solid) return <View style={[s.base, s.solid, style]}>{children}</View>;
  return <BlurView intensity={45} tint="light" style={[s.base, s.frost, style]}>{children}</BlurView>;
}
const s = StyleSheet.create({
  base: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', overflow: 'hidden' },
  frost: { backgroundColor: 'rgba(255,255,255,0.4)' },
  solid: { backgroundColor: 'rgba(255,255,255,0.8)', shadowColor: '#1769AA', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
});
