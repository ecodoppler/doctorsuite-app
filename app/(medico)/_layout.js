import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, StyleSheet, AppState, Platform } from 'react-native';
import { Colors } from '../../services/theme';
import { api, getUser } from '../../services/api';
import { registerForPushNotifications, setupNotificationTapHandler } from '../../services/pushNotifications';
import { GlassView, isLiquidGlass } from '../../components/glass/GlassView';

// Badge custom pro Tab de Chat (lê /api/chat/patients e soma unread)
function ChatTabIcon({ color, size }) {
  const [count, setCount] = useState(0);
  const appState = useRef(AppState.currentState);

  const reload = useCallback(async () => {
    try {
      const list = await api('/api/chat/patients');
      const total = (list || []).reduce((acc, p) => acc + (p.unread || 0), 0);
      setCount(total);
    } catch {}
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 30000);
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') reload();
      appState.current = next;
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, [reload]);

  return (
    <View>
      <Ionicons name="chatbubbles" size={size} color={color} />
      {count > 0 && (
        <View style={iconStyles.badge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
        </View>
      )}
    </View>
  );
}

export default function MedicoLayout() {
  const user = getUser();
  const clinicName = user?.clinic_name || '';
  const router = useRouter();

  useEffect(() => {
    registerForPushNotifications();
    // v0.0.102: handler de toque na push — navega pro deep_link relativo
    const cleanup = setupNotificationTapHandler(router, '/(medico)');
    return cleanup;
  }, [router]);

  // Estilo base da tab bar (extraído pra poder esconder na conversa do chat).
  const tabBarStyle = {
    position: 'absolute',
    borderTopWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: isLiquidGlass ? 'transparent' : 'rgba(255,255,255,0.94)',
    elevation: 0,
  };

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: Colors.white },
      headerTintColor: Colors.text,
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      // iOS 26: barra transparente + Liquid Glass real. Senão: barra branca clara e limpa.
      tabBarStyle,
      tabBarBackground: isLiquidGlass ? () => (
        <GlassView glassStyle="regular" style={StyleSheet.absoluteFillObject} />
      ) : undefined,
      headerRight: clinicName ? () => (
        <Text style={{ fontSize: 11, color: Colors.textMuted, marginRight: 14, maxWidth: 140 }} numberOfLines={1}>
          {clinicName}
        </Text>
      ) : undefined,
    }}>
      <Tabs.Screen name="agenda" options={{
        title: 'Agenda',
        headerTitle: 'Agenda do Dia',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="prontuario" options={{
        title: 'Prontuário',
        headerTitle: 'Prontuário',
        tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
      }} />
      <Tabs.Screen name="chat" options={({ route }) => {
        // Dentro de uma conversa ([id]): esconde a tab bar → vira tela cheia, sem a barra
        // flutuante cobrindo o campo de mensagem. Na lista (index): barra normal.
        const focused = getFocusedRouteNameFromRoute(route) ?? 'index';
        return {
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <ChatTabIcon color={color} size={size} />,
          tabBarStyle: focused === '[id]' ? { display: 'none' } : tabBarStyle,
        };
      }} />
      <Tabs.Screen name="perfil" options={{
        title: 'Perfil',
        headerTitle: 'Meu Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

const iconStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4, right: -10,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 9.5, lineHeight: 11 },
});

