import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { Colors } from '../../services/theme';
import { getUser } from '../../services/api';

export default function SecretariaLayout() {
  const user = getUser();
  const clinicName = user?.clinic_name || '';

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
      <Tabs.Screen name="agendas" options={{
        title: 'Agendas',
        headerTitle: 'Agendas',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="ponto" options={{
        title: 'Ponto',
        headerTitle: 'Ponto Eletrônico',
        tabBarIcon: ({ color, size }) => <Ionicons name="finger-print" size={size} color={color} />,
      }} />
      <Tabs.Screen name="perfil" options={{
        title: 'Perfil',
        headerTitle: 'Meu Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

