// Shared visual primitives used across both variations

const C = {
  // brand
  indigo: '#5B5CF6',
  indigoDeep: '#4338ca',
  indigoSoft: '#eef0ff',
  indigoBg: '#f5f6fa',
  // human / warm
  cream: '#fef7f0',
  peach: '#f6c9b4',
  peachDeep: '#e89976',
  rose: '#3a2336',
  roseSoft: '#f7e6df',
  // clinical
  ink: '#0f172a',
  ink2: '#1e293b',
  slate: '#475569',
  slateLight: '#94a3b8',
  border: '#e2e8f0',
  borderSoft: '#eef2f7',
  bg: '#f6f7fb',
  white: '#ffffff',
  // status
  ok: '#10b981',
  okSoft: '#d1fae5',
  attn: '#f59e0b',
  attnSoft: '#fef3c7',
  warn: '#ef4444',
  warnSoft: '#fee2e2',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
};

const FONT_UI = 'Inter, -apple-system, "SF Pro", system-ui, sans-serif';
const FONT_DISPLAY = '"Fraunces", Georgia, serif';
const FONT_NUM = '"Inter Tight", Inter, system-ui, sans-serif';

// — Risk pill (subtle in header)
function RiskBadge({ level = 'baixo', compact = false }) {
  const map = {
    baixo:    { label: 'Baixo risco',    dot: C.ok,   bg: '#ecfdf5', tx: '#065f46' },
    habitual: { label: 'Risco habitual', dot: C.info, bg: C.infoSoft, tx: '#075985' },
    alto:     { label: 'Alto risco',     dot: C.warn, bg: C.warnSoft, tx: '#991b1b' },
  };
  const s = map[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: compact ? '3px 8px' : '4px 10px',
      borderRadius: 999, background: s.bg, color: s.tx,
      fontSize: compact ? 11 : 12, fontWeight: 600, fontFamily: FONT_UI,
      letterSpacing: 0.1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.dot }} />
      {s.label}
    </span>
  );
}

// — Progress ring for gestational age
function ProgressRing({ size = 168, stroke = 10, value, max = 280, color = C.indigo, track = '#e9ecf6', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(value, max) / max) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// — Compact metric chip
function Chip({ icon, label, value, color = C.indigo, soft = C.indigoSoft }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px', borderRadius: 12,
      background: soft, color: C.ink, fontFamily: FONT_UI,
    }}>
      {icon && <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: FONT_NUM }}>{value}</span>
      </div>
    </div>
  );
}

// — Section title
function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px 8px' }}>
      <h3 style={{ margin: 0, fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: C.slate, letterSpacing: 0.6, textTransform: 'uppercase' }}>{children}</h3>
      {action && <span style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, color: C.indigo }}>{action}</span>}
    </div>
  );
}

// — Card
function Card({ children, style = {}, padding = 16 }) {
  return (
    <div style={{
      background: C.white, borderRadius: 18, padding,
      boxShadow: '0 1px 0 rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.04)',
      border: '1px solid ' + C.borderSoft,
      ...style,
    }}>{children}</div>
  );
}

// — Status dot for labs
function StatusDot({ status }) {
  const map = {
    ok:   { c: C.ok,   bg: C.okSoft },
    attn: { c: C.attn, bg: C.attnSoft },
    pend: { c: C.slateLight, bg: '#f1f5f9' },
    warn: { c: C.warn, bg: C.warnSoft },
    info: { c: C.info, bg: C.infoSoft },
  };
  const s = map[status] || map.ok;
  return <span style={{ width: 8, height: 8, borderRadius: 99, background: s.c, boxShadow: `0 0 0 3px ${s.bg}`, display: 'inline-block' }} />;
}

// — Tab strip
function Tabs({ items, active, onChange, color = C.indigo }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: '#eef0f6', borderRadius: 12, fontFamily: FONT_UI }}>
      {items.map((it, i) => (
        <button key={i} onClick={() => onChange?.(i)} style={{
          flex: 1, border: 0, padding: '8px 10px', borderRadius: 9,
          background: i === active ? C.white : 'transparent',
          color: i === active ? C.ink : C.slate,
          fontWeight: i === active ? 700 : 600, fontSize: 12,
          boxShadow: i === active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
          cursor: 'pointer',
        }}>{it}</button>
      ))}
    </div>
  );
}

// — Tiny line chart (sparkline)
function Spark({ data, w = 280, h = 64, color = C.indigo, fill = 'rgba(91,92,246,0.12)', dots = true }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(0.0001, max - min);
  const px = (i) => (i / (data.length - 1)) * (w - 8) + 4;
  const py = (v) => h - 8 - ((v - min) / span) * (h - 16);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = path + ` L ${px(data.length-1)} ${h} L ${px(0)} ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={area} fill={fill} />
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {dots && data.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={2.5} fill={C.white} stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// — Bottom nav (iOS / Android-agnostic)
function BottomNav({ items, active = 0 }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 8px 14px', background: C.white,
      borderTop: '1px solid ' + C.borderSoft, fontFamily: FONT_UI,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: i === active ? C.indigo : C.slateLight, fontSize: 10, fontWeight: 600 }}>
          <div style={{ fontSize: 18 }}>{it.icon}</div>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { C, FONT_UI, FONT_DISPLAY, FONT_NUM, RiskBadge, ProgressRing, Chip, SectionTitle, Card, StatusDot, Tabs, Spark, BottomNav });
