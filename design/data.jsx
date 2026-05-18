// Mock data for cartão gestante — based on physical card structure + DoctorSuite agenda

const PATIENT = {
  name: 'Ana Paula V. H. Nunes',
  fullName: 'Ana Paula Vanzella Halmenschlager Nunes',
  initials: 'AP',
  age: 32,
  cpf: '738.221.401-04',
  birth: '14/03/1994',
  blood: 'A+',
  height: 165,
  weightPre: 62.0,
  weightNow: 70.4,
  imcPre: 22.8,
  phone: '(63) 99957-1516',
  emergencyContact: { name: 'Eduardo Nunes (esposo)', phone: '(63) 99841-0922' },
  address: 'Quadra 104 Sul, Alameda 22, Palmas — TO',
  doctor: 'Dr. Lucas Pires Nunes',
  doctorCrm: 'CRM-TO 4521',
  clinic: 'Clínica Mater Vitta',
  maternity: {
    name: 'Hospital Mater Vitta',
    address: 'Av. NS-1, Quadra 103 Norte — Palmas, TO',
    phone: '(63) 3215-4000',
    distance: '4,2 km',
  },
  risk: 'baixo',
  // Novos blocos para a Capa
  comorbidades: ['Sem comorbidades crônicas', 'Asma leve em remissão (desde 2018)'],
  intercorrencias: [
    { ig: '26s 4d', desc: 'Pirose persistente — iniciado omeprazol' },
    { ig: '28s 2d', desc: 'Hemorroida externa — orientações de higiene' },
  ],
};

const PREGNANCY = {
  dum: '03/10/2025',
  dpp: '10/07/2026',
  igWeeks: 31,
  igDays: 1,
  igTotalDays: 31 * 7 + 1,
  trimester: 3,
  babyApprox: { length: 41.1, weight: 1502 },
  babyFruit: 'Coco',
  // GPA + paridade textual
  gpa: { g: 2, p: 1, a: 0, pn: 1, pc: 0 },
  paridadeText: 'G2P1A0 · 1 parto normal',
  next: { date: '14/05/2026', time: '09:00', kind: 'Consulta Obstétrica', who: 'Dr. Lucas Pires Nunes' },
};

const VISITS = [
  { date: '12/11/2025', ig: '6s 0d',  weight: 62.5, pa: '110/70', au: null, bcf: null, edema: '0', notes: 'Início do pré-natal. Suplementação iniciada.' },
  { date: '10/12/2025', ig: '10s 0d', weight: 63.4, pa: '108/68', au: null, bcf: 158, edema: '0', notes: 'BCF presente, regular.' },
  { date: '14/01/2026', ig: '14s 4d', weight: 64.8, pa: '112/70', au: 14,   bcf: 152, edema: '0', notes: 'Sem queixas.' },
  { date: '11/02/2026', ig: '18s 4d', weight: 66.1, pa: '110/72', au: 18,   bcf: 148, edema: '0', notes: 'USG morfológico solicitado.' },
  { date: '11/03/2026', ig: '22s 4d', weight: 67.3, pa: '114/74', au: 23,   bcf: 144, edema: '0', notes: 'Movimentação fetal presente.' },
  { date: '08/04/2026', ig: '26s 4d', weight: 68.6, pa: '118/76', au: 26,   bcf: 142, edema: '+', notes: 'Refere queimação retroesternal.' },
  { date: '06/05/2026', ig: '30s 4d', weight: 70.4, pa: '120/78', au: 30,   bcf: 140, edema: '+', notes: 'Hemorroida externa. Curva de peso adequada.' },
];

