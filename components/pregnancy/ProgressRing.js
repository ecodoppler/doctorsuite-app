import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Warm } from '../../services/theme';

export default function ProgressRing({
  size = 168,
  stroke = 10,
  value = 0,
  max = 280,
  color = Warm.accent,
  track = '#e9ecf6',
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(value, max) / max) * c;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={off}
        />
      </Svg>
      <View style={s.center}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
});
