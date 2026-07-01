import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { Fonts, Status, Warm } from '../../../services/theme';
import { pickAndUploadChatImage } from '../../../services/chatImage';
import ChatImage from '../../../components/chat/ChatImage';
import { useAppConfig } from '../../../services/app-config';

const STATE_COLORS = {
  ACTIVE: '#10b981',
  CLOSING: '#f59e0b',
  CLOSED: '#9ca3af',
  BLOCKED: '#dc2626',
  INACTIVE: '#9ca3af',
  DISABLED: '#9ca3af',
};

function fmtTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function fmtDateBR(iso) {
  if (!iso) return '';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
  } catch { return iso; }
}

// Botão SOS / urgência — mostra modal com contatos da maternidade + 192
function UrgencyModal({ visible, onClose, emergency }) {
  const phone = String(emergency?.primaryPhone || '192');
  const label = emergency?.primaryLabel || 'SAMU';
  const hint = emergency?.hint || 'Em caso de sinais de alerta, procure atendimento imediatamente.';
  const handleCall = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits) Linking.openURL(`tel:${digits}`).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.urgencyCard} onPress={() => {}}>
          <View style={s.urgencyHeader}>
            <Ionicons name="warning" size={28} color="#dc2626" />
            <Text style={s.urgencyTitle}>{emergency?.title || 'Em caso de emergência'}</Text>
          </View>
          <Pressable style={s.urgencyItem} onPress={handleCall}>
            <Text style={s.urgencyLabel}>{label}</Text>
            <Text style={s.urgencyPhone}>{phone}</Text>
          </Pressable>
          <Text style={s.urgencyHint}>{hint}</Text>
          <Pressable style={s.urgencyCloseBtn} onPress={onClose}>
            <Text style={s.urgencyCloseText}>Entendi</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Modal de disclaimer obrigatório (1ª vez)
