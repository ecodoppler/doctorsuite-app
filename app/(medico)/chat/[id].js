import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../../services/api';
import { Colors } from '../../../services/theme';
import { pickAndUploadChatImage } from '../../../services/chatImage';
import ChatImage from '../../../components/chat/ChatImage';

function fmtTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function ChatConversation() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = params.id;
  const patientName = params.name ? decodeURIComponent(params.name) : 'Paciente';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const scrollRef = useRef(null);
  const pollTimer = useRef(null);
  const myId = getUser()?.id;

  const load = useCallback(async (silent = false) => {
    try {
      const rows = await api(`/api/chat/patients/${patientId}/messages`);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (e) {
      if (!silent) Alert.alert('Erro', e?.message || 'Falha ao carregar conversa');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(useCallback(() => {
    load();
    pollTimer.current = setInterval(() => load(true), 5000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [load]));

  useEffect(() => {
    if (messages.length && scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');
    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, from_user_id: myId, from_type: 'user', message: msg, created_at: new Date().toISOString(), _pending: true };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const real = await api(`/api/chat/patients/${patientId}/messages`, { method: 'POST', body: JSON.stringify({ message: msg }) });
      setMessages(prev => prev.map(m => m.id === tempId ? real : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m));
      Alert.alert('Não enviado', e?.message || 'Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    if (sending) return;
    const imageKey = await pickAndUploadChatImage(patientId);
    if (!imageKey) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, from_user_id: myId, from_type: 'user', image_url: imageKey, created_at: new Date().toISOString(), _pending: true }]);
    try {
      const real = await api(`/api/chat/patients/${patientId}/messages`, { method: 'POST', body: JSON.stringify({ image_url: imageKey }) });
      setMessages(prev => prev.map(m => m.id === tempId ? real : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m));
      Alert.alert('Não enviado', e?.message || 'Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleExtend = async () => {
    setShowActions(false);
    try {
      const r = await api(`/api/chat/patients/${patientId}/extend`, { method: 'POST', body: JSON.stringify({ days: 30 }) });
      Alert.alert('Atendimento estendido', `Até ${new Date(r.expires_on + 'T12:00:00').toLocaleDateString('pt-BR')}.`);
    } catch (e) { Alert.alert('Erro', e?.message || 'Tente novamente.'); }
  };

  const handleClose = () => {
    setShowActions(false);
    Alert.alert('Encerrar atendimento', 'Esta paciente não poderá mais enviar mensagens. Confirma?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar', style: 'destructive',
        onPress: async () => {
          try {
            await api(`/api/chat/patients/${patientId}/close`, { method: 'POST' });
            router.back();
          } catch (e) { Alert.alert('Erro', e?.message || 'Tente novamente.'); }
        },
      },
    ]);
  };

  const handleBlock = () => {
    setShowActions(false);
    Alert.alert('Bloquear paciente', 'Impede mensagens dessa paciente mesmo dentro do prazo. Pode desbloquear depois. Confirma?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Bloquear', style: 'destructive',
        onPress: async () => {
          try {
            await api(`/api/chat/patients/${patientId}/block`, { method: 'POST' });
            router.back();
          } catch (e) { Alert.alert('Erro', e?.message || 'Tente novamente.'); }
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(patientName[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.headerName} numberOfLines={1}>{patientName}</Text>
          <Text style={s.headerMeta}>Toque para ver prontuário</Text>
        </View>
        <Pressable onPress={() => setShowActions(true)} hitSlop={10} style={s.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={s.messagesArea}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={s.welcome}>
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.primary} />
              <Text style={s.welcomeText}>Nenhuma mensagem ainda</Text>
            </View>
          ) : messages.map((m, idx) => {
            const fromMe = m.from_type === 'user' && (m.from_user_id === myId || !m.from_type);
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDate = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
            return (
              <View key={m.id}>
                {showDate && (
                  <View style={s.dateSep}>
                    <Text style={s.dateSepText}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                )}
                <View style={[s.bubbleRow, fromMe ? s.bubbleRowMe : s.bubbleRowOther]}>
                  <View style={[s.bubble, fromMe ? s.bubbleMe : s.bubbleOther, m._failed && { opacity: 0.5 }]}>
                    {!!m.image_url && <ChatImage imageKey={m.image_url} maxWidth={220} />}
                    {!!m.message && (
                      <Text style={[s.bubbleText, fromMe ? s.bubbleTextMe : s.bubbleTextOther]}>{m.message}</Text>
                    )}
                    <View style={s.bubbleMeta}>
                      <Text style={[s.bubbleTime, fromMe ? s.bubbleTimeMe : s.bubbleTimeOther]}>{fmtTime(m.created_at)}</Text>
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
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable onPress={sendImage} disabled={sending} style={({ pressed }) => [s.attachBtn, pressed && { opacity: 0.6 }]} hitSlop={8}>
            <Ionicons name="image-outline" size={22} color={Colors.primary} />
          </Pressable>
          <TextInput
            style={s.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={Colors.textMuted}
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
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={s.actionsBackdrop} onPress={() => setShowActions(false)}>
          <Pressable style={s.actionsSheet} onPress={() => {}}>
            <Text style={s.actionsTitle}>Ações</Text>
            <Pressable style={s.actionItem} onPress={handleExtend}>
              <Ionicons name="add-circle-outline" size={22} color="#10b981" />
              <Text style={s.actionText}>Estender +30 dias</Text>
            </Pressable>
            <Pressable style={s.actionItem} onPress={handleClose}>
              <Ionicons name="archive-outline" size={22} color="#f59e0b" />
              <Text style={s.actionText}>Encerrar agora</Text>
            </Pressable>
            <Pressable style={s.actionItem} onPress={handleBlock}>
              <Ionicons name="ban-outline" size={22} color="#dc2626" />
              <Text style={[s.actionText, { color: '#dc2626' }]}>Bloquear paciente</Text>
            </Pressable>
            <Pressable style={s.actionCancel} onPress={() => setShowActions(false)}>
              <Text style={s.actionCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#4338ca' },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  menuBtn: { padding: 6 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcome: { alignItems: 'center', paddingTop: 40, gap: 10 },
  welcomeText: { fontSize: 13, color: Colors.textMuted },

  messagesArea: { flex: 1 },
  dateSep: { alignItems: 'center', marginVertical: 10 },
  dateSepText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'capitalize', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },

  bubbleRow: { flexDirection: 'row', marginBottom: 4 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontSize: 14, lineHeight: 18.5 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextOther: { color: Colors.text },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 3 },
  bubbleTime: { fontSize: 10 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.75)' },
  bubbleTimeOther: { color: Colors.textMuted },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 10, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  attachBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 14, color: Colors.text, backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 120, minHeight: 38 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },

  actionsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionsSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 30 },
  actionsTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 10 },
  actionText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  actionCancel: { marginTop: 8, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionCancelText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
