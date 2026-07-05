import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import VFHeader from '../../../components/pregnancy/VFHeader';
import Card from '../../../components/pregnancy/Card';
import SectionTitle from '../../../components/pregnancy/SectionTitle';
import { api, API_BASE } from '../../../services/api';
import { Fonts, Status, Warm } from '../../../services/theme';

const TRIM_KEYS = ['T1', 'T2', 'T3'];
const EXAM_LABELS = {
  us_obstetrica: 'US Obstétrica',
  us_obs_1tri_abd: 'US Obstétrica 1º Tri Abdominal',
  us_obs_1tri_tv: 'US Obstétrica 1º Tri Transvaginal',
  us_morfo_1tri: 'US Morfológica 1º Tri',
  us_morfo_2tri: 'US Morfológica 2º Tri',
  doppler_obstetrico: 'Doppler Obstétrico',
  perfil_biofisico: 'Perfil Biofísico Fetal',
  cardiotocografia: 'Cardiotocografia',
  ecocardiografia_fetal: 'Ecocardiografia Fetal',
  us_pelvica_tv: 'US Pélvica TV',
  us_pelvica_abd: 'US Pélvica Abdominal',
  us_mamas: 'US Mamas',
  us_tireoide: 'US Tireoide',
  us_abdome: 'US Abdome',
  us_rins_vias: 'US Rins e Vias Urinárias',
  us_geral: 'Ultrassonografia',
  mamografia: 'Mamografia',
  densitometria: 'Densitometria Óssea',
  raio_x: 'Raio-X',
  tomografia: 'Tomografia Computadorizada',
  ressonancia: 'Ressonância Magnética',
  cintilografia: 'Cintilografia',
};

