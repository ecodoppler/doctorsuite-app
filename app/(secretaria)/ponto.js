import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';

export default function PontoScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasJornada, setHasJornada] = useState(true);

  const load = useCallback(async () => {
    try {
      const jornada = await api('/api/ponto/minha-jornada').catch(() => []);
      if (!jornada || jornada.length === 0) { setHasJornada(false); setLoading(false); return; }
      const today = new Date().toISOString().slice(0, 10);
      const data = await api(`/api/ponto/meus-registros?date=${today}`);
      setRecords(data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrar = async (tipo) => {
    setRegistering(true);
    try {
      await api('/api/ponto/registrar', {
        method: 'POST',
        body: JSON.stringify({ type: tipo }),
      });
      Alert.alert('✅ Registrado', `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      load();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally { setRegistering(false); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  if (!hasJornada) return (
    <View style={s.center}>
      <Ionicons name="settings-outline" size={48} color={Colors.textMuted} />
      <Text style={s.emptyTitle}>Ponto não configurado</Text>
      <Text style={s.emptyText}>Solicite ao administrador que configure sua jornada de trabalho.</Text>
    </View>
  );

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={s.container}>
      <View style={s.clock}>
        <Text style={s.clockTime}>{now}</Text>
        <Text style={s.clockDate}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
      </View>

      <View style={s.buttons}>
        <TouchableOpacity style={[s.btn, { backgroundColor: Colors.success }]} onPress={() => registrar('entrada')} disabled={registering}>
          <Ionicons name="log-in-outline" size={28} color="#fff" />
          <Text style={s.btnText}>Entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: Colors.danger }]} onPress={() => registrar('saida')} disabled={registering}>
          <Ionicons name="log-out-outline" size={28} color="#fff" />
          <Text style={s.btnText}>Saída</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Registros de Hoje</Text>
      {records.length === 0 ? (
        <Text style={s.noRecords}>Nenhum registro hoje</Text>
      ) : records.map((r, i) => (
        <View key={i} style={s.record}>
          <Ionicons name={r.type === 'entrada' ? 'log-in' : 'log-out'} size={20} color={r.type === 'entrada' ? Colors.success : Colors.danger} />
          <Text style={s.recordType}>{r.type === 'entrada' ? 'Entrada' : 'Saída'}</Text>
          <Text style={s.recordTime}>{new Date(r.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.bg },
  clock: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.lg },
  clockTime: { fontSize: 48, fontWeight: '800', color: Colors.text, letterSpacing: -2 },
  clockDate: { fontSize: FontSize.md, color: Colors.textMuted, textTransform: 'capitalize', marginTop: Spacing.xs },
  buttons: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  btn: { flex: 1, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  noRecords: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
  record: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  recordType: { flex: 1, fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  recordTime: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 280 },
});
