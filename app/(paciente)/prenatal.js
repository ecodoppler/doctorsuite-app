import { useWindowDimensions, ScrollView, View, Text, StyleSheet } from 'react-native';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import Spark from '../../components/pregnancy/Spark';
import { PATIENT, PREGNANCY, VISITS } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

const COLS = [
  { key: 'date',   label: 'Data',  flex: 1 },
  { key: 'ig',     label: 'IG',    flex: 0.8 },
  { key: 'weight', label: 'Peso',  flex: 0.8 },
  { key: 'pa',     label: 'PA',    flex: 0.7 },
  { key: 'bcf',    label: 'BCF',   flex: 0.7 },
];

export default function PrenatalScreen() {
  const { width } = useWindowDimensions();
  const sparkW = Math.max(240, width - 32 - 28); // padding tela + padding card

  const weights = VISITS.map(v => v.weight);
  const sysList = VISITS.map(v => Number(v.pa.split('/')[0]));
  const diaList = VISITS.map(v => Number(v.pa.split('/')[1]));
  const last = VISITS[VISITS.length - 1] || {};
  const lastSys = Number((last.pa || '0/0').split('/')[0]);
  const lastDia = Number((last.pa || '0/0').split('/')[1]);
  const ganho = (PATIENT.weightNow - PATIENT.weightPre).toFixed(1);

  const ordered = [...VISITS].reverse();

  return (
    <View style={s.container}>
      <VFHeader patient={PATIENT} pregnancy={PREGNANCY} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <SectionTitle action="Detalhar →">Curvas de seguimento</SectionTitle>

          {/* Card Peso */}
          <Card padding={14}>
            <View style={s.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.metricLabel}>PESO (kg)</Text>
                <Text style={s.metricValue}>{PATIENT.weightNow}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.smallText}>Pré: <Text style={s.smallStrong}>{PATIENT.weightPre} kg</Text></Text>
                <Text style={s.smallText}>Ganho: <Text style={[s.smallStrong, { color: Status.ok }]}>+{ganho} kg</Text></Text>
                <Text style={s.smallText}>Esperado: 11–16 kg</Text>
              </View>
            </View>
            <Spark
              data={weights}
              width={sparkW} height={64}
              color={Warm.accent}
              fill="rgba(232,153,118,0.22)"
            />
          </Card>

          <View style={{ height: 8 }} />

          {/* Card Pressão arterial */}
          <Card padding={14}>
            <View style={s.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.metricLabel}>PRESSÃO (sist./diast.)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={s.metricValue}>{lastSys}</Text>
                  <Text style={s.metricSlash}>/{lastDia}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.smallText}>Limite: <Text style={s.smallStrong}>140/90</Text></Text>
                <Text style={[s.smallText, { color: Status.ok }]}>Estável · sem alertas</Text>
              </View>
            </View>
            {/* Dual sparkline empilhada */}
            <View>
              <Spark
                data={sysList}
                width={sparkW} height={56}
                color={Warm.accentDeep}
                fill="rgba(184,93,63,0.14)"
              />
              <View style={s.sparkOverlay} pointerEvents="none">
                <Spark
                  data={diaList}
                  width={sparkW} height={56}
                  color={Warm.rose}
                  fill="transparent"
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Histórico de aferições */}
        <View style={s.section}>
          <SectionTitle>Histórico de aferições</SectionTitle>
          <Card padding={0}>
            <View style={s.tableHeader}>
              {COLS.map(c => (
                <Text key={c.key} style={[s.thLabel, { flex: c.flex }]}>{c.label}</Text>
              ))}
            </View>
            {ordered.map((v, i) => (
              <View key={i} style={[s.tableRow, i < ordered.length - 1 && s.tableRowBorder]}>
                <Text style={[s.tdDate, { flex: COLS[0].flex }]}>{v.date.slice(0, 5)}</Text>
                <Text style={[s.tdIG,   { flex: COLS[1].flex }]}>{v.ig}</Text>
                <Text style={[s.tdNum,  { flex: COLS[2].flex }]}>{v.weight}</Text>
                <Text style={[s.tdNum,  { flex: COLS[3].flex }]}>{v.pa}</Text>
                <Text style={[s.tdSlate,{ flex: COLS[4].flex }]}>{v.bcf || '—'}</Text>
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
  section: { paddingHorizontal: 16, paddingTop: 14 },

  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 8 },
  metricLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  metricValue: { fontFamily: Fonts.numHeavy, fontSize: 22, color: Status.ink, lineHeight: 24 },
  metricSlash: { fontFamily: Fonts.num, fontSize: 14, color: Status.slate },
  smallText: { fontSize: 10, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 14 },
  smallStrong: { color: Status.ink, fontFamily: Fonts.uiBold },

  sparkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  thLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.3, textTransform: 'uppercase' },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  tdDate:  { fontSize: 11, color: Status.ink, fontFamily: Fonts.numHeavy },
  tdIG:    { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.num },
  tdNum:   { fontSize: 11, color: Status.ink, fontFamily: Fonts.num },
  tdSlate: { fontSize: 11, color: Status.slate, fontFamily: Fonts.num },
});
