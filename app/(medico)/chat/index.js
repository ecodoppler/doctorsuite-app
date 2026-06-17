import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { Colors } from '../../../services/theme';

const STATE_LABELS = {
  ACTIVE: { color: '#10b981', label: 'Ativo' },
  CLOSING: { color: '#f59e0b', label: 'Fechando' },
  CLOSED: { color: '#9ca3af', label: 'Encerrado' },
  BLOCKED: { color: '#dc2626', label: 'Bloqueado' },
  INACTIVE: { color: '#9ca3af', label: 'Inativo' },
  DISABLED: { color: '#9ca3af', label: 'Desabilitado' },
};

function fmtRelative(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso), now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'ontem';
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

function ageFromDob(dob) {
  if (!dob) return '';
  try {
    const d = new Date(dob + 'T00:00:00');
    const diff = Date.now() - d.getTime();
    const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    return age > 0 && age < 130 ? `${age}a` : '';
  } catch { return ''; }
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const list = await api('/api/chat/patients');
      setPatients(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Pacientes</Text>
        <Text style={s.subtitle}>{patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}</Text>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : err ? (
        <View style={s.empty}>
          <Ionicons name="cloud-offline-outline" size={40} color="#94a3b8" />
          <Text style={s.errText}>{err}</Text>
          <Pressable style={s.retry} onPress={() => { setLoading(true); load(); }}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : patients.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="people-outline" size={48} color="#94a3b8" />
          <Text style={s.emptyTitle}>Sem pacientes no chat</Text>
          <Text style={s.emptyText}>
            Quando você realizar a primeira consulta obstétrica de uma paciente,
            ela aparecerá aqui automaticamente.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        >
          {patients.map((p) => {
            const st = STATE_LABELS[p.state] || { color: '#9ca3af', label: p.state };
            const initial = (p.name || '?')[0].toUpperCase();
            const firstTwoNames = (p.name || '').split(' ').slice(0, 2).join(' ');
            const age = ageFromDob(p.dob);
            const unread = p.unread > 0;
            return (
              <Pressable
                key={p.id}
                style={({ pressed }) => [s.item, pressed && { backgroundColor: '#f8fafc' }]}
                onPress={() => router.push(`/conversa/${p.id}?name=${encodeURIComponent(firstTwoNames)}`)}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
                <View style={s.itemInfo}>
                  <View style={s.itemTitleRow}>
                    <Text style={[s.itemName, unread && s.itemNameUnread]} numberOfLines={1}>{firstTwoNames}</Text>
                    {p.last_message_at && (
                      <Text style={[s.itemTime, unread && { color: Colors.primary, fontWeight: '700' }]}>
                        {fmtRelative(p.last_message_at)}
                      </Text>
                    )}
                  </View>
                  <View style={s.itemMetaRow}>
                    <View style={[s.dot, { backgroundColor: st.color }]} />
                    <Text style={s.itemState}>{st.label}</Text>
                    {!!age && <Text style={s.itemMeta}> · {age}</Text>}
                  </View>
                  <Text style={[s.itemPreview, unread && s.itemPreviewUnread]} numberOfLines={1}>
                    {p.last_message || 'Sem mensagens ainda'}
                  </Text>
                </View>
                {unread && (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadText}>{p.unread > 99 ? '99+' : String(p.unread)}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
  errText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  retry: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },

  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4338ca' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  itemName: { fontSize: 14.5, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  itemNameUnread: { fontWeight: '800' },
  itemTime: { fontSize: 11, color: Colors.textMuted },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  itemState: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  itemMeta: { fontSize: 11, color: Colors.textMuted },
  itemPreview: { fontSize: 12.5, color: Colors.textMuted, marginTop: 3 },
  itemPreviewUnread: { color: Colors.text, fontWeight: '600' },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
