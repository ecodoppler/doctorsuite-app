import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Fonts, Status, Warm } from '../../services/theme';
import {
  formatDecimal,
  linearTicks,
  weightChartDomain,
} from '../../services/prenatal-trends';

const HEIGHT = 190;
const MARGIN = { top: 12, right: 14, bottom: 30, left: 38 };

function linePath(points, x, y, valueKey) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.week).toFixed(1)} ${y(point[valueKey]).toFixed(1)}`)
    .join(' ');
}

function bandPath(points, x, y) {
  if (points.length < 2) return '';
  const upper = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.week).toFixed(1)} ${y(point.maxWeightKg).toFixed(1)}`)
    .join(' ');
  const lower = [...points]
    .reverse()
    .map((point) => `L ${x(point.week).toFixed(1)} ${y(point.minWeightKg).toFixed(1)}`)
    .join(' ');
  return `${upper} ${lower} Z`;
}

export default function WeightTrendChart({ model, width }) {
  const chartWidth = Math.max(240, Number(width) || 280);
  const plotWidth = chartWidth - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const [minWeight, maxWeight] = weightChartDomain(model);
  const ticks = linearTicks([minWeight, maxWeight], 4);
  const x = (week) => MARGIN.left + (Math.max(0, Math.min(40, week)) / 40) * plotWidth;
  const y = (weight) => MARGIN.top + ((maxWeight - weight) / (maxWeight - minWeight)) * plotHeight;
  const points = (model?.points || []).filter((point) => point.week != null);
  const observations = (model?.observations || []).filter((point) => point.week != null);
  const latest = observations[observations.length - 1] || null;
  const xTicks = chartWidth < 340 ? [0, 12, 20, 28, 40] : [0, 12, 20, 28, 36, 40];
  const labelOnRight = latest ? x(latest.week) > chartWidth - 90 : false;

  const accessibleSummary = observations.length
    ? `Curva de peso. Última aferição ${formatDecimal(latest.weightKg)} quilos em ${latest.ig}.`
    : 'Curva de peso sem aferições registradas.';

  return (
    <View>
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={s.measuredSwatch} />
          <Text style={s.legendText}>Peso medido</Text>
        </View>
        {model?.referenceAvailable ? (
          <View style={s.legendItem}>
            <View style={s.bandSwatch} />
            <Text style={s.legendText}>Faixa esperada</Text>
          </View>
        ) : null}
      </View>

      <Svg
        width={chartWidth}
        height={HEIGHT}
        viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
        accessibilityRole="image"
        accessibilityLabel={accessibleSummary}
      >
        {ticks.map((tick) => (
          <G key={tick}>
            <Line
              x1={MARGIN.left}
              y1={y(tick)}
              x2={chartWidth - MARGIN.right}
              y2={y(tick)}
              stroke={Status.borderSoft}
              strokeWidth={1}
            />
            <SvgText
              x={MARGIN.left - 7}
              y={y(tick) + 3.5}
              textAnchor="end"
              fontFamily={Fonts.ui}
              fontSize={9}
              fill={Status.slate}
            >
              {formatDecimal(tick)}
            </SvgText>
          </G>
        ))}

        {model?.referenceAvailable && model.band.length >= 2 ? (
          <Path
            d={bandPath(model.band, x, y)}
            fill="rgba(232,153,118,0.20)"
            stroke="rgba(184,93,63,0.35)"
            strokeWidth={1}
          />
        ) : null}

        {points.length >= 2 ? (
          <Path
            d={linePath(points, x, y, 'weightKg')}
            fill="none"
            stroke={Warm.accentDeep}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((point, index) => (
          <Circle
            key={`${point.kind}-${point.gestationalDays}-${index}`}
            cx={x(point.week)}
            cy={y(point.weightKg)}
            r={point === latest ? 4.5 : 3.2}
            fill="#fff"
            stroke={Warm.accentDeep}
            strokeWidth={point === latest ? 2.5 : 1.8}
          />
        ))}

        {latest ? (
          <SvgText
            x={x(latest.week) + (labelOnRight ? -8 : 8)}
            y={Math.max(MARGIN.top + 10, y(latest.weightKg) - 9)}
            textAnchor={labelOnRight ? 'end' : 'start'}
            fontFamily={Fonts.uiBold}
            fontSize={10}
            fill={Status.ink}
          >
            {formatDecimal(latest.weightKg)} kg
          </SvgText>
        ) : null}

        <Line
          x1={MARGIN.left}
          y1={HEIGHT - MARGIN.bottom}
          x2={chartWidth - MARGIN.right}
          y2={HEIGHT - MARGIN.bottom}
          stroke={Status.border}
          strokeWidth={1}
        />
        {xTicks.map((week) => (
          <SvgText
            key={week}
            x={x(week)}
            y={HEIGHT - 10}
            textAnchor="middle"
            fontFamily={Fonts.ui}
            fontSize={9}
            fill={Status.slate}
          >
            {week === 0 ? 'Pré' : `${week}s`}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  measuredSwatch: {
    width: 16,
    height: 3,
    borderRadius: 99,
    backgroundColor: Warm.accentDeep,
  },
  bandSwatch: {
    width: 16,
    height: 8,
    borderRadius: 3,
    backgroundColor: 'rgba(232,153,118,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(184,93,63,0.35)',
  },
  legendText: {
    fontSize: 9,
    color: Status.slate,
    fontFamily: Fonts.ui,
  },
});
