import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import Spark from '../../components/pregnancy/Spark';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';
import ClinicalDisclaimer from '../../components/ClinicalDisclaimer';

const COLS = [
  { key: 'date',   label: 'Data',  flex: 1 },
  { key: 'ig',     label: 'IG',    flex: 0.8 },
  { key: 'weight', label: 'Peso',  flex: 0.8 },
  { key: 'pa',     label: 'PA',    flex: 0.7 },
  { key: 'bcf',    label: 'BCF',   flex: 0.7 },
];

const ALERT_COLORS = {
  estavel: Status.ok,
  atencao: Status.attn,
  critico: Status.warn,
};

export default function PrenatalScreen() {
  const { width } = useWindowDimensions();
  const sparkW = Math.max(240, width - 32 - 28);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const d = await api('/api/my-pregnancy');
      setData(d);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={Warm.accentDeep} />
        </View>
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
  const visits = data?.visits || [];

  if (!pregnancy) {
    return (
      <View style={s.container}>
        <View style={[s.loaderWrap, { padding: 24 }]}>
          <Ionicons name="heart-outline" size={48} color={Warm.accentDeep} />
          <Text style={s.emptyTitle}>Sem gestação ativa</Text>
          <Text style={s.emptySub}>Pré-natal aparecerá quando o seu médico iniciar uma nova gestação.</Text>
        </View>
      </View>
    );
  }

  // Peso
  const weights = visits.map(v => v.weight).filter(v => v != null);
  const weightNow = patient.weightNow;
  const weightPre = patient.weightPre;
  const ganho = (weightNow != null && weightPre != null)
    ? (weightNow - weightPre).toFixed(1)
    : null;
  const expected = pregnancy.weightExpected || { label: '11–16 kg', category: 'unknown' };

  // PA
  const sysList = visits.map(v => v.paSis).filter(v => v != null);
  const diaList = visits.map(v => v.paDia).filter(v => v != null);
  const lastVisitWithPA = [...visits].reverse().find(v => v.paSis != null && v.paDia != null);
  const lastSys = lastVisitWithPA?.paSis ?? null;
  const lastDia = lastVisitWithPA?.paDia ?? null;
  const paAlert = pregnancy.paAlert || { status: 'estavel', label: 'Estável · sem alertas' };
  const paAlertColor = ALERT_COLORS[paAlert.status] || Status.slate;

  const ordered = [...visits].reverse();

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        <View style={s.section}>
          <SectionTitle>Curvas de seguimento</SectionTitle>

          {/* Card Peso */}
          <Card padding={14}>
            <View style={s.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.metricLabel}>PESO (kg)</Text>
                <Text style={s.metricValue}>{weightNow != null ? weightNow : '—'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.smallText}>
                  Pré: <Text style={s.smallStrong}>{weightPre != null ? `${weightPre} kg` : '—'}</Text>
                </Text>
                <Text style={s.smallText}>
                  Ganho: <Text style={[s.smallStrong, ganho != null && { color: Status.ok }]}>
                    {ganho != null ? `${ganho > 0 ? '+' : ''}${ganho} kg` : '—'}
                  </Text>
                </Text>
                <Text style={s.smallText}>Esperado: {expected.label}</Text>
              </View>
            </View>
            {weights.length >= 2 ? (
              <Spark
                data={weights}
                width={sparkW} height={64}
                color={Warm.accent}
                fill="rgba(232,153,118,0.22)"
              />
            ) : (
              <Text style={s.sparkEmpty}>Aguardando segunda medição para curva</Text>
            )}
          </Card>

          <View style={{ height: 8 }} />

          {/* Card PA */}
          <Card padding={14}>
            <View style={s.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.metricLabel}>PRESSÃO (sist./diast.)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={s.metricValue}>{lastSys != null ? lastSys : '—'}</Text>
                  {lastDia != null && <Text style={s.metricSlash}>/{lastDia}</Text>}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.smallText}>Limite: <Text style={s.smallStrong}>140/90</Text></Text>
                <Text style={[s.smallText, { color: paAlertColor, fontFamily: Fonts.uiBold }]}>
                  {paAlert.label}
                </Text>
              </View>
            </View>
            {sysList.length >= 2 ? (
              <View>
                <Spark data={sysList} width={sparkW} height={56} color={Warm.accentDeep} fill="rgba(184,93,63,0.14)" />
                {diaList.length >= 2 && (
                  <View style={s.sparkOverlay} pointerEvents="none">
                    <Spark data={diaList} width={sparkW} height={56} color={Warm.rose} fill="transparent" />
                  </View>
                )}
              </View>
            ) : (
              <Text style={s.sparkEmpty}>Aguardando segunda medição para curva</Text>
            )}
          </Card>
        </View>

        {/* Histórico de aferições */}
        <View style={s.section}>
          <SectionTitle>Histórico de aferições</SectionTitle>
          {ordered.length === 0 ? (
            <Card padding={16}>
              <Text style={s.empty}>Aguardando primeira consulta da gestação.</Text>
            </Card>
          ) : (
            <Card padding={0}>
              <View style={s.tableHeader}>
                {COLS.map(c => (
                  <Text key={c.key} style={[s.thLabel, { flex: c.flex }]}>{c.label}</Text>
                ))}
              </View>
              {ordered.map((v, i) => (
                <View key={i} style={[s.tableRow, i < ordered.length - 1 && s.tableRowBorder]}>
                  <Text style={[s.tdDate, { flex: COLS[0].flex }]}>{v.date ? v.date.slice(0, 5) : '—'}</Text>
                  <Text style={[s.tdIG,   { flex: COLS[1].flex }]}>{v.ig || '—'}</Text>
                  <Text style={[s.tdNum,  { flex: COLS[2].flex }]}>{v.weight != null ? v.weight : '—'}</Text>
                  <Text style={[s.tdNum,  { flex: COLS[3].flex }]}>{v.pa || '—'}</Text>
                  <Text style={[s.tdSlate,{ flex: COLS[4].flex }]}>{v.bcf != null ? v.bcf : '—'}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
        <ClinicalDisclaimer text="As curvas e percentis exibidos são informativos e não substituem a avaliação do seu médico. Em caso de dúvida ou sintomas, procure atendimento." />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 8, backgroundColor: Warm.accentDeep, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 13 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 22, color: Warm.rose, marginTop: 4 },
  emptySub: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 20 },
  empty: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', textAlign: 'center' },

  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 8 },
  metricLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  metricValue: { fontFamily: Fonts.numHeavy, fontSize: 22, color: Status.ink, lineHeight: 24 },
  metricSlash: { fontFamily: Fonts.num, fontSize: 14, color: Status.slate },
  smallText: { fontSize: 10, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 14 },
  smallStrong: { color: Status.ink, fontFamily: Fonts.uiBold },

  sparkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sparkEmpty: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  thLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.3, textTransform: 'uppercase' },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  tdDate:  { fontSize: 11, color: Status.ink, fontFamily: Fonts.numHeavy },
  tdIG:    { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.num },
  tdNum:   { fontSize: 11, color: Status.ink, fontFamily: Fonts.num },
  tdSlate: { fontSize: 11, color: Status.slate, fontFamily: Fonts.num },
});
