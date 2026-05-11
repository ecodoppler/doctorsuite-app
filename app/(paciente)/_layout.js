import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { Colors } from '../../services/theme';
import { getUser } from '../../services/api';

export default function PacienteLayout() {
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
      <Tabs.Screen name="inicio" options={{
        title: 'Início',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="heart-circle" size={size} color={color} />,
      }} />
      <Tabs.Screen name="prenatal" options={{
        title: 'Pré-natal',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
      }} />
      <Tabs.Screen name="exames" options={{
        title: 'Exames',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="flask" size={size} color={color} />,
      }} />
      <Tabs.Screen name="exame-detalhe" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="alertas" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="vacinas" options={{
        title: 'Vacinas',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
      }} />
      <Tabs.Screen name="plano" options={{
        title: 'Plano',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
      }} />
      <Tabs.Screen name="agendamentos" options={{
        href: null,
        headerTitle: 'Minhas Consultas',
      }} />
      <Tabs.Screen name="laudos" options={{
        href: null,
        headerTitle: 'Meus Laudos',
      }} />
      <Tabs.Screen name="documentos" options={{
        href: null,
        headerTitle: 'Meus Documentos',
      }} />
      <Tabs.Screen name="perfil" options={{
        title: 'Perfil',
        headerTitle: 'Meu Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
