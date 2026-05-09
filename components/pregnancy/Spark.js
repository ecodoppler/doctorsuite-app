import Svg, { Path, Circle } from 'react-native-svg';
import { Warm } from '../../services/theme';

// Sparkline SVG. data = array de números. fill='transparent' desativa área.
export default function Spark({
  data,
  width = 280,
  height = 64,
  color = Warm.accent,
  fill = 'rgba(232,153,118,0.22)',
  dots = true,
}) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(0.0001, max - min);
  const padX = 4, padY = 8;
  const px = (i) => (i / (data.length - 1)) * (width - padX * 2) + padX;
  const py = (v) => height - padY - ((v - min) / span) * (height - padY * 2);

  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${px(data.length - 1)} ${height} L ${px(0)} ${height} Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill !== 'transparent' && <Path d={area} fill={fill} />}
      <Path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {dots && data.map((v, i) => (
        <Circle key={i} cx={px(i)} cy={py(v)} r={2.5} fill="#fff" stroke={color} strokeWidth={1.5} />
      ))}
    </Svg>
  );
}
