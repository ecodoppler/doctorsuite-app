import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import ScreenHeader from '../../components/ScreenHeader';

const statusColors = {
  Agendado: { bg: '#EEF2FF', text: '#4F46E5' },
  Confirmado: { bg: '#ECFDF5', text: '#059669' },
  Em_Atendimento: { bg: '#FEF3C7', text: '#D97706' },
  Finalizado: { bg: '#F3F4F6', text: '#6B7280' },
  Cancelado: { bg: '#FEE2E2', text: '#DC2626' },
  Faltou: { bg: '#FEE2E2', text: '#DC2626' },
};

const statusLabels = {
  Agendado: 'Agendado',
  Confirmado: 'Confirmado',
  Em_Atendimento: 'Em Atendimento',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
  Faltou: 'Faltou',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Handle ISO date or date string
  const d = typeof dateStr === 'string' && dateStr.includes('T')
    ? new Date(dateStr)
    : new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AgendamentosScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/api/my-appointments');
      setAppointments(data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmAppointment = async (id) => {
    try {
      await api(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Confirmado' }),
      });
      Alert.alert('✅ Confirmado', 'Sua consulta foi confirmada!');
      load();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const futureAppts = appointments.filter(a => {
    const d = (a.apt_date || a.appointment_date || a.date || '').slice(0, 10);
    return d >= today && a.status !== 'Cancelado' && a.status !== 'Faltou';
  });
  const pastAppts = appointments.filter(a => {
    const d = (a.apt_date || a.appointment_date || a.date || '').slice(0, 10);
    return d < today || a.status === 'Cancelado' || a.status === 'Faltou';
  });

  const renderItem = ({ item }) => {
    const dateStr = item.apt_date || item.appointment_date || item.date || '';
    const isFuture = dateStr.slice(0, 10) >= today;
    const sc = statusColors[item.status] || statusColors.Agendado;
    const canConfirm = isFuture && (item.status === 'Agendado');

    return (
      <View style={[s.card, !isFuture && s.pastCard]}>
        <View style={s.cardHeader}>
          <View style={s.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={s.dateText}>{formatDate(dateStr)}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeText, { color: sc.text }]}>
              {statusLabels[item.status] || item.status}
            </Text>
          </View>
        </View>

        <View style={s.cardBody}>
          <View style={s.infoRow}>
            <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
            <Text style={s.infoText}>
              {item.start_time?.slice(0, 5) || ''}{item.end_time ? ` — ${item.end_time.slice(0, 5)}` : ''}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="medkit-outline" size={15} color={Colors.textSecondary} />
            <Text style={s.infoText}>
              {item.procedures?.map(p => p.name).join(', ') || item.category || 'Consulta'}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={15} color={Colors.textSecondary} />
            <Text style={s.infoText}>Dr(a). {item.doctor_name || 'Médico'}</Text>
          </View>
        </View>

        {canConfirm && (
          <TouchableOpacity
            style={s.confirmBtn}
            onPress={() => confirmAppointment(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={s.confirmText}>Confirmar Presença</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Minhas Consultas" right={getUser()?.clinic_name} />
      <FlatList
        data={[...futureAppts, ...pastAppts]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={futureAppts.length > 0 ? (
          <Text style={s.sectionTitle}>Próximas Consultas</Text>
        ) : null}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>Nenhuma consulta agendada</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  list: { padding: Spacing.md, paddingBottom: 100 }, // folga p/ a barra de abas nativa (pílula iOS 26)
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  pastCard: { opacity: 0.55 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary, textTransform: 'capitalize' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  cardBody: { marginTop: 4, gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#059669', borderRadius: Radius.md, padding: Spacing.sm, marginTop: Spacing.sm,
  },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