// Laboratoriais — agora estruturados por trimestre, com possibilidade de
// múltiplas datas no mesmo trimestre (ex.: hemograma de seguimento da anemia).
// Cada item tem `series` opcional para o gráfico de evolução.
const LABS = {
  T1: {
    label: '1º Trimestre',
    sessions: [
      {
        date: '06/11/2025', ig: '5s 5d',
        items: [
          { id: 'hemograma',   name: 'Hemograma',           result: 'Hb 12,6 g/dL', status: 'ok',   unit: 'g/dL' },
          { id: 'tipagem',     name: 'Tipagem sanguínea',   result: 'A+ · Coombs neg.',  status: 'ok' },
          { id: 'glicemia',    name: 'Glicemia jejum',      result: '84 mg/dL',     status: 'ok',   unit: 'mg/dL' },
          { id: 'vdrl',        name: 'Sífilis (VDRL)',      result: 'Não reagente', status: 'ok' },
          { id: 'hiv',         name: 'HIV',                 result: 'Não reagente', status: 'ok' },
          { id: 'hbsag',       name: 'Hepatite B (HBsAg)',  result: 'Não reagente', status: 'ok' },
          { id: 'hcv',         name: 'Hepatite C',          result: 'Não reagente', status: 'ok' },
          { id: 'toxo-igg',    name: 'Toxoplasmose IgG',    result: 'Reagente',     status: 'info' },
          { id: 'toxo-igm',    name: 'Toxoplasmose IgM',    result: 'Não reagente', status: 'ok' },
          { id: 'rubeola',     name: 'Rubéola IgG',         result: 'Reagente',     status: 'ok' },
          { id: 'urina',       name: 'Urina tipo I',        result: 'Normal',       status: 'ok' },
          { id: 'urocultura',  name: 'Urocultura',          result: 'Negativa',     status: 'ok' },
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
          { id: 'totg-0',      name: 'TOTG 75g (0h)',       result: '78 mg/dL',     status: 'ok' },
          { id: 'totg-1',      name: 'TOTG 75g (1h)',       result: '142 mg/dL',    status: 'ok' },
          { id: 'totg-2',      name: 'TOTG 75g (2h)',       result: '118 mg/dL',    status: 'ok' },
          { id: 'hemograma',   name: 'Hemograma',           result: 'Hb 11,4 g/dL', status: 'attn', unit: 'g/dL' },
          { id: 'coombs',      name: 'Coombs indireto',     result: 'Negativo',     status: 'ok' },
          { id: 'urina',       name: 'Urina tipo I',        result: 'Normal',       status: 'ok' },
        ],
      },
      {
        // Reavaliação de hemoglobina após início de sulfato ferroso — datas diferentes no mesmo trimestre
        date: '01/04/2026', ig: '25s 5d',
        note: 'Controle de anemia',
        items: [
          { id: 'hemograma',   name: 'Hemograma (controle)', result: 'Hb 11,7 g/dL', status: 'ok', unit: 'g/dL' },
          { id: 'ferritina',   name: 'Ferritina',            result: '32 ng/mL',     status: 'ok' },
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
          { id: 'hemograma',   name: 'Hemograma',           result: 'Hb 11,8 g/dL', status: 'ok', unit: 'g/dL' },
          { id: 'vdrl',        name: 'VDRL',                result: 'Não reagente', status: 'ok' },
          { id: 'hiv',         name: 'HIV',                 result: 'Não reagente', status: 'ok' },
          { id: 'gbs',         name: 'Strepto B (GBS)',     result: 'Aguardando',   status: 'pend' },
          { id: 'urocultura',  name: 'Urocultura',          result: 'Negativa',     status: 'ok' },
        ],
      },
    ],
  },
};

