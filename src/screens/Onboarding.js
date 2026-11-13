import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Glass from '../ui/Glass';
import Logo from '../ui/Logo';
import { Btn, Input, Pick, Msg } from '../ui/Controls';
import { C } from '../ui/theme';
import { useApp } from '../store/useApp';
import { supabase } from '../lib/data';

const SPECIES = ['Tilapia', 'Bangus', 'Catfish', 'Other'].map((v) => ({ v, l: v }));
function check(v) {
  if (v.fullName.length < 2 || v.fullName.length > 60) return 'Enter your full name (2 to 60 characters).';
  if (v.phone && !/^(\+639|09)\d{9}$/.test(v.phone)) return 'Enter a valid Philippine mobile number like 0917 123 4567, or leave it blank.';
  if (v.farmName.length < 2 || v.farmName.length > 60) return 'Enter your farm name (2 to 60 characters).';
  if (v.municipality.length < 2 || v.municipality.length > 60) return 'Enter your municipality or city.';
  if (v.barangay.length > 60) return 'Barangay must be 60 characters or fewer.';
  if (v.pondName.length > 40) return 'Pond name must be 40 characters or fewer.';
  return null;
}
export default function Onboarding() {
  const save = useApp((s) => s.saveOnboarding);
  const [f, setF] = useState({ fullName: '', phone: '', farmName: '', municipality: '', barangay: '', species: 'Tilapia', pondName: 'Pond 01' });
  const [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const submit = async () => {
    const v = { fullName: f.fullName.trim(), phone: f.phone.replace(/[\s-]/g, ''), farmName: f.farmName.trim(), municipality: f.municipality.trim(), barangay: f.barangay.trim(), species: f.species === 'Other' ? null : f.species, pondName: f.pondName.trim() };
    const bad = check(v); if (bad) return setMsg(bad);
    setBusy(true); setMsg(null);
    try { await save({ ...v, phone: v.phone || null, barangay: v.barangay || null, pondName: v.pondName || null }); }
    catch (e) { setMsg('Couldn’t save your farm. Check your connection and try again.'); setBusy(false); }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Logo size={56} /><Text style={st.h1}>Set up your farm</Text></View>
        <Text style={[st.muted, { marginTop: 6 }]}>A few details before your dashboard. We only ask for what the app needs.</Text>
        <Glass solid style={{ padding: 20, marginTop: 18 }}>
          <Text style={st.sec}>About you</Text>
          <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} maxLength={60} autoComplete="name" />
          <Input label="Mobile number (optional)" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={16} hint="Used later for alerts. Leave blank if you prefer." />
          <Text style={st.sec}>Your farm</Text>
          <Input label="Farm name" value={f.farmName} onChangeText={set('farmName')} maxLength={60} />
          <Input label="Municipality or city" value={f.municipality} onChangeText={set('municipality')} maxLength={60} />
          <Input label="Barangay (optional)" value={f.barangay} onChangeText={set('barangay')} maxLength={60} />
          <Text style={st.label}>Main fish species</Text>
          <Pick options={SPECIES} value={f.species} onChange={set('species')} />
          <Text style={st.sec}>First pond (optional)</Text>
          <Input label="Pond name" value={f.pondName} onChangeText={set('pondName')} maxLength={40} hint="Leave blank to add ponds later. You can change its oxygen levels in the Ponds tab." />
          <Msg err>{msg}</Msg>
          <Btn t="Save and continue" onPress={submit} busy={busy} />
          <Btn kind="ghost" t="Log out" onPress={() => { useApp.getState().reset(); supabase?.auth.signOut(); }} disabled={busy} style={{ marginTop: 10 }} />
        </Glass>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const st = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', color: C.navy, letterSpacing: -0.5, flex: 1 }, muted: { color: C.muted, fontSize: 14.5 },
  sec: { fontSize: 17, fontWeight: '700', color: C.navy, marginBottom: 10, marginTop: 4 }, label: { color: C.navy, fontWeight: '600', marginBottom: 8, fontSize: 14 },
});
