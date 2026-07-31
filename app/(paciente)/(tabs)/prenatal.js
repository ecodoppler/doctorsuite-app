import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../../components/pregnancy/VFHeader';
import Card from '../../../components/pregnancy/Card';
import SectionTitle from '../../../components/pregnancy/SectionTitle';
import WeightTrendChart from '../../../components/pregnancy/WeightTrendChart';
import BloodPressureTrendChart from '../../../components/pregnancy/BloodPressureTrendChart';
import { api } from '../../../services/api';
import { Fonts, Status, Warm } from '../../../services/theme';
import {
  buildPrenatalTrendModels,
  formatDecimal,
} from '../../../services/prenatal-trends';
import ClinicalDisclaimer from '../../../components/ClinicalDisclaimer';

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
  indisponivel: Status.slate,
};

const WEIGHT_STATUS_COLORS = {
  abaixo: Status.attn,
  adequado: Status.ok,
  acima: Status.warn,
  indisponivel: Status.slate,
};

function shortDate(value) {
  if (!value) return null;
  const text = String(value);
  const br = text.match(/^(\d{2})\/(\d{2})/);
  if (br) return `${br[1]}/${br[2]}`;
  const iso = text.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (iso) return `${iso[2]}/${iso[1]}`;
  return text.slice(0, 5);
}

function signedKg(value) {
  if (value == null) return '—';
  return `${value > 0 ? '+' : ''}${formatDecimal(value)} kg`;
}

function rangeKg(range) {
  if (!range) return '—';
  return `${formatDecimal(range.min)}–${formatDecimal(range.max)} kg`;
}

export default function PrenatalScreen() {
  const { width } = useWindowDimensions();
  const chartW = Math.max(240, width - 32 - 28);
  const stackMetrics = width < 360;

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

  const trendModels = buildPrenatalTrendModels({ patient, pregnancy, visits });
  const weightModel = trendModels.weight;
  const bpModel = trendModels.bloodPressure;
  const weightStatusColor = WEIGHT_STATUS_COLORS[weightModel.status] || Status.slate;
  const paAlertColor = ALERT_COLORS[bpModel.status] || Status.slate;
  const weightDate = shortDate(weightModel.latest?.date);
  const paDate = shortDate(bpModel.latest?.date);

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
            <View style={[s.cardTopRow, stackMetrics && s.cardTopStack]}>
              <View style={stackMetrics ? s.metricColumnStack : s.metricColumn}>
                <Text style={s.metricLabel}>PESO (KG)</Text>
                <View style={s.metricValueRow}>
                  <Text style={s.metricValue}>
                    {weightModel.latest ? formatDecimal(weightModel.latest.weightKg) : '—'}
                  </Text>
                  {weightModel.latest ? <Text style={s.metricUnit}> kg</Text> : null}
                </View>
                {weightModel.latest ? (
                  <Text style={s.metricMeta}>
                    {weightModel.latest.ig}{weightDate ? ` · ${weightDate}` : ''}
                  </Text>
                ) : null}
              </View>
              <View style={stackMetrics ? s.metricColumnStack : s.metricColumn}>
                <Text style={s.smallText}>
                  Ganho: <Text style={s.smallStrong}>{signedKg(weightModel.gainKg)}</Text>
                </Text>
                {weightModel.referenceAvailable ? (
                  <>
                    <Text style={s.smallText}>
                      IMC pré: <Text style={s.smallStrong}>{formatDecimal(weightModel.bmi)} · {weightModel.categoryLabel}</Text>
                    </Text>
                    <Text style={s.smallText}>
                      Meta total: <Text style={s.smallStrong}>{rangeKg(weightModel.totalGainRangeKg)}</Text>
                    </Text>
                  </>
                ) : null}
                <Text style={[s.statusText, { color: weightStatusColor }]}>
                  {weightModel.statusLabel || 'Referência temporariamente indisponível'}
                </Text>
              </View>
            </View>
            {weightModel.observations.length >= 1 ? (
              <WeightTrendChart model={weightModel} width={chartW} />
            ) : (
              <Text style={s.sparkEmpty}>Aguardando primeira aferição de peso</Text>
            )}
          </Card>

          <View style={{ height: 8 }} />

          {/* Card PA */}
          <Card padding={14}>
            <View style={[s.cardTopRow, stackMetrics && s.cardTopStack]}>
              <View style={stackMetrics ? s.metricColumnStack : s.metricColumn}>
                <Text style={s.metricLabel}>PRESSÃO (SIST./DIAST.)</Text>
                <View style={s.metricValueRow}>
                  <Text style={s.metricValue}>{bpModel.latest ? bpModel.latest.systolic : '—'}</Text>
                  {bpModel.latest ? <Text style={s.metricSlash}>/{bpModel.latest.diastolic}</Text> : null}
                </View>
                {bpModel.latest ? (
                  <Text style={s.metricMeta}>
                    {bpModel.latest.ig}{paDate ? ` · ${paDate}` : ''}
                  </Text>
                ) : null}
              </View>
              <View style={stackMetrics ? s.metricColumnStack : s.metricColumn}>
                {bpModel.referenceAvailable ? (
                  <Text style={s.smallText}>
                    Corte de atenção:{'\n'}
                    <Text style={s.smallStrong}>
                      PAS {formatDecimal(bpModel.thresholds.systolicAttention, 0)} ou PAD {formatDecimal(bpModel.thresholds.diastolicAttention, 0)}
                    </Text>
                  </Text>
                ) : null}
                <Text style={[s.statusText, { color: paAlertColor }]}>
                  {bpModel.statusLabel || 'Referência temporariamente indisponível'}
                </Text>
              </View>
            </View>
            {bpModel.points.length >= 1 ? (
              <BloodPressureTrendChart model={bpModel} width={chartW} />
            ) : (
              <Text style={s.sparkEmpty}>Aguardando primeira aferição de pressão</Text>
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
  cardTopStack: { flexDirection: 'column', gap: 8 },
  metricColumn: { flex: 1, minWidth: 0 },
  metricColumnStack: { width: '100%', minWidth: 0 },
  metricLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  metricValue: { fontFamily: Fonts.numHeavy, fontSize: 22, color: Status.ink, lineHeight: 24 },
  metricSlash: { fontFamily: Fonts.num, fontSize: 14, color: Status.slate },
  metricUnit: { fontFamily: Fonts.uiBold, fontSize: 11, color: Status.slate },
  metricMeta: { marginTop: 3, fontSize: 9, color: Status.slate, fontFamily: Fonts.ui },
  smallText: { fontSize: 10, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 14 },
  smallStrong: { color: Status.ink, fontFamily: Fonts.uiBold },
  statusText: { marginTop: 4, fontSize: 10, lineHeight: 13, fontFamily: Fonts.uiBold },

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
