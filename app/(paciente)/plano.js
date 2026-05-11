import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet, Linking,
  ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';

const PREFERENCE_OPTIONS = [
  { value: 'normal', label: 'Parto normal' },
  { value: 'cesarea', label: 'Cesárea eletiva' },
  { value: 'decide', label: 'Decide na hora' },
];

const ROW_LABELS = {
  preference: 'Via preferida',
  pain: 'Analgesia',
  companion: 'Acompanhante',
  contact: 'Pós-nascimento',
  feeding: 'Aleitamento',
};

// Resolve label visível pra preferência (aceita value enum ou texto legado)
function displayPreference(v) {
  if (!v) return '';
  const found = PREFERENCE_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v;
}

export default function PlanoScreen() {
  const [data, setData] = useState(null);       // { patient, pregnancy }
  const [plan, setPlan] = useState(null);       // birth_plan
  const [mat, setMat] = useState(null);         // maternity
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ bp: {}, mat: {} });

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [pg, bp] = await Promise.all([
        api('/api/my-pregnancy'),
        api('/api/my-pregnancy/birth-plan').catch(() => ({ birth_plan: null, maternity: null })),
      ]);
      setData(pg);
      setPlan(bp.birth_plan || {});
      setMat(bp.maternity || {});
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openEdit = () => {
    setDraft({ bp: { ...(plan || {}) }, mat: { ...(mat || {}) } });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api('/api/my-pregnancy/birth-plan', {
        method: 'PUT',
        body: JSON.stringify({ birth_plan: draft.bp, maternity: draft.mat }),
      });
      setPlan(draft.bp);
      setMat(draft.mat);
      setEditing(false);
    } catch (e) {
      Alert.alert('Erro ao salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loaderWrap}><ActivityIndicator size="large" color={Warm.accentDeep} /></View>
      </View>
    );
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

  // Rows: usa label do enum pra preferência; resto é string direta
  const rows = [
    ['preference', displayPreference(plan?.preference)],
    ['pain',       plan?.pain || ''],
    ['companion',  plan?.companion || ''],
    ['contact',    plan?.contact || ''],
    ['feeding',    plan?.feeding || ''],
  ];
  const hasAnyPlan = rows.some(([, v]) => v) || plan?.notes;
  const hasMat = mat?.name || mat?.address || mat?.phone;

  const handleCall = () => {
    if (!mat?.phone) return;
    Linking.openURL(`tel:${mat.phone.replace(/\D/g, '')}`);
  };

  const handleRoute = () => {
    if (!mat?.address) return;
    const q = encodeURIComponent(`${mat.name || ''} ${mat.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />

      {/* Botão Editar global */}
      <View style={s.headerActions}>
        <Pressable onPress={openEdit} style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="create-outline" size={14} color={Warm.accentDeep} />
          <Text style={s.editBtnText}>Editar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {/* Plano de parto */}
        <View style={s.section}>
          <SectionTitle>Plano de parto</SectionTitle>
          {hasAnyPlan ? (
            <Card padding={0}>
              {rows.map(([key, value], i) => (
                <View key={key} style={[s.planRow, i < rows.length - 1 && s.rowBorder]}>
                  <Text style={s.planKey}>{ROW_LABELS[key]}</Text>
                  <Text style={s.planValue}>{value || '—'}</Text>
                </View>
              ))}
              {plan?.notes ? (
                <View style={s.notesBlock}>
                  <Text style={s.notesText}>
                    <Text style={s.notesLabel}>Notas: </Text>
                    {plan.notes}
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : (
            <Card padding={20}>
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={32} color={Status.slate} />
                <Text style={s.emptyText}>Plano de parto ainda não foi cadastrado.</Text>
                <Pressable onPress={openEdit} style={s.emptyCta}>
                  <Text style={s.emptyCtaText}>Toque em Editar para criar</Text>
                </Pressable>
              </View>
            </Card>
          )}
        </View>

        {/* Maternidade de referência */}
        <View style={s.section}>
          <SectionTitle>Maternidade de referência</SectionTitle>
          {hasMat ? (
            <Card padding={14}>
              {mat?.name ? <Text style={s.matName}>{mat.name}</Text> : null}
              {mat?.address ? <Text style={s.matAddress}>{mat.address}</Text> : null}
              {mat?.pediatra ? <Text style={s.matExtra}>Pediatra: {mat.pediatra}</Text> : null}
              {mat?.anestesista ? <Text style={s.matExtra}>Anestesista: {mat.anestesista}</Text> : null}

              <View style={s.ctaRow}>
                {mat?.phone ? (
                  <Pressable
                    style={({ pressed }) => [s.ctaPrimary, pressed && { opacity: 0.85 }]}
                    onPress={handleCall}
                  >
                    <Ionicons name="call" size={14} color="#fff" />
                    <Text style={s.ctaPrimaryText} numberOfLines={1}>Ligar · {mat.phone}</Text>
                  </Pressable>
                ) : null}
                {mat?.address ? (
                  <Pressable
                    style={({ pressed }) => [s.ctaSecondary, pressed && { opacity: 0.85 }]}
                    onPress={handleRoute}
                  >
                    <Ionicons name="navigate" size={14} color={Warm.accentDeep} />
                    <Text style={s.ctaSecondaryText}>Rota</Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : (
            <Card padding={20}>
              <View style={s.emptyState}>
                <Ionicons name="location-outline" size={32} color={Status.slate} />
                <Text style={s.emptyText}>Maternidade ainda não definida.</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* ─── Modal de edição ─── */}
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
          <View style={s.modalHeader}>
            <Pressable onPress={() => setEditing(false)} style={s.modalHeaderBtn}>
              <Text style={s.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Text style={s.modalTitle}>Editar plano</Text>
            <Pressable onPress={save} disabled={saving} style={[s.modalHeaderBtn, saving && { opacity: 0.5 }]}>
              <Text style={s.modalSaveText}>{saving ? 'Salvando…' : 'Salvar'}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
            {/* Plano de parto */}
            <Text style={s.modalSection}>Plano de parto</Text>

            <Text style={s.fieldLabel}>Via preferida</Text>
            <View style={s.optionGrid}>
              {PREFERENCE_OPTIONS.map((opt) => {
                const active = draft.bp.preference === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setDraft((d) => ({ ...d, bp: { ...d.bp, preference: opt.value } }))}
                    style={[s.optionBtn, active && s.optionBtnActive]}
                  >
                    <Text style={[s.optionText, active && s.optionTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.fieldLabel}>Analgesia</Text>
            <TextInput
              style={s.input}
              value={draft.bp.pain || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, bp: { ...d.bp, pain: t } }))}
              placeholder="Ex: Aceita analgesia se desejar no momento"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Acompanhante</Text>
            <TextInput
              style={s.input}
              value={draft.bp.companion || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, bp: { ...d.bp, companion: t } }))}
              placeholder="Ex: Esposo (Eduardo Nunes)"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Pós-nascimento</Text>
            <TextInput
              style={s.input}
              value={draft.bp.contact || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, bp: { ...d.bp, contact: t } }))}
              placeholder="Ex: Pele a pele imediato + clampeamento oportuno"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Aleitamento</Text>
            <TextInput
              style={s.input}
              value={draft.bp.feeding || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, bp: { ...d.bp, feeding: t } }))}
              placeholder="Ex: Aleitamento materno exclusivo"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={draft.bp.notes || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, bp: { ...d.bp, notes: t } }))}
              placeholder="Outras preferências (ambiente, música, posição…)"
              placeholderTextColor={Status.slate}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Maternidade */}
            <Text style={[s.modalSection, { marginTop: 24 }]}>Maternidade de referência</Text>

            <Text style={s.fieldLabel}>Nome da maternidade</Text>
            <TextInput
              style={s.input}
              value={draft.mat.name || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, mat: { ...d.mat, name: t } }))}
              placeholder="Ex: Hospital Mater Vitta"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Endereço</Text>
            <TextInput
              style={s.input}
              value={draft.mat.address || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, mat: { ...d.mat, address: t } }))}
              placeholder="Ex: Av. NS-1, Q.103 Norte — Palmas/TO"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Telefone</Text>
            <TextInput
              style={s.input}
              value={draft.mat.phone || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, mat: { ...d.mat, phone: t } }))}
              placeholder="Ex: (63) 3215-4000"
              placeholderTextColor={Status.slate}
              keyboardType="phone-pad"
            />

            <Text style={s.fieldLabel}>Pediatra (opcional)</Text>
            <TextInput
              style={s.input}
              value={draft.mat.pediatra || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, mat: { ...d.mat, pediatra: t } }))}
              placeholder="Nome do pediatra"
              placeholderTextColor={Status.slate}
            />

            <Text style={s.fieldLabel}>Anestesista (opcional)</Text>
            <TextInput
              style={s.input}
              value={draft.mat.anestesista || ''}
              onChangeText={(t) => setDraft((d) => ({ ...d, mat: { ...d.mat, anestesista: t } }))}
              placeholder="Nome do anestesista"
              placeholderTextColor={Status.slate}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  // Header actions (botão Editar)
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Warm.accentSoft,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  editBtnText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 12 },

  // Plano
  planRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  planKey: { width: '38%', fontSize: 11, color: Status.slate, fontFamily: Fonts.uiSemibold },
  planValue: { flex: 1, fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold, lineHeight: 16 },

  // Notas
  notesBlock: { backgroundColor: Warm.cream, paddingHorizontal: 14, paddingVertical: 10 },
  notesText: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 16 },
  notesLabel: { color: Status.ink, fontFamily: Fonts.uiBold },

  // Maternidade
  matName: { fontSize: 14, color: Status.ink, fontFamily: Fonts.uiHeavy },
  matAddress: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2, lineHeight: 16 },
  matExtra: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, marginTop: 4 },

  ctaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Warm.accentDeep,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
  },
  ctaPrimaryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12, flexShrink: 1 },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Warm.accentSoft,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  ctaSecondaryText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 12 },

  // Empty state
  emptyState: { alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', marginTop: 4 },
  emptyCta: {
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Warm.accentSoft, borderRadius: 8,
  },
  emptyCtaText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 11 },

  // Loader / error
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Warm.accentDeep, borderRadius: 8, marginTop: 8 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Status.borderSoft, backgroundColor: '#fff',
  },
  modalHeaderBtn: { paddingHorizontal: 6, paddingVertical: 4, minWidth: 72 },
  modalCancelText: { color: Status.slate, fontFamily: Fonts.uiSemibold, fontSize: 14 },
  modalSaveText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 14, textAlign: 'right' },
  modalTitle: { fontFamily: Fonts.uiHeavy, fontSize: 15, color: Status.ink },
  modalSection: {
    fontFamily: Fonts.uiHeavy, fontSize: 13, color: Status.ink,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },

  fieldLabel: { fontFamily: Fonts.uiSemibold, fontSize: 11, color: Status.slate, marginTop: 12, marginBottom: 5 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: Status.ink, fontFamily: Fonts.ui,
    borderWidth: 1, borderColor: Status.borderSoft,
  },
  inputMulti: { minHeight: 70 },

  optionGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  optionBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: Status.borderSoft,
  },
  optionBtnActive: { backgroundColor: Warm.accentSoft, borderColor: Warm.accentDeep },
  optionText: { fontSize: 12, color: Status.slate, fontFamily: Fonts.uiSemibold },
  optionTextActive: { color: Warm.accentDeep, fontFamily: Fonts.uiBold },
});
