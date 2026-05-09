import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { PATIENT, PREGNANCY, BIRTH_PLAN } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

const ROWS = [
  ['Via preferida',  BIRTH_PLAN.preference],
  ['Analgesia',      BIRTH_PLAN.pain],
  ['Acompanhante',   BIRTH_PLAN.companion],
  ['Pós-nascimento', BIRTH_PLAN.contact],
  ['Aleitamento',    BIRTH_PLAN.feeding],
];

export default function PlanoScreen() {
  const m = PATIENT.maternity;

  const handleCall = () => {
    if (!m?.phone) return;
    const digits = m.phone.replace(/\D/g, '');
    Linking.openURL(`tel:${digits}`);
  };

  const handleRoute = () => {
    if (!m?.address) return;
    const q = encodeURIComponent(`${m.name} ${m.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <View style={s.container}>
      <VFHeader patient={PATIENT} pregnancy={PREGNANCY} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Plano de parto */}
        <View style={s.section}>
          <SectionTitle>Plano de parto</SectionTitle>
          <Card padding={0}>
            {ROWS.map(([key, value], i) => (
              <View key={key} style={[s.planRow, i < ROWS.length - 1 && s.rowBorder]}>
                <Text style={s.planKey}>{key}</Text>
                <Text style={s.planValue}>{value}</Text>
              </View>
            ))}
            {BIRTH_PLAN.notes ? (
              <View style={s.notesBlock}>
                <Text style={s.notesText}>
                  <Text style={s.notesLabel}>Notas: </Text>
                  {BIRTH_PLAN.notes}
                </Text>
              </View>
            ) : null}
          </Card>
        </View>

        {/* Maternidade de referência */}
        <View style={s.section}>
          <SectionTitle>Maternidade de referência</SectionTitle>
          <Card padding={14}>
            <Text style={s.matName}>{m.name}</Text>
            <Text style={s.matAddress}>{m.address}</Text>
            {m.distance ? <Text style={s.matDistance}>{m.distance}</Text> : null}

            <View style={s.ctaRow}>
              <Pressable
                style={({ pressed }) => [s.ctaPrimary, pressed && { opacity: 0.85 }]}
                onPress={handleCall}
              >
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={s.ctaPrimaryText} numberOfLines={1}>Ligar · {m.phone}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.ctaSecondary, pressed && { opacity: 0.85 }]}
                onPress={handleRoute}
              >
                <Ionicons name="navigate" size={14} color={Warm.accentDeep} />
                <Text style={s.ctaSecondaryText}>Rota</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  // Plano
  planRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  planKey: { width: '38%', fontSize: 11, color: Status.slate, fontFamily: Fonts.uiSemibold },
  planValue: { flex: 1, fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold, lineHeight: 16 },

  // Notas (fundo cream)
  notesBlock: { backgroundColor: Warm.cream, paddingHorizontal: 14, paddingVertical: 10 },
  notesText: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 16 },
  notesLabel: { color: Status.ink, fontFamily: Fonts.uiBold },

  // Maternidade
  matName: { fontSize: 14, color: Status.ink, fontFamily: Fonts.uiHeavy },
  matAddress: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2, lineHeight: 16 },
  matDistance: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.numHeavy, marginTop: 2 },

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
});
