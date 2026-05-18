// Variation A — Compacta & Glance
// Soft warm header + scrolling feed + glanceable visual cards.
// Patient-facing. Each screen = full phone content (consumed inside <IOSDevice> with no nav bar).

const VA = { // local palette accents
  warmTop: 'linear-gradient(180deg, #fce7d3 0%, #fdf3e8 60%, #f6f7fb 100%)',
  warmTop2: 'linear-gradient(180deg, #f7e6df 0%, #fcefe6 60%, #f6f7fb 100%)',
  cardShadow: '0 2px 4px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
};

// ── Screen 1: Capa / Resumo ───────────────────────────────────────────
function VA_Resumo({ topPad = 56 }) {
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  const pct = Math.round((igTotal / 280) * 100);
  return (
    <div style={{ background: VA.warmTop, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      {/* Header — warm, human */}
      <div style={{ padding: `${topPad}px 20px 0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cartão da Gestante</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 1.05, color: C.rose, marginTop: 6, fontWeight: 500, fontStyle: 'italic' }}>
              Olá, Ana
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.rose, fontSize: 14 }}>{PATIENT.initials}</div>
        </div>
        <div style={{ marginTop: 10 }}><RiskBadge level={PATIENT.risk} compact /></div>
      </div>

      {/* Big ring */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px 8px' }}>
        <ProgressRing size={216} stroke={12} value={igTotal} max={280} color={C.peachDeep} track="rgba(255,255,255,0.7)">
          <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Idade gestacional</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 56, lineHeight: 1, color: C.rose, marginTop: 4 }}>{PREGNANCY.igWeeks}<span style={{ fontSize: 22, marginLeft: 2 }}>s</span><span style={{ fontFamily: FONT_NUM, fontWeight: 700, fontSize: 20, marginLeft: 6, color: C.peachDeep }}>{PREGNANCY.igDays}d</span></div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 6, fontWeight: 600 }}>{PREGNANCY.trimester}º trimestre · {pct}% da jornada</div>
        </ProgressRing>
      </div>

      {/* Baby snippet */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)',
          borderRadius: 18, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.9)',
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ffe5d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🥥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.slate, fontWeight: 600 }}>Esta semana</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 18, color: C.rose, fontWeight: 500 }}>do tamanho de um coco</div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 2, fontFamily: FONT_NUM }}>≈ {PREGNANCY.babyApprox.length} cm · {(PREGNANCY.babyApprox.weight/1000).toFixed(2)} kg</div>
          </div>
        </div>
      </div>

      {/* Glance chips */}
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Chip icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 8 6 11 6 14a6 6 0 0012 0c0-3-2-6-6-12z"/></svg>} label="Tipo sanguíneo" value={PATIENT.blood} color={C.warn} soft="#fff" />
        <Chip icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21l-7-7a5 5 0 017-7 5 5 0 017 7l-7 7z"/></svg>} label="Próxima consulta" value="14/05 · 09h" color={C.indigo} soft="#fff" />
        <Chip icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18"/></svg>} label="Peso atual" value={`${PATIENT.weightNow} kg`} color={C.peachDeep} soft="#fff" />
        <Chip icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>} label="DPP" value={PREGNANCY.dpp.slice(0,5)} color={C.rose} soft="#fff" />
      </div>

      {/* Next consultation card */}
      <div style={{ padding: '16px 20px 0' }}>
        <SectionTitle action="Ver agenda →">Próxima consulta</SectionTitle>
        <div style={{ background: C.white, borderRadius: 18, padding: 16, boxShadow: VA.cardShadow, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 64, borderRadius: 14, background: C.indigoSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.indigo }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6 }}>MAI</div>
            <div style={{ fontFamily: FONT_NUM, fontWeight: 700, fontSize: 24, lineHeight: 1 }}>14</div>
            <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>QUI</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Consulta Obstétrica</div>
            <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>09:00 · {PREGNANCY.next.who}</div>
            <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{PATIENT.clinic}</div>
          </div>
          <div style={{ color: C.slateLight }}>›</div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionTitle>Atalhos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { i: '📈', l: 'Pré-natal' },
            { i: '🧪', l: 'Exames' },
            { i: '💉', l: 'Vacinas' },
            { i: '🚨', l: 'Alertas' },
          ].map((q, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: '12px 6px', textAlign: 'center', boxShadow: VA.cardShadow }}>
              <div style={{ fontSize: 22 }}>{q.i}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: C.slate, marginTop: 4 }}>{q.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: Pré-natal — gráficos ─────────────────────────────────────
function VA_PreNatal({ topPad = 56 }) {
  const weights = VISITS.map(v => v.weight);
  const sysList = VISITS.map(v => +v.pa.split('/')[0]);
  const auList = VISITS.filter(v => v.au != null).map(v => v.au);
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <div style={{ padding: `${topPad}px 20px 4px` }}>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Pré-natal</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.ink, marginTop: 4, fontWeight: 500 }}>Como você tem evoluído</div>
      </div>

      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600 }}>PESO</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{PATIENT.weightNow}<span style={{ fontSize: 13, color: C.slate, fontWeight: 600, marginLeft: 4 }}>kg</span></div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, whiteSpace: 'nowrap' }}>Ganho total</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ok, whiteSpace: 'nowrap' }}>+{(PATIENT.weightNow - PATIENT.weightPre).toFixed(1)} kg</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Spark data={weights} w={280} h={68} color={C.peachDeep} fill="rgba(232,153,118,0.16)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.slateLight, fontWeight: 600 }}>
            <span>6s</span><span>14s</span><span>22s</span><span>30s</span>
          </div>
        </Card>

        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, whiteSpace: 'nowrap' }}>PRESSÃO ARTERIAL</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.1, whiteSpace: 'nowrap' }}>120/78<span style={{ fontSize: 13, color: C.slate, fontWeight: 600, marginLeft: 4 }}>mmHg</span></div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, whiteSpace: 'nowrap' }}>Última aferição</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ok, whiteSpace: 'nowrap' }}>Normal</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Spark data={sysList} w={280} h={68} color={C.indigo} fill="rgba(91,92,246,0.14)" />
          </div>
        </Card>

        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, whiteSpace: 'nowrap' }}>ALTURA UTERINA</div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.1, whiteSpace: 'nowrap' }}>30<span style={{ fontSize: 13, color: C.slate, fontWeight: 600, marginLeft: 4 }}>cm</span></div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>BCF</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM, whiteSpace: 'nowrap' }}>140 bpm</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Spark data={auList} w={280} h={56} color={C.rose} fill="rgba(58,35,54,0.10)" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Screen 3: Consultas (timeline) ─────────────────────────────────────
function VA_Consultas({ topPad = 56 }) {
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <div style={{ padding: `${topPad}px 20px 4px` }}>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Consultas pré-natais</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.ink, marginTop: 4, fontWeight: 500 }}>{VISITS.length} consultas realizadas</div>
      </div>
      <div style={{ padding: '12px 20px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 36, top: 24, bottom: 8, width: 2, background: C.borderSoft }} />
        {VISITS.slice().reverse().map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, position: 'relative' }}>
            <div style={{ width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: 99, background: i === 0 ? C.peachDeep : C.white, border: `2px solid ${i === 0 ? C.peachDeep : C.borderSoft}`, marginTop: 14, zIndex: 1 }} />
            </div>
            <div style={{ flex: 1, background: C.white, borderRadius: 14, padding: 12, border: '1px solid ' + C.borderSoft }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{v.date}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo }}>{v.ig}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: C.slate, flexWrap: 'wrap' }}>
                <span>⚖ <strong style={{ color: C.ink }}>{v.weight} kg</strong></span>
                <span>♥ <strong style={{ color: C.ink }}>{v.pa}</strong></span>
                {v.au && <span>AU <strong style={{ color: C.ink }}>{v.au}</strong></span>}
                {v.bcf && <span>BCF <strong style={{ color: C.ink }}>{v.bcf}</strong></span>}
              </div>
              {v.notes && <div style={{ fontSize: 11, color: C.slate, marginTop: 6, lineHeight: 1.4 }}>{v.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 4: Exames + USG (combined) ─────────────────────────────────
function VA_Exames({ topPad = 56 }) {
  const [tab, setTab] = React.useState(2);
  const trims = ['1º Trimestre', '2º Trimestre', '3º Trimestre', 'Ultrassons'];
  const labs = [LABS.T1, LABS.T2, LABS.T3, USG][tab];
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <div style={{ padding: `${topPad}px 20px 4px` }}>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Exames</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.ink, marginTop: 4, fontWeight: 500 }}>Resultados &amp; ultrassons</div>
      </div>
      <div style={{ padding: '12px 20px 0' }}>
        <Tabs items={trims} active={tab} onChange={setTab} />
      </div>
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tab < 3 ? labs.map((l, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid ' + C.borderSoft }}>
            <StatusDot status={l.status} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{l.name}</div>
              <div style={{ fontSize: 11, color: C.slate }}>{l.date}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{l.result}</div>
          </div>
        )) : labs.map((u, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: 14, border: '1px solid ' + C.borderSoft }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{u.kind}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.indigo }}>{u.ig}</div>
            </div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 2, fontFamily: FONT_NUM }}>{u.date}</div>
            <div style={{ fontSize: 12, color: C.ink2, marginTop: 6, lineHeight: 1.4 }}>{u.finding}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 5: Alertas + Maternidade ────────────────────────────────────
function VA_Alertas({ topPad = 56 }) {
  return (
    <div style={{ background: VA.warmTop2, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <div style={{ padding: `${topPad}px 20px 4px` }}>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Sinais de alerta</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.rose, marginTop: 4, fontWeight: 500 }}>Quando procurar a maternidade</div>
      </div>

      {/* SOS card */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: C.warn, borderRadius: 18, padding: 16, color: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{PATIENT.maternity.name}</div>
            <div style={{ fontSize: 12, opacity: 0.92 }}>{PATIENT.maternity.distance} · {PATIENT.maternity.phone}</div>
          </div>
          <div style={{ background: C.white, color: C.warn, padding: '8px 12px', borderRadius: 10, fontWeight: 800, fontSize: 12 }}>LIGAR</div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <SectionTitle>Procure imediatamente se</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALERTS.map((a, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center', border: '1px solid ' + C.borderSoft }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{a.title}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 2, lineHeight: 1.35 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen 6: Compartilhar ────────────────────────────────────────────
function VA_Compartilhar({ topPad = 56 }) {
  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: FONT_UI, paddingBottom: 100 }}>
      <div style={{ padding: `${topPad}px 20px 4px` }}>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Compartilhar cartão</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.ink, marginTop: 4, fontWeight: 500 }}>Para a maternidade ou plantão</div>
      </div>

      {/* QR card */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: C.white, borderRadius: 22, padding: 22, border: '1px solid ' + C.borderSoft, textAlign: 'center' }}>
          <div style={{
            width: 196, height: 196, margin: '0 auto', borderRadius: 12,
            background: `
              radial-gradient(circle at 18% 18%, ${C.ink} 0 18px, transparent 19px),
              radial-gradient(circle at 82% 18%, ${C.ink} 0 18px, transparent 19px),
              radial-gradient(circle at 18% 82%, ${C.ink} 0 18px, transparent 19px),
              repeating-conic-gradient(${C.ink} 0 25%, transparent 0 50%) 50% 50% / 14px 14px
            `,
            backgroundColor: 'white',
            border: '8px solid white',
            boxShadow: '0 0 0 1px ' + C.borderSoft,
          }} />
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: FONT_DISPLAY, fontStyle: 'italic' }}>{PATIENT.fullName}</div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>Vigência: 09/05/2026 às 23:59 · {PATIENT.clinic}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { i: '📄', l: 'PDF' },
          { i: '🔗', l: 'Link' },
          { i: '💬', l: 'WhatsApp' },
        ].map((q, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: '14px 6px', textAlign: 'center', border: '1px solid ' + C.borderSoft }}>
            <div style={{ fontSize: 22 }}>{q.i}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, marginTop: 4 }}>{q.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Bottom nav for VA
function VA_Nav({ active = 0 }) {
  return <BottomNav active={active} items={[
    { icon: '🏠', label: 'Início' },
    { icon: '📊', label: 'Pré-natal' },
    { icon: '📅', label: 'Consultas' },
    { icon: '🧪', label: 'Exames' },
    { icon: '👤', label: 'Perfil' },
  ]} />;
}

Object.assign(window, { VA_Resumo, VA_PreNatal, VA_Consultas, VA_Exames, VA_Alertas, VA_Compartilhar, VA_Nav });
