export const FINALIZED_TIMELINE_STATUSES = Object.freeze([
  'concluido',
  'finalizado',
  'assinado',
  'registrado',
]);

const FINALIZED_TIMELINE_STATUS_SET = new Set(FINALIZED_TIMELINE_STATUSES);

export function isFinalizedTimelineStatus(status) {
  return FINALIZED_TIMELINE_STATUS_SET.has(status);
}

export function finalizedTimelineReports(reports) {
  if (!Array.isArray(reports)) return [];
  return reports.filter((report) => isFinalizedTimelineStatus(report?.status));
}

export function countFinalizedTimelineReports(reports) {
  return finalizedTimelineReports(reports).length;
}

export function filterProntuarioTimeline(timeline, filter) {
  const items = Array.isArray(timeline) ? timeline : [];
  if (filter === 'all') return items;
  return items.filter(
    (item) => item.type === filter || (filter === 'exame' && item.source === 'report'),
  );
}

// Rótulos amigáveis dos tipos de exame (espelho do web EXAM_TYPES).
// Fallback: "prettify" da chave crua.
const EXAM_TYPES = {
  us_pelvica_tv: 'US Pélvica via Transvaginal',
  us_pelvica_abd: 'US Pélvica via Abdominal',
  us_mamas: 'US Mamas e Prolongamentos Axilares',
  us_obs_1tri_abd: 'US Obstétrica 1º Tri Abdominal',
  us_obs_1tri_tv: 'US Obstétrica 1º Tri Transvaginal',
  us_obstetrica: 'US Obstétrica',
  us_morfo_1tri: 'US Morfológica 1º Tri com Doppler',
  us_morfo_2tri: 'US Morfológica 2º Tri com Doppler',
  doppler_obstetrico: 'Doppler Obstétrico',
  ecocardiografia_fetal: 'Ecocardiografia Fetal',
  perfil_biofisico: 'Perfil Biofísico Fetal',
  colposcopia: 'Colposcopia',
};

function examLabel(type) {
  if (!type) return 'Laudo';
  if (EXAM_TYPES[type]) return EXAM_TYPES[type];
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const DOC_TYPE_LABELS = {
  atestado: 'Atestado Médico',
  declaracao: 'Declaração de Comparecimento',
  encaminhamento: 'Encaminhamento Médico',
  exames: 'Solicitação de Exames',
};

export function buildProntuarioTimeline(data = {}) {
  const items = [];
  const records = data.records || [];
  const appointments = data.appointments || [];
  const reports = data.reports || [];

  // Medical records
  for (const mr of records) {
    let content = {};
    try {
      content = typeof mr.content_json === 'string'
        ? JSON.parse(mr.content_json)
        : mr.content_json || {};
    } catch {}
    const recType = content.record_type || 'consulta';
    items.push({
      source: 'record',
      type: recType === 'procedimento' ? 'procedimento' : 'consulta',
      date: mr.created_at?.slice(0, 10),
      time: mr.created_at?.slice(11, 16),
      title: recType === 'consulta_obstetrica' ? 'Consulta Obstétrica'
        : recType === 'consulta_ginecologica' ? 'Consulta Ginecológica'
        : recType === 'encerramento_gestacao' ? 'Encerramento de Gestação'
        : recType === 'importado' ? 'Registro Importado'
        : recType === 'chat_anexo' ? 'Mensagens do Chat'
        : recType === 'procedimento' ? 'Procedimento'
        : 'Consulta Médica',
      doctor: mr.doctor_name,
      id: mr.id,
      color: '#4f46e5',
      content,
      status: 'registrado',
    });
  }

  // Appointments (skip if linked to a record). Se o agendamento tem laudo vinculado,
  // carrega os pdf_tokens dele pra dar acesso ao PDF (senão o laudo ficaria inacessível).
  // Espelha a web (_buildTimeline): só ENTRA na timeline o appointment que é EXAME com laudo
  // finalizado. Consultas vêm pelos records; agendamentos futuros / sem laudo NÃO aparecem aqui.
  for (const a of appointments) {
    const hasRecord = records.find((record) => record.appointment_id === a.id);
    if (hasRecord) continue;
    const category = a.type_category || a.category;
    if (
      category !== 'exame'
      || !a.report_id
      || !isFinalizedTimelineStatus(a.status)
    ) continue;
    const linkedReport = reports.find((report) => report.id === a.report_id) || null;
    items.push({
      source: 'appointment',
      type: a.type_category || a.category || 'consulta',
      date: a.appointment_date,
      time: a.appointment_time?.slice(0, 5),
      title: a.type_name || (linkedReport ? examLabel(linkedReport.exam_type) : 'Consulta'),
      doctor: a.doctor_name,
      insurance: a.insurance_name,
      status: a.status,
      id: a.id,
      pdfTokens: linkedReport?.pdf_tokens || '',
      hasLaudo: !!linkedReport,
      reportId: linkedReport?.id || null,
      color: a.category === 'exame' ? '#10b981' : '#3b82f6',
    });
  }

  // Reports (standalone) — só finalizados, com nome amigável + pdf_tokens pra abrir o PDF.
  for (const report of finalizedTimelineReports(reports)) {
    const linked = appointments.find((appointment) => appointment.report_id === report.id);
    if (!linked) {
      items.push({
        source: 'report',
        type: 'exame',
        date: report.created_at?.slice(0, 10),
        time: report.created_at?.slice(11, 16),
        title: examLabel(report.exam_type),
        status: report.status,
        id: report.id,
        pdfTokens: report.pdf_tokens || '',
        examType: report.exam_type,
        color: '#0ea5e9',
      });
    }
  }

  // Documentos clínicos assinados (atestado/declaração/encaminhamento/solicitação) — anexa ao
  // atendimento (record) do MESMO DIA; sem record no dia → entra como item próprio.
  const clinicDocs = data.clinic_documents || [];
  for (const doc of clinicDocs) {
    if (!doc?.signed) continue;
    const day = (doc.created_at || '').slice(0, 10);
    const entry = {
      id: doc.id,
      doc_type: doc.doc_type,
      label: DOC_TYPE_LABELS[doc.doc_type] || 'Documento',
      signed: true,
      has_pdf: !!doc.has_pdf,
    };
    const host = items.find((item) => item.source === 'record' && item.date === day);
    if (host) {
      (host.docs = host.docs || []).push(entry);
    } else {
      items.push({
        source: 'document',
        type: 'documento',
        date: day,
        time: (doc.created_at || '').slice(11, 16),
        title: entry.label,
        status: 'assinado',
        id: doc.id,
        color: '#8b5cf6',
        docs: [entry],
      });
    }
  }

  items.sort(
    (a, b) => ((b.date || '') + (b.time || '')).localeCompare(
      (a.date || '') + (a.time || ''),
    ),
  );
  return items;
}
