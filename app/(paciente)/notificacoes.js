import { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';
import { useNotifications } from '../../services/notifications-context';

// Mapeia kind do backend → ícone visual da notificação
const KIND_ICON = {
  laudo_pronto: 'flask-outline',
  doc_assinado: 'shield-checkmark-outline',
  consulta_amanha: 'calendar-outline',
  consulta_hoje: 'sunny-outline',
  consulta_remarcada: 'swap-horizontal-outline',
  consulta_cancelada: 'close-circle-outline',
};

// Mapeia kind do backend → cor de destaque do card
const KIND_COLOR = {
  laudo_pronto: '#8b5cf6',
  doc_assinado: '#10b981',
  consulta_amanha: '#3b82f6',
  consulta_hoje: '#f59e0b',
  consulta_remarcada: '#f59e0b',
  consulta_cancelada: '#dc2626',
};

function fmtRelative(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffSec < 60) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffH < 24) return `há ${diffH}h`;
    if (diffD === 1) return 'ontem';
    if (diffD < 7) return `há ${diffD} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { list, loadList, reload, setList, setUnreadCount } = useNotifications();
  const [loading, setLoading] = useState(list === null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await loadList();
    await reload();
    setLoading(false);
    setRefreshing(false);
  }, [loadList, reload]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  // Marca uma notificação como lida + navega pra deep link.
  // Optimistic: atualiza state local antes do request voltar.
  const handlePress = async (notif) => {
    if (!notif.read_at) {
      setList((prev) => (prev || []).map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      try { await api(`/api/my-notifications/${notif.id}/read`, { method: 'POST' }); } catch {}
    }
    const link = notif.data?.deep_link;
    if (link) router.push(`/(paciente)${link}`);
  };

  const handleReadAll = async () => {
    const unread = (list || []).filter(n => !n.read_at);
    if (unread.length === 0) return;
    setList((prev) => (prev || []).map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
    setUnreadCount(0);
    try { await api('/api/my-notifications/read-all', { method: 'POST' }); } catch {}
  };

  const hasUnread = (list || []).some(n => !n.read_at);

  return (
    <LinearGradient colors={Warm.coverGradient} locations={Warm.coverGradientStops} style={s.gradient}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        <View style={s.headerNav}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={Warm.accentDeep} />
          </Pressable>
          <Text style={s.headerTitle}>Notificações</Text>
          <View style={{ flex: 1 }} />
          {hasUnread && (
            <Pressable onPress={handleReadAll} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={s.readAllText}>Marcar todas</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color={Warm.accentDeep} />
          </View>
        ) : (list || []).length === 0 ? (
          <View style={s.empty}>
            <View style={s.bellWrap}>
              <Ionicons name="notifications-off-outline" size={42} color={Warm.accentDeep} />
            </View>
            <Text style={s.emptyTitle}>Nenhuma notificação</Text>
            <Text style={s.emptyText}>
              Quando houver novidades sobre laudos, documentos ou consultas, elas aparecerão aqui.
            </Text>
          </View>
        ) : (
          <View style={s.listWrap}>
            {(list || []).map((n) => {
              const isUnread = !n.read_at;
              const icon = KIND_ICON[n.kind] || 'notifications-outline';
              const color = KIND_COLOR[n.kind] || Warm.accentDeep;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => handlePress(n)}
                  style={({ pressed }) => [s.card, isUnread && s.cardUnread, pressed && { opacity: 0.85 }]}
                >
                  <View style={[s.iconCircle, { backgroundColor: color + '22' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.titleRow}>
                      <Text style={[s.title, isUnread && s.titleUnread]} numberOfLines={1}>{n.title}</Text>
                      {isUnread && <View style={s.dot} />}
                    </View>
                    {!!n.body && <Text style={s.body} numberOfLines={2}>{n.body}</Text>}
                    <Text style={s.time}>{fmtRelative(n.created_at)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  headerTitle: { fontFamily: Fonts.uiBold, fontSize: 16, color: Status.ink },
  readAllText: { fontFamily: Fonts.uiBold, fontSize: 12.5, color: Warm.accentDeep, paddingHorizontal: 8, paddingVertical: 6 },

  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  empty: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 60, gap: 12 },
  bellWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: Fonts.uiHeavy, fontSize: 17, color: Status.ink, marginTop: 4 },
  emptyText: { fontFamily: Fonts.ui, fontSize: 13, color: Status.slate, textAlign: 'center', lineHeight: 20 },

  listWrap: { paddingHorizontal: 12, gap: 8, marginTop: 6 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: Warm.accentDeep, paddingLeft: 9 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: Fonts.uiSemibold, fontSize: 13.5, color: Status.ink, flex: 1, minWidth: 0 },
  titleUnread: { fontFamily: Fonts.uiHeavy },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Warm.accentDeep },
  body: { fontFamily: Fonts.ui, fontSize: 12.5, color: Status.slate, marginTop: 2, lineHeight: 17 },
  time: { fontFamily: Fonts.ui, fontSize: 11, color: Status.slate, marginTop: 4, fontStyle: 'italic' },
});
