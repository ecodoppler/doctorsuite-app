import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getUser, setLogoutHandler, restoreAuth } from '../services/api';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const handleLogout = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  // Carrega sessao persistida (SecureStore) ANTES de qualquer redirect
  useEffect(() => {
    setLogoutHandler(handleLogout);
    let mounted = true;
    (async () => {
      await restoreAuth();
      if (mounted) setIsReady(true);
    })();
    return () => { mounted = false; };
  }, [handleLogout]);

  // Redireciona conforme estado da sessao + role do usuario
  useEffect(() => {
    if (!isReady) return;
    const user = getUser();
    const inAuth = segments[0] === '(auth)';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    // Se ja logado e ainda em auth, manda para a area do role
    if (inAuth) {
      const role = user.role;
      if (role === 'admin' || role === 'medico') router.replace('/(medico)/agenda');
      else if (role === 'secretaria') router.replace('/(secretaria)/agendas');
      else router.replace('/(paciente)/agendamentos');
    }
  }, [isReady, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fc' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
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
