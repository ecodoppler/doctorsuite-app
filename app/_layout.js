import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, AppState, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { InterTight_700Bold, InterTight_800ExtraBold } from '@expo-google-fonts/inter-tight';
import { Fraunces_500Medium_Italic, Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces';
import { getUser, setLogoutHandler, restoreAuth } from '../services/api';
import { Colors, Spacing, FontSize, Radius } from '../services/theme';
import {
  isEnabled as bioEnabled,
  authenticate as bioAuthenticate,
  touchActive as bioTouchActive,
  shouldRelock as bioShouldRelock,
  getBiometricLabel,
} from '../services/biometric';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold_Italic,
  });
  const [isReady, setIsReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometria');
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  const handleLogout = useCallback(() => {
    setLocked(false);
    router.replace('/(auth)/login');
  }, [router]);

  useEffect(() => {
    setLogoutHandler(handleLogout);
    let mounted = true;
    (async () => {
      await restoreAuth();
      const u = getUser();
      if (u) {
        const enabled = await bioEnabled();
        if (enabled && mounted) {
          setLocked(true);
          getBiometricLabel().then(l => mounted && setBioLabel(l));
        }
      }
      if (mounted) setIsReady(true);
    })();
    return () => { mounted = false; };
  }, [handleLogout]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        await bioTouchActive();
      } else if ((prev === 'background' || prev === 'inactive') && next === 'active') {
        const u = getUser();
        if (!u) return;
        const enabled = await bioEnabled();
        if (!enabled) return;
        const relock = await bioShouldRelock();
        if (relock) {
          setLocked(true);
          getBiometricLabel().then(setBioLabel);
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isReady || locked) return;
    const user = getUser();
    const inAuth = segments[0] === '(auth)';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (inAuth) {
      const role = user.role;
      if (role === 'admin' || role === 'medico') router.replace('/(medico)/agenda');
      else if (role === 'secretaria') router.replace('/(secretaria)/agendas');
      else router.replace('/(paciente)/inicio');
    }
  }, [isReady, segments, locked]);

  const tryUnlock = useCallback(async () => {
    const res = await bioAuthenticate(`Entrar no DoctorSuite`);
    if (res?.success) {
      await bioTouchActive();
      setLocked(false);
    }
  }, []);

  useEffect(() => {
    if (locked && isReady) tryUnlock();
  }, [locked, isReady, tryUnlock]);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={s.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (locked) {
    const user = getUser();
    return (
      <View style={s.lockContainer}>
        <StatusBar style="dark" />
        <View style={s.lockIconWrap}>
          <Ionicons name="lock-closed" size={48} color={Colors.primary} />
        </View>
        <Text style={s.lockTitle}>DoctorSuite</Text>
        <Text style={s.lockSubtitle}>{user?.name ? `Olá, ${user.name.split(' ')[0]}` : 'Acesso protegido'}</Text>
        <TouchableOpacity style={s.unlockBtn} onPress={tryUnlock}>
          <Ionicons name="finger-print" size={20} color={Colors.white} />
          <Text style={s.unlockBtnText}>Desbloquear com {bioLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.logoutLink} onPress={handleLogout}>
          <Text style={s.logoutLinkText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(medico)" />
        <Stack.Screen name="(secretaria)" />
        <Stack.Screen name="(paciente)" />
      </Stack>
    </>
  );
}

const s = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, padding: Spacing.xl },
  lockIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primarySofter, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  lockTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  lockSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.md, gap: Spacing.sm },
  unlockBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  logoutLink: { marginTop: Spacing.xl, padding: Spacing.sm },
  logoutLinkText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
