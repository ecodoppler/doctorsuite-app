import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../services/theme';

// Cabeçalho de tela para as abas NATIVAS (NativeTabs não fornece header de navegação).
// Inclui a área segura do topo (notch) + título à esquerda + texto opcional à direita
// (ex.: nome da clínica) — reproduz o que o cabeçalho do Tabs fazia antes.
// Quando a tela foi EMPILHADA sobre as abas (router.canGoBack()), mostra um "voltar".
export default function ScreenHeader({ title, right }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canBack = router.canGoBack();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      {canBack ? (
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.back}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
      ) : null}
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      {right ? <Text style={s.right} numberOfLines={1}>{right}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  back: { marginRight: 8, marginLeft: -6 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  right: { fontSize: 11, color: Colors.textMuted, maxWidth: 150, marginLeft: 8 },
});
