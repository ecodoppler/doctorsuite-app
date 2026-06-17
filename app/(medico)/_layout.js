import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { AppState } from 'react-native';
import { api } from '../../services/api';
import { registerForPushNotifications, setupNotificationTapHandler } from '../../services/pushNotifications';

// Contador de mensagens não lidas (pro Badge nativo do Chat).
function useChatUnread() {
  const [count, setCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const reload = useCallback(async () => {
    try {
      const list = await api('/api/chat/patients');
      setCount((list || []).reduce((acc, p) => acc + (p.unread || 0), 0));
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
  return count;
}

export default function MedicoLayout() {
  const router = useRouter();
  const unread = useChatUnread();

  useEffect(() => {
    registerForPushNotifications();
    const cleanup = setupNotificationTapHandler(router, '/(medico)');
    return cleanup;
  }, [router]);

  // Barra de abas NATIVA (UITabBar). No iOS 26 o sistema aplica o Liquid Glass automaticamente
  // (pílula flutuante translúcida com refração). Ícones via SF Symbols; cabeçalho de cada tela
  // é feito pelo componente ScreenHeader (NativeTabs não fornece header).
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="agenda">
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Agenda</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prontuario">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Prontuário</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>Chat</Label>
        {unread > 0 ? <Badge>{unread > 99 ? '99+' : String(unread)}</Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
