import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api, getToken } from '../../services/api';
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

function fmtDate(raw) {
  if (!raw) return '—';
  const s = (raw instanceof Date) ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR');
}

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

// Baixa o PDF privado com Bearer token pra cache local. Retorna URI do arquivo.
// Usado SÓ pra Sharing — WebBrowser não aceita file:// (v0.0.094).
async function downloadPdfToCache(doc) {
  const token = getToken();
  if (!token) throw new Error('Sessão expirada');
  const localUri = FileSystem.cacheDirectory + `documento-${doc.id}.pdf`;
  const result = await FileSystem.downloadAsync(
    `${API_BASE}${doc.pdf_url}`,
    localUri,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (result.status !== 200) throw new Error(`Falha (${result.status})`);
  return result.uri;
}

// v0.0.094: pega URL R2 assinada temporária (5min) — pra abrir no in-app browser.
async function getSignedPdfUrl(doc) {
  const r = await api(`/api/my-clinic-documents/${doc.id}/pdf-url`);
  if (!r?.url) throw new Error('PDF não disponível');
  return r.url;
}

export default function DocumentosScreen() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

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

  const validarUrl = (doc) => `${API_BASE}/validar/doc/${doc.id}`;

  // Ver: prioriza PDF via URL R2 assinada (in-app browser). Fallback: validação.
  // v0.0.094: WebBrowser não aceita file://; passamos URL R2 assinada (300s) em vez de baixar local.
  const handleVer = async (doc) => {
    if (busyId) return;
    setBusyId(doc.id);
    try {
      let url;
      if (doc.has_pdf) {
        url = await getSignedPdfUrl(doc);
      } else {
        // Doc legado sem PDF — abre validação como fallback
        url = validarUrl(doc);
      }
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: Warm.accentDeep,
        controlsColor: '#fff',
        enableBarCollapsing: true,
      });
    } catch (e) {
      Alert.alert('Erro ao abrir', e?.message || 'Tente novamente.');
    } finally {
      setBusyId(null);
    }
  };

  // Compartilhar: arquivo .pdf como anexo (Share sheet nativo)
  // Pra docs sem PDF, compartilha URL da validação (fallback)
  const handleCompartilhar = async (doc) => {
    if (busyId) return;
    setBusyId(doc.id);
    try {
      if (doc.has_pdf) {
        const localUri = await downloadPdfToCache(doc);
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
          return;
        }
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: doc.doc_type_label,
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback pra docs legacy
        await WebBrowser.openBrowserAsync(validarUrl(doc));
      }
    } catch (e) {
      Alert.alert('Erro ao compartilhar', e?.message || 'Tente novamente.');
    } finally {
      setBusyId(null);
    }
  };

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

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.doc_type === filter);
  const showFilter = docs.length > 5;

  return (
    <View style={s.container}>
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
            const isBusy = busyId === doc.id;
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
                  {!doc.has_pdf && (
                    <Text style={s.legacyTag}> · (somente validação)</Text>
                  )}
                </View>
                <View style={s.actionRow}>
                  <Pressable
                    style={({ pressed }) => [s.btnPrimary, (pressed || isBusy) && { opacity: 0.85 }]}
                    onPress={() => handleVer(doc)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="eye-outline" size={14} color="#fff" />
                        <Text style={s.btnPrimaryText}>Ver</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.btnSecondary, (pressed || isBusy) && { opacity: 0.85 }]}
                    onPress={() => handleCompartilhar(doc)}
                    disabled={isBusy}
                  >
                    <Ionicons name="share-outline" size={14} color={Warm.accentDeep} />
                    <Text style={s.btnSecondaryText}>{doc.has_pdf ? 'Compartilhar' : 'Validação'}</Text>
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

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Warm.accentDeep, borderRadius: 8, marginTop: 8 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },

  filterBar: { paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  pill: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#f1f5f9', borderRadius: 16 },
  pillActive: { backgroundColor: Warm.accentDeep },
  pillText: { fontFamily: Fonts.uiSemibold, fontSize: 12, color: Status.slate },
  pillTextActive: { color: '#fff', fontFamily: Fonts.uiBold },

  docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docTitle: { fontFamily: Fonts.uiHeavy, fontSize: 14, color: Status.ink },
  docMeta: { fontFamily: Fonts.ui, fontSize: 11, color: Status.slate, marginTop: 2 },
  docSummary: { fontFamily: Fonts.uiSemibold, fontSize: 12, color: Status.ink, marginTop: 8, marginLeft: 30 },
  signRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 30, flexWrap: 'wrap' },
  signText: { fontFamily: Fonts.ui, fontSize: 10.5, color: Status.slate },
  legacyTag: { fontFamily: Fonts.ui, fontSize: 10, color: Status.slate, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Warm.accentDeep, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 36,
  },
  btnPrimaryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 12 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Warm.accentSoft, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 36,
  },
  btnSecondaryText: { color: Warm.accentDeep, fontFamily: Fonts.uiBold, fontSize: 12 },

  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: Fonts.uiHeavy, fontSize: 14, color: Status.ink, marginTop: 6 },
  emptyText: {
    fontFamily: Fonts.ui, fontSize: 12, color: Status.slate, textAlign: 'center',
    marginTop: 4, lineHeight: 18, paddingHorizontal: 14,
  },
});
