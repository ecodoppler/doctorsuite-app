import { useState, useEffect, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import ScreenHeader from '../../components/ScreenHeader';

// v0.0.650: agenda da secretária — vê as agendas dos MÉDICOS do dia (seletor + agrupamento),
// com info BÁSICA do paciente (nome + telefone). SEM dados de consulta/exame/laudo (o endpoint
// /api/appointments não faz join com prontuário). Campos do backend: appointment_time, doctor_name_full,
// patient_name, patient_phone, type_name, status (corrige bug histórico que lia item.time/doctor_name).
export default function AgendasScreen() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Médicos da clínica (uma vez) para o seletor
  useEffect(() => {
    api('/api/doctors?active=1').then((d) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/appointments?date=${date}`);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const changeDate = (dir) => {
    const d = new Date(date + 'T12:00:00'); // T12 evita rolar o dia por fuso (bug do new Date(date) UTC)
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().slice(0, 10));
    setLoading(true);
  };

  const formatDate = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const statusColor = (st) => {
    if (st === 'confirmado' || st === 'atendido' || st === 'concluido' || st === 'finalizado') return Colors.success;
    if (st === 'cancelado' || st === 'cancelada' || st === 'faltou' || st === 'falta') return Colors.danger;
    return Colors.warning;
  };

  // Filtra por médico selecionado + agrupa por médico em seções (ordenadas por hora dentro de cada).
  const filtered = selectedDoctor === 'all'
    ? appointments
    : appointments.filter((a) => a.doctor_id === selectedDoctor);
  const byDoctor = {};
  for (const a of filtered) {
    const key = a.doctor_id || '_sem_';
    if (!byDoctor[key]) byDoctor[key] = { title: a.doctor_name_full || a.doctor_name || 'Sem médico', data: [] };
    byDoctor[key].data.push(a);
  }
  const sections = Object.values(byDoctor)
    .map((sec) => ({ ...sec, data: sec.data.slice().sort((x, y) => (x.appointment_time || '').localeCompare(y.appointment_time || '')) }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const callPhone = (phone) => {
    const n = String(phone || '').replace(/\D/g, '');
    if (n) Linking.openURL(`tel:${n}`).catch(() => {});
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Agendas" right={getUser()?.clinic_name} />
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={s.dateBtn}><Ionicons name="chevron-back" size={22} color={Colors.primary} /></TouchableOpacity>
        <Text style={s.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={s.dateBtn}><Ionicons name="chevron-forward" size={22} color={Colors.primary} /></TouchableOpacity>
      </View>

      {doctors.length > 0 && (
        <View style={s.docBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.docBarContent}>
            <DocChip label="Todos" active={selectedDoctor === 'all'} onPress={() => setSelectedDoctor('all')} />
            {doctors.map((d) => (
              <DocChip key={d.id} label={d.name} active={selectedDoctor === d.id} onPress={() => setSelectedDoctor(d.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title} · {section.data.length}</Text>
          )}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.time}>{(item.appointment_time || '').slice(0, 5) || '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.patient_name || 'Paciente'}</Text>
                <Text style={s.detail}>{item.type_name || item.category || 'Consulta'}{item.room ? ` · ${item.room}` : ''}</Text>
                {item.patient_phone ? (
                  <TouchableOpacity onPress={() => callPhone(item.patient_phone)} style={s.phoneRow} activeOpacity={0.7}>
                    <Ionicons name="call-outline" size={13} color={Colors.primary} />
                    <Text style={s.phone}>{item.patient_phone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={[s.statusDot, { backgroundColor: statusColor(item.status) }]} />
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyText}>Nenhum agendamento neste dia</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function DocChip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipActive]} activeOpacity={0.8}>
      <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBtn: { padding: Spacing.sm },
  dateText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  docBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  docBarContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.borderLight, maxWidth: 180 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: Spacing.md, paddingBottom: 100 }, // folga p/ a barra de abas nativa (pílula iOS 26)
  sectionHeader: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.md },
  time: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, width: 48 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  detail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  phone: { fontSize: FontSize.sm, color: Colors.primary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
