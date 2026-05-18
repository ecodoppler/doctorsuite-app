// PDF preview — A4 print version of the pregnancy card
// Static composition designed at A4 ratio (594x840 displayed at scale)

function PDFPreview() {
  const igTotal = PREGNANCY.igWeeks * 7 + PREGNANCY.igDays;
  return (
    <div style={{
      width: 594, minHeight: 840, background: 'white', fontFamily: FONT_UI,
      color: C.ink, padding: '32px 36px', boxSizing: 'border-box',
      boxShadow: '0 12px 32px rgba(15,23,42,0.10)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${C.indigo}`, paddingBottom: 14 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 26, color: C.indigoDeep, fontWeight: 600, lineHeight: 1 }}>Cartão da Gestante</div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{PATIENT.clinic} · Emitido em 09/05/2026</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: C.slate, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>DoctorSuite</div>
          <div style={{ fontFamily: FONT_NUM, fontSize: 11, color: C.ink, fontWeight: 600 }}>nº 2026-A50421</div>
          <div style={{ marginTop: 4 }}><RiskBadge level={PATIENT.risk} compact /></div>
        </div>
      </div>

      {/* Identification block */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
        <div>
          <div style={{ fontSize: 9, color: C.slate, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gestante</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginTop: 2 }}>{PATIENT.fullName}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, fontSize: 10 }}>
            {[
              ['Nasc.', PATIENT.birth],
              ['Idade', `${PATIENT.age} anos`],
              ['CPF', PATIENT.cpf],
              ['Altura', `${PATIENT.height} cm`],
              ['Sangue', PATIENT.blood],
              ['Telefone', PATIENT.phone],
            ].map(([k, v], i) => (
              <div key={i}>
                <div style={{ color: C.slate, fontWeight: 600 }}>{k}</div>
                <div style={{ color: C.ink, fontWeight: 700, fontFamily: FONT_NUM }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.indigoSoft, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.indigoDeep, fontWeight: 700, textTransform: 'uppercase' }}>Idade gestacional hoje</div>
          <div style={{ fontFamily: FONT_NUM, fontSize: 32, fontWeight: 800, color: C.indigoDeep, lineHeight: 1, marginTop: 4 }}>
            {PREGNANCY.igWeeks}<span style={{ fontSize: 16 }}>s</span> {PREGNANCY.igDays}<span style={{ fontSize: 12 }}>d</span>
          </div>
          <div style={{ fontSize: 9, color: C.indigoDeep, fontWeight: 700, marginTop: 6 }}>DUM {PREGNANCY.dum} · DPP {PREGNANCY.dpp}</div>
        </div>
      </div>

      {/* Antecedentes + Plano */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Antecedentes</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {Object.entries({ G: PREGNANCY.gpa.g, P: PREGNANCY.gpa.p, A: PREGNANCY.gpa.a, 'P.N.': PREGNANCY.gpa.pn, 'P.C.': PREGNANCY.gpa.pc }).map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: '#f6f7fb', borderRadius: 6, padding: '4px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: C.slate, fontWeight: 700 }}>{k}</div>
                <div style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9.5, color: C.slate, lineHeight: 1.4 }}>
            <div>Parto normal 2019, 39s2d, 3.180 g.</div>
            <div>Nega HAS/DM/alergias. Apendicectomia 2012.</div>
            <div>Mãe HAS · Pai DM2.</div>
          </div>
        </div>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Plano de parto</div>
          <div style={{ fontSize: 9.5, color: C.ink, lineHeight: 1.5 }}>
            Via: <strong>{BIRTH_PLAN.preference}</strong> · Acomp.: {BIRTH_PLAN.companion}<br/>
            Aleitamento materno exclusivo · Pele a pele imediato.<br/>
            <span style={{ color: C.slate }}>{BIRTH_PLAN.notes}</span>
          </div>
        </div>
      </div>

      {/* Pré-natal table */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Consultas pré-natais</div>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr 0.7fr 0.6fr 0.6fr 2fr', fontSize: 9, color: C.slate, fontWeight: 700, padding: '6px 10px', borderBottom: '1px solid ' + C.border, textTransform: 'uppercase', background: '#fafbfd' }}>
            <span>Data</span><span>IG</span><span>Peso</span><span>PA</span><span>AU</span><span>BCF</span><span>Observações</span>
          </div>
          {VISITS.map((v, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr 0.7fr 0.6fr 0.6fr 2fr', fontSize: 9.5, padding: '6px 10px', borderBottom: i < arr.length - 1 ? '1px solid ' + C.borderSoft : 'none', alignItems: 'center', fontFamily: FONT_NUM }}>
              <span style={{ fontWeight: 700, color: C.ink }}>{v.date}</span>
              <span style={{ color: C.indigo, fontWeight: 700 }}>{v.ig}</span>
              <span>{v.weight}</span>
              <span>{v.pa}</span>
              <span>{v.au || '—'}</span>
              <span>{v.bcf || '—'}</span>
              <span style={{ fontFamily: FONT_UI, color: C.slate }}>{v.notes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Labs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
        {[
          { tr: '1º Trim.', items: LABS.T1 },
          { tr: '2º Trim.', items: LABS.T2 },
          { tr: '3º Trim.', items: LABS.T3 },
        ].map((tg, k) => (
          <div key={k} style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{tg.tr}</div>
            {tg.items.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, padding: '2px 0', borderBottom: i < tg.items.length - 1 ? '1px dashed ' + C.borderSoft : 'none' }}>
                <span style={{ color: C.slate }}>{l.name}</span>
                <span style={{ color: C.ink, fontWeight: 700, fontFamily: FONT_NUM }}>{l.result}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* USG + Vacinas + Maternidade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10, marginTop: 14 }}>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Ultrassons</div>
          {USG.map((u, i) => (
            <div key={i} style={{ fontSize: 8.5, marginBottom: 6, lineHeight: 1.35 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: C.ink }}>{u.kind}</strong>
                <span style={{ color: C.indigo, fontWeight: 700, fontFamily: FONT_NUM }}>{u.date} · {u.ig}</span>
              </div>
              <div style={{ color: C.slate }}>{u.finding}</div>
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Vacinas</div>
          {VACCINES.map((v, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, padding: '2px 0' }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>{v.name.split(' (')[0]}</span>
              <span style={{ color: C.ok, fontWeight: 700, fontFamily: FONT_NUM }}>✓ {v.date.slice(0,5)}</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', margin: '8px 0 4px' }}>Medicações</div>
          {MEDS.map((m, i) => (
            <div key={i} style={{ fontSize: 8.5, color: C.slate }}>{m.name} <strong style={{ color: C.ink }}>{m.dose}</strong> · {m.freq}</div>
          ))}
        </div>
        <div style={{ border: '1px solid ' + C.border, borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Maternidade</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.ink }}>{PATIENT.maternity.name}</div>
          <div style={{ fontSize: 8.5, color: C.slate, marginTop: 2, lineHeight: 1.35 }}>{PATIENT.maternity.address}</div>
          <div style={{ fontSize: 9, color: C.ink, fontWeight: 700, marginTop: 4, fontFamily: FONT_NUM }}>{PATIENT.maternity.phone}</div>
          <div style={{ fontSize: 9, color: C.indigo, fontWeight: 800, textTransform: 'uppercase', margin: '8px 0 4px' }}>Médico</div>
          <div style={{ fontSize: 9.5, color: C.ink, fontWeight: 700 }}>{PATIENT.doctor}</div>
          <div style={{ fontSize: 8.5, color: C.slate }}>{PATIENT.doctorCrm}</div>
        </div>
      </div>

      {/* Alerts banner */}
      <div style={{ marginTop: 14, background: '#fff5f5', border: '1px solid ' + C.warnSoft, borderRadius: 8, padding: 10 }}>
        <div style={{ fontSize: 9, color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sinais de alerta — procure a maternidade imediatamente</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6, fontSize: 9, color: '#7f1d1d' }}>
          {ALERTS.map((a, i) => (
            <div key={i}><strong>{a.title}</strong> — <span style={{ opacity: 0.85 }}>{a.detail}</span></div>
          ))}
        </div>
      </div>

      {/* Footer with QR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 10, borderTop: '1px solid ' + C.borderSoft }}>
        <div style={{ fontSize: 8, color: C.slate, lineHeight: 1.5 }}>
          Documento informativo gerado automaticamente pelo prontuário eletrônico DoctorSuite. <br/>
          Não substitui parecer médico. Para versão sempre atualizada, leia o QR.
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 4,
          background: `repeating-conic-gradient(${C.ink} 0 25%, white 0 50%) 0 0 / 6px 6px`,
          border: '2px solid white', boxShadow: '0 0 0 1px ' + C.border,
        }} />
      </div>
    </div>
  );
}

Object.assign(window, { PDFPreview });