// Séries para o gráfico de evolução de exames com múltiplos pontos no tempo.
// Ref ranges para sombrear faixa normal.
const LAB_SERIES = {
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

// Imagem — separada em USG e Ecocardiografia fetal
const IMAGING = {
  usg: [
    { kind: 'USG Obstétrica precoce',          date: '15/11/2025', ig: '6s 4d',  finding: 'Saco gestacional único, embrião com BCF presente.' },
    { kind: 'USG Morfológico 1º Trimestre',    date: '14/01/2026', ig: '14s 4d', finding: 'TN 1,4 mm. Marcadores normais. Risco baixo para aneuploidias.' },
    { kind: 'USG Morfológica 2º Trimestre',    date: '11/03/2026', ig: '22s 4d', finding: 'Anatomia fetal sem alterações. Placenta posterior, alta inserção.' },
    { kind: 'Doppler Obstétrico',              date: '11/05/2026', ig: '31s 1d', finding: 'IP de artérias uterinas e umbilical normais para a IG.' },
  ],
  ecoFetal: [
    { kind: 'Ecocardiografia fetal',           date: '18/03/2026', ig: '23s 3d', finding: 'Anatomia cardíaca fetal normal. 4 câmaras, vias de saída e arco aórtico sem alterações. FC 144 bpm.' },
  ],
};

// Mantido para compatibilidade com componentes antigos
const USG = IMAGING.usg;

const VACCINES = [
  { name: 'dTpa (tríplice acelular)',  status: 'done',   date: '14/02/2026', ig: '20s 4d', note: 'Dose única na gestação · proteção materna e neonatal' },
  { name: 'Influenza (gripe)',         status: 'done',   date: '14/04/2026', ig: '28s 4d', note: 'Campanha 2026 · trivalente' },
  { name: 'COVID-19 (reforço)',        status: 'done',   date: '14/04/2026', ig: '28s 4d', note: 'Bivalente XBB · co-administrada com influenza' },
  { name: 'Hepatite B',                status: 'prev',   date: '— pré-gestacional',         ig: '—',      note: 'Esquema completo prévio confirmado' },
];

const MEDS = [
  { name: 'Ácido fólico',          dose: '5 mg',     freq: '1x/dia',  since: 'Pré-concepcional', why: 'Prevenção de defeitos do tubo neural' },
  { name: 'Sulfato ferroso',       dose: '40 mg',    freq: '1x/dia',  since: '20s',              why: 'Profilaxia de anemia' },
  { name: 'Carbonato de cálcio',   dose: '1.200 mg', freq: '1x/dia',  since: '20s',              why: 'Prevenção de pré-eclâmpsia' },
  { name: 'Omeprazol',             dose: '20 mg',    freq: 'SOS',     since: '26s',              why: 'Pirose' },
];

const HISTORY = {
  obstetric: [
    { kind: 'Parto normal', year: 2019, ig: '39s 2d', baby: 'M, 3.180 g', notes: 'Sem intercorrências.' },
  ],
  personal: ['Nega HAS / DM / alergias', 'Apendicectomia (2012)'],
  family: ['Mãe: HAS', 'Pai: DM tipo 2', 'Sem histórico de pré-eclâmpsia'],
};

const BIRTH_PLAN = {
  preference: 'Parto normal',
  pain: 'Aceita analgesia se desejar no momento',
  companion: 'Esposo (Eduardo Nunes)',
  contact: 'Pele a pele imediato + clampeamento oportuno',
  feeding: 'Aleitamento materno exclusivo',
  notes: 'Prefere ambiente com luz baixa e música. Aberta a episiotomia se houver indicação.',
};

const ALERTS = [
  { icon: '🩸', title: 'Sangramento vaginal',        detail: 'De qualquer quantidade ou cor.' },
  { icon: '💧', title: 'Perda de líquido',           detail: 'Líquido claro, esverdeado ou com odor.' },
  { icon: '⚡', title: 'Dor de cabeça forte',        detail: 'Que não passa, com visão turva ou pontos brilhantes.' },
  { icon: '🤰', title: 'Contrações regulares',       detail: '4 em 20 min ou 8 em 1 h, antes de 37 semanas.' },
  { icon: '👶', title: 'Diminuição de movimentos',   detail: 'Bebê parado ou se mexendo menos que o habitual.' },
  { icon: '🌡️', title: 'Febre ≥ 38 °C',             detail: 'Persistente, com ou sem outros sintomas.' },
];

// Backwards-compat: flat per-trimester arrays for VA_Exames / VB_Exames / PDFPreview
const LABS_GROUPED = LABS;
const LABS_FLAT = {
  T1: LABS.T1.sessions.flatMap(s => s.items),
  T2: LABS.T2.sessions.flatMap(s => s.items),
  T3: LABS.T3.sessions.flatMap(s => s.items),
};
// Override LABS export with flat arrays so existing consumers (.map) still work,
// while VF_Exames imports LABS_GROUPED for the session-aware layout.
const LABS_EXPORT = { T1: LABS_FLAT.T1, T2: LABS_FLAT.T2, T3: LABS_FLAT.T3 };

Object.assign(window, { PATIENT, PREGNANCY, VISITS, LABS: LABS_EXPORT, LABS_GROUPED, LAB_SERIES, IMAGING, USG, VACCINES, MEDS, HISTORY, BIRTH_PLAN, ALERTS });
