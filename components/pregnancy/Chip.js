import { View, Text, StyleSheet } from 'react-native';
import { Fonts, Status } from '../../services/theme';

export default function Chip({ label, value, soft = '#ffffff' }) {
  return (
    <View style={[s.chip, { backgroundColor: soft }]}>
      <Text style={s.label} numberOfLines={1}>{label}</Text>
      <Text style={s.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  label: {
    fontSize: 10,
    color: Status.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Fonts.uiSemibold,
  },
  value: {
    fontSize: 14,
    color: Status.ink,
    fontFamily: Fonts.num,
    marginTop: 2,
  },
});
