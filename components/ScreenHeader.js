import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../services/theme';

// Cabeçalho de tela para as abas NATIVAS (NativeTabs não fornece header de navegação).
// Inclui a área segura do topo (notch) + título à esquerda + texto opcional à direita
// (ex.: nome da clínica) — reproduz o que o cabeçalho do Tabs fazia antes.
export default function ScreenHeader({ title, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
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
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  right: { fontSize: 11, color: Colors.textMuted, maxWidth: 150, marginLeft: 8 },
});
