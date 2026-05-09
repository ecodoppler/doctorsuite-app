import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { LAB_SERIES } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

export default function ExameDetalheScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const series = LAB_SERIES[id];
  if (!series) {
    return (
      <View style={s.containerEmpty}>
        <Text style={s.emptyText}>Exame não encontrado.</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  // Geometria do gráfico
  const W = Math.min(Math.max(240, width - 60), 360);
  const H = 160;
  const padL = 36, padR = 12, padT = 12, padB = 24;
  const values = series.points.map(p => p.value);
  const yMin = Math.min(series.refMin, ...values) * 0.92;
  const yMax = Math.max(series.refMax, ...values) * 1.08;
  const xN = Math.max(1, series.points.length - 1);
  const px = (i) => padL + (i / xN) * (W - padL - padR);
  const py = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  const path = series.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(p.value).toFixed(1)}`)
    .join(' ');
  const refTop = py(series.refMax);
  const refBot = py(series.refMin);
  const last = series.points[series.points.length - 1];

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
            <Text style={s.examName} numberOfLines={1}>{series.name}</Text>
          </View>
        </View>
        <View style={s.headerStats}>
          <View>
            <Text style={s.eyebrow}>Último valor</Text>
            <Text style={s.lastValue}>
              {last.value}<Text style={s.unit}> {series.unit}</Text>
            </Text>
          </View>
          <View style={{ marginLeft: 32 }}>
            <Text style={s.eyebrow}>Faixa de referência</Text>
            <Text style={s.refRange}>{series.refMin} – {series.refMax} {series.unit}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Card com gráfico */}
        <View style={s.section}>
          <Card padding={14}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              {/* faixa de referência sombreada */}
              <Rect
                x={padL} y={refTop}
                width={W - padL - padR} height={refBot - refTop}
                fill="rgba(16,185,129,0.10)"
              />
              {/* tracejadas refMin / refMax */}
              <Line x1={padL} x2={W - padR} y1={refTop} y2={refTop} stroke="rgba(16,185,129,0.5)" strokeDasharray="4 3" strokeWidth={1} />
              <Line x1={padL} x2={W - padR} y1={refBot} y2={refBot} stroke="rgba(16,185,129,0.5)" strokeDasharray="4 3" strokeWidth={1} />
              {/* labels eixo Y (refMin / refMax) */}
              {[series.refMin, series.refMax].map((v, i) => (
                <SvgText
                  key={i}
                  x={padL - 6} y={py(v) + 3}
                  textAnchor="end" fontSize={9}
                  fill={Status.slate} fontFamily={Fonts.num}
                >{v}</SvgText>
              ))}
              {/* linha terracota */}
              <Path d={path} fill="none" stroke={Warm.accentDeep} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {/* pontos + labels eixo X (IG) */}
              {series.points.map((p, i) => (
                <G key={i}>
                  <Circle
                    cx={px(i)} cy={py(p.value)}
                    r={5} fill="#fff"
                    stroke={p.flag === 'attn' ? Status.attn : Warm.accentDeep}
                    strokeWidth={2.5}
                  />
                  <SvgText
                    x={px(i)} y={H - 8}
                    textAnchor="middle" fontSize={9}
                    fill={Status.slate} fontFamily={Fonts.num}
                  >{(p.ig || '').replace(' ', '')}</SvgText>
                </G>
              ))}
            </Svg>
          </Card>
        </View>

        {/* Histórico cronológico reverso */}
        <View style={s.section}>
          <SectionTitle>Histórico</SectionTitle>
          <Card padding={0}>
            {[...series.points].reverse().map((p, i, arr) => (
              <View key={i} style={[s.row, i < arr.length - 1 && s.rowBorder]}>
                <View style={[s.bullet, { backgroundColor: p.flag === 'attn' ? Status.attn : Warm.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowDate}>
                    {p.date}<Text style={s.rowIG}>  {p.ig}</Text>
                  </Text>
                  {p.note ? <Text style={s.rowNote}>{p.note}</Text> : null}
                </View>
                <Text style={s.rowValue}>
                  {p.value}<Text style={s.rowUnit}> {series.unit}</Text>
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  containerEmpty: { flex: 1, backgroundColor: '#f6f7fb', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: Status.slate, fontFamily: Fonts.ui },
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
