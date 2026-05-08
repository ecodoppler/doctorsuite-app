import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';

export default function LaudosScreen() {
  const [laudos, setLaudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api('/api/my-reports');
      setLaudos(data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d).slice(0, 10);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Strip HTML tags for plain text display
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={laudos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.7}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={s.title}>{item.template_name || item.report_type || 'Laudo'}</Text>
              <Text style={s.subtitle}>{formatDate(item.created_at)}</Text>
              <Text style={s.doctor}>Dr(a). {item.doctor_name || 'Médico'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>Nenhum laudo disponível</Text>
          </View>
        }
      />

      {/* Report detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle} numberOfLines={1}>
              {selected?.template_name || selected?.report_type || 'Laudo'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={s.modalBody} contentContainerStyle={{ padding: Spacing.lg }}>
            <View style={s.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={s.metaText}>{formatDate(selected?.created_at)}</Text>
            </View>
            <View style={s.metaRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
              <Text style={s.metaText}>Dr(a). {selected?.doctor_name || 'Médico'}</Text>
            </View>

            {selected?.observations ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Observações</Text>
                <Text style={s.bodyText}>{stripHtml(selected.observations)}</Text>
              </View>
            ) : null}

            {selected?.conclusion ? (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Conclusão</Text>
                <Text style={s.bodyText}>{stripHtml(selected.conclusion)}</Text>
              </View>
            ) : null}

            {!selected?.observations && !selected?.conclusion && selected?.content ? (
              <View style={s.section}>
                <Text style={s.bodyText}>{stripHtml(selected.content)}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  list: { padding: Spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  title: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  doctor: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  modalBody: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  section: {
    marginTop: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
});
