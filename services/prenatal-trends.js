const WEIGHT_STATUS_LABELS = Object.freeze({
  abaixo: 'Abaixo da faixa nesta semana',
  adequado: 'Dentro da faixa nesta semana',
  acima: 'Acima da faixa nesta semana',
  indisponivel: 'Referência temporariamente indisponível',
});

const BMI_CATEGORY_LABELS = Object.freeze({
  baixo_peso: 'Baixo peso',
  eutrofica: 'Eutrófica',
  sobrepeso: 'Sobrepeso',
  obesidade: 'Obesidade',
});

const BP_STATUS_LABELS = Object.freeze({
  estavel: 'Última aferição abaixo do corte',
  atencao: 'Atenção: última aferição atingiu o corte',
  indisponivel: 'Referência temporariamente indisponível',
});

export function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGestationalDays(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/(\d+)\s*s(?:\s*(\d+)\s*d)?/i);
  if (!match) return null;
  const weeks = Number(match[1]);
  const days = Number(match[2] || 0);
  if (!Number.isFinite(weeks) || !Number.isFinite(days) || days < 0 || days > 6) return null;
  return weeks * 7 + days;
}

export function gestationalDaysForVisit(visit) {
  const explicit = finiteNumber(visit?.igTotalDays);
  if (explicit != null && explicit >= 0) return explicit;
  return parseGestationalDays(visit?.ig);
}

export function formatGestationalAge(totalDays) {
  const value = finiteNumber(totalDays);
  if (value == null || value < 0) return '—';
  const wholeDays = Math.floor(value);
  return `${Math.floor(wholeDays / 7)}s ${wholeDays % 7}d`;
}

export function formatDecimal(value, maximumDigits = 1) {
  const parsed = finiteNumber(value);
  if (parsed == null) return '—';
  const fixed = parsed.toFixed(maximumDigits);
  return fixed
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')
    .replace('.', ',');
}

export function sortVisitsByGestation(visits) {
  if (!Array.isArray(visits)) return [];
  return visits
    .map((visit, index) => ({
      visit,
      index,
      gestationalDays: gestationalDaysForVisit(visit),
    }))
    .filter((item) => item.gestationalDays != null)
    .sort((a, b) => {
      if (a.gestationalDays !== b.gestationalDays) {
        return a.gestationalDays - b.gestationalDays;
      }
      return a.index - b.index;
    });
}

function sameMeasurement(point, candidate, valueKeys) {
  if (!point || !candidate) return false;
  if (point.gestationalDays !== candidate.gestationalDays) return false;
  return valueKeys.every((key) => point[key] === candidate[key]);
}

