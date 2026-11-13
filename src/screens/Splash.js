import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';
// Shown for ~2 seconds at launch. Same ice-blue background as the native splash, so the hand-off is seamless.
export default function Splash() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 800, useNativeDriver: true }).start(); }, [a]);
  return (
    <View style={s.wrap}>
      <Animated.View style={{ alignItems: 'center', opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
        <Logo size={170} />
        <Text style={s.name}>IsdaOne</Text>
        <Text style={s.tag}>Monitor your ponds. Manage your feeding.{'\n'}Protect your fish.</Text>
      </Animated.View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#EAF6FF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  name: { fontSize: 38, fontWeight: '700', color: C.navy, letterSpacing: -1, marginTop: 8 },
  tag: { color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 21, fontSize: 15 },
});
