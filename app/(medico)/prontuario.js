import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  RefreshControl, ScrollView, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import { getPendingPatient, onPendingPatient } from '../../services/navigation';

function openWhatsApp(phone) {
  if (!phone) return;
  const digits = phone.replace(/\D/g, '');
  const num = digits.startsWith('55') ? digits : '55' + digits;
  Linking.openURL(`https://wa.me/${num}`);
}

// Build unified timeline from API data
function buildTimeline(data) {
  const items = [];
  const records = data.records || [];
  const appointments = data.appointments || [];
  const reports = data.reports || [];

  // Medical records
  for (const mr of records) {
    let content = {};
    try { content = typeof mr.content_json === 'string' ? JSON.parse(mr.content_json) : mr.content_json || {}; } catch {}
    const recType = content.record_type || 'consulta';
    items.push({
      source: 'record', type: recType === 'procedimento' ? 'procedimento' : 'consulta',
      date: mr.created_at?.slice(0, 10), time: mr.created_at?.slice(11, 16),
      title: recType === 'consulta_obstetrica' ? 'Consulta Obstétrica'
        : recType === 'consulta_ginecologica' ? 'Consulta Ginecológica'
        : recType === 'procedimento' ? 'Procedimento' : 'Consulta Médica',
      doctor: mr.doctor_name, id: mr.id, color: '#4f46e5', content, status: 'registrado',
    });
  }

  // Appointments (skip if linked to a record)
  for (const a of appointments) {
    const hasRecord = records.find(r => r.appointment_id === a.id);
    if (hasRecord) continue;
    items.push({
      source: 'appointment', type: a.type_category || a.category || 'consulta',
      date: a.appointment_date, time: a.appointment_time?.slice(0, 5),
      title: a.type_name || 'Consulta', doctor: a.doctor_name,
      insurance: a.insurance_name, status: a.status, id: a.id,
      color: a.category === 'exame' ? '#10b981' : '#3b82f6',
    });
  }

  // Reports (standalone)
  for (const r of reports) {
    const linked = appointments.find(a => a.report_id === r.id);
    if (!linked) {
      items.push({
        source: 'report', type: 'exame',
        date: r.created_at?.slice(0, 10), time: r.created_at?.slice(11, 16),
        title: r.exam_type || 'Laudo', status: r.status, id: r.id,
        color: '#0ea5e9',
      });
    }
  }

  items.sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')));
  return items;
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
}

const statusColors = {
  registrado: '#10b981', atendido: '#10b981', concluido: '#10b981', finalizado: '#10b981',
  agendado: '#f59e0b', confirmado: '#3b82f6', cancelado: '#ef4444', faltou: '#ef4444',
};

