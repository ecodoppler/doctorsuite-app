import Svg, {
  Circle, G, Line, Path, Rect, Text as SvgText,
} from 'react-native-svg';
import { Fonts, Status, Warm } from '../../services/theme';
import {
  formatDecimal,
  pressureChartDomain,
} from '../../services/prenatal-trends';

const HEIGHT = 254;
const MARGIN = { left: 58, right: 14 };
const PANEL_HEIGHT = 78;
const SYS_TOP = 24;
const DIA_TOP = 132;

function linePath(points, x, y, valueKey) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.week).toFixed(1)} ${y(point[valueKey]).toFixed(1)}`)
    .join(' ');
}

function gestationalDomain(points) {
  if (!points.length) return [0, 40];
  const first = points[0].week;
  const last = points[points.length - 1].week;
  if (first === last) {
    return [Math.max(0, first - 3), Math.min(42, first + 3)];
  }
  let min = Math.max(0, Math.floor(first) - 1);
  let max = Math.min(42, Math.ceil(last) + 1);
  if (max - min < 6) {
    const middle = (min + max) / 2;
    min = Math.max(0, middle - 3);
    max = Math.min(42, middle + 3);
  }
  return [min, max];
}

function xTickPoints(points, maxTicks) {
  if (points.length <= maxTicks) return points;
  const indexes = maxTicks === 3
    ? [0, Math.floor((points.length - 1) / 2), points.length - 1]
    : [0, Math.floor((points.length - 1) / 3), Math.floor(((points.length - 1) * 2) / 3), points.length - 1];
  return indexes.map((index) => points[index]);
}

function PressurePanel({
  points,
  valueKey,
  label,
  top,
  domain,
  threshold,
  color,
  x,
  width,
}) {
  const [min, max] = domain;
  const y = (value) => top + ((max - value) / (max - min)) * PANEL_HEIGHT;
  const latest = points[points.length - 1] || null;
  const thresholdY = threshold == null ? null : y(threshold);
  const labelOnRight = latest ? x(latest.week) > width - 70 : false;

  return (
    <G>
      <SvgText
        x={8}
        y={top + 10}
        fontFamily={Fonts.uiBold}
        fontSize={10}
        fill={Status.ink}
      >
        {label}
      </SvgText>
      <SvgText
        x={8}
        y={top + 23}
        fontFamily={Fonts.ui}
        fontSize={8}
        fill={Status.slate}
      >
        mmHg
      </SvgText>

      {[min, max].map((tick) => (
        <G key={`${label}-${tick}`}>
          <Line
            x1={MARGIN.left}
            y1={y(tick)}
            x2={width - MARGIN.right}
            y2={y(tick)}
            stroke={Status.borderSoft}
            strokeWidth={1}
          />
          <SvgText
            x={MARGIN.left - 6}
            y={y(tick) + 3}
            textAnchor="end"
            fontFamily={Fonts.ui}
            fontSize={8}
            fill={Status.slate}
          >
            {formatDecimal(tick, 0)}
          </SvgText>
        </G>
      ))}

      {thresholdY != null ? (
        <G>
          <Line
            x1={MARGIN.left}
            y1={thresholdY}
            x2={width - MARGIN.right}
            y2={thresholdY}
            stroke={Status.attn}
            strokeWidth={1.2}
            strokeDasharray="5 4"
          />
          <SvgText
            x={width - MARGIN.right}
            y={thresholdY - 4}
            textAnchor="end"
            fontFamily={Fonts.uiBold}
            fontSize={8}
            fill={Status.attn}
          >
            corte {formatDecimal(threshold, 0)}
          </SvgText>
        </G>
      ) : null}

      {points.length >= 2 ? (
        <Path
          d={linePath(points, x, y, valueKey)}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {points.map((point, index) => {
        const value = point[valueKey];
        const reachedThreshold = threshold != null && value >= threshold;
        if (reachedThreshold) {
          return (
            <G key={`${label}-${point.gestationalDays}-${index}`}>
              <Rect
                x={x(point.week) - 4}
                y={y(value) - 4}
                width={8}
                height={8}
                rx={1}
                fill={Status.attn}
                transform={`rotate(45 ${x(point.week)} ${y(value)})`}
              />
              <SvgText
                x={x(point.week)}
                y={y(value) + 3}
                textAnchor="middle"
                fontFamily={Fonts.uiBold}
                fontSize={7}
                fill="#fff"
              >
                !
              </SvgText>
            </G>
          );
        }
        return (
          <Circle
            key={`${label}-${point.gestationalDays}-${index}`}
            cx={x(point.week)}
            cy={y(value)}
            r={point === latest ? 4.3 : 3}
            fill="#fff"
            stroke={color}
            strokeWidth={point === latest ? 2.4 : 1.7}
          />
        );
      })}

      {latest ? (
        <SvgText
          x={x(latest.week) + (labelOnRight ? -8 : 8)}
          y={Math.max(top + 10, y(latest[valueKey]) - 8)}
          textAnchor={labelOnRight ? 'end' : 'start'}
          fontFamily={Fonts.uiBold}
          fontSize={10}
          fill={Status.ink}
        >
          {formatDecimal(latest[valueKey], 0)}
        </SvgText>
      ) : null}
    </G>
  );
}

export default function BloodPressureTrendChart({ model, width }) {
  const chartWidth = Math.max(240, Number(width) || 280);
  const points = model?.points || [];
  const [minWeek, maxWeek] = gestationalDomain(points);
  const plotWidth = chartWidth - MARGIN.left - MARGIN.right;
  const x = (week) => MARGIN.left + ((week - minWeek) / (maxWeek - minWeek)) * plotWidth;
  const sysDomain = pressureChartDomain(points.map((point) => point.systolic), 'systolic');
  const diaDomain = pressureChartDomain(points.map((point) => point.diastolic), 'diastolic');
  const thresholdSys = model?.thresholds?.systolicAttention ?? null;
  const thresholdDia = model?.thresholds?.diastolicAttention ?? null;
  const tickPoints = xTickPoints(points, chartWidth < 340 ? 3 : 4);
  const latest = points[points.length - 1] || null;
  const attentionCount = points.filter((point) => point.attention === true).length;
  const accessibleSummary = latest
    ? `Curvas de pressão arterial. Última aferição ${latest.systolic} por ${latest.diastolic} milímetros de mercúrio em ${latest.ig}. ${attentionCount} aferições atingiram o corte de atenção.`
    : 'Curvas de pressão arterial sem aferições registradas.';

  return (
    <Svg
      width={chartWidth}
      height={HEIGHT}
      viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
      accessibilityRole="image"
      accessibilityLabel={accessibleSummary}
    >
      <PressurePanel
        points={points}
        valueKey="systolic"
        label="PAS"
        top={SYS_TOP}
        domain={sysDomain}
        threshold={thresholdSys}
        color={Warm.rose}
        x={x}
        width={chartWidth}
      />
      <Line
        x1={8}
        y1={119}
        x2={chartWidth - MARGIN.right}
        y2={119}
        stroke={Status.borderSoft}
        strokeWidth={1}
      />
      <PressurePanel
        points={points}
        valueKey="diastolic"
        label="PAD"
        top={DIA_TOP}
        domain={diaDomain}
        threshold={thresholdDia}
        color={Warm.accentDeep}
        x={x}
        width={chartWidth}
      />

      <Line
        x1={MARGIN.left}
        y1={HEIGHT - 27}
        x2={chartWidth - MARGIN.right}
        y2={HEIGHT - 27}
        stroke={Status.border}
        strokeWidth={1}
      />
      {tickPoints.map((point, index) => (
        <SvgText
          key={`${point.gestationalDays}-${index}`}
          x={x(point.week)}
          y={HEIGHT - 9}
          textAnchor="middle"
          fontFamily={Fonts.ui}
          fontSize={9}
          fill={Status.slate}
        >
          {`${Math.floor(point.week)}s`}
        </SvgText>
      ))}
    </Svg>
  );
}
