import { View, Text, StyleSheet } from 'react-native';
import { Fonts, Status } from '../../services/theme';

const MAP = {
  habitual: { label: 'Risco habitual', dot: Status.info, bg: Status.infoSoft, tx: '#075985' },
  alto:     { label: 'Alto risco',     dot: Status.warn, bg: Status.warnSoft, tx: '#991b1b' },
};

export default function RiskBadge({ level = 'habitual', compact = false }) {
  const m = MAP[level] || MAP.habitual;
  return (
    <View style={[s.pill, { backgroundColor: m.bg, paddingVertical: compact ? 3 : 4, paddingHorizontal: compact ? 8 : 10 }]}>
      <View style={[s.dot, { backgroundColor: m.dot }]} />
      <Text style={[s.label, { color: m.tx, fontSize: compact ? 11 : 12 }]}>{m.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 99 },
  label: { fontFamily: Fonts.uiSemibold, letterSpacing: 0.1 },
});
