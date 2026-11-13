import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import Glass from '../ui/Glass';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';
import { supabase } from '../lib/data';
import { norm, emailOk, RULES, passOk, friendly } from '../lib/auth';

const T = {
  login: ['Welcome back', 'Log in to check your ponds.', 'Log in'],
  signup: ['Create your account', 'Start monitoring your ponds.', 'Create account'],
  verify: ['Check your email', 'Enter the code we sent to confirm your account.', 'Confirm account'],
  forgot: ['Reset your password', 'Enter your email and we’ll send you a code.', 'Send code'],
  reset: ['Choose a new password', 'Enter the code from your email and a new password.', 'Save new password'],
};
const codeOk = (c) => /^\d{6,8}$/.test(c.trim());

export default function Auth({ setHold }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', pw: '', pw2: '', code: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [wait, setWait] = useState(0);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const email = norm(f.email);
  const fail = (t) => setMsg({ err: true, t });
  const go = (m, note) => { setMode(m); setMsg(note ? { t: note } : null); setShow(false); setF((s) => ({ ...s, pw: '', pw2: '', code: '' })); };
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function run(fn) { setBusy(true); setMsg(null); try { await fn(); } catch (e) { fail(friendly(e)); } setBusy(false); }
  const needNewPw = () => !passOk(f.pw) ? 'Your password doesn’t meet all the requirements.' : f.pw !== f.pw2 ? 'Passwords don’t match.' : null;

  const submit = () => run(async () => {
    const A = supabase.auth;
    if (mode !== 'verify' && !emailOk(f.email)) return fail('Enter a valid email address.');
    if (mode === 'login') {
      if (!f.pw) return fail('Enter your password.');
      const { error } = await A.signInWithPassword({ email, password: f.pw });
      if (error && /not confirmed/i.test(error.message)) return go('verify', 'Confirm your email first. Tap “Resend code” if you need a new one.');
      if (error) throw error;
    } else if (mode === 'signup') {
      const bad = needNewPw(); if (bad) return fail(bad);
      const { data, error } = await A.signUp({ email, password: f.pw });
      if (error) throw error;
      if (data.user?.identities?.length === 0) return fail('An account with this email already exists. Log in or reset your password.');
      if (!data.session) { go('verify', `We sent a code to ${email}.`); setWait(60); }
    } else if (mode === 'verify') {
      if (!codeOk(f.code)) return fail('Enter the numeric code from your email.');
      const { error } = await A.verifyOtp({ email, token: f.code.trim(), type: 'signup' });
      if (error) throw error;
    } else if (mode === 'forgot') {
      const { error } = await A.resetPasswordForEmail(email);
      if (error) throw error;
      go('reset', 'If an account exists for this email, we sent a code.'); setWait(60);
    } else if (mode === 'reset') {
      if (!codeOk(f.code)) return fail('Enter the numeric code from your email.');
      const bad = needNewPw(); if (bad) return fail(bad);
      setHold(true); // keep this screen up while the temporary recovery session exists
      try {
        const v = await A.verifyOtp({ email, token: f.code.trim(), type: 'recovery' }); if (v.error) throw v.error;
        const u = await A.updateUser({ password: f.pw }); if (u.error) throw u.error;
        setHold(false);
      } catch (e) { await A.signOut(); setHold(false); throw e; }
    }
  });
  const resend = () => run(async () => {
    const { error } = mode === 'verify' ? await supabase.auth.resend({ type: 'signup', email }) : await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    setWait(60); setMsg({ t: 'New code sent. Check your email.' });
  });

  const newPw = mode === 'signup' || mode === 'reset';
  const Link = ({ t, onPress, off }) => <Pressable onPress={onPress} disabled={off || busy} accessibilityRole="link" style={st.link}><Text style={[st.linkT, off && { opacity: 0.5 }]}>{t}</Text></Pressable>;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Logo size={64} /><Text style={st.brand}>IsdaOne</Text></View>
        <Text style={st.tag}>Monitor your ponds. Manage your feeding. Protect your fish.</Text>
        <Glass solid style={{ padding: 20, marginTop: 22 }}>
          <Text style={st.h}>{T[mode][0]}</Text>
          <Text style={[st.muted, { marginBottom: 14 }]}>{T[mode][1]}</Text>
          {mode !== 'verify' && <Field label="Email" value={f.email} onChange={set('email')} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" editable={mode !== 'reset'} />}
          {(mode === 'verify' || mode === 'reset') && <Field label="Code from email" value={f.code} onChange={set('code')} keyboardType="number-pad" maxLength={8} />}
          {(mode === 'login' || newPw) && <Field label={mode === 'reset' ? 'New password' : 'Password'} value={f.pw} onChange={set('pw')} secure={!show} toggle={() => setShow(!show)} shown={show} autoComplete={newPw ? 'new-password' : 'current-password'} textContentType={newPw ? 'newPassword' : 'password'} />}
          {newPw && <>
            <Field label="Confirm password" value={f.pw2} onChange={set('pw2')} secure={!show} />
            <View style={{ gap: 4, marginBottom: 6 }}>{RULES.map((r) => { const ok = r.test(f.pw); return <Text key={r.id} style={{ color: ok ? '#15803D' : C.muted, fontSize: 13 }}>{ok ? '✓' : '○'}  {r.label}</Text>; })}</View>
          </>}
          {msg && <Text accessibilityLiveRegion="polite" style={[st.msg, msg.err ? st.err : st.ok]}>{msg.err ? '✕  ' : ''}{msg.t}</Text>}
          <Pressable onPress={submit} disabled={busy} accessibilityRole="button" style={[st.btn, busy && { opacity: 0.7 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>{T[mode][2]}</Text>}
          </Pressable>
          <View style={{ marginTop: 6 }}>
            {mode === 'login' && <><Link t="Forgot password?" onPress={() => go('forgot')} /><Link t="New here? Create an account" onPress={() => go('signup')} /></>}
            {mode === 'signup' && <Link t="Already have an account? Log in" onPress={() => go('login')} />}
            {(mode === 'verify' || mode === 'reset') && <Link t={wait > 0 ? `Resend code in ${wait}s` : 'Resend code'} onPress={resend} off={wait > 0} />}
            {mode !== 'login' && mode !== 'signup' && <Link t="Back to log in" onPress={() => go('login')} />}
          </View>
        </Glass>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, secure, toggle, shown, ...p }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={st.label}>{label}</Text>
      <View style={st.inputRow}>
        <TextInput value={value} onChangeText={onChange} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false} accessibilityLabel={label} style={st.input} placeholderTextColor={C.muted} {...p} />
        {toggle && <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'} style={{ padding: 12 }}><Text style={{ color: C.ocean, fontWeight: '600' }}>{shown ? 'Hide' : 'Show'}</Text></Pressable>}
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  brand: { fontSize: 40, fontWeight: '700', color: C.navy, letterSpacing: -1 }, tag: { color: C.muted, marginTop: 4, fontSize: 15 },
  h: { fontSize: 22, fontWeight: '700', color: C.navy, marginBottom: 2 }, muted: { color: C.muted, fontSize: 14 },
  label: { color: C.navy, fontWeight: '600', marginBottom: 6, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#9CC4E0', borderRadius: 14, backgroundColor: '#fff', paddingLeft: 14 },
  input: { flex: 1, paddingVertical: 13, fontSize: 16, color: C.navy },
  msg: { padding: 10, borderRadius: 12, marginBottom: 10, overflow: 'hidden', fontSize: 14 }, err: { backgroundColor: '#FEE2E2', color: '#7F1D1D' }, ok: { backgroundColor: C.ice, color: C.navy },
  btn: { backgroundColor: C.ocean, borderRadius: 14, paddingVertical: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center' }, btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { paddingVertical: 10, minHeight: 44, justifyContent: 'center' }, linkT: { color: C.ocean, fontWeight: '600', textAlign: 'center' },
});
