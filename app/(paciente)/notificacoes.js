import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Status, Warm } from '../../services/theme';

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}>
        <View style={s.headerNav}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={Warm.accentDeep} />
          </Pressable>
          <Text style={s.headerTitle}>Notificações</Text>
        </View>

        <View style={s.empty}>
          <View style={s.bellWrap}>
            <Ionicons name="notifications-outline" size={48} color={Warm.accentDeep} />
          </View>
          <Text style={s.emptyTitle}>Em breve</Text>
          <Text style={s.emptyText}>
            Aqui você verá lembretes de consulta, avisos sobre laudos prontos
            e novos documentos compartilhados pela clínica.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  headerTitle: { fontFamily: Fonts.uiBold, fontSize: 16, color: Status.ink },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 60, gap: 14 },
  bellWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: Fonts.uiHeavy, fontSize: 20, color: Status.ink, marginTop: 4 },
  emptyText: { fontFamily: Fonts.ui, fontSize: 13, color: Status.slate, textAlign: 'center', lineHeight: 20 },
});
