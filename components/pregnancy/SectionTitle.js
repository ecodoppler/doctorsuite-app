import { View, Text, StyleSheet } from 'react-native';
import { Fonts, Status, Warm } from '../../services/theme';

export default function SectionTitle({ children, action }) {
  return (
    <View style={s.row}>
      <Text style={s.title}>{children}</Text>
      {action ? <Text style={s.action}>{action}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  title: {
    fontSize: 13,
    color: Status.slate,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: Fonts.uiBold,
  },
  action: {
    fontSize: 12,
    color: Warm.accentDeep,
    fontFamily: Fonts.uiSemibold,
  },
});
