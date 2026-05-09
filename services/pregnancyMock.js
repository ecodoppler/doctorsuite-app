// Mock para o Cartão da Gestante. Substituir por GET /api/pregnancy/me quando o
// backend expor o módulo. Shape inicial baseado no design/data.jsx.

export const PATIENT = {
  name: 'Ana Paula V. H. Nunes',
  initials: 'AP',
  age: 32,
  blood: 'A+',
  weightPre: 62.0,
  weightNow: 70.4,
  risk: 'baixo',
  comorbidades: ['Sem comorbidades crônicas', 'Asma leve em remissão (desde 2018)'],
  intercorrencias: [
    { ig: '26s 4d', desc: 'Pirose persistente — iniciado omeprazol' },
    { ig: '28s 2d', desc: 'Hemorroida externa — orientações de higiene' },
  ],
  maternity: {
    name: 'Hospital Mater Vitta',
    address: 'Av. NS-1, Quadra 103 Norte — Palmas, TO',
    phone: '(63) 3215-4000',
    distance: '4,2 km',
  },
};

export const ALERTS = [
  { icon: '🩸', title: 'Sangramento vaginal',      detail: 'De qualquer quantidade ou cor.' },
  { icon: '💧', title: 'Perda de líquido',         detail: 'Líquido claro, esverdeado ou com odor.' },
  { icon: '⚡', title: 'Dor de cabeça forte',      detail: 'Que não passa, com visão turva ou pontos brilhantes.' },
  { icon: '🤰', title: 'Contrações regulares',     detail: '4 em 20 min ou 8 em 1 h, antes de 37 semanas.' },
  { icon: '👶', title: 'Diminuição de movimentos', detail: 'Bebê parado ou se mexendo menos que o habitual.' },
  { icon: '🌡️', title: 'Febre ≥ 38 °C',            detail: 'Persistente, com ou sem outros sintomas.' },
];

export const BIRTH_PLAN = {
  preference: 'Parto normal',
  pain: 'Aceita analgesia se desejar no momento',
  companion: 'Esposo (Eduardo Nunes)',
  contact: 'Pele a pele imediato + clampeamento oportuno',
  feeding: 'Aleitamento materno exclusivo',
  notes: 'Prefere ambiente com luz baixa e música. Aberta a episiotomia se houver indicação.',
};

export const VISITS = [
  { date: '12/11/2025', ig: '6s 0d',  weight: 62.5, pa: '110/70', bcf: null },
  { date: '10/12/2025', ig: '10s 0d', weight: 63.4, pa: '108/68', bcf: 158 },
  { date: '14/01/2026', ig: '14s 4d', weight: 64.8, pa: '112/70', bcf: 152 },
  { date: '11/02/2026', ig: '18s 4d', weight: 66.1, pa: '110/72', bcf: 148 },
  { date: '11/03/2026', ig: '22s 4d', weight: 67.3, pa: '114/74', bcf: 144 },
  { date: '08/04/2026', ig: '26s 4d', weight: 68.6, pa: '118/76', bcf: 142 },
  { date: '06/05/2026', ig: '30s 4d', weight: 70.4, pa: '120/78', bcf: 140 },
];

export const PREGNANCY = {
  dum: '03/10/2025',
  dpp: '10/07/2026',
  igWeeks: 31,
  igDays: 1,
  trimester: 3,
  gpa: { g: 2, p: 1, a: 0, pn: 1, pc: 0 },
  paridadeText: 'G2P1A0 · 1 parto normal',
  next: { date: '14/05', time: '09:00', kind: 'Consulta Obstétrica', who: 'Dr. Lucas Pires Nunes' },
};

export const MEDS = [
  { name: 'Ácido fólico',        dose: '5 mg',     freq: '1x/dia', since: 'Pré-concepcional', why: 'Prevenção de defeitos do tubo neural' },
  { name: 'Sulfato ferroso',     dose: '40 mg',    freq: '1x/dia', since: '20s',              why: 'Profilaxia de anemia' },
  { name: 'Carbonato de cálcio', dose: '1.200 mg', freq: '1x/dia', since: '20s',              why: 'Prevenção de pré-eclâmpsia' },
  { name: 'Omeprazol',           dose: '20 mg',    freq: 'SOS',    since: '26s',              why: 'Pirose' },
];

export const HISTORY = {
  obstetric: [
    { kind: 'Parto normal', year: 2019, ig: '39s 2d', baby: 'M, 3.180 g' },
  ],
  personal: ['Nega HAS / DM / alergias', 'Apendicectomia (2012)'],
  family: ['Mãe: HAS', 'Pai: DM tipo 2', 'Sem histórico de pré-eclâmpsia'],
};

