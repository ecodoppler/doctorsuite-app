import { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getUser, setLogoutHandler } from '../services/api';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const handleLogout = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  useEffect(() => {
    setLogoutHandler(handleLogout);
    setIsReady(true);
  }, [handleLogout]);

  useEffect(() => {
    if (!isReady) return;
    const user = getUser();
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    }
  }, [isReady, segments]);

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
