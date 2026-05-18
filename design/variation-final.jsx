// Variation FINAL — Hybrid (refresh)
// Mudanças desta revisão:
//  • VF_Header sem tab strip (resolve duplicação com a bottom nav)
//  • Exames: labs por trimestre/sessão (datas distintas no mesmo trim) + clique abre VF_LabDetail
//  • Imagem separada em USG e Ecocardiografia fetal
//  • Vacinas removidas de Exames — agora têm tela própria (VF_Vacinas)
//  • Bottom nav: Início · Pré-natal · Exames · Vacinas · Plano (Alertas via atalho na Capa)

const VF = {
  headerBg: 'linear-gradient(135deg, #b85d3f 0%, #d97757 50%, #e89976 100%)',
  warmCardTop: '#fef7f0',
  accent: C.peachDeep,
  accentDeep: '#b85d3f',
  accentSoft: '#fde8d8',
  rose: C.rose,
  roseSoft: C.roseSoft,
};

// ── Header warm (SEM tabs — apenas identidade + IG/DPP) ───────────────
function VF_Header({ topPad = 56 }) {
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  const pct = (igTotal / 280) * 100;
  return (
    <div style={{ background: VF.headerBg, color: 'white', padding: `${topPad}px 16px 16px`, fontFamily: FONT_UI, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{PATIENT.initials}</div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 16, fontWeight: 500, lineHeight: 1.1 }}>{PATIENT.name}</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>{PATIENT.age} anos · {PATIENT.blood}</div>
          </div>
        </div>
        <RiskBadge level={PATIENT.risk} compact />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, position: 'relative' }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Idade gestacional</div>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
            {PREGNANCY.igWeeks}<span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>s</span>
            <span style={{ fontSize: 24, marginLeft: 8 }}>{PREGNANCY.igDays}</span><span style={{ fontSize: 14, fontWeight: 700 }}>d</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>DPP</div>
          <div style={{ fontFamily: FONT_NUM, fontWeight: 800, fontSize: 18 }}>{PREGNANCY.dpp}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>3º trim · {PREGNANCY.paridadeText}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, position: 'relative', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.22)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'white', borderRadius: 99 }} />
        {[12, 27].map((w, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(w/40)*100}%`, top: -2, width: 2, height: 10, background: 'rgba(255,255,255,0.45)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.75, fontWeight: 700, marginTop: 4 }}>
        <span>0s</span><span>12s</span><span>27s</span><span>40s</span>
      </div>
    </div>
  );
}

// ── Pré-natal ─────────────────────────────────────────────────────────
function VF_PreNatal({ topPad = 56 }) {
  const weights = VISITS.map(v => v.weight);
  const sysList = VISITS.map(v => +v.pa.split('/')[0]);
  const diaList = VISITS.map(v => +v.pa.split('/')[1]);
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VF_Header topPad={topPad} />
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
          <Spark data={weights} w={300} h={64} color={VF.accent} fill="rgba(232,153,118,0.22)" />
        </Card>
        <div style={{ height: 8 }} />
        <Card padding={14}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.slate, fontWeight: 700 }}>PRESSÃO (sist./diast.)</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1 }}>120<span style={{ fontSize: 14, color: C.slate }}>/78</span></div>
            </div>
            <div style={{ flex: 1, fontSize: 10, color: C.slate }}>
              <div>Limite: <strong>140/90</strong></div>
              <div style={{ color: C.ok }}>Estável · sem alertas</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Spark data={sysList} w={300} h={56} color={VF.accentDeep} fill="rgba(184,93,63,0.14)" />
            <div style={{ position: 'absolute', inset: 0 }}>
              <Spark data={diaList} w={300} h={56} color={VF.rose} fill="transparent" />
            </div>
          </div>
        </Card>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Histórico de aferições</SectionTitle>
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr 0.7fr', fontSize: 10, color: C.slate, fontWeight: 700, padding: '10px 12px', borderBottom: '1px solid ' + C.borderSoft, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <span>Data</span><span>IG</span><span>Peso</span><span>PA</span><span>BCF</span>
          </div>
          {VISITS.slice().reverse().map((v, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr 0.7fr', fontSize: 11, padding: '10px 12px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none', alignItems: 'center', fontFamily: FONT_NUM }}>
              <span style={{ fontWeight: 700, color: C.ink }}>{v.date.slice(0,5)}</span>
              <span style={{ color: VF.accentDeep, fontWeight: 700 }}>{v.ig}</span>
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

// ── Exames (laboratoriais + imagem) ──────────────────────────────────
// Cada lab item é "tocável" — mostramos chevron e affordance visual de toque.
function VF_Exames({ topPad = 56, onLabClick }) {
  const trims = [LABS_GROUPED.T1, LABS_GROUPED.T2, LABS_GROUPED.T3];
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VF_Header topPad={topPad} />

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Laboratoriais</SectionTitle>
        {trims.map((tg, k) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: VF.accentDeep, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 6px' }}>{tg.label}</div>
            {tg.sessions.map((s, si) => (
              <div key={si} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 4px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{s.date} <span style={{ color: C.slate, fontWeight: 600, marginLeft: 4 }}>{s.ig}</span></div>
                  {s.note && <div style={{ fontSize: 10, color: C.slate, fontStyle: 'italic' }}>{s.note}</div>}
                </div>
                <Card padding={0}>
                  {s.items.map((l, i) => {
                    const hasSeries = !!LAB_SERIES[l.id];
                    return (
                      <div key={i}
                        onClick={() => onLabClick && hasSeries && onLabClick(l.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          borderBottom: i < s.items.length - 1 ? '1px solid ' + C.borderSoft : 'none',
                          cursor: hasSeries ? 'pointer' : 'default',
                        }}>
                        <StatusDot status={l.status} />
                        <div style={{ flex: 1, fontSize: 12, color: C.ink, fontWeight: 600 }}>
                          {l.name}
                          {hasSeries && <span style={{ display: 'inline-block', marginLeft: 6, fontSize: 9, color: VF.accentDeep, background: VF.accentSoft, padding: '1px 6px', borderRadius: 99, fontWeight: 700, letterSpacing: 0.3 }}>EVOLUÇÃO</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{l.result}</div>
                        {hasSeries && <div style={{ color: C.slateLight, fontSize: 14, marginLeft: 4 }}>›</div>}
                      </div>
                    );
                  })}
                </Card>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        <SectionTitle>Ultrassonografias</SectionTitle>
        <Card padding={0}>
          {IMAGING.usg.map((u, i) => (
            <div key={i} style={{ padding: 12, borderBottom: i < IMAGING.usg.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{u.kind}</div>
                <div style={{ fontSize: 10, color: VF.accentDeep, fontWeight: 700 }}>{u.ig}</div>
              </div>
              <div style={{ fontSize: 10, color: C.slate, fontFamily: FONT_NUM }}>{u.date}</div>
              <div style={{ fontSize: 11, color: C.ink2, marginTop: 4, lineHeight: 1.4 }}>{u.finding}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Ecocardiografia fetal</SectionTitle>
        <Card padding={0}>
          {IMAGING.ecoFetal.map((u, i) => (
            <div key={i} style={{ padding: 12, borderBottom: i < IMAGING.ecoFetal.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{u.kind}</div>
                <div style={{ fontSize: 10, color: VF.accentDeep, fontWeight: 700 }}>{u.ig}</div>
              </div>
              <div style={{ fontSize: 10, color: C.slate, fontFamily: FONT_NUM }}>{u.date}</div>
              <div style={{ fontSize: 11, color: C.ink2, marginTop: 4, lineHeight: 1.4 }}>{u.finding}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Lab Detail (gráfico de evolução) ─────────────────────────────────
function VF_LabDetail({ topPad = 56, labId = 'hemograma', onBack }) {
  const series = LAB_SERIES[labId];
  if (!series) return null;
  const W = 320, H = 160, padL = 36, padR = 12, padT = 12, padB = 24;
  const values = series.points.map(p => p.value);
  const yMin = Math.min(series.refMin, ...values) * 0.92;
  const yMax = Math.max(series.refMax, ...values) * 1.08;
  const xN = series.points.length - 1;
  const px = (i) => padL + (i / Math.max(1, xN)) * (W - padL - padR);
  const py = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  const path = series.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(p.value).toFixed(1)}`).join(' ');
  const refTop = py(series.refMax);
  const refBot = py(series.refMin);
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      {/* Mini header (só voltar + nome) */}
      <div style={{ background: VF.headerBg, color: 'white', padding: `${topPad}px 16px 18px`, fontFamily: FONT_UI }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={onBack} style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>‹</div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Evolução do exame</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 22, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>{series.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase' }}>Último valor</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 24, fontWeight: 800 }}>{values[values.length-1]} <span style={{ fontSize: 12, opacity: 0.85 }}>{series.unit}</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase' }}>Faixa de referência</div>
            <div style={{ fontFamily: FONT_NUM, fontSize: 14, fontWeight: 700, marginTop: 4 }}>{series.refMin} – {series.refMax} {series.unit}</div>
          </div>
        </div>
      </div>

      {/* Chart card */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card padding={14}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: '100%' }}>
            {/* faixa de referência */}
            <rect x={padL} y={refTop} width={W - padL - padR} height={refBot - refTop} fill="rgba(16,185,129,0.10)" />
            <line x1={padL} x2={W - padR} y1={refTop} y2={refTop} stroke="rgba(16,185,129,0.5)" strokeDasharray="4 3" strokeWidth="1" />
            <line x1={padL} x2={W - padR} y1={refBot} y2={refBot} stroke="rgba(16,185,129,0.5)" strokeDasharray="4 3" strokeWidth="1" />
            {/* y axis labels */}
            {[series.refMin, series.refMax].map((v, i) => (
              <text key={i} x={padL - 6} y={py(v) + 3} textAnchor="end" fontSize="9" fill={C.slate} fontFamily={FONT_NUM}>{v}</text>
            ))}
            {/* line */}
            <path d={path} fill="none" stroke={VF.accentDeep} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* points */}
            {series.points.map((p, i) => (
              <g key={i}>
                <circle cx={px(i)} cy={py(p.value)} r={5} fill="white" stroke={p.flag === 'attn' ? C.attn : VF.accentDeep} strokeWidth="2.5" />
                <text x={px(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={C.slate} fontFamily={FONT_NUM}>{p.ig.replace(' ', '')}</text>
              </g>
            ))}
          </svg>
        </Card>
      </div>

      {/* Lista de pontos */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Histórico</SectionTitle>
        <Card padding={0}>
          {series.points.slice().reverse().map((p, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: p.flag === 'attn' ? C.attn : VF.accent }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{p.date} <span style={{ color: C.slate, fontWeight: 600, marginLeft: 4 }}>{p.ig}</span></div>
                {p.note && <div style={{ fontSize: 10.5, color: C.slate, marginTop: 2 }}>{p.note}</div>}
              </div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 14, fontWeight: 800, color: C.ink }}>{p.value} <span style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>{series.unit}</span></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Vacinas (tela própria) ────────────────────────────────────────────
function VF_Vacinas({ topPad = 56 }) {
  const taken = VACCINES.filter(v => v.status === 'done');
  const prev  = VACCINES.filter(v => v.status === 'prev');
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VF_Header topPad={topPad} />
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 22, color: C.ink, fontWeight: 500 }}>Vacinas tomadas na gravidez</div>
        <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{taken.length} aplicações realizadas durante a gestação atual</div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <Card padding={0}>
          {taken.map((v, i) => (
            <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: i < taken.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.okSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ok, fontSize: 18, fontWeight: 800, flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: VF.accentDeep, fontWeight: 700, fontFamily: FONT_NUM, whiteSpace: 'nowrap' }}>{v.ig}</div>
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 2, fontFamily: FONT_NUM }}>{v.date}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4, lineHeight: 1.4 }}>{v.note}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {prev.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <SectionTitle>Imunizações pré-gestacionais</SectionTitle>
          <Card padding={0}>
            {prev.map((v, i) => (
              <div key={i} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < prev.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: C.slateLight }} />
                <div style={{ flex: 1, fontSize: 12, color: C.ink, fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: C.slate }}>{v.note}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ background: VF.warmCardTop, borderRadius: 14, padding: 14, border: '1px solid ' + C.borderSoft }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: VF.accentDeep, textTransform: 'uppercase', letterSpacing: 0.4 }}>Recomendado e ainda não aplicado</div>
          <div style={{ fontSize: 12, color: C.slate, marginTop: 6, lineHeight: 1.5 }}>Todas as vacinas recomendadas para esta gestação foram aplicadas. ✓</div>
        </div>
      </div>
    </div>
  );
}

