import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/pregnancy/Card';
import RiskBadge from '../../../components/pregnancy/RiskBadge';
import ProgressRing from '../../../components/pregnancy/ProgressRing';
import Chip from '../../../components/pregnancy/Chip';
import SectionTitle from '../../../components/pregnancy/SectionTitle';
import { Fonts, Status, Warm } from '../../../services/theme';
import { usePregnancy } from '../../../services/pregnancy-context';
import { useNotifications } from '../../../services/notifications-context';

const firstName = (full) => (full || '').trim().split(' ')[0] || '';

// Sino com badge funcional. Lê unreadCount do NotificationsContext.
function NotificationBell({ onPress, color = Warm.accentDeep }) {
  const { unreadCount } = useNotifications();
  const showBadge = unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [s.bellBtn, pressed && { opacity: 0.6 }]}
      accessibilityLabel={showBadge ? `${unreadCount} notificações não lidas` : 'Notificações'}
    >
      <Ionicons name="notifications-outline" size={22} color={color} />
      {showBadge && (
        <View style={s.bellBadge}>
          <Text style={s.bellBadgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, error: err, reload } = usePregnancy();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  // Loading inicial
  if (loading) {
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={Warm.accentDeep} />
        </View>
      </LinearGradient>
    );
  }

  // Erro de rede
  if (err) {
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <View style={[s.loaderWrap, { padding: 24 }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
          <Text style={s.errText}>Não foi possível carregar.{'\n'}{err}</Text>
          <Pressable onPress={reload} style={s.retryBtn}>
            <Text style={s.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const patient = data?.patient || {};
  const pregnancy = data?.pregnancy;
  const nextAppointment = data?.nextAppointment || null;

  // ─── Sem gestação ativa: hub com acesso rápido ───
  if (!pregnancy) {
    const ACTIONS = [
      { key: 'agendamentos', label: 'Consultas', icon: 'calendar-outline', target: '/(paciente)/agendamentos' },
      { key: 'laudos',       label: 'Laudos',    icon: 'document-text-outline', target: '/(paciente)/laudos' },
      { key: 'documentos',   label: 'Documentos',icon: 'shield-checkmark-outline', target: '/(paciente)/documentos' },
      { key: 'perfil',       label: 'Perfil',    icon: 'person-circle-outline', target: '/(paciente)/perfil' },
    ];
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header: saudação + sino */}
          <View style={s.hubHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.hubEyebrow}>Olá, {firstName(patient.name) || 'paciente'} 👋</Text>
              <Text style={s.hubGreeting}>Seu cartão</Text>
            </View>
            <NotificationBell onPress={() => router.push('/(paciente)/notificacoes')} />
          </View>

          {/* Próxima consulta */}
          {nextAppointment ? (
            <Pressable
              style={({ pressed }) => [s.nextCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(paciente)/agendamentos')}
            >
              <View style={s.nextIcon}>
                <Ionicons name="calendar" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.nextEyebrow}>Próxima consulta</Text>
                <Text style={s.nextWhen}>
                  {nextAppointment.date}{nextAppointment.time ? ` · ${nextAppointment.time}` : ''}
                </Text>
                <Text style={s.nextWho} numberOfLines={1}>
                  {nextAppointment.kind}{nextAppointment.who ? ` · ${nextAppointment.who}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Status.slate} />
            </Pressable>
          ) : (
            <Card padding={14} style={{ marginHorizontal: 16, marginTop: 16 }}>
              <View style={s.noNextRow}>
                <Ionicons name="calendar-outline" size={20} color={Status.slate} />
                <Text style={s.noNextText}>Nenhuma consulta agendada</Text>
              </View>
            </Card>
          )}

          {/* Grid 2x2 de ações */}
          <SectionTitle style={{ marginTop: 18 }}>Acesso rápido</SectionTitle>
          <View style={s.actionsGrid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.key}
                style={({ pressed }) => [s.actionCard, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(a.target)}
              >
                <View style={s.actionIconWrap}>
                  <Ionicons name={a.icon} size={26} color={Warm.accentDeep} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </LinearGradient>
    );
  }

  const meds = data.meds || [];
  const allergies = data.allergies || []; // v0.0.307
  const history = data.history || { obstetric: [], personal: [], family: [] };

  const igTotal = pregnancy.igWeeks * 7 + pregnancy.igDays;
  const pct = Math.round((igTotal / 280) * 100);
  const dppShort = pregnancy.dpp ? pregnancy.dpp.slice(0, 5) : '—';
  const next = pregnancy.next;
  const nextLabel = next ? `${next.date} · ${next.time}` : '—';

  return (
    <LinearGradient
      colors={Warm.coverGradient}
      locations={Warm.coverGradientStops}
      style={s.gradient}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {/* Header warm */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>Cartão da Gestante</Text>
            <Text style={s.greeting}>Olá, {firstName(patient.name)}</Text>
          </View>
          <NotificationBell onPress={() => router.push('/(paciente)/notificacoes')} />
          <View style={s.avatar}>
            <Text style={s.avatarText}>{patient.initials}</Text>
          </View>
        </View>
        <View style={s.riskRow}>
          <RiskBadge level={patient.risk || 'habitual'} compact />
          <View style={s.shortcuts}>
            <Pressable
              style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(paciente)/agendamentos')}
            >
              <Ionicons name="calendar-outline" size={13} color={Warm.accentDeep} />
              <Text style={s.shortcutText}>Consultas</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(paciente)/laudos')}
            >
              <Ionicons name="document-text-outline" size={13} color={Warm.accentDeep} />
              <Text style={s.shortcutText}>Laudos</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(paciente)/documentos')}
            >
              <Ionicons name="shield-checkmark-outline" size={13} color={Warm.accentDeep} />
              <Text style={s.shortcutText}>Documentos</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(paciente)/vacinas')}
            >
              <Ionicons name="medkit-outline" size={13} color={Warm.accentDeep} />
              <Text style={s.shortcutText}>Vacinas</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(paciente)/plano')}
            >
              <Ionicons name="clipboard-outline" size={13} color={Warm.accentDeep} />
              <Text style={s.shortcutText}>Plano</Text>
            </Pressable>
          </View>
        </View>

        {/* Anel de IG */}
        <View style={s.ringWrap}>
          <ProgressRing
            size={196} stroke={12}
            value={igTotal} max={280}
            color={Warm.accent} track="rgba(255,255,255,0.7)"
          >
            <Text style={s.ringEyebrow}>Idade gestacional</Text>
            <View style={s.ringIGRow}>
              <Text style={s.ringIG}>{pregnancy.igWeeks}</Text>
              <Text style={s.ringIGSuffix}>s</Text>
              <Text style={s.ringIGDays}>{pregnancy.igDays}d</Text>
            </View>
            <Text style={s.ringSubtitle}>{pregnancy.trimester}º trim · {pct}% da jornada</Text>
          </ProgressRing>
        </View>

        {/* Glance chips 2x2 */}
        <View style={s.chipsGrid}>
          <View style={s.chipCol}><Chip label="Tipo sanguíneo" value={patient.blood || '—'} /></View>
          <View style={s.chipCol}><Chip label="Próxima consulta" value={nextLabel} /></View>
          <View style={s.chipCol}><Chip label="Peso atual" value={patient.weightNow != null ? `${patient.weightNow} kg` : '—'} /></View>
          <View style={s.chipCol}><Chip label="DPP" value={dppShort} /></View>
        </View>

        {/* Paridade */}
        <Section>
          <SectionTitle>Paridade</SectionTitle>
          <Card padding={12}>
            <View style={s.gpaRow}>
              {[
                ['G', pregnancy.gpa.g],
                ['P', pregnancy.gpa.p],
                ['A', pregnancy.gpa.a],
                ['P.N.', pregnancy.gpa.pn],
                ['P.C.', pregnancy.gpa.pc],
              ].map(([k, v]) => (
                <View key={k} style={s.gpaTile}>
                  <Text style={s.gpaLabel}>{k}</Text>
                  <Text style={s.gpaValue}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={s.gpaText}>{pregnancy.paridadeText}</Text>
          </Card>
        </Section>

        {/* Medicamentos em uso */}
        {meds.length > 0 && (
          <Section>
            <SectionTitle>Medicamentos em uso</SectionTitle>
            <Card padding={0}>
              {meds.map((m, i) => (
                <View key={i} style={[s.medItem, i < meds.length - 1 && s.itemBorder]}>
                  <View style={s.medBullet} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.medName}>
                      {m.name}{m.dose ? <Text style={s.medDose}> {m.dose}</Text> : null}
                    </Text>
                    {(m.freq || m.since || m.why) && (
                      <Text style={s.medMeta}>
                        {[m.freq, m.since && `desde ${m.since}`, m.why].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Alergias — v0.0.307 */}
        {allergies.length > 0 && (
          <Section>
            <SectionTitle>Alergias</SectionTitle>
            <Card padding={0}>
              {allergies.map((a, i) => (
                <View key={i} style={[s.medItem, i < allergies.length - 1 && s.itemBorder]}>
                  <View style={s.allergyBullet} />
                  <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.medName}>{a.name}</Text>
                    {a.kind === 'product' && (
                      <Text style={s.allergyKindBadge}>Comercial</Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Comorbidades */}
        <Section>
          <SectionTitle>Comorbidades</SectionTitle>
          <Card padding={12}>
            {(patient.comorbidades && patient.comorbidades.length > 0)
              ? patient.comorbidades.map((c, i) => (
                  <View key={i} style={s.bulletRow}>
                    <Text style={s.bulletDot}>·</Text>
                    <Text style={s.bulletText}>{c}</Text>
                  </View>
                ))
              : <Text style={s.empty}>Sem comorbidades crônicas</Text>}
          </Card>
        </Section>

        {/* Antecedentes */}
        {(history.obstetric.length > 0 || history.personal.length > 0 || history.family.length > 0) && (
          <Section>
            <SectionTitle>Antecedentes</SectionTitle>
            {(history.obstetric.length > 0 || history.personal.length > 0) && (
              <View style={s.histRow}>
                {history.obstetric.length > 0 && (
                  <View style={s.histCol}>
                    <Card padding={12}>
                      <Text style={s.histLabel}>Obstétricos</Text>
                      {history.obstetric.map((o, i) => {
                        const meta = [o.ig, o.baby].filter(Boolean).join(', ');
                        return (
                          <Text key={i} style={s.histText}>
                            {o.kind}{o.year ? ` ${o.year}` : ''}{meta ? ` (${meta})` : ''}
                          </Text>
                        );
                      })}
                    </Card>
                  </View>
                )}
                {history.personal.length > 0 && (
                  <View style={s.histCol}>
                    <Card padding={12}>
                      <Text style={s.histLabel}>Pessoais</Text>
                      {history.personal.map((p, i) => (
                        <Text key={i} style={s.histBullet}>· {p}</Text>
                      ))}
                    </Card>
                  </View>
                )}
              </View>
            )}
            {history.family.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Card padding={12}>
                  <Text style={s.histLabel}>Familiares</Text>
                  <View style={s.familyPills}>
                    {history.family.map((f, i) => (
                      <View key={i} style={s.pill}>
                        <Text style={s.pillText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </View>
            )}
          </Section>
        )}

        {/* Intercorrências */}
        <Section>
          <SectionTitle>Intercorrências da gestação</SectionTitle>
          <Card padding={12}>
            {patient.intercorrencias && patient.intercorrencias.length > 0
              ? patient.intercorrencias.map((it, i) => (
                  <View key={i} style={s.bulletRow}>
                    <Text style={s.bulletDot}>·</Text>
                    <Text style={s.bulletText}>{it}</Text>
                  </View>
                ))
              : <Text style={s.empty}>Sem intercorrências registradas até o momento.</Text>}
          </Card>
        </Section>

        {/* Atalho Sinais de alerta */}
        <View style={s.alertWrap}>
          <Pressable style={({ pressed }) => [s.alertCard, pressed && { opacity: 0.7 }]} onPress={() => router.push('/(paciente)/alertas')}>
            <View style={s.alertIcon}>
              <Text style={s.alertEmoji}>🚨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Sinais de alerta</Text>
              <Text style={s.alertSub}>Quando procurar a maternidade imediatamente</Text>
            </View>
            <Text style={s.alertChev}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Section({ children }) {
  return <View style={{ paddingHorizontal: 20, marginTop: 14 }}>{children}</View>;
}

const s = StyleSheet.create({
  gradient: { flex: 1 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 8, backgroundColor: Warm.accentDeep, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 13 },

  emptyWrap: { alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 26, color: Warm.rose, marginTop: 4 },
  emptySub: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 },
  eyebrow: { fontSize: 12, color: Status.slate, fontFamily: Fonts.uiSemibold, letterSpacing: 0.4, textTransform: 'uppercase' },
  greeting: { fontFamily: Fonts.display, fontSize: 30, lineHeight: 32, color: Warm.rose, marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.uiBold, color: Warm.rose, fontSize: 14 },

  // Risk + atalhos
  riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, gap: 8 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, flex: 1 },
  shortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
  },
  shortcutText: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiBold },

  // Ring
  ringWrap: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  ringEyebrow: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiSemibold, letterSpacing: 0.4, textTransform: 'uppercase' },
  ringIGRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  ringIG: { fontFamily: Fonts.display, fontSize: 50, color: Warm.rose, lineHeight: 50 },
  ringIGSuffix: { fontFamily: Fonts.display, fontSize: 20, color: Warm.rose, marginLeft: 2 },
  ringIGDays: { fontFamily: Fonts.num, fontSize: 18, color: Warm.accent, marginLeft: 6 },
  ringSubtitle: { fontSize: 11, color: Status.slate, fontFamily: Fonts.uiSemibold, marginTop: 4 },

  // Chips
  chipsGrid: { paddingHorizontal: 20, paddingTop: 6, flexDirection: 'row', flexWrap: 'wrap' },
  chipCol: { width: '50%', padding: 4 },

  // Paridade
  gpaRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  gpaTile: { flex: 1, backgroundColor: Warm.accentSoft, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  gpaLabel: { fontSize: 9, color: Warm.accentDeep, fontFamily: Fonts.uiBold },
  gpaValue: { fontFamily: Fonts.numHeavy, fontSize: 16, color: Warm.accentDeep, lineHeight: 18 },
  gpaText: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, lineHeight: 15 },

  // Itens (med + intercorr)
  medItem: { padding: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  medBullet: { width: 6, height: 6, borderRadius: 99, backgroundColor: Warm.accent, marginTop: 6 },
  medName: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiBold },
  medDose: { color: Warm.accentDeep, fontFamily: Fonts.num, fontSize: 11 },
  medMeta: { fontSize: 10.5, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },
  // v0.0.307: alergias — bullet vermelho (padrão clínico de alerta) + badge "Comercial" pra nomes de marca.
  allergyBullet: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#dc2626', marginTop: 6 },
  allergyKindBadge: { fontSize: 9, fontWeight: '600', color: '#6d28d9', backgroundColor: '#ede9fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },

  bulletRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  bulletDot: { color: Warm.accentDeep, fontFamily: Fonts.uiBold },
  bulletText: { fontSize: 11.5, color: Status.ink, fontFamily: Fonts.ui, lineHeight: 18, flex: 1 },
  empty: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic' },

  // Antecedentes
  histRow: { flexDirection: 'row', gap: 8 },
  histCol: { flex: 1 },
  histLabel: { fontSize: 10, color: Status.slate, fontFamily: Fonts.uiBold, textTransform: 'uppercase' },
  histText: { fontSize: 11, color: Status.ink, fontFamily: Fonts.ui, marginTop: 6, lineHeight: 16 },
  histBullet: { fontSize: 10.5, color: Status.slate, fontFamily: Fonts.ui, marginTop: 4, lineHeight: 16 },
  familyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 10.5, color: Status.ink, fontFamily: Fonts.uiSemibold },

  // Intercorrências
  interRow: { padding: 14, paddingVertical: 10, flexDirection: 'row', gap: 12 },
  interIG: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.num, minWidth: 48 },
  interDesc: { fontSize: 11.5, color: Status.ink, fontFamily: Fonts.ui, lineHeight: 16, flex: 1 },

  // Alerta
  alertWrap: { paddingHorizontal: 20, marginTop: 16 },
  alertCard: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fee2e2', borderRadius: 14, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: Status.warn, alignItems: 'center', justifyContent: 'center' },
  alertEmoji: { fontSize: 18 },
  alertTitle: { fontSize: 12, color: '#991b1b', fontFamily: Fonts.uiHeavy },
  alertSub: { fontSize: 10.5, color: '#7f1d1d', fontFamily: Fonts.ui, marginTop: 2 },
  alertChev: { color: '#991b1b', fontFamily: Fonts.uiHeavy, fontSize: 18 },

  // v0.0.100 — Sino de notificações
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4, right: 4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)',
  },
  bellBadgeText: {
    color: '#fff',
    fontFamily: Fonts.uiBold,
    fontSize: 9.5,
    lineHeight: 11,
  },

  // v0.0.100 — Hub não-gestante
  hubHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 4 },
  hubEyebrow: { fontSize: 13, color: Status.slate, fontFamily: Fonts.uiSemibold },
  hubGreeting: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 32, color: Warm.rose, marginTop: 2 },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  nextIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Warm.accentDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  nextEyebrow: { fontSize: 10.5, color: Status.slate, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  nextWhen: { fontFamily: Fonts.uiHeavy, fontSize: 15, color: Status.ink, marginTop: 2 },
  nextWho: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },
  noNextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  noNextText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic' },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, marginTop: 4,
  },
  actionCard: {
    width: '50%', padding: 4,
    alignItems: 'stretch',
  },
  actionIconWrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionLabel: {
    fontFamily: Fonts.uiBold, fontSize: 13, color: Status.ink, textAlign: 'center',
  },

  hubFootnote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingTop: 22, paddingBottom: 12,
    justifyContent: 'center',
  },
  hubFootnoteText: { fontSize: 11.5, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', textAlign: 'center', flex: 1 },
});
