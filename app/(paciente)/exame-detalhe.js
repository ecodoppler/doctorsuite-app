import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';

export default function ExameDetalheScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const examKey = String(params.id || params.name || '').trim();

  const load = useCallback(async () => {
    if (!examKey) { setLoading(false); return; }
    try {
      setErr(null);
      const d = await api(`/api/my-pregnancy/labs/${encodeURIComponent(examKey)}`);
      setSeries(d);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
  }, [examKey]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={s.container}><View style={s.loaderWrap}>
        <ActivityIndicator size="large" color={Warm.accentDeep} />
      </View></View>
    );
  }
  if (err || !series) {
    return (
      <View style={s.containerEmpty}>
        <Text style={s.emptyText}>{err || 'Exame não encontrado.'}</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const points = series.points || [];
  const last = points[points.length - 1];
  const lastUnit = last?.unit || series.unit || '';

  // Pontos numéricos para plotar (descarta entradas qualitativas como "Não reagente")
  const numericPoints = points
    .map(p => ({ ...p, _num: parseFloat(String(p.value).replace(',', '.')) }))
    .filter(p => Number.isFinite(p._num));

  const W = Math.min(Math.max(240, width - 60), 360);
  const H = 160;
  const padL = 30, padR = 12, padT = 12, padB = 24;

  // Geometria do gráfico (sem faixa de referência)
  let path = '';
  let plotPoints = [];
  if (numericPoints.length >= 2) {
    const values = numericPoints.map(p => p._num);
    const yMin = Math.min(...values);
    const yMax = Math.max(...values);
    const span = Math.max(0.0001, yMax - yMin);
    const yLo = yMin - span * 0.1;
    const yHi = yMax + span * 0.1;
    const xN = Math.max(1, numericPoints.length - 1);
    const px = (i) => padL + (i / xN) * (W - padL - padR);
    const py = (v) => padT + (1 - (v - yLo) / (yHi - yLo)) * (H - padT - padB);
    plotPoints = numericPoints.map((p, i) => ({ ...p, _x: px(i), _y: py(p._num) }));
    path = plotPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p._x.toFixed(1)} ${p._y.toFixed(1)}`).join(' ');
  }

  return (
    <View style={s.container}>
      {/* Mini header warm */}
      <LinearGradient
        colors={Warm.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.headerTop}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.eyebrow}>Evolução do exame</Text>
            <Text style={s.examName} numberOfLines={1}>{series.name || examKey}</Text>
          </View>
        </View>
        {last ? (
          <View style={s.headerStats}>
            <View>
              <Text style={s.eyebrow}>Último valor</Text>
              <Text style={s.lastValue}>
                {last.value}{lastUnit ? <Text style={s.unit}> {lastUnit}</Text> : null}
              </Text>
            </View>
            <View style={{ marginLeft: 32 }}>
              <Text style={s.eyebrow}>Última coleta</Text>
              <Text style={s.refRange}>{last.date}{last.ig ? ` · ${last.ig}` : ''}</Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Card com gráfico (só se tiver 2+ pontos numéricos) */}
        {plotPoints.length >= 2 ? (
          <View style={s.section}>
            <Card padding={14}>
              <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <Path d={path} fill="none" stroke={Warm.accentDeep} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                {plotPoints.map((p, i) => (
                  <G key={i}>
                    <Circle
                      cx={p._x} cy={p._y}
                      r={5} fill="#fff"
                      stroke={Warm.accentDeep}
                      strokeWidth={2.5}
                    />
                    <SvgText
                      x={p._x} y={H - 8}
                      textAnchor="middle" fontSize={9}
                      fill={Status.slate} fontFamily={Fonts.num}
                    >{(p.ig || '').replace(' ', '')}</SvgText>
                  </G>
                ))}
              </Svg>
            </Card>
          </View>
        ) : numericPoints.length === 1 ? (
          <View style={s.section}>
            <Card padding={16}>
              <Text style={s.empty}>Apenas uma medição registrada — gráfico aparecerá com 2 ou mais.</Text>
            </Card>
          </View>
        ) : null}

        {/* Histórico cronológico reverso */}
        <View style={s.section}>
          <SectionTitle>Histórico</SectionTitle>
          {points.length === 0 ? (
            <Card padding={16}>
              <Text style={s.empty}>Sem registros nesta gestação.</Text>
            </Card>
          ) : (
            <Card padding={0}>
              {[...points].reverse().map((p, i, arr) => (
                <View key={i} style={[s.row, i < arr.length - 1 && s.rowBorder]}>
                  <View style={[s.bullet, { backgroundColor: Warm.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowDate}>
                      {p.date}{p.ig ? <Text style={s.rowIG}>  {p.ig}</Text> : null}
                    </Text>
                    {p.notes ? <Text style={s.rowNote}>{p.notes}</Text> : null}
                  </View>
                  <Text style={s.rowValue}>
                    {p.value}{p.unit ? <Text style={s.rowUnit}> {p.unit}</Text> : null}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  containerEmpty: { flex: 1, backgroundColor: '#f6f7fb', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Status.slate, fontFamily: Fonts.ui },
  empty: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', textAlign: 'center' },
  backLink: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  backLinkText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 14 },

  // Mini header
  header: { paddingHorizontal: 16, paddingBottom: 18, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontFamily: Fonts.uiBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  examName: { color: '#fff', fontFamily: Fonts.display, fontSize: 22, lineHeight: 24, marginTop: 2 },
  headerStats: { flexDirection: 'row', marginTop: 14 },
  lastValue: { color: '#fff', fontFamily: Fonts.numHeavy, fontSize: 24 },
  unit: { fontSize: 12, fontFamily: Fonts.ui, color: 'rgba(255,255,255,0.85)' },
  refRange: { color: '#fff', fontFamily: Fonts.num, fontSize: 14, marginTop: 4 },

  section: { paddingHorizontal: 16, paddingTop: 14 },

  // Histórico
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  bullet: { width: 8, height: 8, borderRadius: 99 },
  rowDate: { fontSize: 12, color: Status.ink, fontFamily: Fonts.numHeavy },
  rowIG: { color: Status.slate, fontFamily: Fonts.num },
  rowNote: { fontSize: 10.5, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },
  rowValue: { fontSize: 14, color: Status.ink, fontFamily: Fonts.numHeavy },
  rowUnit: { fontSize: 10, color: Status.slate, fontFamily: Fonts.ui },
});
