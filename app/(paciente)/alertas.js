import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { PATIENT, ALERTS } from '../../services/pregnancyMock';
import { Fonts, Status, Warm } from '../../services/theme';

export default function AlertasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const m = PATIENT.maternity;

  const handleCall = () => {
    if (!m?.phone) return;
    const digits = m.phone.replace(/\D/g, '');
    Linking.openURL(`tel:${digits}`);
  };

  return (
    <LinearGradient
      colors={Warm.alertGradient}
      locations={Warm.coverGradientStops}
      style={s.gradient}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mini header (voltar) */}
        <View style={s.headerNav}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={Warm.rose} />
          </Pressable>
        </View>

        {/* Título humano */}
        <View style={s.titleBlock}>
          <Text style={s.eyebrow}>Sinais de alerta</Text>
          <Text style={s.title}>Quando procurar a maternidade</Text>
        </View>

        {/* SOS card */}
        <View style={s.section}>
          <View style={s.sosCard}>
            <View style={s.sosIcon}>
              <Text style={s.sosIconText}>🚑</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.sosName} numberOfLines={1}>{m.name}</Text>
              <Text style={s.sosMeta} numberOfLines={1}>
                {m.distance ? `${m.distance} · ` : ''}{m.phone}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.sosBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCall}
            >
              <Text style={s.sosBtnText}>LIGAR</Text>
            </Pressable>
          </View>
        </View>

        {/* Lista de alertas */}
        <View style={s.section}>
          <SectionTitle>Procure imediatamente se</SectionTitle>
          <View style={{ gap: 8 }}>
            {ALERTS.map((a, i) => (
              <View key={i} style={s.alertCard}>
                <View style={s.alertIcon}>
                  <Text style={s.alertIconText}>{a.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitle}>{a.title}</Text>
                  <Text style={s.alertDetail}>{a.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },

  // Header (botão voltar)
  headerNav: { paddingHorizontal: 12, paddingTop: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Título
  titleBlock: { paddingHorizontal: 20, paddingTop: 4 },
  eyebrow: { fontSize: 12, color: Status.slate, fontFamily: Fonts.uiSemibold, letterSpacing: 0.4, textTransform: 'uppercase' },
  title: { fontFamily: Fonts.display, fontSize: 26, color: Warm.rose, lineHeight: 30, marginTop: 4 },

  section: { paddingHorizontal: 20, paddingTop: 14 },

  // SOS
  sosCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Status.warn,
    borderRadius: 18, padding: 16,
  },
  sosIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosIconText: { fontSize: 22 },
  sosName: { color: '#fff', fontSize: 15, fontFamily: Fonts.uiHeavy },
  sosMeta: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontFamily: Fonts.ui, marginTop: 2 },
  sosBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  sosBtnText: { color: Status.warn, fontFamily: Fonts.uiHeavy, fontSize: 12, letterSpacing: 0.4 },

  // Itens de alerta
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Status.borderSoft,
  },
  alertIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: '#fff5ef',
    alignItems: 'center', justifyContent: 'center',
  },
  alertIconText: { fontSize: 18 },
  alertTitle: { fontSize: 13, color: Status.ink, fontFamily: Fonts.uiBold },
  alertDetail: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 16, marginTop: 2 },
});
