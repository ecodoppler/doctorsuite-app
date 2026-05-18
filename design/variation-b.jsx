// Variation B — Detalhada & Estruturada
// Sticky metric header + tabbed clinical layout. Patient-facing but data-rich.

const VB = {
  headerBg: 'linear-gradient(135deg, #4f46e5 0%, #5B5CF6 60%, #7c3aed 100%)',
  rowBg: '#ffffff',
};

// — Sticky data header used on most VB screens
function VB_Header({ topPad = 56, tab, setTab }) {
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  const pct = (igTotal / 280) * 100;
  return (
    <div style={{ background: VB.headerBg, color: 'white', padding: `${topPad}px 16px 0`, fontFamily: FONT_UI }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{PATIENT.initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{PATIENT.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{PATIENT.age} anos · {PATIENT.blood}</div>
          </div>
        </div>
        <RiskBadge level={PATIENT.risk} compact />
      </div>

      {/* Big IG number row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Idade gestacional</div>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
            {PREGNANCY.igWeeks}<span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>s</span>
            <span style={{ fontSize: 24, marginLeft: 8 }}>{PREGNANCY.igDays}</span><span style={{ fontSize: 14, fontWeight: 700 }}>d</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>DPP</div>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 18 }}>{PREGNANCY.dpp}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>3º trim · G{PREGNANCY.gpa.g}P{PREGNANCY.gpa.p}A{PREGNANCY.gpa.a}</div>
        </div>
      </div>

      {/* progress bar with trimester ticks */}
      <div style={{ marginTop: 12, position: 'relative', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'white', borderRadius: 99 }} />
        {[12, 27].map((w, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(w/40)*100}%`, top: -2, width: 2, height: 10, background: 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.7, fontWeight: 700, marginTop: 4 }}>
        <span>0s</span><span>12s</span><span>27s</span><span>40s</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 14, borderBottom: '1px solid rgba(255,255,255,0.15)', overflowX: 'auto' }}>
        {tab.map((t, i) => (
          <div key={i} onClick={() => setTab && setTab(i)} style={{
            padding: '10px 12px', fontSize: 12, fontWeight: 700,
            color: t.active ? 'white' : 'rgba(255,255,255,0.6)',
            borderBottom: t.active ? '2px solid white' : '2px solid transparent',
            whiteSpace: 'nowrap', cursor: 'pointer',
          }}>{t.label}</div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 1: Resumo ──────────────────────────────────────────────────
function VB_Resumo({ topPad = 56 }) {
  const tab = ['Resumo', 'Pré-natal', 'Exames', 'Plano'].map((l, i) => ({ label: l, active: i === 0 }));
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VB_Header topPad={topPad} tab={tab} />

      {/* Quick metrics grid */}
      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { l: 'Peso atual',     v: `${PATIENT.weightNow} kg`, sub: `+${(PATIENT.weightNow - PATIENT.weightPre).toFixed(1)} kg`, c: C.ok },
          { l: 'Pressão',        v: '120/78',                  sub: 'mmHg · normal',                                                c: C.ok },
          { l: 'IMC pré',        v: PATIENT.imcPre,            sub: 'eutrofia',                                                      c: C.ok },
          { l: 'BCF',            v: '140',                     sub: 'bpm · normal',                                                  c: C.ok },
        ].map((m, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, padding: '10px 12px', border: '1px solid ' + C.borderSoft }}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.l}</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 20, fontWeight: 800, color: C.ink, lineHeight: 1.1, marginTop: 2 }}>{m.v}</div>
            <div style={{ fontSize: 10, color: m.c, fontWeight: 700, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Próxima consulta */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle action="Ver tudo">Próxima consulta</SectionTitle>
        <div style={{ background: C.white, borderRadius: 12, padding: 12, border: '1px solid ' + C.borderSoft, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 44, borderRadius: 99, background: C.indigo }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{PREGNANCY.next.kind}</div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>14/05/2026 · 09h00 · {PREGNANCY.next.who}</div>
          </div>
          <div style={{ background: C.indigoSoft, color: C.indigo, padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>EM 5 DIAS</div>
        </div>
      </div>

      {/* Identificação compacta */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Identificação</SectionTitle>
        <Card padding={0}>
          {[
            ['CPF', PATIENT.cpf],
            ['Nascimento', `${PATIENT.birth} (${PATIENT.age} anos)`],
            ['Altura', `${PATIENT.height} cm`],
            ['Tipo sanguíneo', PATIENT.blood],
            ['Telefone', PATIENT.phone],
            ['Emergência', `${PATIENT.emergencyContact.name} · ${PATIENT.emergencyContact.phone}`],
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ flex: '0 0 36%', fontSize: 11, color: C.slate, fontWeight: 600 }}>{r[0]}</div>
              <div style={{ flex: 1, fontSize: 12, color: C.ink, fontWeight: 600, fontFamily: FONT_NUM }}>{r[1]}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Antecedentes */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Antecedentes</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Card padding={12}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Obstétricos</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {Object.entries({ G: PREGNANCY.gpa.g, P: PREGNANCY.gpa.p, A: PREGNANCY.gpa.a }).map(([k, v]) => (
                <div key={k} style={{ flex: 1, background: C.indigoSoft, borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: C.indigoDeep, fontWeight: 700 }}>{k}</div>
                  <div style={{ fontFamily: FONT_NUM, fontSize: 16, fontWeight: 800, color: C.indigoDeep, lineHeight: 1 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: C.slate, marginTop: 8, lineHeight: 1.4 }}>Parto normal 2019 (39s2d, 3.180g)</div>
          </Card>
          <Card padding={12}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Pessoais &amp; familiares</div>
            <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', fontSize: 10.5, color: C.slate, lineHeight: 1.5 }}>
              <li>· Nega HAS / DM / alergias</li>
              <li>· Apendicectomia (2012)</li>
              <li>· Mãe HAS, pai DM2</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: Pré-natal — gráficos múltiplos + tabela ──────────────────
function VB_PreNatal({ topPad = 56 }) {
  const tab = ['Resumo', 'Pré-natal', 'Exames', 'Plano'].map((l, i) => ({ label: l, active: i === 1 }));
  const weights = VISITS.map(v => v.weight);
  const sysList = VISITS.map(v => +v.pa.split('/')[0]);
  const diaList = VISITS.map(v => +v.pa.split('/')[1]);
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VB_Header topPad={topPad} tab={tab} />

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle action="Detalhar →">Curvas de seguimento</SectionTitle>
        <Card padding={14}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, whiteSpace: 'nowrap' }}>PESO (kg)</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{PATIENT.weightNow}</div>
            </div>
            <div style={{ flex: 1, fontSize: 10, color: C.slate, whiteSpace: 'nowrap' }}>
              <div>Pré: <strong style={{ color: C.ink }}>{PATIENT.weightPre} kg</strong></div>
              <div>Ganho: <strong style={{ color: C.ok }}>+{(PATIENT.weightNow - PATIENT.weightPre).toFixed(1)} kg</strong></div>
              <div>Esperado: 11–16 kg</div>
            </div>
          </div>
          <Spark data={weights} w={300} h={64} color={C.peachDeep} fill="rgba(232,153,118,0.18)" />
        </Card>

        <div style={{ height: 8 }} />
        <Card padding={14}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.slate, fontWeight: 700 }}>PRESSÃO (sistólica/diastólica)</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1 }}>120<span style={{ fontSize: 14, color: C.slate }}>/78</span></div>
            </div>
            <div style={{ flex: 1, fontSize: 10, color: C.slate }}>
              <div>Limite: <strong>140/90</strong></div>
              <div style={{ color: C.ok }}>Estável · sem alertas</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Spark data={sysList} w={300} h={56} color={C.indigo} fill="rgba(91,92,246,0.14)" />
            <div style={{ position: 'absolute', inset: 0 }}>
              <Spark data={diaList} w={300} h={56} color={C.indigoDeep} fill="transparent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela completa */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Histórico de aferições</SectionTitle>
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr 0.7fr', fontSize: 10, color: C.slate, fontWeight: 700, padding: '10px 12px', borderBottom: '1px solid ' + C.borderSoft, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <span>Data</span><span>IG</span><span>Peso</span><span>PA</span><span>BCF</span>
          </div>
          {VISITS.slice().reverse().map((v, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr 0.7fr', fontSize: 11, padding: '10px 12px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none', alignItems: 'center', fontFamily: FONT_NUM }}>
              <span style={{ fontWeight: 700, color: C.ink }}>{v.date.slice(0,5)}</span>
              <span style={{ color: C.indigo, fontWeight: 700 }}>{v.ig}</span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{v.weight}</span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{v.pa}</span>
              <span style={{ color: C.slate }}>{v.bcf || '—'}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Screen 3: Exames — labs por trimestre + USG ───────────────────────
function VB_Exames({ topPad = 56 }) {
  const tab = ['Resumo', 'Pré-natal', 'Exames', 'Plano'].map((l, i) => ({ label: l, active: i === 2 }));
  const allLabs = [
    { trim: '1º Trimestre', date: '06/11/2025', items: LABS.T1 },
    { trim: '2º Trimestre', date: '04/03/2026', items: LABS.T2 },
    { trim: '3º Trimestre', date: '02/05/2026', items: LABS.T3 },
  ];
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VB_Header topPad={topPad} tab={tab} />

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Laboratoriais</SectionTitle>
        {allLabs.map((tg, k) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 6px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tg.trim}</div>
              <div style={{ fontSize: 10, color: C.slate, fontFamily: FONT_NUM }}>{tg.date}</div>
            </div>
            <Card padding={0}>
              {tg.items.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: i < tg.items.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
                  <StatusDot status={l.status} />
                  <div style={{ flex: 1, fontSize: 12, color: C.ink, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{l.result}</div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        <SectionTitle>Ultrassonografias</SectionTitle>
        <Card padding={0}>
          {USG.map((u, i) => (
            <div key={i} style={{ padding: 12, borderBottom: i < USG.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{u.kind}</div>
                <div style={{ fontSize: 10, color: C.indigo, fontWeight: 700 }}>{u.ig}</div>
              </div>
              <div style={{ fontSize: 10, color: C.slate, fontFamily: FONT_NUM }}>{u.date}</div>
              <div style={{ fontSize: 11, color: C.ink2, marginTop: 4, lineHeight: 1.4 }}>{u.finding}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Vacinação</SectionTitle>
        <Card padding={0}>
          {VACCINES.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < VACCINES.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.okSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ok, fontSize: 14 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.ink, fontWeight: 700 }}>{v.name}</div>
                <div style={{ fontSize: 10, color: C.slate }}>{v.note}</div>
              </div>
              <div style={{ fontSize: 10, color: C.slate, fontFamily: FONT_NUM }}>{v.date.slice(0,5)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Screen 4: Plano de parto + Maternidade + Alertas ─────────────────
function VB_Plano({ topPad = 56 }) {
  const tab = ['Resumo', 'Pré-natal', 'Exames', 'Plano'].map((l, i) => ({ label: l, active: i === 3 }));
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VB_Header topPad={topPad} tab={tab} />

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Plano de parto</SectionTitle>
        <Card padding={0}>
          {[
            ['Via preferida', BIRTH_PLAN.preference],
            ['Analgesia', BIRTH_PLAN.pain],
            ['Acompanhante', BIRTH_PLAN.companion],
            ['Pós-nascimento', BIRTH_PLAN.contact],
            ['Aleitamento', BIRTH_PLAN.feeding],
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ flex: '0 0 38%', fontSize: 11, color: C.slate, fontWeight: 600 }}>{r[0]}</div>
              <div style={{ flex: 1, fontSize: 12, color: C.ink, fontWeight: 600 }}>{r[1]}</div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', fontSize: 11, color: C.slate, lineHeight: 1.5, background: '#fafbfd' }}>
            <strong style={{ color: C.ink }}>Notas:</strong> {BIRTH_PLAN.notes}
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Medicações em uso</SectionTitle>
        <Card padding={0}>
          {MEDS.map((m, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: i < MEDS.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.name} <span style={{ fontWeight: 600, color: C.indigo, fontFamily: FONT_NUM }}>{m.dose}</span></div>
                <div style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>{m.freq}</div>
              </div>
              <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>Desde {m.since} · {m.why}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Maternidade de referência</SectionTitle>
        <Card padding={14}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{PATIENT.maternity.name}</div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{PATIENT.maternity.address}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1, background: C.indigo, color: 'white', borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>Ligar · {PATIENT.maternity.phone}</div>
            <div style={{ background: C.indigoSoft, color: C.indigo, borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 12 }}>Rota</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: 14, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: C.warn }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Sinais de alerta</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            {ALERTS.slice(0,6).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <div style={{ fontSize: 10.5, color: '#7f1d1d', lineHeight: 1.35 }}><strong>{a.title}</strong></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VB_Nav({ active = 0 }) {
  return <BottomNav active={active} items={[
    { icon: '🏠', label: 'Início' },
    { icon: '📊', label: 'Pré-natal' },
    { icon: '🧪', label: 'Exames' },
    { icon: '📋', label: 'Plano' },
    { icon: '👤', label: 'Perfil' },
  ]} />;
}

Object.assign(window, { VB_Header, VB_Resumo, VB_PreNatal, VB_Exames, VB_Plano, VB_Nav });
