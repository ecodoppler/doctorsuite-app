import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import StatusDot from '../../components/pregnancy/StatusDot';
import { PATIENT, PREGNANCY, LABS_GROUPED, LAB_SERIES, IMAGING } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

export default function ExamesScreen() {
  const router = useRouter();
  const trims = [LABS_GROUPED.T1, LABS_GROUPED.T2, LABS_GROUPED.T3];

  const onLabClick = (id) => {
    router.push({ pathname: '/(paciente)/exame-detalhe', params: { id } });
  };

  return (
    <View style={s.container}>
      <VFHeader patient={PATIENT} pregnancy={PREGNANCY} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Laboratoriais */}
        <View style={s.section}>
          <SectionTitle>Laboratoriais</SectionTitle>
          {trims.map((trim, ti) => (
            <View key={ti} style={{ marginBottom: 14 }}>
              <Text style={s.trimLabel}>{trim.label}</Text>
              {trim.sessions.map((session, si) => (
                <View key={si} style={{ marginBottom: 8 }}>
                  <View style={s.sessionHeader}>
                    <Text style={s.sessionDate}>
                      {session.date} <Text style={s.sessionIG}>{session.ig}</Text>
                    </Text>
                    {session.note ? <Text style={s.sessionNote}>{session.note}</Text> : null}
                  </View>
                  <Card padding={0}>
                    {session.items.map((item, i) => {
                      const hasSeries = !!LAB_SERIES[item.id];
                      const isLast = i === session.items.length - 1;
                      return (
                        <Pressable
                          key={i}
                          disabled={!hasSeries}
                          onPress={() => onLabClick(item.id)}
                          style={({ pressed }) => [
                            s.labRow,
                            !isLast && s.labRowBorder,
                            hasSeries && pressed && { backgroundColor: '#fafafa' },
                          ]}
                        >
                          <StatusDot status={item.status} />
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
        <View style={[s.section, { paddingTop: 4 }]}>
          <SectionTitle>Ultrassonografias</SectionTitle>
          <Card padding={0}>
            {IMAGING.usg.map((u, i) => (
              <View key={i} style={[s.imgRow, i < IMAGING.usg.length - 1 && s.imgRowBorder]}>
                <View style={s.imgHeader}>
                  <Text style={s.imgKind}>{u.kind}</Text>
                  <Text style={s.imgIG}>{u.ig}</Text>
                </View>
                <Text style={s.imgDate}>{u.date}</Text>
                <Text style={s.imgFinding}>{u.finding}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Ecocardiografia fetal */}
        {IMAGING.ecoFetal && IMAGING.ecoFetal.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Ecocardiografia fetal</SectionTitle>
            <Card padding={0}>
              {IMAGING.ecoFetal.map((e, i) => (
                <View key={i} style={[s.imgRow, i < IMAGING.ecoFetal.length - 1 && s.imgRowBorder]}>
                  <View style={s.imgHeader}>
                    <Text style={s.imgKind}>{e.kind}</Text>
                    <Text style={s.imgIG}>{e.ig}</Text>
                  </View>
                  <Text style={s.imgDate}>{e.date}</Text>
                  <Text style={s.imgFinding}>{e.finding}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  // Trimestre / sessão
  trimLabel: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4, paddingBottom: 6 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 4 },
  sessionDate: { fontSize: 11, color: Status.ink, fontFamily: Fonts.numHeavy },
  sessionIG: { color: Status.slate, fontFamily: Fonts.num, marginLeft: 4 },
  sessionNote: { fontSize: 10, color: Status.slate, fontStyle: 'italic', fontFamily: Fonts.ui },

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
  imgDate: { fontSize: 10, color: Status.slate, fontFamily: Fonts.num },
  imgFinding: { fontSize: 11, color: Status.ink, fontFamily: Fonts.ui, marginTop: 4, lineHeight: 16 },
});
