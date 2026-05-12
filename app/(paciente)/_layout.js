import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { Colors } from '../../services/theme';
import { getUser } from '../../services/api';
import { PregnancyProvider, usePregnancy } from '../../services/pregnancy-context';

function TabsInner() {
  const user = getUser();
  const clinicName = user?.clinic_name || '';
  const { data, loading } = usePregnancy();

  // Enquanto carrega, esconde tabs obstétricas (evita "flash" + click acidental).
  // Quando data está null por erro, também trata como não-gestante.
  const hasPregnancy = !!data?.pregnancy;
  const obstHref = hasPregnancy ? undefined : null;
  // Documentos vira tab visível quando não-gestante (vira atalho central).
  // Quando gestante, fica acessível via push (atalhos do início).
  const docsHref = hasPregnancy ? null : undefined;

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
        href: obstHref,
        tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
      }} />
      <Tabs.Screen name="exames" options={{
        title: 'Exames',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="flask" size={size} color={color} />,
      }} />
      <Tabs.Screen name="exame-detalhe" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="alertas" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notificacoes" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="vacinas" options={{
        title: 'Vacinas',
        headerShown: false,
        href: obstHref,
        tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
      }} />
      <Tabs.Screen name="plano" options={{
        title: 'Plano',
        headerShown: false,
        href: obstHref,
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
        title: 'Documentos',
        href: docsHref,
        headerTitle: 'Meus Documentos',
        tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
      }} />
      <Tabs.Screen name="perfil" options={{
        title: 'Perfil',
        headerTitle: 'Meu Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

export default function PacienteLayout() {
  return (
    <PregnancyProvider>
      <TabsInner />
    </PregnancyProvider>
  );
}
