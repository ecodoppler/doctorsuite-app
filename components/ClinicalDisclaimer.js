import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Aviso clínico padrão (App Store 2.1 / CFM): conteúdo do app é informativo e não substitui
// a avaliação médica. Autossuficiente (não depende do tema da tela) — cor neutra discreta.
export default function ClinicalDisclaimer({ text }) {
  return (
    <View style={s.box}>
      <Ionicons name="information-circle-outline" size={15} color="#94a3b8" style={{ marginTop: 1 }} />
      <Text style={s.txt}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  txt: { flex: 1, fontSize: 11, lineHeight: 16, color: '#94a3b8' },
});
