import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { Colors } from '../../services/theme';
import { getUser } from '../../services/api';
import { registerForPushNotifications } from '../../services/pushNotifications';

export default function MedicoLayout() {
  const user = getUser();
  const clinicName = user?.clinic_name || '';

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: Colors.white },
      headerTintColor: Colors.text,
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
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
      <Tabs.Screen name="perfil" options={{
        title: 'Perfil',
        headerTitle: 'Meu Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

