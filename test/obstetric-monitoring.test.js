import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DELETE_REASONS,
  alertBadge,
  localDateParts,
  localDateTimeToIso,
} from '../services/obstetric-monitoring.js';

test('converte data e hora local sem aceitar datas inválidas', () => {
  assert.equal(localDateTimeToIso('2026-07-30', '08:35') !== null, true);
  assert.equal(localDateTimeToIso('2026-02-30', '08:35'), null);
  assert.equal(localDateTimeToIso('2026-07-30', '25:00'), null);
  assert.deepEqual(localDateParts(new Date(2026, 6, 30, 8, 35)), {
    date: '2026-07-30',
    time: '08:35',
  });
});

test('expõe somente os dois motivos permitidos', () => {
  assert.deepEqual(DELETE_REASONS, {
    typing_error: 'Erro de digitação',
    time_error: 'Erro de horário',
  });
});

test('diferencia atenção de urgência na interface da paciente', () => {
  assert.deepEqual(alertBadge('attention'), { label: 'Atenção', tone: 'attention' });
  assert.deepEqual(alertBadge('urgent'), { label: 'Urgência', tone: 'urgent' });
  assert.equal(alertBadge('normal'), null);
});
