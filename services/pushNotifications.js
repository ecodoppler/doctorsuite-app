import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let _pushToken = null;

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('[PUSH] Must use physical device for push notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PUSH] Permission not granted');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'DoctorSuite',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    _pushToken = tokenData.data;
    console.log('[PUSH] Token:', _pushToken);

    // Send token to server
    await api('/api/push-token', {
      method: 'POST',
      body: JSON.stringify({ token: _pushToken }),
    });
    console.log('[PUSH] Token registered on server');
    return _pushToken;
  } catch (err) {
    console.warn('[PUSH] Error registering:', err);
    return null;
  }
}

export async function unregisterPushNotifications() {
  if (_pushToken) {
    try {
      await api('/api/push-token', {
        method: 'DELETE',
        body: JSON.stringify({ token: _pushToken }),
      });
    } catch {}
    _pushToken = null;
  }
}

// v0.0.102: handler de toque em push notification.
// Push payload (Expo) chega com data: { deep_link, notification_id, kind, ... }
// Quando o usuário toca na notificação:
//   1. Marca notification_id como lida (best-effort)
//   2. Navega pra deep_link (relativo à área do usuário — paciente ou médico)
// `baseRoute` = '/(paciente)' | '/(medico)'.
export function setupNotificationTapHandler(router, baseRoute = '/(paciente)') {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data || {};
      const notifId = data.notification_id;
      const deepLink = data.deep_link;
      if (notifId) {
        api(`/api/my-notifications/${notifId}/read`, { method: 'POST' }).catch(() => {});
      }
      if (deepLink) {
        // Pequeno delay pra UI estar pronta (especialmente cold start)
        setTimeout(() => {
          try {
            // A conversa do chat (médico) virou tela cheia no Stack raiz (/conversa/<id>),
            // fora do grupo de abas — então o deep_link '/chat/<id>' abre lá. O '/chat'
            // (lista, sem id) continua relativo à área do usuário.
            const convo = /^\/chat\/(.+)$/.exec(deepLink);
            if (convo) {
              router.push(`/conversa/${convo[1]}`);
            } else {
              router.push(`${baseRoute}${deepLink}`);
            }
          } catch (e) { console.warn('[push tap nav]', e.message); }
        }, 200);
      }
    } catch (e) { console.warn('[push tap handler]', e.message); }
  });
  return () => sub.remove();
}
