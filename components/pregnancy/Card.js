import { View, StyleSheet } from 'react-native';
import { Status } from '../../services/theme';

export default function Card({ children, padding = 16, style }) {
  return (
    <View style={[s.card, { padding }, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Status.borderSoft,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
});
