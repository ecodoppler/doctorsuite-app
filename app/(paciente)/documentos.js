import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, Linking, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';
import Card from '../../components/pregnancy/Card';

const API_BASE = 'https://doctorsuite.app';

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'atestado', label: 'Atestados' },
  { value: 'declaracao', label: 'Declarações' },
  { value: 'encaminhamento', label: 'Encam.' },
];

const TYPE_ICONS = {
  atestado: 'medical-outline',
  declaracao: 'time-outline',
  encaminhamento: 'arrow-forward-circle-outline',
};

// Helper de data tolerante a Date (PG) ou string
function fmtDate(raw) {
  if (!raw) return '—';
  const s = (raw instanceof Date) ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Summary do conteúdo por tipo
function docSummary(doc) {
  const c = doc.content || {};
  if (doc.doc_type === 'atestado') {
    const parts = [];
    if (c.dias) parts.push(`${c.dias} dia(s)`);
    if (c.cid) parts.push(`CID ${c.cid}`);
    return parts.join(' · ');
  }
  if (doc.doc_type === 'declaracao') {
    const periodoLabels = {
      manha: 'Manhã', tarde: 'Tarde', noite: 'Noite',
      manha_tarde: 'Manhã e tarde', tarde_noite: 'Tarde e noite', integral: 'Dia inteiro',
    };
    if (c.periodo && periodoLabels[c.periodo]) return periodoLabels[c.periodo];
    if (c.hora_entrada && c.hora_saida) return `${c.hora_entrada} às ${c.hora_saida}`;
    if (c.hora_entrada) return `a partir das ${c.hora_entrada}`;
    return '';
  }
  if (doc.doc_type === 'encaminhamento') {
    return c.especialidade ? `Para: ${c.especialidade}` : '';
  }
  return '';
}

export default function DocumentosScreen() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setErr(null);
      const data = await api('/api/my-clinic-documents');
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const verUrl = (doc) => `${API_BASE}/validar/doc/${doc.id}`;

  // Ver: WebView interna (in-app browser via expo-web-browser)
  const handleVer = async (doc) => {
    try {
      await WebBrowser.openBrowserAsync(verUrl(doc), {
        toolbarColor: Warm.accentDeep,
        controlsColor: '#fff',
        enableBarCollapsing: true,
      });
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Não foi possível abrir');
    }
  };

  // Exportar: abre no browser nativo (Safari/Chrome) — paciente salva/imprime/AirDrop
  const handleExportar = (doc) => {
    Linking.openURL(verUrl(doc)).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir no navegador.');
    });
  };

  // Compartilhar: Share API nativa
  const handleCompartilhar = async (doc) => {
    try {
      await Share.share({
        title: doc.doc_type_label,
        message: `${doc.doc_type_label} — ${fmtDate(doc.signed_at)}\nVerificação: ${verUrl(doc)}`,
        url: verUrl(doc),
      });
    } catch (e) {
      // usuário cancelou ou erro silencioso
    }
  };

  // Loading / error
  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loaderWrap}><ActivityIndicator size="large" color={Warm.accentDeep} /></View>
      </View>
    );
  }
  if (err) {
    return (
      <View style={s.container}>
        <View style={[s.loaderWrap, { padding: 24 }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
          <Text style={s.errText}>Não foi possível carregar.{'\n'}{err}</Text>
          <Pressable onPress={() => { setLoading(true); load(); }} style={s.retryBtn}>
            <Text style={s.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Filtro
  const filtered = filter === 'all' ? docs : docs.filter((d) => d.doc_type === filter);
  // Mostra pills só se tiver > 5 docs (decisão UX)
  const showFilter = docs.length > 5;

  return (
    <View style={s.container}>
      {/* Filtros (condicional > 5 docs) */}
      {showFilter && (
        <View style={s.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {TYPE_FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={[s.pill, active && s.pillActive]}
                >
                  <Text style={[s.pillText, active && s.pillTextActive]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {filtered.length === 0 ? (
          <Card padding={24}>
            <View style={s.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={42} color={Status.slate} />
              <Text style={s.emptyTitle}>
                {filter === 'all'
                  ? 'Sem documentos assinados'
                  : 'Sem documentos deste tipo'}
              </Text>
              {filter === 'all' && (
                <Text style={s.emptyText}>
                  Quando seu médico emitir atestados, declarações ou encaminhamentos,
                  eles aparecerão aqui.
                </Text>
              )}
            </View>
          </Card>
        ) : (
          filtered.map((doc) => {
            const summary = docSummary(doc);
            const modeLabel = doc.mode === 'digital' ? 'Versão Digital' : 'Papel Timbrado';
            return (
              <Card key={doc.id} padding={14} style={{ marginBottom: 10 }}>
                <View style={s.docHeader}>
                  <Ionicons name={TYPE_ICONS[doc.doc_type] || 'document-outline'} size={20} color={Warm.accentDeep} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.docTitle}>{doc.doc_type_label}</Text>
                    <Text style={s.docMeta}>
                      {fmtDate(doc.signed_at)}
                      {doc.doctor_name ? ` · ${doc.doctor_name}` : ''}
                    </Text>
                  </View>
                </View>
                {summary ? <Text style={s.docSummary}>{summary}</Text> : null}
                <View style={s.signRow}>
                  <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                  <Text style={s.signText}>Assinado digitalmente · {modeLabel}</Text>
                </View>
                <View style={s.actionRow}>
                  <Pressable style={({ pressed }) => [s.btnPrimary, pressed && { opacity: 0.85 }]} onPress={() => handleVer(doc)}>
                    <Ionicons name="eye-outline" size={14} color="#fff" />
                    <Text style={s.btnPrimaryText}>Ver</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.85 }]} onPress={() => handleExportar(doc)}>
                    <Ionicons name="download-outline" size={14} color={Warm.accentDeep} />
                    <Text style={s.btnSecondaryText}>Exportar</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.85 }]} onPress={() => handleCompartilhar(doc)}>
                    <Ionicons name="share-outline" size={14} color={Warm.accentDeep} />
                    <Text style={s.btnSecondaryText}>Compartilhar</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },

  // Loader / error
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Warm.accentDeep, borderRadius: 8, marginTop: 8 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },

  // Filter pills
  filterBar: { paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#f1f5f9', borderRadius: 16,
  },
  pillActive: { backgroundColor: Warm.accentDeep },
  pillText: { fontFamily: Fonts.uiSemibold, fontSize: 12, color: Status.slate },
  pillTextActive: { color: '#fff', fontFamily: Fonts.uiBold },

  // Doc card
  docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docTitle: { fontFamily: Fonts.uiHeavy, fontSize: 14, color: Status.ink },
  docMeta: { fontFamily: Fonts.ui, fontSize: 11, color: Status.slate, marginTop: 2 },
  docSummary: { fontFamily: Fonts.uiSemibold, fontSize: 12, color: Status.ink, marginTop: 8, marginLeft: 30 },
  signRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 30 },
  signText: { fontFamily: Fonts.ui, fontSize: 10.5, color: Status.slate },

  // Actions
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Warm.accentDeep, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, flex: 1, justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Warm.accentSoft, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, flex: 1, justifyContent: 'center',
  },
  btnSecondaryText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 12 },

  // Empty state
  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: Fonts.uiHeavy, fontSize: 14, color: Status.ink, marginTop: 6 },
  emptyText: {
    fontFamily: Fonts.ui, fontSize: 12, color: Status.slate, textAlign: 'center',
    marginTop: 4, lineHeight: 18, paddingHorizontal: 14,
  },
});