function normalizedWeightBand(weightTrend, weightPre) {
  if (weightTrend?.applicable !== true || weightPre == null) return [];
  if (!Array.isArray(weightTrend.weeklyGainRangeKg)) return [];

  return weightTrend.weeklyGainRangeKg
    .map((range) => {
      const week = finiteNumber(range?.week);
      const minGainKg = finiteNumber(range?.min);
      const maxGainKg = finiteNumber(range?.max);
      if (
        week == null || week < 0 || week > 40
        || minGainKg == null || maxGainKg == null
        || minGainKg > maxGainKg
      ) return null;
      return {
        week,
        minGainKg,
        maxGainKg,
        minWeightKg: weightPre + minGainKg,
        maxWeightKg: weightPre + maxGainKg,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.week - b.week);
}

function normalizeWeight(patient, weightTrend, orderedVisits) {
  const weightPre = finiteNumber(patient?.weightPre);
  const observations = orderedVisits
    .map(({ visit, gestationalDays }) => {
      const weightKg = finiteNumber(visit?.weight);
      if (weightKg == null) return null;
      return {
        kind: 'visit',
        gestationalDays,
        week: gestationalDays / 7,
        weightKg,
        date: visit?.date || null,
        ig: visit?.ig || formatGestationalAge(gestationalDays),
      };
    })
    .filter(Boolean);

  const latestFromApi = weightTrend?.latest;
  const apiLatestWeight = finiteNumber(latestFromApi?.weightKg);
  const apiLatestDays = finiteNumber(latestFromApi?.gestationalDays);
  if (apiLatestWeight != null && apiLatestDays != null && apiLatestDays >= 0) {
    const candidate = {
      kind: 'visit',
      gestationalDays: apiLatestDays,
      week: apiLatestDays / 7,
      weightKg: apiLatestWeight,
      date: latestFromApi?.measuredAt || null,
      ig: formatGestationalAge(apiLatestDays),
    };
    if (!observations.some((point) => sameMeasurement(point, candidate, ['weightKg']))) {
      observations.push(candidate);
      observations.sort((a, b) => a.gestationalDays - b.gestationalDays);
    }
  }

  const baseline = weightPre == null ? [] : [{
    kind: 'pre',
    gestationalDays: 0,
    week: 0,
    weightKg: weightPre,
    date: null,
    ig: 'Pré',
  }];
  const points = [...baseline, ...observations];
  const latestObservation = observations[observations.length - 1] || null;
  const fallbackWeight = finiteNumber(patient?.weightNow);
  const latest = latestObservation || (fallbackWeight == null ? null : {
    kind: 'current',
    gestationalDays: null,
    week: null,
    weightKg: fallbackWeight,
    date: null,
    ig: '—',
  });

  const band = normalizedWeightBand(weightTrend, weightPre);
  const totalMin = finiteNumber(weightTrend?.totalGainRangeKg?.min);
  const totalMax = finiteNumber(weightTrend?.totalGainRangeKg?.max);
  const status = typeof latestFromApi?.status === 'string' ? latestFromApi.status : null;
  const apiGain = finiteNumber(latestFromApi?.gainKg);
  const calculatedGain = latest?.weightKg != null && weightPre != null
    ? latest.weightKg - weightPre
    : null;

  return {
    points,
    observations,
    latest,
    weightPre,
    gainKg: apiGain ?? calculatedGain,
    band,
    referenceAvailable: weightTrend?.applicable === true && band.length >= 2,
    unavailableReason: weightTrend?.unavailableReason || null,
    referenceLabel: weightTrend?.reference?.label || null,
    bmi: finiteNumber(weightTrend?.prePregnancyBmi),
    category: weightTrend?.category || null,
    categoryLabel: BMI_CATEGORY_LABELS[weightTrend?.category] || null,
    totalGainRangeKg: totalMin != null && totalMax != null && totalMin <= totalMax
      ? { min: totalMin, max: totalMax }
      : null,
    status,
    statusLabel: WEIGHT_STATUS_LABELS[status]
      || (weightTrend?.applicable === true ? null : WEIGHT_STATUS_LABELS.indisponivel),
  };
}

function normalizeBloodPressure(bpTrend, orderedVisits) {
  const systolicAttention = finiteNumber(bpTrend?.thresholds?.systolicAttention);
  const diastolicAttention = finiteNumber(bpTrend?.thresholds?.diastolicAttention);
  const thresholdsAvailable = systolicAttention != null && diastolicAttention != null;

  const points = orderedVisits
    .map(({ visit, gestationalDays }) => {
      const systolic = finiteNumber(visit?.paSis);
      const diastolic = finiteNumber(visit?.paDia);
      if (systolic == null || diastolic == null) return null;
      return {
        gestationalDays,
        week: gestationalDays / 7,
        systolic,
        diastolic,
        date: visit?.date || null,
        ig: visit?.ig || formatGestationalAge(gestationalDays),
        attention: thresholdsAvailable
          ? systolic >= systolicAttention || diastolic >= diastolicAttention
          : null,
      };
    })
    .filter(Boolean);

  const latestFromApi = bpTrend?.latest;
  const apiLatestDays = finiteNumber(latestFromApi?.gestationalDays);
  const apiLatestSystolic = finiteNumber(latestFromApi?.systolic);
  const apiLatestDiastolic = finiteNumber(latestFromApi?.diastolic);
  if (
    apiLatestDays != null && apiLatestDays >= 0
    && apiLatestSystolic != null && apiLatestDiastolic != null
  ) {
    const candidate = {
      gestationalDays: apiLatestDays,
      week: apiLatestDays / 7,
      systolic: apiLatestSystolic,
      diastolic: apiLatestDiastolic,
      date: latestFromApi?.measuredAt || null,
      ig: formatGestationalAge(apiLatestDays),
      attention: thresholdsAvailable
        ? apiLatestSystolic >= systolicAttention || apiLatestDiastolic >= diastolicAttention
        : null,
    };
    if (!points.some((point) => sameMeasurement(point, candidate, ['systolic', 'diastolic']))) {
      points.push(candidate);
      points.sort((a, b) => a.gestationalDays - b.gestationalDays);
    }
  }

  const latest = points[points.length - 1] || null;
  const status = typeof latestFromApi?.status === 'string' ? latestFromApi.status : null;

  return {
    points,
    latest,
    thresholds: thresholdsAvailable
      ? { systolicAttention, diastolicAttention }
      : null,
    referenceAvailable: thresholdsAvailable,
    status,
    statusLabel: BP_STATUS_LABELS[status]
      || (thresholdsAvailable ? null : BP_STATUS_LABELS.indisponivel),
  };
}

export function buildPrenatalTrendModels({ patient = {}, pregnancy = {}, visits = [] } = {}) {
  const orderedVisits = sortVisitsByGestation(visits);
  const trends = pregnancy?.trends || {};
  return {
    weight: normalizeWeight(patient, trends?.weight, orderedVisits),
    bloodPressure: normalizeBloodPressure(trends?.bloodPressure, orderedVisits),
  };
}

export function weightChartDomain(weightModel) {
  const values = [
    ...(weightModel?.points || []).map((point) => point.weightKg),
    ...(weightModel?.band || []).flatMap((point) => [point.minWeightKg, point.maxWeightKg]),
  ].map(finiteNumber).filter((value) => value != null);

  if (!values.length) return [0, 10];

  let min = Math.min(...values);
  let max = Math.max(...values);
  const span = Math.max(4, max - min);
  const padding = Math.max(1, span * 0.08);
  min -= padding;
  max += padding;

  if (max - min < 6) {
    const middle = (max + min) / 2;
    min = middle - 3;
    max = middle + 3;
  }

  return [
    Math.floor(min / 2) * 2,
    Math.ceil(max / 2) * 2,
  ];
}

export function pressureChartDomain(values, kind) {
  const base = kind === 'diastolic' ? [50, 100] : [90, 150];
  const valid = (Array.isArray(values) ? values : [])
    .map(finiteNumber)
    .filter((value) => value != null);
  if (!valid.length) return base;

  const observedMin = Math.min(...valid);
  const observedMax = Math.max(...valid);
  const min = observedMin < base[0]
    ? Math.floor((observedMin - 5) / 10) * 10
    : base[0];
  const max = observedMax > base[1]
    ? Math.ceil((observedMax + 5) / 10) * 10
    : base[1];
  return [min, max];
}

export function linearTicks([min, max], segments = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  return Array.from({ length: segments + 1 }, (_, index) => (
    min + ((max - min) * index) / segments
  ));
}
