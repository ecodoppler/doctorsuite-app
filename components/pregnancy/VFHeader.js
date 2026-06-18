import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RiskBadge from './RiskBadge';
import { Fonts, Warm } from '../../services/theme';

// Header reutilizado pelas telas 02–05 do Cartão da Gestante.
// Sem tab strip (a navegação entre seções é feita pela bottom nav).
// Quando a tela foi EMPILHADA sobre as abas (router.canGoBack()), mostra um "voltar".
export default function VFHeader({ patient, pregnancy }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canBack = router.canGoBack();
  const igTotal = pregnancy.igWeeks * 7 + pregnancy.igDays;
  const pct = (igTotal / 280) * 100;

  return (
    <LinearGradient
      colors={Warm.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.wrap, { paddingTop: insets.top + 12 }]}
    >
      {/* Halo translúcido canto superior direito (efeito radial aproximado) */}
      <View style={s.halo} pointerEvents="none" />

      <View style={s.topRow}>
        {canBack ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ) : null}
        <View style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{patient.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>{patient.name}</Text>
            <Text style={s.subtle}>{patient.age} anos · {patient.blood}</Text>
          </View>
        </View>
        <RiskBadge level={patient.risk} compact />
      </View>

      <View style={s.bigRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>Idade gestacional</Text>
          <View style={s.igRow}>
            <Text style={s.igWeeks}>{pregnancy.igWeeks}</Text>
            <Text style={s.igWeeksSuffix}>s</Text>
            <Text style={s.igDays}>{pregnancy.igDays}</Text>
            <Text style={s.igDaysSuffix}>d</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.eyebrow}>DPP</Text>
          <Text style={s.dpp}>{pregnancy.dpp}</Text>
          <Text style={s.subtle}>{pregnancy.trimester}º trim · {pregnancy.paridadeText}</Text>
        </View>
      </View>

      {/* Barra de progresso com ticks 12s e 27s */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${Math.min(100, pct)}%` }]} />
        <View style={[s.tick, { left: `${(12 / 40) * 100}%` }]} />
        <View style={[s.tick, { left: `${(27 / 40) * 100}%` }]} />
      </View>
      <View style={s.scaleRow}>
        <Text style={s.scaleLabel}>0s</Text>
        <Text style={s.scaleLabel}>12s</Text>
        <Text style={s.scaleLabel}>27s</Text>
        <Text style={s.scaleLabel}>40s</Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden' },
  halo: {
    position: 'absolute',
    right: -40, top: -40,
    width: 180, height: 180, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { marginRight: 6, marginLeft: -4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  avatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },
  name: { color: '#fff', fontFamily: Fonts.display, fontSize: 16, lineHeight: 18 },
  subtle: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontFamily: Fonts.ui },

  bigRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontFamily: Fonts.uiBold, letterSpacing: 0.6, textTransform: 'uppercase' },

  igRow: { flexDirection: 'row', alignItems: 'baseline' },
  igWeeks: { color: '#fff', fontFamily: Fonts.numHeavy, fontSize: 40, lineHeight: 40 },
  igWeeksSuffix: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 18, marginLeft: 2 },
  igDays: { color: '#fff', fontFamily: Fonts.numHeavy, fontSize: 24, marginLeft: 8 },
  igDaysSuffix: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 14 },

  dpp: { color: '#fff', fontFamily: Fonts.numHeavy, fontSize: 18 },

  progressBg: { marginTop: 12, height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', position: 'relative' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#fff', borderRadius: 99 },
  tick: { position: 'absolute', top: -2, width: 2, height: 10, backgroundColor: 'rgba(255,255,255,0.45)' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scaleLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontFamily: Fonts.uiBold },
});
