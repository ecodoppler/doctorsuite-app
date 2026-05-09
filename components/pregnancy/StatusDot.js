import { View } from 'react-native';
import { Status } from '../../services/theme';

const MAP = {
  ok:   { c: Status.ok,         bg: Status.okSoft },
  attn: { c: Status.attn,       bg: Status.attnSoft },
  pend: { c: Status.slateLight, bg: '#f1f5f9' },
  warn: { c: Status.warn,       bg: Status.warnSoft },
  info: { c: Status.info,       bg: Status.infoSoft },
};

// Dot 8px com halo soft 14px ao redor (substitui o box-shadow do mock web).
export default function StatusDot({ status = 'ok' }) {
  const m = MAP[status] || MAP.ok;
  return (
    <View style={{
      width: 14, height: 14, borderRadius: 99,
      backgroundColor: m.bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: m.c }} />
    </View>
  );
}
