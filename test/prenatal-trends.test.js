import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPrenatalTrendModels,
  parseGestationalDays,
  pressureChartDomain,
  sortVisitsByGestation,
  weightChartDomain,
} from '../services/prenatal-trends.js';

const trends = {
  weight: {
    applicable: true,
    unavailableReason: null,
    reference: { id: 'br-ms-gpg-2022', label: 'Ministério da Saúde 2022' },
    prePregnancyBmi: 22.7,
    category: 'eutrofica',
    totalGainRangeKg: { min: 8, max: 12 },
    weeklyGainRangeKg: [
      { week: 10, min: -2.4, max: 0 },
      { week: 21, min: 0.8, max: 3.6 },
      { week: 40, min: 8, max: 12 },
    ],
    latest: {
      measuredAt: '2026-07-23',
      gestationalDays: 147,
      weightKg: 65.3,
      gainKg: 2.8,
      expectedGainKg: { min: 0.8, max: 3.6 },
      status: 'adequado',
    },
  },
  bloodPressure: {
    thresholds: { systolicAttention: 130, diastolicAttention: 90 },
    latest: {
      measuredAt: '2026-07-23',
      gestationalDays: 147,
      systolic: 116,
      diastolic: 74,
      status: 'estavel',
    },
  },
};

const visits = [
  {
    date: '23/07/2026',
    ig: '21s 0d',
    igTotalDays: 147,
    weight: 65.3,
    paSis: 116,
    paDia: 74,
  },
  {
    date: '04/06/2026',
    ig: '14s 0d',
    igTotalDays: 98,
    weight: 62.8,
    paSis: 110,
    paDia: 70,
  },
  {
    date: '02/07/2026',
    ig: '18s 0d',
    igTotalDays: 126,
    weight: 64.1,
    paSis: 112,
    paDia: 72,
  },
];

test('ordena consultas por idade gestacional e usa o texto de IG como fallback', () => {
  assert.equal(parseGestationalDays('21s 3d'), 150);
  assert.equal(parseGestationalDays('inválida'), null);

  const ordered = sortVisitsByGestation([
    { ig: '18s 0d' },
    { igTotalDays: 98, ig: '14s 0d' },
    { ig: 'inválida' },
  ]);
  assert.deepEqual(ordered.map((item) => item.gestationalDays), [98, 126]);
});

test('normaliza a curva de peso da fixture e converte ganho esperado em peso absoluto', () => {
  const models = buildPrenatalTrendModels({
    patient: { weightPre: 62.5, weightNow: 65.3 },
    pregnancy: { trends },
    visits,
  });

  assert.deepEqual(models.weight.observations.map((point) => point.week), [14, 18, 21]);
  assert.equal(models.weight.points[0].kind, 'pre');
  assert.equal(models.weight.points[0].weightKg, 62.5);
  assert.equal(models.weight.latest.weightKg, 65.3);
  assert.equal(models.weight.gainKg, 2.8);
  assert.equal(models.weight.categoryLabel, 'Eutrófica');
  assert.deepEqual(models.weight.totalGainRangeKg, { min: 8, max: 12 });
  assert.equal(models.weight.status, 'adequado');

  const week21 = models.weight.band.find((point) => point.week === 21);
  assert.ok(Math.abs(week21.minWeightKg - 63.3) < 0.0001);
  assert.ok(Math.abs(week21.maxWeightKg - 66.1) < 0.0001);
});

test('usa cortes inclusivos de PAS 130 ou PAD 90 e ignora medidas incompletas', () => {
  const models = buildPrenatalTrendModels({
    pregnancy: {
      trends: {
        bloodPressure: {
          thresholds: { systolicAttention: 130, diastolicAttention: 90 },
          latest: {
            gestationalDays: 84,
            systolic: 129,
            diastolic: 90,
            status: 'atencao',
          },
        },
      },
    },
    visits: [
      { igTotalDays: 70, ig: '10s 0d', paSis: 129, paDia: 89 },
      { igTotalDays: 77, ig: '11s 0d', paSis: 130, paDia: 89 },
      { igTotalDays: 84, ig: '12s 0d', paSis: 129, paDia: 90 },
      { igTotalDays: 91, ig: '13s 0d', paSis: 135, paDia: null },
    ],
  });

  assert.deepEqual(models.bloodPressure.points.map((point) => point.attention), [
    false,
    true,
    true,
  ]);
  assert.equal(models.bloodPressure.points.length, 3);
  assert.equal(models.bloodPressure.status, 'atencao');
  assert.equal(Object.hasOwn(models.bloodPressure, 'average'), false);
  assert.equal(Object.hasOwn(models.bloodPressure, 'pam'), false);
});

test('sem pregnancy.trends mantém observações e remove referências clínicas legadas', () => {
  const models = buildPrenatalTrendModels({
    patient: { weightPre: 62.5, weightNow: 65.3 },
    pregnancy: {
      weightExpected: { label: '11.5–16 kg' },
      paAlert: { status: 'estavel', label: 'Estável' },
    },
    visits,
  });

  assert.equal(models.weight.referenceAvailable, false);
  assert.equal(models.weight.band.length, 0);
  assert.equal(models.weight.status, null);
  assert.equal(models.weight.statusLabel, 'Referência temporariamente indisponível');
  assert.equal(models.bloodPressure.referenceAvailable, false);
  assert.equal(models.bloodPressure.status, null);
  assert.equal(models.bloodPressure.statusLabel, 'Referência temporariamente indisponível');
  assert.equal(models.bloodPressure.points.length, 3);
});

test('domínios preservam escalas clínicas e expandem apenas para valores externos', () => {
  assert.deepEqual(pressureChartDomain([110, 116, 130], 'systolic'), [90, 150]);
  assert.deepEqual(pressureChartDomain([70, 74, 90], 'diastolic'), [50, 100]);
  assert.deepEqual(pressureChartDomain([82, 166], 'systolic'), [70, 180]);

  const models = buildPrenatalTrendModels({
    patient: { weightPre: 62.5 },
    pregnancy: { trends },
    visits,
  });
  const [min, max] = weightChartDomain(models.weight);
  assert.ok(min <= 60);
  assert.ok(max >= 76);
});
