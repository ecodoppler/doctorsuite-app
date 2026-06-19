import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import { requestPontoPermissions, captureSelfie, getCurrentLocation, registrarPonto } from '../../services/pontoCapture';
import ScreenHeader from '../../components/ScreenHeader';

// Tipos seguindo backend (server.js:23287)
const TYPES = {
  entrada: { label: 'Entrada', icon: 'log-in-outline', color: Colors.success },
  inicio_intervalo: { label: 'Início do intervalo', icon: 'cafe-outline', color: Colors.warning },
  fim_intervalo: { label: 'Fim do intervalo', icon: 'play-back-circle-outline', color: Colors.info },
  saida: { label: 'Saída', icon: 'log-out-outline', color: Colors.danger },
};

function greeting() {
  const hour = new Date().getHours();
  let saud = 'Olá';
  if (hour < 12) saud = 'Bom dia';
  else if (hour < 18) saud = 'Boa tarde';
  else saud = 'Boa noite';
  const user = getUser();
  const fullName = user?.name || '';
  const firstName = fullName.replace(/^(Dr\.?|Dra\.?)\s*/i, '').split(/\s+/)[0] || '';
  return firstName ? `${saud}, ${firstName}!` : `${saud}!`;
}

export default function PontoScreen() {
  const [config, setConfig] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasJornada, setHasJornada] = useState(true);
  const [loadError, setLoadError] = useState(false); // v0.0.650: distingue erro de rede de "sem jornada"
  const [tick, setTick] = useState(0); // refresh do relógio

  const load = useCallback(async () => {
    setLoadError(false);
    // v0.0.650: a jornada decide "configurado" — NÃO engolir o erro (antes, um 500/queda de rede
    // virava [] → falso "Ponto não configurado"). Erro de rede → estado de erro com "Tentar de novo".
    let jornada;
    try {
      jornada = await api('/api/ponto/minha-jornada');
    } catch (e) {
      console.warn('[ponto/jornada]', e?.message);
      setLoadError(true);
      setLoading(false);
      return;
    }
    if (!jornada || jornada.length === 0) {
      setHasJornada(false);
      setLoading(false);
      return;
    }
    setHasJornada(true);
    const cfg = await api('/api/ponto/config').catch(() => null);
    setConfig(cfg);
    const today = new Date().toISOString().slice(0, 10);
    const data = await api(`/api/ponto/meus-registros?date=${today}`).catch(() => []);
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  // Próximo tipo a registrar (entrada → intervalo → fim_intervalo → saída → entrada)
  const nextType = useMemo(() => {
    if (records.length === 0) return 'entrada';
    const last = records[records.length - 1]?.record_type;
    if (last === 'entrada') return 'inicio_intervalo';
    if (last === 'inicio_intervalo') return 'fim_intervalo';
    if (last === 'fim_intervalo') return 'saida';
    return 'entrada';
  }, [records, tick]);

  // Status atual derivado do último tipo
  const status = useMemo(() => {
    if (records.length === 0) return { key: 'aguardando', label: 'Aguardando entrada', color: Colors.textMuted };
    const last = records[records.length - 1]?.record_type;
    if (last === 'entrada' || last === 'fim_intervalo') return { key: 'em_jornada', label: 'Em jornada', color: Colors.success };
    if (last === 'inicio_intervalo') return { key: 'pausa', label: 'Em pausa', color: Colors.warning };
    if (last === 'saida') return { key: 'encerrado', label: 'Jornada encerrada', color: Colors.textMuted };
    return { key: 'aguardando', label: 'Aguardando', color: Colors.textMuted };
  }, [records, tick]);

  const registrar = async () => {
    setRegistering(true);
    const tipo = nextType;
    const tipoLabel = TYPES[tipo].label;
    try {
      // 1. Permissões (idempotente; OS lembra)
      const perms = await requestPontoPermissions();
      if (!perms.camera) {
        setRegistering(false);
        return;
      }

      // 2. Selfie (se config exige)
      let selfie = null;
      if (config?.selfie_required) {
        selfie = await captureSelfie();
        if (!selfie) {
          // user cancelou — abortar registro
          setRegistering(false);
          return;
        }
      }

      // 3. Localização (em paralelo seria ideal, mas captureSelfie já retornou)
      const loc = perms.location ? await getCurrentLocation() : null;
      if (config?.geofence_enabled && !loc) {
        Alert.alert(
          'Localização obrigatória',
          'A clínica exige geofencing. Ative a localização e tente novamente.'
        );
        setRegistering(false);
        return;
      }

      // 4. Registrar (multipart)
      const rec = await registrarPonto(tipo, { selfie, lat: loc?.lat, lng: loc?.lng });
      Alert.alert('✅ Ponto registrado', `${tipoLabel}\nNSR: ${rec.nsr}`);
      await load();
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Falha ao registrar ponto');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (loadError) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Ponto" right={getUser()?.clinic_name} />
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Não foi possível carregar</Text>
          <Text style={s.emptyText}>Verifique sua conexão e tente novamente.</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={s.retryBtn} activeOpacity={0.8}>
            <Text style={s.retryText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!hasJornada) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Ponto" right={getUser()?.clinic_name} />
        <View style={s.center}>
          <Ionicons name="settings-outline" size={48} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Ponto não configurado</Text>
          <Text style={s.emptyText}>Solicite ao administrador que configure sua jornada de trabalho.</Text>
        </View>
      </View>
    );
  }

  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateLong = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const next = TYPES[nextType];

  return (
    <View style={s.container}>
      <ScreenHeader title="Ponto" right={getUser()?.clinic_name} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
      <Text style={s.greeting}>{greeting()}</Text>
      <View style={s.statusRow}>
        <View style={[s.statusDot, { backgroundColor: status.color }]} />
        <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
      </View>

      <View style={s.clock}>
        <Text style={s.clockTime}>{time}</Text>
        <Text style={s.clockDate}>{dateLong.charAt(0).toUpperCase() + dateLong.slice(1)}</Text>
      </View>

      {status.key !== 'encerrado' && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: next.color }]}
          onPress={registrar}
          disabled={registering}
          activeOpacity={0.85}
        >
          {registering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={next.icon} size={28} color="#fff" />
              <Text style={s.btnText}>Registrar {next.label}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {status.key === 'encerrado' && (
        <View style={s.encerradoCard}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          <Text style={s.encerradoText}>Jornada de hoje encerrada</Text>
        </View>
      )}

      <View style={s.hints}>
        {config?.selfie_required && (
          <View style={s.hintItem}>
            <Ionicons name="camera-outline" size={14} color={Colors.textMuted} />
            <Text style={s.hintText}>Selfie obrigatória</Text>
          </View>
        )}
        {config?.geofence_enabled && (
          <View style={s.hintItem}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={s.hintText}>Geofence ativo · raio {config.geofence_radius_m || 100} m</Text>
          </View>
        )}
      </View>

      <Text style={s.sectionTitle}>Registros de hoje</Text>
      {records.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="hourglass-outline" size={28} color={Colors.textMuted} />
          <Text style={s.noRecords}>Nenhum registro hoje</Text>
        </View>
      ) : (
        records.map((r) => {
          const t = TYPES[r.record_type] || { label: r.record_type, icon: 'radio-button-on-outline', color: Colors.textMuted };
          const tStr = new Date(r.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return (
            <View key={r.id || r.nsr} style={[s.record, { borderLeftColor: t.color }]}>
              <Ionicons name={t.icon} size={20} color={t.color} />
              <View style={{ flex: 1 }}>
                <Text style={s.recordType}>{t.label}</Text>
                <Text style={s.recordNsr}>NSR {r.nsr}</Text>
              </View>
              <Text style={[s.recordTime, { color: t.color }]}>{tStr}</Text>
              {r.selfie_path ? (
                <Image
                  source={{ uri: r.selfie_path.startsWith('http') ? r.selfie_path : `https://doctorsuite.app${r.selfie_path}` }}
                  style={s.selfieThumb}
                />
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.bg },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, fontWeight: '600' },
  clock: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.lg },
  clockTime: { fontSize: 56, fontWeight: '800', color: Colors.text, letterSpacing: -2 },
  clockDate: { fontSize: FontSize.md, color: Colors.textMuted, textTransform: 'capitalize', marginTop: Spacing.xs },
  btn: { borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.lg },
  encerradoCard: { backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  encerradoText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.success },
  hints: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  hintItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  empty: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  noRecords: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.xs },
  record: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, borderLeftWidth: 4 },
  recordType: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  recordNsr: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  recordTime: { fontSize: FontSize.md, fontWeight: '700' },
  selfieThumb: { width: 32, height: 32, borderRadius: 16 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 280 },
  retryBtn: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primary },
  retryText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