// ── Plano de parto ────────────────────────────────────────────────────
function VF_Plano({ topPad = 56 }) {
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <VF_Header topPad={topPad} />

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
          <div style={{ padding: '10px 14px', fontSize: 11, color: C.slate, lineHeight: 1.5, background: VF.warmCardTop }}>
            <strong style={{ color: C.ink }}>Notas:</strong> {BIRTH_PLAN.notes}
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <SectionTitle>Maternidade de referência</SectionTitle>
        <Card padding={14}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{PATIENT.maternity.name}</div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{PATIENT.maternity.address}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1, background: VF.accentDeep, color: 'white', borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>Ligar · {PATIENT.maternity.phone}</div>
            <div style={{ background: VF.accentSoft, color: VF.accentDeep, borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 12 }}>Rota</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Bottom nav warm — Início · Pré-natal · Exames · Vacinas · Plano
function VF_NavWarm({ active = 0 }) {
  const items = [
    { icon: '🏠', label: 'Início' },
    { icon: '📊', label: 'Pré-natal' },
    { icon: '🧪', label: 'Exames' },
    { icon: '💉', label: 'Vacinas' },
    { icon: '📋', label: 'Plano' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 8px 14px', background: C.white,
      borderTop: '1px solid ' + C.borderSoft, fontFamily: FONT_UI,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: i === active ? VF.accentDeep : C.slateLight, fontSize: 10, fontWeight: 600 }}>
          <div style={{ fontSize: 18 }}>{it.icon}</div>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Capa enriquecida (substitui VA_Resumo na seção Final) ────────────
function VF_Capa({ topPad = 56 }) {
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  const pct = Math.round((igTotal / 280) * 100);
  return (
    <div style={{ background: 'linear-gradient(180deg, #fce7d3 0%, #fdf3e8 60%, #f6f7fb 100%)', minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      {/* Header warm */}
      <div style={{ padding: `${topPad}px 20px 0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cartão da Gestante</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 1.05, color: C.rose, marginTop: 6, fontWeight: 500, fontStyle: 'italic' }}>Olá, Ana</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.rose, fontSize: 14 }}>{PATIENT.initials}</div>
        </div>
        <div style={{ marginTop: 10 }}><RiskBadge level={PATIENT.risk} compact /></div>
      </div>

      {/* Anel */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px 8px' }}>
        <ProgressRing size={196} stroke={12} value={igTotal} max={280} color={VF.accent} track="rgba(255,255,255,0.7)">
          <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Idade gestacional</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 50, lineHeight: 1, color: C.rose, marginTop: 4 }}>{PREGNANCY.igWeeks}<span style={{ fontSize: 20, marginLeft: 2 }}>s</span><span style={{ fontFamily: FONT_NUM, fontWeight: 700, fontSize: 18, marginLeft: 6, color: VF.accent }}>{PREGNANCY.igDays}d</span></div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 4, fontWeight: 600 }}>3º trim · {pct}% da jornada</div>
        </ProgressRing>
      </div>

      {/* Glance chips */}
      <div style={{ padding: '6px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Chip label="Tipo sanguíneo" value={PATIENT.blood} color={C.warn} soft="#fff" />
        <Chip label="Próxima consulta" value="14/05 · 09h" color={VF.accentDeep} soft="#fff" />
        <Chip label="Peso atual" value={`${PATIENT.weightNow} kg`} color={VF.accent} soft="#fff" />
        <Chip label="DPP" value={PREGNANCY.dpp.slice(0,5)} color={C.rose} soft="#fff" />
      </div>

      {/* Paridade */}
      <div style={{ padding: '16px 20px 0' }}>
        <SectionTitle>Paridade</SectionTitle>
        <Card padding={12}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {Object.entries({ G: PREGNANCY.gpa.g, P: PREGNANCY.gpa.p, A: PREGNANCY.gpa.a, 'P.N.': PREGNANCY.gpa.pn, 'P.C.': PREGNANCY.gpa.pc }).map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: VF.accentSoft, borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: VF.accentDeep, fontWeight: 700 }}>{k}</div>
                <div style={{ fontFamily: FONT_NUM, fontSize: 16, fontWeight: 800, color: VF.accentDeep, lineHeight: 1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.slate, lineHeight: 1.4 }}>{PREGNANCY.paridadeText}</div>
        </Card>
      </div>

      {/* Medicações em uso */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionTitle action="Ver tudo">Medicamentos em uso</SectionTitle>
        <Card padding={0}>
          {MEDS.map((m, i) => (
            <div key={i} style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: i < MEDS.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: VF.accent, marginTop: 6 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{m.name} <span style={{ fontWeight: 600, color: VF.accentDeep, fontFamily: FONT_NUM, fontSize: 11 }}>{m.dose}</span></div>
                <div style={{ fontSize: 10.5, color: C.slate, marginTop: 2 }}>{m.freq} · desde {m.since} · {m.why}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Comorbidades */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionTitle>Comorbidades</SectionTitle>
        <Card padding={12}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 11.5, color: C.ink, lineHeight: 1.6 }}>
            {PATIENT.comorbidades.map((c, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                <span style={{ color: VF.accentDeep, fontWeight: 700 }}>·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Antecedentes */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionTitle>Antecedentes</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Card padding={12}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Obstétricos</div>
            <div style={{ fontSize: 11, color: C.ink, marginTop: 6, lineHeight: 1.45 }}>
              {HISTORY.obstetric.map((o, i) => (
                <div key={i}>{o.kind} {o.year} ({o.ig}, {o.baby})</div>
              ))}
            </div>
          </Card>
          <Card padding={12}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Pessoais</div>
            <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', fontSize: 10.5, color: C.slate, lineHeight: 1.5 }}>
              {HISTORY.personal.map((p, i) => <li key={i}>· {p}</li>)}
            </ul>
          </Card>
          <Card padding={12} style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Familiares</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {HISTORY.family.map((f, i) => (
                <span key={i} style={{ fontSize: 10.5, color: C.ink, background: '#f1f5f9', padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>{f}</span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Intercorrências */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionTitle>Intercorrências da gestação</SectionTitle>
        <Card padding={0}>
          {PATIENT.intercorrencias.map((it, i, arr) => (
            <div key={i} style={{ padding: '10px 14px', display: 'flex', gap: 12, borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none' }}>
              <div style={{ fontSize: 11, color: VF.accentDeep, fontWeight: 700, fontFamily: FONT_NUM, minWidth: 48 }}>{it.ig}</div>
              <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.45 }}>{it.desc}</div>
            </div>
          ))}
          {PATIENT.intercorrencias.length === 0 && (
            <div style={{ padding: 14, fontSize: 11, color: C.slate, fontStyle: 'italic' }}>Sem intercorrências registradas até o momento.</div>
          )}
        </Card>
      </div>

      {/* Atalho de alertas (Alertas saiu da bottom nav) */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: C.warn, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b' }}>Sinais de alerta</div>
            <div style={{ fontSize: 10.5, color: '#7f1d1d', marginTop: 2 }}>Quando procurar a maternidade imediatamente</div>
          </div>
          <div style={{ color: '#991b1b', fontWeight: 800, fontSize: 18 }}>›</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VF_Header, VF_Capa, VF_PreNatal, VF_Exames, VF_LabDetail, VF_Vacinas, VF_Plano, VF_NavWarm });