function examLabel(type, fallback) {
  if (type && EXAM_LABELS[type]) return EXAM_LABELS[type];
  if (fallback) return String(fallback);
  return String(type || 'Laudo').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateBR(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const iso = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.split('-').reverse().join('/');
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return raw;
}

function textKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hasReportPdf(report) {
  return report?.has_pdf === true || report?.has_pdf === 1 || report?.has_pdf === '1' || report?.has_pdf === 'true' || report?.has_pdf === 't';
}

function buildReportRefs(reports) {
  return (reports || [])
    .filter((report) => report?.id)
    .map((report) => {
      const type = String(report.exam_type || '');
      return {
        report,
        type,
        date: formatDateBR(report.exam_date || report.created_at),
        kind: examLabel(type, report.template_name || report.report_type),
      };
    });
}

function attachReports(items, reportRefs, usedIds) {
  return (items || []).map((item) => {
    const itemDate = formatDateBR(item.date);
    const itemType = String(item.exam_type || '');
    const itemKind = textKey(item.kind);
    const found = reportRefs.find((ref) => {
      if (usedIds.has(ref.report.id)) return false;
      if (itemDate && ref.date !== itemDate) return false;
      if (itemType && ref.type === itemType) return true;
      return itemKind && textKey(ref.kind) === itemKind;
    });
    if (found?.report?.id) usedIds.add(found.report.id);
    return {
      ...item,
      report: found?.report || null,
      date: item.date || found?.date || '',
      kind: item.kind || found?.kind || 'Exame de imagem',
    };
  });
}

export default function ExamesScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyReportId, setBusyReportId] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [d, reports] = await Promise.all([
        api('/api/my-pregnancy'),
        api('/api/my-reports').catch(() => []),
      ]);
      setData({ ...(d || {}), reports: Array.isArray(reports) ? reports : [] });
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
      <View style={s.container}><View style={s.loaderWrap}>
        <ActivityIndicator size="large" color={Warm.accentDeep} />
      </View></View>
    );
  }
  if (err) {
    return (
      <View style={s.container}><View style={[s.loaderWrap, { padding: 24 }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
        <Text style={s.errText}>Não foi possível carregar.{'\n'}{err}</Text>
        <Pressable onPress={() => { setLoading(true); load(); }} style={s.retryBtn}>
          <Text style={s.retryText}>Tentar de novo</Text>
        </Pressable>
      </View></View>
    );
  }

  const patient = data?.patient || {};
  const pregnancy = data?.pregnancy;
  if (!pregnancy) {
    return (
      <View style={s.container}><View style={[s.loaderWrap, { padding: 24 }]}>
        <Ionicons name="heart-outline" size={48} color={Warm.accentDeep} />
        <Text style={s.emptyTitle}>Sem gestação ativa</Text>
        <Text style={s.emptySub}>Exames aparecem aqui quando o seu médico iniciar uma nova gestação.</Text>
      </View></View>
    );
  }

  const labsByTrim = data?.labs?.byTrimester || {};
  const trims = TRIM_KEYS
    .map(k => labsByTrim[k])
    .filter(t => t && Array.isArray(t.sessions) && t.sessions.length > 0);

  const usg = data?.imaging?.usg || [];
  const ecoFetal = data?.imaging?.ecoFetal || [];

  const hasAnyLab = trims.length > 0;
  const hasAnyImaging = usg.length > 0 || ecoFetal.length > 0;

  const onLabClick = (id, name) => {
    router.push({ pathname: '/(paciente)/exame-detalhe', params: { id, name } });
  };

  const openReportPdf = async (item) => {
    const report = item?.report;
    if (!report?.id || !hasReportPdf(report)) {
      Alert.alert('Laudo', 'O PDF deste laudo ainda não está disponível.');
      return;
    }
    setBusyReportId(report.id);
    try {
      const r = await api(`/api/my-reports/${report.id}/pdf-url`);
      const raw = r?.url;
      if (!raw) {
        Alert.alert('Laudo', 'O PDF deste laudo ainda não está disponível.');
        return;
      }
      const url = String(raw).startsWith('http') ? raw : `${API_BASE}${raw}`;
      await WebBrowser.openBrowserAsync(url);
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível abrir o PDF do laudo.');
    } finally {
      setBusyReportId(null);
    }
  };

  const reportRefs = buildReportRefs(data?.reports);
  const usedReportIds = new Set();
  const usgRows = attachReports(usg, reportRefs, usedReportIds);
  const ecoFetalRows = attachReports(ecoFetal, reportRefs, usedReportIds);

  const renderImagingRow = (item, index, list) => {
    const hasPdf = hasReportPdf(item.report);
    const busy = busyReportId && String(busyReportId) === String(item.report?.id);
    return (
      <View key={item.report?.id || `${item.kind}-${item.date}-${index}`} style={[s.imgRow, index < list.length - 1 && s.imgRowBorder]}>
        <View style={s.imgHeader}>
          <Text style={s.imgKind}>{item.kind}</Text>
          {item.ig ? <Text style={s.imgIG}>{item.ig}</Text> : null}
        </View>
        <View style={s.imgMetaRow}>
          {item.date ? <Text style={s.imgDate}>{item.date}</Text> : null}
          {item.report?.doctor_name ? (
            <>
              {item.date ? <Text style={s.imgMetaDot}>·</Text> : null}
              <Text style={s.imgDoctor} numberOfLines={1}>Dr(a). {item.report.doctor_name}</Text>
            </>
          ) : null}
        </View>
        {hasPdf ? (
          <Pressable
            onPress={() => openReportPdf(item)}
            disabled={!!busy}
            style={({ pressed }) => [s.reportBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.7 }]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="document-text" size={16} color="#fff" />
                <Text style={s.reportBtnText}>Abrir laudo</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={s.unavailableRow}>
            <Ionicons name="time-outline" size={15} color={Status.slate} />
            <Text style={s.unavailableText}>Laudo ainda não disponível</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {/* Laboratoriais */}
        <View style={s.section}>
          <SectionTitle>Laboratoriais</SectionTitle>
          {!hasAnyLab ? (
            <Card padding={16}>
              <Text style={s.empty}>Nenhum exame laboratorial registrado nesta gestação ainda.</Text>
            </Card>
          ) : trims.map((trim, ti) => (
            <View key={ti} style={{ marginBottom: 14 }}>
              <Text style={s.trimLabel}>{trim.label}</Text>
              {trim.sessions.map((session, si) => (
                <View key={si} style={{ marginBottom: 8 }}>
                  <View style={s.sessionHeader}>
                    <Text style={s.sessionDate}>
                      {(session.date || '').slice(0, 5)} <Text style={s.sessionIG}>{session.ig}</Text>
                    </Text>
                  </View>
                  <Card padding={0}>
                    {session.items.map((item, i) => {
                      const hasSeries = !!item.hasSeries;
                      const isLast = i === session.items.length - 1;
                      return (
                        <Pressable
                          key={i}
                          disabled={!hasSeries}
                          onPress={() => onLabClick(item.id, item.name)}
                          style={({ pressed }) => [
                            s.labRow,
                            !isLast && s.labRowBorder,
                            hasSeries && pressed && { backgroundColor: '#fafafa' },
                          ]}
                        >
                          <View style={s.labNameWrap}>
                            <Text style={s.labName} numberOfLines={1}>{item.name}</Text>
                            {hasSeries && (
                              <View style={s.evolBadge}>
                                <Text style={s.evolText}>EVOLUÇÃO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={s.labResult} numberOfLines={1}>{item.result}</Text>
                          {hasSeries ? <Text style={s.chev}>›</Text> : null}
                        </Pressable>
                      );
                    })}
                  </Card>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Ultrassonografias */}
        {usg.length > 0 && (
          <View style={[s.section, { paddingTop: 4 }]}>
            <SectionTitle>Ultrassonografias</SectionTitle>
            <Card padding={0}>
              {usgRows.map(renderImagingRow)}
            </Card>
          </View>
        )}

        {/* Ecocardiografia fetal */}
        {ecoFetal.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Ecocardiografia fetal</SectionTitle>
            <Card padding={0}>
              {ecoFetalRows.map(renderImagingRow)}
            </Card>
          </View>
        )}

        {!hasAnyLab && !hasAnyImaging && (
          <View style={s.section}>
            <Text style={s.emptySub}>Nenhum exame registrado ainda.</Text>
          </View>
        )}
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

  // Trimestre / sessão
  trimLabel: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4, paddingBottom: 6 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 4 },
  sessionDate: { fontSize: 11, color: Status.ink, fontFamily: Fonts.numHeavy },
  sessionIG: { color: Status.slate, fontFamily: Fonts.num, marginLeft: 4 },

  // Lab item
  labRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  labRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  labNameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  labName: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold, flexShrink: 1 },
  labResult: { fontSize: 12, color: Status.ink, fontFamily: Fonts.numHeavy, marginLeft: 6 },
  chev: { color: Status.slateLight, fontSize: 16, marginLeft: 2, fontFamily: Fonts.uiBold },

  // Badge EVOLUÇÃO
  evolBadge: { backgroundColor: Warm.accentSoft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 },
  evolText: { fontSize: 9, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy, letterSpacing: 0.3 },

  // Imagem (USG, eco)
  imgRow: { padding: 12 },
  imgRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  imgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  imgKind: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiBold, flex: 1, marginRight: 8 },
  imgIG: { fontSize: 10, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy },
  imgMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  imgDate: { fontSize: 10, color: Status.slate, fontFamily: Fonts.num },
  imgMetaDot: { fontSize: 10, color: Status.slateLight, fontFamily: Fonts.uiBold },
  imgDoctor: { fontSize: 10, color: Status.slate, fontFamily: Fonts.ui, flex: 1 },
  reportBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Warm.accentDeep,
  },
  reportBtnText: { color: '#fff', fontSize: 12, fontFamily: Fonts.uiBold },
  unavailableRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  unavailableText: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiSemibold },
});
