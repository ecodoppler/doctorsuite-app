import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import ClinicalDisclaimer from '../../components/ClinicalDisclaimer';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(raw).slice(0, 16);
  }
}

const emptyDraft = () => ({
  date: todayDate(),
  time: nowTime(),
  systolic: '',
  diastolic: '',
  pulse: '',
  notes: '',
});

export default function MrpaScreen() {
  const [data, setData] = useState(null);
  const [mrpa, setMrpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [pg, mon] = await Promise.all([
        api('/api/my-pregnancy'),
        api('/api/my-pregnancy/mrpa'),
      ]);
      setData(pg);
      setMrpa(mon);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };
  const program = mrpa?.program || { enabled: false, config: { target_count: 7 } };
  const rows = mrpa?.measurements || [];
  const openRows = rows.filter((r) => !r.imported_record_id);
  const target = Number(program.config?.target_count || 7);
  const progress = Math.min(openRows.length, target);

  const last = rows[0] || null;
  const avg = useMemo(() => {
    if (!rows.length) return null;
    const sis = Math.round(rows.reduce((sum, r) => sum + Number(r.systolic || 0), 0) / rows.length);
    const dia = Math.round(rows.reduce((sum, r) => sum + Number(r.diastolic || 0), 0) / rows.length);
    return `${sis}/${dia}`;
  }, [rows]);

  const openForm = () => {
    setDraft(emptyDraft());
    setEditing(true);
  };

  const save = async () => {
    const systolic = parseInt(draft.systolic, 10);
    const diastolic = parseInt(draft.diastolic, 10);
    const pulse = draft.pulse ? parseInt(draft.pulse, 10) : null;
    if (!draft.date || !draft.time) return Alert.alert('Preencha data e hora');
    if (!Number.isFinite(systolic) || systolic < 60 || systolic > 260) return Alert.alert('PA sistólica inválida');
    if (!Number.isFinite(diastolic) || diastolic < 30 || diastolic > 160) return Alert.alert('PA diastólica inválida');
    if (pulse != null && (!Number.isFinite(pulse) || pulse < 30 || pulse > 220)) return Alert.alert('Pulso inválido');

    setSaving(true);
    try {
      await api('/api/my-pregnancy/mrpa/readings', {
        method: 'POST',
        body: JSON.stringify({
          measured_at: new Date(`${draft.date}T${draft.time}:00`).toISOString(),
          systolic,
          diastolic,
          pulse,
          notes: draft.notes.trim() || null,
        }),
      });
      setEditing(false);
      await load();
    } catch (e) {
      Alert.alert('Erro ao salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    Alert.alert('Remover medida?', `${item.systolic}/${item.diastolic} mmHg`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await api(`/api/my-pregnancy/mrpa/readings/${item.id}`, { method: 'DELETE' });
            await load();
          } catch (e) {
            Alert.alert('Erro', e?.message || 'Não foi possível remover.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={s.container}><View style={s.loaderWrap}><ActivityIndicator size="large" color={Warm.accentDeep} /></View></View>;
  }

  if (err) {
    return (
      <View style={s.container}>
        <View style={[s.loaderWrap, { padding: 24 }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
          <Text style={s.errText}>Não foi possível carregar.{'\n'}{err}</Text>
          <Pressable onPress={() => { setLoading(true); load(); }} style={s.retryBtn}>
            <Text style={s.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const patient = data?.patient || {};
  const pregnancy = data?.pregnancy;

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        <View style={[s.section, { paddingTop: 14 }]}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.title}>MRPA</Text>
              <Text style={s.subtitle}>{program.enabled ? `${progress}/${target} medidas abertas` : 'Aguardando habilitação médica'}</Text>
            </View>
            {program.enabled ? (
              <Pressable onPress={openForm} style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.85 }]}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addBtnText}>Adicionar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Card padding={14}>
            <View style={s.metricRow}>
              <View style={s.metricBlock}>
                <Text style={s.metricLabel}>Última PA</Text>
                <Text style={s.metricValue}>{last ? `${last.systolic}/${last.diastolic}` : '—'}</Text>
              </View>
              <View style={s.metricBlock}>
                <Text style={s.metricLabel}>Média</Text>
                <Text style={s.metricValue}>{avg || '—'}</Text>
              </View>
              <View style={s.metricBlock}>
                <Text style={s.metricLabel}>Meta</Text>
                <Text style={s.metricValue}>{target}</Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${target ? Math.min(100, (progress / target) * 100) : 0}%` }]} />
            </View>
          </Card>
        </View>

        <View style={s.section}>
          <SectionTitle>Medidas</SectionTitle>
          {rows.length ? (
            <Card padding={0}>
              {rows.map((r, i) => (
                <Pressable
                  key={r.id || i}
                  onLongPress={() => !r.imported_record_id && remove(r)}
                  style={[s.row, i < rows.length - 1 && s.rowBorder]}
                >
                  <View style={s.paPill}>
                    <Text style={s.paPillText}>{r.systolic}/{r.diastolic}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowDate}>{fmtDateTime(r.measured_at)}</Text>
                    {r.notes ? <Text style={s.rowNote}>{r.notes}</Text> : null}
                  </View>
                  {r.pulse ? <Text style={s.rowPulse}>FC {r.pulse}</Text> : null}
                  {r.imported_record_id ? <Text style={s.imported}>Importada</Text> : null}
                </Pressable>
              ))}
            </Card>
          ) : (
            <Card padding={18}>
              <Text style={s.empty}>Nenhuma medida registrada.</Text>
            </Card>
          )}
        </View>

        <ClinicalDisclaimer text="Registros domiciliares são acompanhamentos informativos. Em caso de sintomas ou valores preocupantes, procure atendimento." />
      </ScrollView>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nova medida</Text>
              <Pressable onPress={() => setEditing(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Status.slate} />
              </Pressable>
            </View>
            <View style={s.inputGrid}>
              <Field label="Data" value={draft.date} onChangeText={(v) => setDraft((d) => ({ ...d, date: v }))} placeholder="AAAA-MM-DD" />
              <Field label="Hora" value={draft.time} onChangeText={(v) => setDraft((d) => ({ ...d, time: v }))} placeholder="HH:MM" />
              <Field label="Sistólica" value={draft.systolic} onChangeText={(v) => setDraft((d) => ({ ...d, systolic: v }))} keyboardType="number-pad" />
              <Field label="Diastólica" value={draft.diastolic} onChangeText={(v) => setDraft((d) => ({ ...d, diastolic: v }))} keyboardType="number-pad" />
              <Field label="Pulso" value={draft.pulse} onChangeText={(v) => setDraft((d) => ({ ...d, pulse: v }))} keyboardType="number-pad" optional />
            </View>
            <Field label="Observação" value={draft.notes} onChangeText={(v) => setDraft((d) => ({ ...d, notes: v }))} multiline optional />
            <Pressable onPress={save} disabled={saving} style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}>
              <Text style={s.saveText}>{saving ? 'Salvando…' : 'Salvar medida'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Field({ label, optional, style, ...props }) {
  return (
    <View style={[s.field, style]}>
      <Text style={s.fieldLabel}>{label}{optional ? ' (opcional)' : ''}</Text>
      <TextInput
        {...props}
        style={[s.input, props.multiline && { height: 76, textAlignVertical: 'top' }]}
        placeholderTextColor={Status.slateLight}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, marginTop: 10, textAlign: 'center' },
  retryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Warm.accentDeep },
  retryText: { color: '#fff', fontFamily: Fonts.uiSemibold, fontSize: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: Fonts.display, fontSize: 24, color: Status.ink, lineHeight: 28 },
  subtitle: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Warm.accentDeep, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },
  metricRow: { flexDirection: 'row', gap: 10 },
  metricBlock: { flex: 1 },
  metricLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { marginTop: 3, fontSize: 22, color: Status.ink, fontFamily: Fonts.numHeavy },
  progressTrack: { marginTop: 12, height: 8, borderRadius: 99, backgroundColor: Status.borderSoft, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 99, backgroundColor: Warm.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  paPill: { minWidth: 72, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 10, backgroundColor: Warm.accentSoft, alignItems: 'center' },
  paPillText: { fontSize: 14, color: Warm.accentDeep, fontFamily: Fonts.numHeavy },
  rowDate: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold },
  rowNote: { marginTop: 2, fontSize: 11, color: Status.slate, fontFamily: Fonts.ui },
  rowPulse: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiBold },
  imported: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, textTransform: 'uppercase' },
  empty: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.35)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: Status.ink, fontFamily: Fonts.uiBold },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { flexGrow: 1, flexBasis: '45%' },
  fieldLabel: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiBold, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: Status.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Status.ink, fontFamily: Fonts.ui, backgroundColor: '#fff' },
  saveBtn: { marginTop: 4, borderRadius: 14, backgroundColor: Warm.accentDeep, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontFamily: Fonts.uiBold },
});
