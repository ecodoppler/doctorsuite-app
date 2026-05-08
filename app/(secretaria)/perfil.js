import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUser, logout } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const roleLabel = (r) => {
    if (r === 'admin') return 'Administrador';
    if (r === 'medico') return 'Médico(a)';
    if (r === 'secretaria') return 'Secretário(a)';
    return 'Paciente';
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.name || 'Usuário'}</Text>
        <Text style={s.role}>{roleLabel(user?.role)}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      <View style={s.section}>
        <MenuItem icon="medical" label="Clínica" value={user?.clinic_name || '—'} />
        <MenuItem icon="briefcase" label="Função" value={roleLabel(user?.role)} />
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={s.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={s.version}>DoctorSuite App v1.0.0</Text>
    </View>
  );
}

function MenuItem({ icon, label, value }) {
  return (
    <View style={s.menuItem}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={s.menuValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.white, padding: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySofter, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  role: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginTop: 4 },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  section: { margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  menuValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.dangerBg, borderRadius: Radius.md, gap: Spacing.sm },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.danger },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md },
});
