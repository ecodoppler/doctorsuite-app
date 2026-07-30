import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FINALIZED_TIMELINE_STATUSES,
  buildProntuarioTimeline,
  countFinalizedTimelineReports,
  filterProntuarioTimeline,
  isFinalizedTimelineStatus,
} from '../services/prontuario-timeline.js';

test('considera somente os quatro estados finais usados pelo prontuário web', () => {
  assert.deepEqual(FINALIZED_TIMELINE_STATUSES, [
    'concluido',
    'finalizado',
    'assinado',
    'registrado',
  ]);

  for (const status of FINALIZED_TIMELINE_STATUSES) {
    assert.equal(isFinalizedTimelineStatus(status), true, status);
  }

  for (const status of ['rascunho', 'em_analise', 'edicao_livre', 'final', '', null, undefined]) {
    assert.equal(isFinalizedTimelineStatus(status), false, String(status));
  }
});

test('remove rascunhos da timeline e do contador sem duplicar laudo vinculado', () => {
  const data = {
    records: [{
      id: 'record-1',
      appointment_id: 'consultation-1',
      created_at: '2026-07-30T14:06:00',
      doctor_name: 'Dra. Teste',
      content_json: JSON.stringify({ record_type: 'consulta_obstetrica' }),
    }],
    appointments: [{
      id: 'appointment-final',
      category: 'exame',
      status: 'finalizado',
      report_id: 'report-linked',
      appointment_date: '2026-07-29',
      appointment_time: '13:30:00',
      type_name: 'US Obstétrica',
    }],
    reports: [
      {
        id: 'report-final',
        status: 'finalizado',
        exam_type: 'us_obs_1tri_tv',
        created_at: '2026-07-30T14:08:00',
      },
      {
        id: 'report-linked',
        status: 'assinado',
        exam_type: 'us_obstetrica',
        created_at: '2026-07-29T13:30:00',
      },
      {
        id: 'report-draft',
        status: 'rascunho',
        exam_type: 'us_mamas',
        created_at: '2026-07-30T15:00:00',
      },
      {
        id: 'report-analysis',
        status: 'em_analise',
        exam_type: 'colposcopia',
        created_at: '2026-07-30T16:00:00',
      },
      {
        id: 'report-free-edit',
        status: 'edicao_livre',
        exam_type: 'us_pelvica_tv',
        created_at: '2026-07-30T17:00:00',
      },
      {
        id: 'report-unknown',
        status: 'desconhecido',
        exam_type: 'us_pelvica_abd',
        created_at: '2026-07-30T18:00:00',
      },
    ],
    clinic_documents: [
      {
        id: 'doc-signed-attached',
        doc_type: 'atestado',
        signed: true,
        has_pdf: true,
        created_at: '2026-07-30T14:10:00',
      },
      {
        id: 'doc-draft-attached',
        doc_type: 'declaracao',
        signed: false,
        has_pdf: false,
        created_at: '2026-07-30T14:11:00',
      },
      {
        id: 'doc-signed-standalone',
        doc_type: 'encaminhamento',
        signed: true,
        has_pdf: true,
        created_at: '2026-07-28T10:00:00',
      },
      {
        id: 'doc-draft-standalone',
        doc_type: 'exames',
        signed: false,
        has_pdf: false,
        created_at: '2026-07-27T10:00:00',
      },
    ],
  };

  const timeline = buildProntuarioTimeline(data);
  const ids = timeline.map((item) => item.id);

  assert.equal(countFinalizedTimelineReports(data.reports), 2);
  assert.deepEqual(ids, [
    'report-final',
    'record-1',
    'appointment-final',
    'doc-signed-standalone',
  ]);
  assert.equal(ids.includes('report-linked'), false);
  assert.equal(ids.includes('report-draft'), false);
  assert.equal(ids.includes('report-analysis'), false);
  assert.equal(ids.includes('report-free-edit'), false);
  assert.equal(ids.includes('report-unknown'), false);
  assert.equal(ids.includes('doc-draft-standalone'), false);

  const record = timeline.find((item) => item.id === 'record-1');
  assert.deepEqual(record.docs.map((doc) => doc.id), ['doc-signed-attached']);
});

test('mantém os filtros operando sobre a timeline já sanitizada', () => {
  const timeline = buildProntuarioTimeline({
    records: [{
      id: 'record-1',
      created_at: '2026-07-30T10:00:00',
      content_json: { record_type: 'consulta' },
    }],
    appointments: [{
      id: 'appointment-1',
      category: 'exame',
      status: 'registrado',
      report_id: 'report-linked',
      appointment_date: '2026-07-29',
      appointment_time: '09:00:00',
    }],
    reports: [
      {
        id: 'report-linked',
        status: 'assinado',
        created_at: '2026-07-29T09:00:00',
      },
      {
        id: 'report-standalone',
        status: 'concluido',
        created_at: '2026-07-28T08:00:00',
      },
      {
        id: 'report-draft',
        status: 'rascunho',
        created_at: '2026-07-31T08:00:00',
      },
    ],
  });

  assert.equal(filterProntuarioTimeline(timeline, 'all').length, 3);
  assert.deepEqual(
    filterProntuarioTimeline(timeline, 'consulta').map((item) => item.id),
    ['record-1'],
  );
  assert.deepEqual(
    filterProntuarioTimeline(timeline, 'exame').map((item) => item.id),
    ['appointment-1', 'report-standalone'],
  );
});

test('retorna estado vazio quando a API fornece apenas rascunhos', () => {
  const timeline = buildProntuarioTimeline({
    reports: [
      { id: 'draft-1', status: 'rascunho', created_at: '2026-07-30T10:00:00' },
      { id: 'draft-2', status: 'em_analise', created_at: '2026-07-30T11:00:00' },
      { id: 'draft-3', status: 'edicao_livre', created_at: '2026-07-30T12:00:00' },
    ],
    clinic_documents: [{
      id: 'doc-draft',
      signed: false,
      created_at: '2026-07-30T13:00:00',
    }],
  });

  assert.deepEqual(timeline, []);
  assert.deepEqual(filterProntuarioTimeline(timeline, 'all'), []);
  assert.deepEqual(filterProntuarioTimeline(timeline, 'exame'), []);
});
