import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Glass from './src/ui/Glass';
import Header from './src/ui/Header';
import { C } from './src/ui/theme';
import Home, { Empty } from './src/screens/Home';
import Auth from './src/screens/Auth';
import Splash from './src/screens/Splash';
import Onboarding from './src/screens/Onboarding';
import Ponds from './src/screens/Ponds';
import Feeding from './src/screens/Feeding';
import Alerts from './src/screens/Alerts';
import Loading from './src/screens/Loading';
import { isSample, supabase } from './src/lib/data';
import { useApp } from './src/store/useApp';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'ponds', label: 'Ponds', icon: 'water-outline', view: Ponds },
  { id: 'feeding', label: 'Feeding', icon: 'time-outline', view: Feeding },
  { id: 'alerts', label: 'Alerts', icon: 'notifications-outline', view: Alerts },
];

function Shell({ email, farmName, onSignOut }) {
  const tab = useApp((st) => st.tab);
  const farm = useApp((st) => st.farm);
  const error = useApp((st) => st.error);
  const setTab = useApp((st) => st.setTab);
  const refresh = useApp((st) => st.refresh);
  const insets = useSafeAreaInsets();
  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);

  const T = TABS.find((x) => x.id === tab);
  let body;
  if (error) body = <View style={{ padding: 16 }}><Empty text={`Can’t reach the database.\n${error}`} /><Pressable style={s.btn} onPress={refresh}><Text style={s.btnT}>Try again</Text></Pressable></View>;
  else if (!farm) body = <Loading label="Loading your farm…" />;
  else if (tab === 'home') body = <Home />;
  else { const V = T.view; body = <V />; }

  return (
    <LinearGradient colors={[C.sky, '#BFE6FF', C.ice]} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {isSample && <View style={s.sample}><Text style={s.sampleT}>Sample data, not live readings</Text></View>}
        {email && <View style={s.who}><Text style={s.whoT} numberOfLines={1}>{farmName ? `${farmName} · ${email}` : email}</Text><Pressable onPress={onSignOut} accessibilityRole="button" style={{ padding: 8 }}><Text style={s.out}>Log out</Text></Pressable></View>}
        <View style={{ flex: 1 }}>{body}</View>
      </SafeAreaView>
      <Glass style={[s.tabs, { bottom: Math.max(14, insets.bottom) }]}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} style={[s.tab, tab === t.id && s.on]}>
            <Ionicons name={t.icon} size={23} color={tab === t.id ? C.ocean : C.muted} />
            <Text style={[s.tabT, { color: tab === t.id ? C.ocean : C.muted }]}>{t.label}</Text>
          </Pressable>
        ))}
      </Glass>
    </LinearGradient>
  );
}

function Root() {
  // session: undefined = still checking, null = logged out. Without Supabase keys the app runs as a sample demo, no login.
  const [session, setSession] = useState(supabase ? undefined : null);
  const [hold, setHold] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSplashDone(true), 2000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => data.subscription.unsubscribe();
  }, []);
  const account = useApp((st) => st.account), accountError = useApp((st) => st.accountError);
  useEffect(() => { if (session) useApp.getState().loadAccount(); }, [session?.user?.id]);
  if (!splashDone) return <Splash />;
  if (!supabase) return <Shell />;
  if (session === undefined) return <LinearGradient colors={[C.sky, C.ice]} style={{ flex: 1 }}><Loading label="Checking your session…" /></LinearGradient>;
  if (!session || hold) return <LinearGradient colors={[C.sky, '#BFE6FF', C.ice]} style={{ flex: 1 }}><StatusBar barStyle="dark-content" /><Auth setHold={setHold} /></LinearGradient>;
  const bg = [C.sky, '#BFE6FF', C.ice];
  if (accountError) return <LinearGradient colors={bg} style={{ flex: 1 }}><View style={{ padding: 16, paddingTop: 80 }}><Empty text={`Can’t load your farm.\n${accountError}`} /><Pressable style={s.btn} onPress={() => useApp.getState().loadAccount()}><Text style={s.btnT}>Try again</Text></Pressable></View></LinearGradient>;
  if (account === undefined) return <LinearGradient colors={bg} style={{ flex: 1 }}><Loading label="Setting up your account…" /></LinearGradient>;
  if (!account.farm) return <LinearGradient colors={bg} style={{ flex: 1 }}><StatusBar barStyle="dark-content" /><Onboarding /></LinearGradient>;
  return <Shell email={session.user.email} farmName={account.farm.name} onSignOut={() => { useApp.getState().reset(); supabase.auth.signOut(); }} />;
}
export default () => <SafeAreaProvider><Root /></SafeAreaProvider>;

const s = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', color: C.navy },
  sample: { backgroundColor: '#FFF3D6', paddingVertical: 4, alignItems: 'center' }, sampleT: { fontSize: 12, fontWeight: '600', color: C.navy },
  who: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }, whoT: { color: C.muted, fontSize: 12.5, flex: 1 }, out: { color: C.ocean, fontWeight: '600', fontSize: 13 },
  tabs: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', padding: 6, borderRadius: 99 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 99, gap: 2 }, on: { backgroundColor: C.ice },
  tabT: { fontSize: 11.5, fontWeight: '600' },
  btn: { marginTop: 12, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14, backgroundColor: C.ocean }, btnT: { color: '#fff', fontWeight: '600' },
});
