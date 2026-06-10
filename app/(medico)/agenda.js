import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, getUser } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import { setPendingPatient } from '../../services/navigation';

function generateSlots(schedule, appointments) {
  if (!schedule || !schedule.start_time || !schedule.end_time) return null;
  const slots = [];
  const dur = schedule.slot_duration || 30;
  const [sh, sm] = schedule.start_time.split(':').map(Number);
  const [eh, em] = schedule.end_time.split(':').map(Number);
  const lunchStart = schedule.lunch_start || null;
  const lunchEnd = schedule.lunch_end || null;
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  while (mins < endMins) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    const time = `${hh}:${mm}`;
    if (lunchStart && lunchEnd && time >= lunchStart && time < lunchEnd) { mins += dur; continue; }
    const endSlotMins = mins + dur;
    const endHH = String(Math.floor(endSlotMins / 60)).padStart(2, '0');
    const endMM = String(endSlotMins % 60).padStart(2, '0');
    const endTime = `${endHH}:${endMM}`;
    const appt = appointments.find(a => (a.appointment_time || '').slice(0, 5) === time);
    slots.push({ time, endTime, appointment: appt || null });
    mins += dur;
  }
  return slots;
}

export default function AgendaScreen() {
  const [slots, setSlots] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noSchedule, setNoSchedule] = useState(false);
  const [scheduleChecked, setScheduleChecked] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const user = getUser();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const doctorId = user?.doctor_id;
      const [appts, schedules] = await Promise.all([
        api(`/api/appointments?date=${date}${doctorId ? `&doctor_id=${doctorId}` : ''}`),
        doctorId ? api(`/api/doctor-schedules/${doctorId}`) : Promise.resolve(null),
      ]);
      const sorted = (appts || []).sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));
      setAppointments(sorted);

      if (!doctorId || schedules === null) {
        setSlots(null);
        setNoSchedule(false);
        setScheduleChecked(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const jsDow = new Date(date + 'T12:00:00').getDay();
      const adjustedDow = jsDow === 0 ? 6 : jsDow - 1;
      const todaySchedule = (schedules || []).find(s => Number(s.day_of_week) === adjustedDow && Number(s.active) === 1);

      if (todaySchedule) {
        setSlots(generateSlots(todaySchedule, sorted));
        setNoSchedule(false);
      } else {
        setSlots(null);
        setNoSchedule(true);
      }
      setScheduleChecked(true);
    } catch (e) { console.warn('[AGENDA] Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [date, user?.doctor_id]);

  useEffect(() => { setLoading(true); setScheduleChecked(false); load(); }, [load]);

  const changeDate = (dir) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().slice(0, 10));
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;

  const formatDate = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  };

  const statusColor = (st) => {
    if (st === 'confirmado') return Colors.success;
    if (st === 'cancelado') return Colors.danger;
    if (st === 'atendido') return Colors.info;
    return Colors.warning;
  };

  const statusLabel = (st) => {
    if (st === 'confirmado') return 'CONFIRMADO';
    if (st === 'cancelado') return 'CANCELADO';
    if (st === 'atendido') return 'ATENDIDO';
    return 'AGENDADO';
  };

  const handleTapAppointment = (appt) => {
    if (!appt) return;
    // Mesma regra do card/web: só os principais (esconde componentes do pacote).
    const _allProcs = appt.procedures || [];
    const _principais = _allProcs.filter(p => !p.parent_procedure_id);
    const _procSrc = _principais.length > 0 ? _principais : _allProcs;
    const procs = _procSrc.map(p => {
      const ins = p.is_particular ? 'Particular' : (p.insurance_name || 'Particular');
      return `${p.type_name || 'Procedimento'} (${ins})`;
    });
    if (procs.length === 0 && appt.procedures_summary) procs.push(appt.procedures_summary);
    if (procs.length === 0) procs.push(appt.type_name || 'Consulta');

    const timeStart = (appt.appointment_time || '').slice(0, 5);
    const slot = slots?.find(s => s.time === timeStart);
    const timeEnd = slot?.endTime || '';
    const timeRange = timeEnd ? `${timeStart} — ${timeEnd}` : timeStart;

    const lines = [
      ...procs,
      `⏰ ${timeRange}`,
      `👨‍⚕️ Dr(a). ${appt.doctor_name_full || user?.doctor_name || 'Médico'}`,
      `📞 ${appt.patient_phone || '—'}`,
      `📊 ${statusLabel(appt.status)}`,
    ];

    Alert.alert(
      appt.patient_name || 'Paciente',
      lines.join('\n'),
      [
        { text: 'Prontuário', onPress: () => openProntuario(appt.patient_id, appt.patient_name) },
        { text: 'Fechar' },
      ]
    );
  };

  const openProntuario = (patientId, patientName) => {
    setPendingPatient({ id: patientId, name: patientName });
    router.push('/(medico)/prontuario');
  };

  const renderSlot = ({ item }) => {
    const appt = item.appointment;
    const hasAppt = !!appt;
    // Espelha o web: mostra só os procedimentos PRINCIPAIS (parent_procedure_id NULL),
    // escondendo os componentes do pacote (desmembramento por convênio). Fallback defensivo
    // p/ a lista crua se não houver principal, e p/ type_name se procedures[] vier vazio.
    const _allProcs = (hasAppt && appt.procedures) || [];
    const _principais = _allProcs.filter(p => !p.parent_procedure_id);
    const _procList = _principais.length > 0 ? _principais : _allProcs;
    const procLines = hasAppt
      ? (_procList.length > 0
        ? _procList.map(p => `${p.type_name || 'Procedimento'} · ${p.is_particular ? 'Particular' : (p.insurance_name || 'Particular')}`)
        : [appt.procedures_summary || appt.type_name || 'Consulta'])
      : [];

    return (
      <TouchableOpacity
        style={s.slotCard}
        onPress={() => handleTapAppointment(appt)}
        activeOpacity={hasAppt ? 0.7 : 1}
        disabled={!hasAppt}
      >
        <View style={s.slotTimeCol}>
          <Text style={s.slotTime}>{item.time}</Text>
        </View>
        {hasAppt ? (
          <View style={s.slotBody}>
            <View style={s.slotHeader}>
              <View style={[s.statusDot, { backgroundColor: statusColor(appt.status) }]} />
              <Text style={s.patientName} numberOfLines={1}>{appt.patient_name || 'Paciente'}</Text>
            </View>
            {procLines.map((line, i) => (
              <Text key={i} style={s.procLine} numberOfLines={1}>{line}</Text>
            ))}
          </View>
        ) : (
          <View style={s.slotBody}>
            <Text style={s.emptyLabel}>Disponível</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{section.title}</Text>
    </View>
  );

  const allSlots = slots || appointments.map(a => ({
    time: (a.appointment_time || '').slice(0, 5),
    endTime: '',
    appointment: a,
  }));

  const morning = allSlots.filter(d => d.time < '12:00');
  const afternoon = allSlots.filter(d => d.time >= '12:00');
  const sections = [];
  if (morning.length) sections.push({ title: 'MANHÃ', data: morning });
  if (afternoon.length) sections.push({ title: 'TARDE', data: afternoon });

  const livres = slots ? slots.filter(x => !x.appointment).length : 0;
  const canceladas = appointments.filter(a => a.status === 'cancelado').length;
  const consultasAtivas = appointments.length - canceladas;
  const statItems = [];
  if (consultasAtivas > 0) statItems.push(`${consultasAtivas} ${consultasAtivas === 1 ? 'consulta' : 'consultas'}`);
  if (slots) statItems.push(`${livres} ${livres === 1 ? 'livre' : 'livres'}`);
  if (canceladas > 0) statItems.push(`${canceladas} ${canceladas === 1 ? 'cancelada' : 'canceladas'}`);

  return (
    <View style={s.container}>
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={s.dateBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <View style={s.dateCenter}>
          <Text style={s.dateText}>{formatDate(date)}</Text>
          {!isToday && (
            <TouchableOpacity onPress={() => setDate(todayStr)} style={s.todayBtn}>
              <Text style={s.todayBtnText}>Hoje</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={s.dateBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {!loading && !noSchedule && statItems.length > 0 && (
        <View style={s.statsBar}>
          <Text style={s.statText}>{statItems.join('  ·  ')}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : (scheduleChecked && noSchedule) ? (
        <View style={s.noScheduleContainer}>
          <Ionicons name="calendar-clear-outline" size={56} color={Colors.textMuted} />
          <Text style={s.noScheduleTitle}>Profissional não atende neste dia</Text>
          <Text style={s.noScheduleSubtitle}>Este médico não possui horário de atendimento configurado para este dia da semana.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => item.time + i}
          renderItem={renderSlot}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyStateText}>Nenhum horário disponível</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBtn: { padding: Spacing.xs },
  dateCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  todayBtn: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: Colors.primarySofter, borderRadius: Radius.full },
  todayBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  statsBar: { paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  statText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  sectionHeader: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 4, backgroundColor: Colors.bg },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6 },

  list: { paddingBottom: Spacing.lg },
  slotCard: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  slotTimeCol: { width: 46, paddingTop: 1 },
  slotTime: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  slotBody: { flex: 1 },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  patientName: { fontSize: 13, fontWeight: '700', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 },
  procLine: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginLeft: 14 },

  emptyLabel: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyStateText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  noScheduleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  noScheduleTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' },
  noScheduleSubtitle: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center', maxWidth: 300 },
});
