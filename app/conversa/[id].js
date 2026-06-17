import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors } from '../../services/theme';
import { pickAndUploadChatImage } from '../../services/chatImage';
import ChatImage from '../../components/chat/ChatImage';
import ChatTemplatesModal from '../../components/chat/ChatTemplatesModal';
import { GlassView } from '../../components/glass/GlassView';

// Verifica se nota interna ainda é editável (24h pós criação)
function canEditNote(msg, myId) {
  if (msg.note_type !== 'internal') return false;
  if (msg.from_user_id !== myId) return false;
  const created = new Date(msg.created_at);
  return (Date.now() - created.getTime()) < 24 * 3600 * 1000;
}

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
  // v0.0.108: notas internas + templates
  const [internalMode, setInternalMode] = useState(false);     // próxima msg será nota interna?
  const [hideNotes, setHideNotes] = useState(false);           // esconde balões amarelos no fluxo
  const [editingNote, setEditingNote] = useState(null);        // { id, message }
  const [showTemplates, setShowTemplates] = useState(false);   // modal templates aberto?
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
    const isInternal = internalMode;
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId, from_user_id: myId, from_type: 'user',
      message: msg, note_type: isInternal ? 'internal' : 'normal',
      created_at: new Date().toISOString(), _pending: true
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const body = { message: msg };
      if (isInternal) body.note_type = 'internal';
      const real = await api(`/api/chat/patients/${patientId}/messages`, { method: 'POST', body: JSON.stringify(body) });
      setMessages(prev => prev.map(m => m.id === tempId ? real : m));
      setInternalMode(false); // resetar após enviar
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m));
      Alert.alert('Não enviado', e?.message || 'Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  // v0.0.108: edição de nota interna
  const saveEditNote = async () => {
    if (!editingNote || !editingNote.message.trim()) return;
    try {
      await api(`/api/chat/patients/${patientId}/messages/${editingNote.id}`, {
        method: 'PUT', body: JSON.stringify({ message: editingNote.message.trim() }),
      });
      setMessages(prev => prev.map(m => m.id === editingNote.id ? { ...m, message: editingNote.message.trim() } : m));
      setEditingNote(null);
    } catch (e) { Alert.alert('Erro', e?.message || 'Não foi possível salvar.'); }
  };

  const deleteNote = (noteId) => {
    Alert.alert('Excluir nota?', 'Esta nota interna será removida permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await api(`/api/chat/patients/${patientId}/messages/${noteId}`, { method: 'DELETE' });
          setMessages(prev => prev.filter(m => m.id !== noteId));
        } catch (e) { Alert.alert('Erro', e?.message || 'Não foi possível excluir.'); }
      }},
    ]);
  };

  // v0.0.108: insere template no input (substitui variáveis via backend)
  const applyTemplate = async (tpl) => {
    try {
      const r = await api(`/api/chat-templates/preview?text=${encodeURIComponent(tpl.body)}&patient_id=${patientId}`);
      setText(r.expanded || tpl.body);
    } catch {
      setText(tpl.body);
    }
    setShowTemplates(false);
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
        <Pressable
          onPress={() => setHideNotes(!hideNotes)}
          hitSlop={10}
          style={s.menuBtn}
          accessibilityLabel={hideNotes ? 'Mostrar notas internas' : 'Esconder notas internas'}
        >
          <Ionicons name={hideNotes ? 'eye-off-outline' : 'eye-outline'} size={20} color={hideNotes ? '#f59e0b' : Colors.textMuted} />
        </Pressable>
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
          ) : messages.filter(m => !hideNotes || m.note_type !== 'internal').map((m, idx, arr) => {
            const fromMe = m.from_type === 'user' && (m.from_user_id === myId || !m.from_type);
            const isInternal = m.note_type === 'internal';
            const prev = idx > 0 ? arr[idx - 1] : null;
            const showDate = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
            const editable = canEditNote(m, myId);
            return (
              <View key={m.id}>
                {showDate && (
                  <View style={s.dateSep}>
                    <Text style={s.dateSepText}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                )}
                {/* Nota interna: largura cheia, fundo amarelo */}
                {isInternal ? (
                  <Pressable
                    onLongPress={editable ? () => setEditingNote({ id: m.id, message: m.message }) : undefined}
                    style={s.noteRow}
                  >
                    <View style={s.noteBubble}>
                      <View style={s.noteHeader}>
                        <Ionicons name="document-text-outline" size={13} color="#92400e" />
                        <Text style={s.noteHeaderText}>NOTA INTERNA · só você vê</Text>
                        {editable && (
                          <Pressable hitSlop={6} onPress={() => setEditingNote({ id: m.id, message: m.message })} style={{ padding: 2 }}>
                            <Ionicons name="create-outline" size={14} color="#92400e" />
                          </Pressable>
                        )}
                        {editable && (
                          <Pressable hitSlop={6} onPress={() => deleteNote(m.id)} style={{ padding: 2 }}>
                            <Ionicons name="trash-outline" size={14} color="#dc2626" />
                          </Pressable>
                        )}
                      </View>
                      <Text style={s.noteText}>{m.message}</Text>
                      <Text style={s.noteTime}>{fmtTime(m.created_at)}</Text>
                    </View>
                  </Pressable>
                ) : (
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
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Banner indicando modo nota interna */}
        {internalMode && (
          <View style={s.internalBanner}>
            <Ionicons name="document-text" size={14} color="#92400e" />
            <Text style={s.internalBannerText}>Próxima mensagem será nota interna (paciente não vê)</Text>
            <Pressable onPress={() => setInternalMode(false)} hitSlop={8}>
              <Ionicons name="close" size={16} color="#92400e" />
            </Pressable>
          </View>
        )}
        <View style={[s.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable onPress={sendImage} disabled={sending || internalMode} style={({ pressed }) => [s.attachBtn, (pressed || internalMode) && { opacity: 0.4 }]} hitSlop={8}>
            <Ionicons name="image-outline" size={22} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={() => setShowTemplates(true)} disabled={sending} style={({ pressed }) => [s.attachBtn, pressed && { opacity: 0.6 }]} hitSlop={8}>
            <Ionicons name="reader-outline" size={22} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={() => setInternalMode(!internalMode)} disabled={sending} style={({ pressed }) => [s.attachBtn, pressed && { opacity: 0.6 }]} hitSlop={8}>
            <Ionicons name={internalMode ? 'document-text' : 'document-text-outline'} size={22} color={internalMode ? '#f59e0b' : Colors.primary} />
          </Pressable>
          <TextInput
            style={[s.input, internalMode && { backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1 }]}
            placeholder={internalMode ? 'Nota interna (paciente não vê)...' : 'Digite uma mensagem...'}
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4000}
            editable={!sending}
          />
          <Pressable
            onPress={send}
            style={({ pressed }) => [s.sendBtn, internalMode && { backgroundColor: '#f59e0b' }, (!text.trim() || sending) && s.sendBtnDisabled, pressed && { opacity: 0.7 }]}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* v0.0.108: Modal edição de nota interna */}
      <Modal visible={!!editingNote} transparent animationType="fade" onRequestClose={() => setEditingNote(null)}>
        <View style={s.editModalBackdrop}>
          <GlassView tint="systemMaterialDark" intensity={40} style={StyleSheet.absoluteFillObject} />
          <View style={s.editCard}>
            <View style={s.editHeader}>
              <Ionicons name="document-text" size={20} color="#92400e" />
              <Text style={s.editTitle}>Editar nota interna</Text>
            </View>
            <TextInput
              style={s.editInput}
              value={editingNote?.message || ''}
              onChangeText={(t) => setEditingNote(prev => ({ ...prev, message: t }))}
              multiline
              autoFocus
              maxLength={4000}
            />
            <View style={s.editActions}>
              <Pressable onPress={() => setEditingNote(null)} style={s.editCancelBtn}>
                <Text style={s.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={saveEditNote} style={s.editSaveBtn}>
                <Text style={s.editSaveText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* v0.0.108: Modal templates rápidos */}
      <ChatTemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onPick={applyTemplate}
      />

      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={s.actionsBackdrop} onPress={() => setShowActions(false)}>
          <GlassView tint="systemMaterialDark" intensity={40} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
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

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 8, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  attachBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 14, color: Colors.text, backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 120, minHeight: 38 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },

  // v0.0.108: Banner modo nota interna
  internalBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', borderTopWidth: 1, borderTopColor: '#fde68a', paddingHorizontal: 14, paddingVertical: 8 },
  internalBannerText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '600' },

  // v0.0.108: Balão de nota interna (largura cheia, amarelo)
  noteRow: { paddingHorizontal: 4, marginVertical: 4 },
  noteBubble: { backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: '#f59e0b', borderRadius: 10, padding: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  noteHeaderText: { fontSize: 10.5, fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 },
  noteText: { fontSize: 13.5, color: '#78350f', lineHeight: 18 },
  noteTime: { fontSize: 10, color: '#92400e', marginTop: 4, fontStyle: 'italic' },

  // v0.0.108: Modal edição de nota — v0.2 Liquid Glass: backdrop semi-escuro
  // + GlassView por cima (sistema material dark) pro efeito frosted Apple
  editModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, width: '100%', maxWidth: 380 },
  editHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  editTitle: { fontSize: 15, fontWeight: '700', color: '#92400e' },
  editInput: { borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text, backgroundColor: '#fffbeb', minHeight: 100, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', marginTop: 14, gap: 10 },
  editCancelBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8 },
  editCancelText: { fontWeight: '600', color: Colors.text },
  editSaveBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: '#f59e0b', borderRadius: 8 },
  editSaveText: { fontWeight: '700', color: '#fff' },

  actionsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end' },
  actionsSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 30 },
  actionsTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 10 },
  actionText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  actionCancel: { marginTop: 8, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionCancelText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