// Laboratoriais agrupados por trimestre/sessão de coleta.
// Suportar múltiplas sessões no mesmo trimestre (ex.: controle de anemia).
export const LABS_GROUPED = {
  T1: {
    label: '1º Trimestre',
    sessions: [
      {
        date: '06/11/2025', ig: '5s 5d',
        items: [
          { id: 'hemograma',  name: 'Hemograma',          result: 'Hb 12,6 g/dL',     status: 'ok' },
          { id: 'tipagem',    name: 'Tipagem sanguínea',  result: 'A+ · Coombs neg.', status: 'ok' },
          { id: 'glicemia',   name: 'Glicemia jejum',     result: '84 mg/dL',         status: 'ok' },
          { id: 'vdrl',       name: 'Sífilis (VDRL)',     result: 'Não reagente',     status: 'ok' },
          { id: 'hiv',        name: 'HIV',                result: 'Não reagente',     status: 'ok' },
          { id: 'hbsag',      name: 'Hepatite B (HBsAg)', result: 'Não reagente',     status: 'ok' },
          { id: 'hcv',        name: 'Hepatite C',         result: 'Não reagente',     status: 'ok' },
          { id: 'toxo-igg',   name: 'Toxoplasmose IgG',   result: 'Reagente',         status: 'info' },
          { id: 'toxo-igm',   name: 'Toxoplasmose IgM',   result: 'Não reagente',     status: 'ok' },
          { id: 'rubeola',    name: 'Rubéola IgG',        result: 'Reagente',         status: 'ok' },
          { id: 'urina',      name: 'Urina tipo I',       result: 'Normal',           status: 'ok' },
          { id: 'urocultura', name: 'Urocultura',         result: 'Negativa',         status: 'ok' },
        ],
      },
    ],
  },
  T2: {
    label: '2º Trimestre',
    sessions: [
      {
        date: '04/03/2026', ig: '21s 5d',
        items: [
          { id: 'totg-0',    name: 'TOTG 75g (0h)',   result: '78 mg/dL',     status: 'ok' },
          { id: 'totg-1',    name: 'TOTG 75g (1h)',   result: '142 mg/dL',    status: 'ok' },
          { id: 'totg-2',    name: 'TOTG 75g (2h)',   result: '118 mg/dL',    status: 'ok' },
          { id: 'hemograma', name: 'Hemograma',       result: 'Hb 11,4 g/dL', status: 'attn' },
          { id: 'coombs',    name: 'Coombs indireto', result: 'Negativo',     status: 'ok' },
          { id: 'urina',     name: 'Urina tipo I',    result: 'Normal',       status: 'ok' },
        ],
      },
      {
        date: '01/04/2026', ig: '25s 5d', note: 'Controle de anemia',
        items: [
          { id: 'hemograma', name: 'Hemograma (controle)', result: 'Hb 11,7 g/dL', status: 'ok' },
          { id: 'ferritina', name: 'Ferritina',            result: '32 ng/mL',     status: 'ok' },
        ],
      },
    ],
  },
  T3: {
    label: '3º Trimestre',
    sessions: [
      {
        date: '02/05/2026', ig: '30s 0d',
        items: [
          { id: 'hemograma',  name: 'Hemograma',       result: 'Hb 11,8 g/dL', status: 'ok' },
          { id: 'vdrl',       name: 'VDRL',            result: 'Não reagente', status: 'ok' },
          { id: 'hiv',        name: 'HIV',             result: 'Não reagente', status: 'ok' },
          { id: 'gbs',        name: 'Strepto B (GBS)', result: 'Aguardando',   status: 'pend' },
          { id: 'urocultura', name: 'Urocultura',      result: 'Negativa',     status: 'ok' },
        ],
      },
    ],
  },
};

// Séries para o gráfico de evolução (Tela 03b). Itens cujo `id` aparece aqui
// recebem badge EVOLUÇÃO + chevron e ficam tocáveis.
export const LAB_SERIES = {
  hemograma: {
    name: 'Hemoglobina', unit: 'g/dL', refMin: 11.0, refMax: 14.5,
    points: [
      { date: '06/11/2025', ig: '5s 5d',  value: 12.6 },
      { date: '04/03/2026', ig: '21s 5d', value: 11.4, flag: 'attn', note: 'Anemia leve · iniciado sulfato ferroso' },
      { date: '01/04/2026', ig: '25s 5d', value: 11.7, note: 'Controle' },
      { date: '02/05/2026', ig: '30s 0d', value: 11.8 },
    ],
  },
  glicemia: {
    name: 'Glicemia jejum', unit: 'mg/dL', refMin: 70, refMax: 92,
    points: [
      { date: '06/11/2025', ig: '5s 5d',  value: 84 },
      { date: '04/03/2026', ig: '21s 5d', value: 78 },
    ],
  },
};

// Vacinas. status: 'done' = aplicada na gestação atual; 'prev' = pré-gestacional;
// 'pending' = recomendada para esta gestação ainda não aplicada.
export const VACCINES = [
  { name: 'dTpa (tríplice acelular)', status: 'done', date: '14/02/2026', ig: '20s 4d', note: 'Dose única na gestação · proteção materna e neonatal' },
  { name: 'Influenza (gripe)',        status: 'done', date: '14/04/2026', ig: '28s 4d', note: 'Campanha 2026 · trivalente' },
  { name: 'COVID-19 (reforço)',       status: 'done', date: '14/04/2026', ig: '28s 4d', note: 'Bivalente XBB · co-administrada com influenza' },
  { name: 'Hepatite B',               status: 'prev', date: '— pré-gestacional',         ig: '—',      note: 'Esquema completo prévio confirmado' },
];

export const IMAGING = {
  usg: [
    { kind: 'USG Obstétrica precoce',         date: '15/11/2025', ig: '6s 4d',  finding: 'Saco gestacional único, embrião com BCF presente.' },
    { kind: 'USG Morfológico 1º Trimestre',   date: '14/01/2026', ig: '14s 4d', finding: 'TN 1,4 mm. Marcadores normais. Risco baixo para aneuploidias.' },
    { kind: 'USG Morfológica 2º Trimestre',   date: '11/03/2026', ig: '22s 4d', finding: 'Anatomia fetal sem alterações. Placenta posterior, alta inserção.' },
    { kind: 'Doppler Obstétrico',             date: '11/05/2026', ig: '31s 1d', finding: 'IP de artérias uterinas e umbilical normais para a IG.' },
  ],
  ecoFetal: [
    { kind: 'Ecocardiografia fetal',          date: '18/03/2026', ig: '23s 3d', finding: 'Anatomia cardíaca fetal normal. 4 câmaras, vias de saída e arco aórtico sem alterações. FC 144 bpm.' },
  ],
};
