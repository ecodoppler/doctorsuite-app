import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function AgendasScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/appointments?date=${date}`);
      const sorted = (data || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setAppointments(sorted);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const changeDate = (dir) => {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().slice(0, 10));
    setLoading(true);
  };

  const formatDate = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const statusColor = (st) => {
    if (st === 'confirmado') return Colors.success;
    if (st === 'cancelado') return Colors.danger;
    return Colors.warning;
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Agendas" right={getUser()?.clinic_name} />
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={s.dateBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={s.dateBtn}>
          <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.time}>{item.time?.slice(0, 5)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.patient_name || 'Paciente'}</Text>
                <Text style={s.detail}>{item.doctor_name ? `Dr(a). ${item.doctor_name}` : ''} • {item.category || 'Consulta'}</Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: statusColor(item.status) }]} />
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyText}>Nenhum agendamento</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBtn: { padding: Spacing.sm },
  dateText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  list: { padding: Spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.md },
  time: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, width: 48 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  detail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