function DisclaimerModal({ visible, text, onAccept, accepting }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.disclaimerWrap}>
        <View style={s.disclaimerCard}>
          <Text style={s.disclaimerTitle}>Antes de começar</Text>
          <ScrollView style={s.disclaimerScroll}>
            <Text style={s.disclaimerText}>{text}</Text>
          </ScrollView>
          <Pressable style={[s.disclaimerBtn, accepting && { opacity: 0.6 }]} onPress={onAccept} disabled={accepting}>
            {accepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.disclaimerBtnText}>Aceito e concordo</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { config } = useAppConfig();
  const emergency = config.patient?.emergency || {};
  const chatConfig = config.patient?.chat || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);
  const [acceptingDisclaimer, setAcceptingDisclaimer] = useState(false);
  const scrollRef = useRef(null);
  const pollTimer = useRef(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setErr(null);
      const d = await api('/api/my-chat');
      setData(d);
    } catch (e) {
      if (!silent) setErr(e?.message || 'Falha ao carregar chat');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Mark as read ao abrir
    api('/api/my-chat/read', { method: 'POST' }).catch(() => {});
    // Polling a cada 5s enquanto tela está em foco
    pollTimer.current = setInterval(() => load(true), 5000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [load]));

  // Scroll pra baixo quando chegam mensagens novas
  useEffect(() => {
    if (data?.messages?.length && scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [data?.messages?.length]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');
    // Optimistic: adiciona à lista localmente
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, from_type: 'patient', message: msg, created_at: new Date().toISOString(), _pending: true };
    setData(d => ({ ...d, messages: [...(d?.messages || []), tempMsg] }));
    try {
      const real = await api('/api/my-chat/messages', { method: 'POST', body: JSON.stringify({ message: msg }) });
      // Substitui temp por real
      setData(d => ({ ...d, messages: (d.messages || []).map(m => m.id === tempId ? real : m) }));
    } catch (e) {
      // Falha: marca como erro e mantém na tela
      setData(d => ({ ...d, messages: (d.messages || []).map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m) }));
      Alert.alert('Não foi possível enviar', e?.message || 'Tente novamente em alguns instantes.');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    if (sending) return;
    const imageKey = await pickAndUploadChatImage();
    if (!imageKey) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setData(d => ({ ...d, messages: [...(d?.messages || []), { id: tempId, from_type: 'patient', image_url: imageKey, created_at: new Date().toISOString(), _pending: true }] }));
    try {
      const real = await api('/api/my-chat/messages', { method: 'POST', body: JSON.stringify({ image_url: imageKey }) });
      setData(d => ({ ...d, messages: (d.messages || []).map(m => m.id === tempId ? real : m) }));
    } catch (e) {
      setData(d => ({ ...d, messages: (d.messages || []).map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m) }));
      Alert.alert('Não foi possível enviar', e?.message || 'Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const acceptDisclaimer = async () => {
    setAcceptingDisclaimer(true);
    try {
      await api('/api/my-chat/accept-disclaimer', { method: 'POST' });
      await load();
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Tente novamente.');
    } finally {
      setAcceptingDisclaimer(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={Warm.accentDeep} />
        </View>
      </LinearGradient>
    );
  }

  if (err) {
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <View style={[s.loaderWrap, { padding: 24 }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
          <Text style={s.errText}>{err}</Text>
          <Pressable style={s.retryBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const state = data?.state || 'INACTIVE';
  const stateColor = STATE_COLORS[state] || '#9ca3af';
  const doctor = data?.responsible_doctor;
  const crmUf = doctor?.crm_uf || config.locale?.defaultCrmUf;
  const doctorMeta = doctor?.crm
    ? `${crmUf ? `CRM-${crmUf}` : 'CRM'} ${doctor.crm}`
    : (chatConfig.doctorFallbackLabel || 'Seu médico');
  const canSend = ['ACTIVE', 'CLOSING'].includes(state);
  const showDisclaimer = canSend && doctor && !data.disclaimer_accepted;

  // Estado sem chat ativo (sem médico, encerrado, bloqueado, desabilitado)
  if (!doctor || ['CLOSED', 'BLOCKED', 'INACTIVE', 'DISABLED'].includes(state)) {
    return (
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 80, flexGrow: 1 }}>
          <View style={s.emptyWrap}>
            <View style={[s.emptyIcon, { backgroundColor: stateColor + '22' }]}>
              <Ionicons
                name={state === 'BLOCKED' ? 'lock-closed' : state === 'CLOSED' ? 'archive' : 'chatbox-outline'}
                size={42}
                color={stateColor}
              />
            </View>
            <Text style={s.emptyTitle}>
              {state === 'BLOCKED' ? 'Atendimento suspenso'
                : state === 'CLOSED' ? 'Atendimento encerrado'
                : state === 'DISABLED' ? 'Chat indisponível'
                : 'Sem atendimento ativo'}
            </Text>
            <Text style={s.emptyText}>
              {data?.reason || chatConfig.inactiveReason || 'Aguarde uma nova gestação ou converse com sua clínica.'}
            </Text>
            {data?.expires_on && state === 'CLOSED' && (
              <Text style={s.emptyMeta}>Encerrado em {fmtDateBR(data.expires_on)}</Text>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.headerBg}>
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View style={s.doctorBadge}>
            <View style={s.doctorAvatar}>
              <Ionicons name="medical" size={20} color={Warm.accentDeep} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.doctorName} numberOfLines={1}>{doctor.name}</Text>
              <Text style={s.doctorMeta} numberOfLines={1}>
                {doctorMeta}
              </Text>
            </View>
          </View>
          {state === 'CLOSING' && data.expires_on && (
            <View style={s.closingBanner}>
              <Ionicons name="time-outline" size={14} color="#92400e" />
              <Text style={s.closingText}>Atendimento encerra em {fmtDateBR(data.expires_on)}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={s.messagesArea}
        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {(data.messages || []).length === 0 && (
          <View style={s.welcomeWrap}>
            <Ionicons name="chatbubbles-outline" size={36} color={Warm.accentDeep} />
            <Text style={s.welcomeText}>
              Envie sua primeira mensagem para {doctor.name.split(' ')[0]}.{'\n'}
              {chatConfig.responseSlaText || 'Resposta em até 24h em dias úteis.'}
            </Text>
          </View>
        )}
        {(data.messages || []).map((m, idx) => {
          const fromMe = m.from_type === 'patient';
          const prev = idx > 0 ? data.messages[idx - 1] : null;
          const showDateSep = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
          return (
            <View key={m.id}>
              {showDateSep && (
                <View style={s.dateSep}>
                  <Text style={s.dateSepText}>
                    {new Date(m.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </Text>
                </View>
              )}
              <View style={[s.bubbleRow, fromMe ? s.bubbleRowMe : s.bubbleRowOther]}>
                <View style={[s.bubble, fromMe ? s.bubbleMe : s.bubbleOther, m._failed && { opacity: 0.5 }]}>
                  {!!m.image_url && <ChatImage imageKey={m.image_url} maxWidth={220} />}
                  {!!m.message && <Text style={[s.bubbleText, fromMe ? s.bubbleTextMe : s.bubbleTextOther]}>{m.message}</Text>}
                  <View style={s.bubbleMeta}>
                    <Text style={[s.bubbleTime, fromMe ? s.bubbleTimeMe : s.bubbleTimeOther]}>
                      {fmtTime(m.created_at)}
                    </Text>
                    {fromMe && (
                      m._pending ? <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                      : m._failed ? <Ionicons name="alert-circle" size={11} color="#fca5a5" style={{ marginLeft: 4 }} />
                      : m.read ? <Ionicons name="checkmark-done" size={12} color="#a7f3d0" style={{ marginLeft: 4 }} />
                      : <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable onPress={() => setShowUrgency(true)} style={s.urgencyBar}>
        <Ionicons name="warning-outline" size={14} color="#dc2626" />
        <Text style={s.urgencyBarText}>{emergency.title || 'Em caso de emergência'}</Text>
        <Ionicons name="chevron-forward" size={14} color="#dc2626" />
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={[s.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            onPress={sendImage}
            disabled={sending}
            style={({ pressed }) => [s.attachBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="image-outline" size={22} color={Warm.accentDeep} />
          </Pressable>
          <TextInput
            style={s.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={Status.slate}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4000}
            editable={!sending}
          />
          <Pressable
            onPress={send}
            style={({ pressed }) => [s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled, pressed && { opacity: 0.7 }]}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <UrgencyModal visible={showUrgency} onClose={() => setShowUrgency(false)} emergency={emergency} />
      <DisclaimerModal
        visible={!!showDisclaimer}
        text={data.disclaimer_text}
        onAccept={acceptDisclaimer}
        accepting={acceptingDisclaimer}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  gradient: { flex: 1 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 8, backgroundColor: Warm.accentDeep, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 13 },

  // Empty state (sem chat / encerrado)
  emptyWrap: { alignItems: 'center', paddingHorizontal: 28, gap: 14, paddingTop: 60 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 22, color: Status.ink, marginTop: 4 },
  emptyText: { fontSize: 13.5, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 20 },
  emptyMeta: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', marginTop: 4 },

  // Header
  headerBg: { paddingBottom: 4 },
  header: { paddingHorizontal: 14, paddingBottom: 12 },
  doctorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  doctorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Warm.accentSoft, alignItems: 'center', justifyContent: 'center' },
  doctorName: { fontFamily: Fonts.uiBold, fontSize: 14.5, color: Status.ink },
  doctorMeta: { fontFamily: Fonts.ui, fontSize: 11, color: Status.slate, marginTop: 1 },
  closingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8,
  },
  closingText: { fontFamily: Fonts.uiSemibold, fontSize: 11.5, color: '#92400e', flex: 1 },

  // Messages
  messagesArea: { flex: 1 },
  welcomeWrap: { alignItems: 'center', gap: 10, paddingTop: 40, paddingHorizontal: 30 },
  welcomeText: { fontFamily: Fonts.ui, fontSize: 13, color: Status.slate, textAlign: 'center', lineHeight: 19 },

  dateSep: { alignItems: 'center', marginVertical: 10 },
  dateSepText: {
    fontFamily: Fonts.uiBold, fontSize: 11, color: Status.slate, textTransform: 'capitalize',
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99,
  },

  bubbleRow: { flexDirection: 'row', marginBottom: 4 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleMe: { backgroundColor: Warm.accentDeep, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontFamily: Fonts.ui, fontSize: 14, lineHeight: 18.5 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextOther: { color: Status.ink },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 3 },
  bubbleTime: { fontFamily: Fonts.ui, fontSize: 10 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.75)' },
  bubbleTimeOther: { color: Status.slate },

  // Urgency bar (acima do input)
  urgencyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#fef2f2', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#fecaca',
    paddingVertical: 7,
  },
  urgencyBarText: { fontFamily: Fonts.uiBold, fontSize: 11.5, color: '#dc2626' },

  // Input
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 10, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  attachBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontFamily: Fonts.ui, fontSize: 14, color: Status.ink, backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 120, minHeight: 38 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Warm.accentDeep, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },

  // Urgency modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  urgencyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 380 },
  urgencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  urgencyTitle: { fontFamily: Fonts.uiHeavy, fontSize: 17, color: Status.ink, flex: 1 },
  urgencyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 10 },
  urgencyLabel: { fontFamily: Fonts.uiBold, fontSize: 14, color: '#7f1d1d' },
  urgencyPhone: { fontFamily: Fonts.numHeavy, fontSize: 22, color: '#dc2626' },
  urgencyHint: { fontFamily: Fonts.ui, fontSize: 12, color: Status.slate, lineHeight: 17, marginVertical: 8 },
  urgencyCloseBtn: { backgroundColor: Warm.accentDeep, paddingVertical: 11, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  urgencyCloseText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 14 },

  // Disclaimer modal
  disclaimerWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  disclaimerCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, maxHeight: '80%' },
  disclaimerTitle: { fontFamily: Fonts.display, fontSize: 22, color: Warm.rose, marginBottom: 10 },
  disclaimerScroll: { marginBottom: 14, maxHeight: 400 },
  disclaimerText: { fontFamily: Fonts.ui, fontSize: 13.5, color: Status.ink, lineHeight: 21 },
  disclaimerBtn: { backgroundColor: Warm.accentDeep, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  disclaimerBtnText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 14.5 },
});
