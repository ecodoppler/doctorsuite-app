import { ScrollView, View, Text, StyleSheet } from 'react-native';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { PATIENT, PREGNANCY, VACCINES } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

export default function VacinasScreen() {
  const taken = VACCINES.filter(v => v.status === 'done');
  const prev = VACCINES.filter(v => v.status === 'prev');
  const pending = VACCINES.filter(v => v.status === 'pending');

  return (
    <View style={s.container}>
      <VFHeader patient={PATIENT} pregnancy={PREGNANCY} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Título humano */}
        <View style={[s.section, { paddingTop: 14 }]}>
          <Text style={s.title}>Vacinas tomadas na gravidez</Text>
          <Text style={s.subtitle}>
            {taken.length} {taken.length === 1 ? 'aplicação realizada' : 'aplicações realizadas'} durante a gestação atual
          </Text>
        </View>

        {/* Vacinas aplicadas na gestação */}
        {taken.length > 0 && (
          <View style={s.section}>
            <Card padding={0}>
              {taken.map((v, i) => (
                <View key={i} style={[s.takenRow, i < taken.length - 1 && s.rowBorder]}>
                  <View style={s.checkBox}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.takenHeader}>
                      <Text style={s.takenName} numberOfLines={2}>{v.name}</Text>
                      <Text style={s.takenIG}>{v.ig}</Text>
                    </View>
                    <Text style={s.takenDate}>{v.date}</Text>
                    {v.note ? <Text style={s.takenNote}>{v.note}</Text> : null}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Imunizações pré-gestacionais */}
        {prev.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Imunizações pré-gestacionais</SectionTitle>
            <Card padding={0}>
              {prev.map((v, i) => (
                <View key={i} style={[s.prevRow, i < prev.length - 1 && s.rowBorder]}>
                  <View style={s.prevDot} />
                  <Text style={s.prevName} numberOfLines={1}>{v.name}</Text>
                  <Text style={s.prevNote} numberOfLines={1}>{v.note}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Card warm informativo */}
        <View style={s.section}>
          <View style={s.warmCard}>
            <Text style={s.warmEyebrow}>
              {pending.length > 0 ? 'Recomendado e ainda não aplicado' : 'Recomendado e ainda não aplicado'}
            </Text>
            {pending.length === 0 ? (
              <Text style={s.warmText}>
                Todas as vacinas recomendadas para esta gestação foram aplicadas. ✓
              </Text>
            ) : (
              <View style={{ marginTop: 6 }}>
                {pending.map((v, i) => (
                  <Text key={i} style={s.pendingItem}>· {v.name}{v.note ? ` — ${v.note}` : ''}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  title: { fontFamily: Fonts.display, fontSize: 22, color: Status.ink, lineHeight: 26 },
  subtitle: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },

  // Aplicadas na gestação
  takenRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  checkBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Status.okSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: Status.ok, fontFamily: Fonts.uiHeavy, fontSize: 18 },
  takenHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  takenName: { flex: 1, fontSize: 13, color: Status.ink, fontFamily: Fonts.uiBold },
  takenIG: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.num },
  takenDate: { fontSize: 11, color: Status.slate, fontFamily: Fonts.num, marginTop: 2 },
  takenNote: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, marginTop: 4, lineHeight: 16 },

  // Pré-gestacionais
  prevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  prevDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: Status.slateLight },
  prevName: { flex: 1, fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold },
  prevNote: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, flexShrink: 1, textAlign: 'right' },

  // Card warm informativo
  warmCard: {
    backgroundColor: Warm.cream,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Status.borderSoft,
  },
  warmEyebrow: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  warmText: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 6, lineHeight: 18 },
  pendingItem: { fontSize: 12, color: Status.ink, fontFamily: Fonts.ui, lineHeight: 18 },
});
