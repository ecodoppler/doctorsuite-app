import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text } from 'react-native';
import { Colors } from '../../services/theme';
import { getUser } from '../../services/api';
import { GlassView, isLiquidGlass } from '../../components/glass/GlassView';

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
      // v0.2 Liquid Glass: tab bar flutuante translúcida
      tabBarStyle: {
        position: 'absolute',
        borderTopWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
        borderTopColor: 'rgba(0,0,0,0.06)',
        // iOS 26: barra transparente + Liquid Glass real. Senão: barra branca clara e limpa.
        backgroundColor: isLiquidGlass ? 'transparent' : 'rgba(255,255,255,0.94)',
        elevation: 0,
      },
      tabBarBackground: isLiquidGlass ? () => (
        <GlassView glassStyle="regular" style={StyleSheet.absoluteFillObject} />
      ) : undefined,
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

