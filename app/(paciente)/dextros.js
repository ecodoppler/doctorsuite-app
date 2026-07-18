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

function fmtDate(raw) {
  if (!raw) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
    const [y, m, d] = String(raw).split('-');
    return `${d}/${m}`;
  }
  try {
    return new Date(raw).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return String(raw).slice(0, 10);
  }
}

const emptyDraft = (slot) => ({
  date: todayDate(),
  slot_key: slot || 'jejum',
  value_mgdl: '',
  notes: '',
});

export default function DextrosScreen() {
  const [data, setData] = useState(null);
  const [dextro, setDextro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft('jejum'));

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [pg, mon] = await Promise.all([
        api('/api/my-pregnancy'),
        api('/api/my-pregnancy/dextros'),
      ]);
      setData(pg);
      setDextro(mon);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };
  const program = dextro?.program || { enabled: false, config: { pattern: 'basic' } };
  const pattern = program.config?.pattern || 'basic';
  const slots = dextro?.patterns?.[pattern] || [];
  const rows = dextro?.measurements || [];
  const slotByKey = useMemo(() => Object.fromEntries(slots.map((s) => [s.key, s.label])), [slots]);
  const openRows = rows.filter((r) => !r.imported_record_id);
  const patternLabel = pattern === 'expanded' ? '7 pontos' : '4 pontos';

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const dateKey = r.measured_at
        ? new Date(r.measured_at).toLocaleDateString('sv-SE')
        : '—';
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(r);
    });
    return Array.from(map.entries());
  }, [rows]);

  const openForm = () => {
    setDraft(emptyDraft(slots[0]?.key || 'jejum'));
    setEditing(true);
  };

  const save = async () => {
    const value = parseInt(draft.value_mgdl, 10);
    if (!draft.date) return Alert.alert('Preencha a data');
    if (!draft.slot_key) return Alert.alert('Selecione o horário');
    if (!Number.isFinite(value) || value < 20 || value > 600) return Alert.alert('Valor inválido');

    setSaving(true);
    try {
      await api('/api/my-pregnancy/dextros/readings', {
        method: 'POST',
        body: JSON.stringify({
          measured_at: new Date(`${draft.date}T12:00:00`).toISOString(),
          slot_key: draft.slot_key,
          value_mgdl: value,
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
    Alert.alert('Remover dextro?', `${slotByKey[item.slot_key] || item.slot_key}: ${item.value_mgdl} mg/dL`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await api(`/api/my-pregnancy/dextros/readings/${item.id}`, { method: 'DELETE' });
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
              <Text style={s.title}>Dextros</Text>
              <Text style={s.subtitle}>{program.enabled ? `${patternLabel} · ${openRows.length} abertos` : 'Aguardando habilitação médica'}</Text>
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
            <Text style={s.patternTitle}>{patternLabel}</Text>
            <View style={s.slotWrap}>
              {slots.map((slot) => (
                <View key={slot.key} style={s.slotChip}>
                  <Text style={s.slotChipText}>{slot.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={s.section}>
          <SectionTitle>Registros</SectionTitle>
          {grouped.length ? grouped.map(([dateKey, items]) => (
            <Card key={dateKey} padding={0} style={{ marginBottom: 10 }}>
              <View style={s.dayHeader}>
                <Text style={s.dayTitle}>{fmtDate(dateKey)}</Text>
                <Text style={s.dayCount}>{items.length} medida(s)</Text>
              </View>
              {items.map((r, i) => (
                <Pressable
                  key={r.id || i}
                  onLongPress={() => !r.imported_record_id && remove(r)}
                  style={[s.row, i < items.length - 1 && s.rowBorder]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowSlot}>{slotByKey[r.slot_key] || r.slot_key}</Text>
                    {r.notes ? <Text style={s.rowNote}>{r.notes}</Text> : null}
                  </View>
                  <Text style={s.value}>{r.value_mgdl}</Text>
                  <Text style={s.unit}>mg/dL</Text>
                  {r.imported_record_id ? <Text style={s.imported}>Importado</Text> : null}
                </Pressable>
              ))}
            </Card>
          )) : (
            <Card padding={18}>
              <Text style={s.empty}>Nenhum dextro registrado.</Text>
            </Card>
          )}
        </View>

        <ClinicalDisclaimer text="Registros domiciliares são acompanhamentos informativos. Em caso de sintomas ou valores preocupantes, procure atendimento." />
      </ScrollView>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Novo dextro</Text>
              <Pressable onPress={() => setEditing(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Status.slate} />
              </Pressable>
            </View>
            <Field label="Data" value={draft.date} onChangeText={(v) => setDraft((d) => ({ ...d, date: v }))} placeholder="AAAA-MM-DD" />
            <Text style={s.fieldLabel}>Horário</Text>
            <View style={s.slotPicker}>
              {slots.map((slot) => {
                const active = draft.slot_key === slot.key;
                return (
                  <Pressable
                    key={slot.key}
                    onPress={() => setDraft((d) => ({ ...d, slot_key: slot.key }))}
                    style={[s.slotOption, active && s.slotOptionActive]}
                  >
                    <Text style={[s.slotOptionText, active && s.slotOptionTextActive]}>{slot.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field label="Valor" value={draft.value_mgdl} onChangeText={(v) => setDraft((d) => ({ ...d, value_mgdl: v }))} keyboardType="number-pad" placeholder="mg/dL" />
            <Field label="Observação" value={draft.notes} onChangeText={(v) => setDraft((d) => ({ ...d, notes: v }))} multiline optional />
            <Pressable onPress={save} disabled={saving} style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.9 }, saving && { opacity: 0.6 }]}>
              <Text style={s.saveText}>{saving ? 'Salvando…' : 'Salvar dextro'}</Text>
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
  patternTitle: { fontSize: 13, color: Status.ink, fontFamily: Fonts.uiBold, marginBottom: 10 },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Warm.cream, borderWidth: 1, borderColor: Status.borderSoft },
  slotChipText: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiBold },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fbfcfe', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  dayTitle: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiBold },
  dayCount: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  rowSlot: { fontSize: 13, color: Status.ink, fontFamily: Fonts.uiSemibold },
  rowNote: { marginTop: 2, fontSize: 11, color: Status.slate, fontFamily: Fonts.ui },
  value: { minWidth: 42, textAlign: 'right', fontSize: 20, color: Status.ink, fontFamily: Fonts.numHeavy },
  unit: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiBold },
  imported: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, textTransform: 'uppercase' },
  empty: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.35)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: Status.ink, fontFamily: Fonts.uiBold },
  field: { width: '100%' },
  fieldLabel: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiBold, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: Status.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Status.ink, fontFamily: Fonts.ui, backgroundColor: '#fff' },
  slotPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotOption: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Status.border, backgroundColor: '#fff' },
  slotOptionActive: { borderColor: Warm.accentDeep, backgroundColor: Warm.accentSoft },
  slotOptionText: { fontSize: 12, color: Status.slate, fontFamily: Fonts.uiSemibold },
  slotOptionTextActive: { color: Warm.accentDeep, fontFamily: Fonts.uiBold },
  saveBtn: { marginTop: 4, borderRadius: 14, backgroundColor: Warm.accentDeep, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontFamily: Fonts.uiBold },
});