export default function ProntuarioScreen() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [prontuarioData, setProntuarioData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await api('/api/patients');
      setPatients(data || []);
      setFiltered(data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Listen for navigation from agenda → prontuário
  useEffect(() => {
    const pending = getPendingPatient();
    if (pending) openPatient(pending);
    const unsub = onPendingPatient((patient) => {
      if (patient) openPatient(patient);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.cpf || '').includes(q) ||
      (p.phone || '').includes(q) ||
      (p.patient_number || '').toString().includes(q)
    ));
  }, [search, patients]);

  const openPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingDetail(true);
    setFilter('all');
    try {
      const data = await api(`/api/prontuario/${patient.id}`);
      setProntuarioData(data);
      setTimeline(buildTimeline(data));
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoadingDetail(false); }
  };

  const goBack = () => { setSelectedPatient(null); setProntuarioData(null); setTimeline([]); };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredTimeline = filter === 'all' ? timeline : timeline.filter(i => i.type === filter || (filter === 'exame' && i.source === 'report'));

  // ======================== DETAIL VIEW ========================
  if (selectedPatient) {
    const p = selectedPatient;
    const records = prontuarioData?.records || [];
    const reports = prontuarioData?.reports || [];
    const appts = prontuarioData?.appointments || [];

    return (
      <View style={s.container}>
        <View style={s.detailHeader}>
          <TouchableOpacity onPress={goBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            <Text style={s.backText}>Pacientes</Text>
          </TouchableOpacity>
        </View>

        {loadingDetail ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md }}>
            {/* Patient card */}
            <View style={s.patientCard}>
              <View style={s.avatarLg}>
                <Text style={s.avatarLgText}>{getInitials(p.name)}</Text>
              </View>
              <Text style={s.patientNameLg}>{p.name}</Text>
              <View style={s.patientInfoRow}>
                {p.phone && <TouchableOpacity style={s.infoPill} onPress={() => openWhatsApp(p.phone)}><Ionicons name="logo-whatsapp" size={13} color="#25D366" /><Text style={[s.infoPillText, { color: '#25D366' }]}>{p.phone}</Text></TouchableOpacity>}
                {p.cpf && <View style={s.infoPill}><Ionicons name="card" size={13} color={Colors.primary} /><Text style={s.infoPillText}>{p.cpf}</Text></View>}
              </View>
            </View>

            {/* Stats */}
            <View style={s.summaryRow}>
              <View style={s.summaryCard}><Text style={s.summaryNum}>{records.length}</Text><Text style={s.summaryLabel}>Consultas</Text></View>
              <View style={s.summaryCard}><Text style={s.summaryNum}>{reports.length}</Text><Text style={s.summaryLabel}>Laudos</Text></View>
              <View style={s.summaryCard}><Text style={s.summaryNum}>{appts.length}</Text><Text style={s.summaryLabel}>Agendamentos</Text></View>
            </View>

            {/* Filters */}
            <View style={s.filterRow}>
              <Text style={s.sectionTitle}>Histórico</Text>
              <View style={s.filterBtns}>
                {[{ key: 'all', label: 'Todos' }, { key: 'consulta', label: 'Consultas' }, { key: 'exame', label: 'Exames' }].map(f => (
                  <TouchableOpacity key={f.key} style={[s.filterBtn, filter === f.key && s.filterBtnActive]} onPress={() => setFilter(f.key)}>
                    <Text style={[s.filterBtnText, filter === f.key && s.filterBtnTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timeline */}
            {filteredTimeline.length === 0 ? (
              <View style={s.emptyTimeline}>
                <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
                <Text style={s.emptyTimelineText}>Nenhum registro encontrado</Text>
              </View>
            ) : filteredTimeline.map((item, i) => (
              <View key={item.id + '-' + i} style={s.timelineItem}>
                {/* Timeline connector */}
                <View style={s.timelineLeft}>
                  <View style={[s.timelineDot, { backgroundColor: item.color }]}>
                    <Ionicons
                      name={item.source === 'record' ? 'medical' : item.source === 'report' ? 'document-text' : 'calendar'}
                      size={14} color="#fff"
                    />
                  </View>
                  {i < filteredTimeline.length - 1 && <View style={s.timelineLine} />}
                </View>

                {/* Content */}
                <View style={s.timelineCard}>
                  {/* Header */}
                  <View style={s.timelineCardHeader}>
                    <Text style={s.timelineDate}>{formatDateBR(item.date)} {item.time ? `às ${item.time}` : ''}</Text>
                    <View style={[s.tlBadge, { backgroundColor: (statusColors[item.status] || '#6b7280') + '22' }]}>
                      <Text style={[s.tlBadgeText, { color: statusColors[item.status] || '#6b7280' }]}>{(item.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={s.timelineTitle}>{item.title}</Text>

                  {/* Meta */}
                  <View style={s.timelineMeta}>
                    {item.doctor && <Text style={s.metaItem}>👨‍⚕️ {item.doctor}</Text>}
                    {item.insurance && <Text style={s.metaItem}>💳 {item.insurance}</Text>}
                    {item.source === 'record' && <View style={s.prontuarioBadge}><Text style={s.prontuarioBadgeText}>prontuário</Text></View>}
                  </View>

                  {/* Record content */}
                  {item.source === 'record' && item.content && renderRecordContent(item.content)}
                </View>
              </View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    );
  }

  // ======================== LIST VIEW ========================
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar paciente por nome, CPF ou telefone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={s.count}>{filtered.length} paciente{filtered.length !== 1 ? 's' : ''}</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => openPatient(item)}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.name} numberOfLines={1}>{item.name}</Text>
              <View style={s.meta}>
                {item.phone && <Text style={s.metaText}>📞 {item.phone}</Text>}
              </View>
              {item.cpf && <Text style={s.cpf}>CPF: {item.cpf}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>{search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</Text>
          </View>
        }
      />
    </View>
  );
}

// Render medical record content fields
function renderRecordContent(content) {
  const fields = [];
  const rt = content.record_type;

  // Obstetric data
  if (rt === 'consulta_obstetrica') {
    const gpce = [];
    if (content.gestacoes != null) gpce.push(`G${content.gestacoes}`);
    if (content.partos_normais != null) gpce.push(`P${content.partos_normais}`);
    if (content.partos_cesariana != null) gpce.push(`C${content.partos_cesariana}`);
    if (content.abortos != null) gpce.push(`A${content.abortos}`);
    if (content.ectopicas != null) gpce.push(`E${content.ectopicas}`);
    const igParts = [];
    if (gpce.length > 0) igParts.push(gpce.join(' '));
    if (content.ig_semanas !== undefined) igParts.push(`IG: ${content.ig_semanas}s ${content.ig_dias || 0}d`);
    if (content.dum) igParts.push(`DUM: ${formatDateBR(content.dum)}`);
    if (igParts.length > 0) fields.push({ icon: 'body', label: 'Dados Obstétricos', value: igParts.join(' · ') });

    // Exam vitals
    const vitals = [];
    if (content.pa) vitals.push(`PA: ${content.pa}`);
    if (content.peso) vitals.push(`Peso: ${content.peso} kg`);
    if (content.afu) vitals.push(`AFU: ${content.afu} cm`);
    if (content.bcf_consulta) vitals.push(`BCF: ${content.bcf_consulta} bpm`);
    if (content.mov_fetais) vitals.push(`MF: ${content.mov_fetais}`);
    if (vitals.length > 0) fields.push({ icon: 'heart', label: 'Exame', value: vitals.join(' · ') });
  }

  // Main evolution text
  const evolucao = content.evolucao || content.queixa_principal;
  if (evolucao) {
    const label = rt === 'consulta_obstetrica' ? 'Evolução Obstétrica'
      : rt === 'consulta_ginecologica' ? 'Evolução Ginecológica' : 'Evolução';
    fields.push({ icon: 'create', label, value: evolucao });
  }

  // Structured fields
  const structuredFields = [
    { key: 'hda', label: 'HDA', icon: 'book' },
    { key: 'exame_fisico', label: 'Exame Físico', icon: 'fitness' },
    { key: 'gin_exame_fisico', label: 'Exame Físico', icon: 'fitness' },
    { key: 'hipotese_diagnostica', label: 'Hipótese Diagnóstica', icon: 'analytics' },
    { key: 'conduta', label: 'Conduta', icon: 'clipboard' },
    { key: 'gin_conduta', label: 'Conduta', icon: 'clipboard' },
    { key: 'prescricao', label: 'Prescrição', icon: 'medkit' },
    { key: 'exames_solicitados', label: 'Exames Solicitados', icon: 'flask' },
    { key: 'observacoes', label: 'Observações', icon: 'chatbox' },
  ];
  for (const f of structuredFields) {
    if (content[f.key]) fields.push({ icon: f.icon, label: f.label, value: content[f.key] });
  }

  if (fields.length === 0) return null;

  return (
    <View style={s.recordFields}>
      {fields.map((f, i) => (
        <View key={i} style={s.recordField}>
          <View style={s.fieldLabelRow}>
            <Ionicons name={f.icon} size={14} color={Colors.primary} />
            <Text style={s.fieldLabel}>{f.label}</Text>
          </View>
          <Text style={s.fieldValue}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  // Search / List
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: Spacing.md, marginBottom: 0, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSize.md, color: Colors.text },
  count: { fontSize: FontSize.sm, color: Colors.textMuted, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySofter, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cardBody: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  meta: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cpf: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  // Detail
  detailHeader: { backgroundColor: Colors.white, paddingTop: 8, paddingBottom: 8, paddingHorizontal: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '500' },
  patientCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md },
  avatarLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primarySofter, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarLgText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  patientNameLg: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  patientInfoRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySofter, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  infoPillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '500' },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  summaryNum: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  // Filters
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  filterBtns: { flexDirection: 'row', gap: 4 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.borderLight },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  filterBtnTextActive: { color: '#fff' },
  // Timeline
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 36, alignItems: 'center' },
  timelineDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: -2 },
  timelineCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginLeft: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineDate: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  tlBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  tlBadgeText: { fontSize: 10, fontWeight: '700' },
  timelineTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  timelineMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  metaItem: { fontSize: FontSize.xs, color: Colors.textSecondary },
  prontuarioBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  prontuarioBadgeText: { fontSize: 10, color: '#0284c7', fontWeight: '600' },
  // Record fields
  recordFields: { marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm },
  recordField: { marginBottom: Spacing.sm },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  fieldValue: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  emptyTimeline: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyTimelineText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
