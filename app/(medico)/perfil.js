import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUser, logout } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import {
  isSupported as bioIsSupported,
  isEnabled as bioIsEnabled,
  setEnabled as bioSetEnabled,
  authenticate as bioAuthenticate,
  getBiometricLabel,
  touchActive as bioTouchActive,
} from '../../services/biometric';

export default function PerfilScreen() {
  const router = useRouter();
  const user = getUser();
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometria');
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const sup = await bioIsSupported();
      const en = await bioIsEnabled();
      const label = await getBiometricLabel();
      if (mounted) {
        setBioSupported(sup);
        setBioOn(en);
        setBioLabel(label);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggleBio = useCallback(async (value) => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      if (value) {
        const res = await bioAuthenticate(`Confirme para ativar ${bioLabel}`);
        if (!res?.success) return;
        await bioSetEnabled(true);
        await bioTouchActive();
        setBioOn(true);
      } else {
        await bioSetEnabled(false);
        setBioOn(false);
      }
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, bioLabel]);

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

      {bioSupported && (
        <View style={s.section}>
          <View style={s.bioRow}>
            <Ionicons name="finger-print" size={20} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={s.menuValue}>Acesso por {bioLabel}</Text>
              <Text style={s.menuLabel}>Desbloqueia ao abrir o app</Text>
            </View>
            <Switch
              value={bioOn}
              onValueChange={handleToggleBio}
              disabled={bioBusy}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={Platform.OS === 'android' ? (bioOn ? Colors.primary : '#f4f4f5') : undefined}
            />
          </View>
        </View>
      )}

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
  section: { margin: Spacing.md, marginBottom: 0, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  bioRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  menuValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.dangerBg, borderRadius: Radius.md, gap: Spacing.sm },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.danger },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md },
});
