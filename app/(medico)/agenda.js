import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
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
      console.log('[AGENDA] doctor_id:', doctorId, 'date:', date);
      const [appts, schedules] = await Promise.all([
        api(`/api/appointments?date=${date}${doctorId ? `&doctor_id=${doctorId}` : ''}`),
        doctorId ? api(`/api/doctor-schedules/${doctorId}`) : Promise.resolve(null),
      ]);
      const sorted = (appts || []).sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));
      setAppointments(sorted);

      // If no doctor_id (admin without doctor profile), skip schedule check
      if (!doctorId || schedules === null) {
        setSlots(null);
        setNoSchedule(false);
        setScheduleChecked(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // DB uses 0=Monday...6=Sunday; JS getDay() returns 0=Sunday...6=Saturday
      const jsDow = new Date(date + 'T12:00:00').getDay();
      const adjustedDow = jsDow === 0 ? 6 : jsDow - 1;
      console.log('[AGENDA] jsDow:', jsDow, 'adjustedDow:', adjustedDow);
      const todaySchedule = (schedules || []).find(s => {
        const matches = Number(s.day_of_week) === adjustedDow && Number(s.active) === 1;
        console.log('[AGENDA] checking schedule: dow', s.day_of_week, '===', adjustedDow, 'active:', s.active, '=> matches:', matches);
        return matches;
      });
      console.log('[AGENDA] todaySchedule:', todaySchedule ? 'FOUND' : 'NOT FOUND');

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

  const formatDate = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
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
    // Build procedures list
    const procs = (appt.procedures || []).map(p => {
      const ins = p.is_particular ? 'Particular' : (p.insurance_name || 'Particular');
      return `${p.type_name || 'Procedimento'} (${ins})`;
    });
    if (procs.length === 0 && appt.procedures_summary) {
      procs.push(appt.procedures_summary);
    }
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
    return (
      <TouchableOpacity
        style={[s.slotCard, hasAppt && s.slotBooked]}
        onPress={() => handleTapAppointment(appt)}
        activeOpacity={hasAppt ? 0.7 : 1}
        disabled={!hasAppt}
      >
        <View style={s.slotTimeCol}>
          <Text style={s.slotTime}>{item.time}</Text>
          <Text style={s.slotTimeSep}>—</Text>
          <Text style={s.slotTimeEnd}>{item.endTime}</Text>
        </View>
        {hasAppt ? (
          <View style={s.slotBody}>
            <View style={[s.slotAccent, { backgroundColor: statusColor(appt.status) }]} />
            <View style={s.slotContent}>
              <Text style={s.patientName} numberOfLines={1}>{appt.patient_name || 'Paciente'}</Text>
              <View style={s.slotMeta}>
                <Text style={s.procText} numberOfLines={1}>{appt.procedures_summary || appt.type_name || 'Consulta'}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(appt.status) + '22' }]}>
                  <Text style={[s.statusText, { color: statusColor(appt.status) }]}>{statusLabel(appt.status)}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={s.slotEmpty}>
            <Text style={s.emptyLabel}>Disponível</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const data = slots || appointments.map(a => ({
    time: (a.appointment_time || '').slice(0, 5),
    endTime: '',
    appointment: a,
  }));

  return (
    <View style={s.container}>
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
      ) : (scheduleChecked && noSchedule) ? (
        <View style={s.noScheduleContainer}>
          <Ionicons name="calendar-clear-outline" size={56} color={Colors.textMuted} />
          <Text style={s.noScheduleTitle}>Profissional não atende neste dia</Text>
          <Text style={s.noScheduleSubtitle}>Este médico não possui horário de atendimento configurado para este dia da semana.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => item.time + i}
          renderItem={renderSlot}
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
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBtn: { padding: Spacing.sm },
  dateText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  list: { padding: Spacing.sm },
  slotCard: { flexDirection: 'row', marginBottom: 2, minHeight: 56, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  slotBooked: { backgroundColor: Colors.white },
  slotTimeCol: { width: 70, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  slotTime: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  slotTimeSep: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 14 },
  slotTimeEnd: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted },
  slotBody: { flex: 1, flexDirection: 'row' },
  slotAccent: { width: 4, borderRadius: 2 },
  slotContent: { flex: 1, paddingHorizontal: Spacing.md, justifyContent: 'center', paddingVertical: Spacing.sm },
  patientName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  slotMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  procText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  slotEmpty: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.md },
  emptyLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyStateText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  noScheduleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  noScheduleTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' },
  noScheduleSubtitle: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center', maxWidth: 300 },
});
