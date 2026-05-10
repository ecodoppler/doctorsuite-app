import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../components/pregnancy/VFHeader';
import Card from '../../components/pregnancy/Card';
import SectionTitle from '../../components/pregnancy/SectionTitle';
import { api } from '../../services/api';
import { Fonts, Status, Warm } from '../../services/theme';

export default function VacinasScreen() {
  const [data, setData] = useState(null);          // shape: { patient, pregnancy } (de /api/my-pregnancy)
  const [vac, setVac] = useState(null);            // shape: { taken, prev, pending } (de /api/my-pregnancy/vaccines)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [pg, vc] = await Promise.all([
        api('/api/my-pregnancy'),
        api('/api/my-pregnancy/vaccines'),
      ]);
      setData(pg);
      setVac(vc);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={s.container}><View style={s.loaderWrap}>
        <ActivityIndicator size="large" color={Warm.accentDeep} />
      </View></View>
    );
  }
  if (err) {
    return (
      <View style={s.container}><View style={[s.loaderWrap, { padding: 24 }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={Status.slate} />
        <Text style={s.errText}>Não foi possível carregar.{'\n'}{err}</Text>
        <Pressable onPress={() => { setLoading(true); load(); }} style={s.retryBtn}>
          <Text style={s.retryText}>Tentar de novo</Text>
        </Pressable>
      </View></View>
    );
  }

  const patient = data?.patient || {};
  const pregnancy = data?.pregnancy;
  const taken = vac?.taken || [];
  const prev = vac?.prev || [];
  const pending = vac?.pending || [];

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {/* Título humano */}
        <View style={[s.section, { paddingTop: 14 }]}>
          <Text style={s.title}>Vacinas tomadas na gravidez</Text>
          <Text style={s.subtitle}>
            {taken.length} {taken.length === 1 ? 'aplicação realizada' : 'aplicações realizadas'} durante a gestação atual
          </Text>
        </View>

        {/* Vacinas aplicadas na gestação */}
        {taken.length > 0 && (
          <View style={s.section}>
            <Card padding={0}>
              {taken.map((v, i) => (
                <View key={v.id || i} style={[s.takenRow, i < taken.length - 1 && s.rowBorder]}>
                  <View style={s.checkBox}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.takenHeader}>
                      <Text style={s.takenName} numberOfLines={2}>{v.name}</Text>
                      {v.ig ? <Text style={s.takenIG}>{v.ig}</Text> : null}
                    </View>
                    <Text style={s.takenDate}>{v.date || 'data não informada'}</Text>
                    {v.note ? <Text style={s.takenNote}>{v.note}</Text> : null}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Imunizações pré-gestacionais */}
        {prev.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Imunizações pré-gestacionais</SectionTitle>
            <Card padding={0}>
              {prev.map((v, i) => (
                <View key={v.id || i} style={[s.prevRow, i < prev.length - 1 && s.rowBorder]}>
                  <View style={s.prevDot} />
                  <Text style={s.prevName} numberOfLines={1}>{v.name}</Text>
                  <Text style={s.prevNote} numberOfLines={1}>{v.note || v.date || '— pré-gestacional'}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Card warm informativo */}
        <View style={s.section}>
          <View style={s.warmCard}>
            <Text style={s.warmEyebrow}>Recomendado e ainda não aplicado</Text>
            {pending.length === 0 ? (
              <Text style={s.warmText}>
                Todas as vacinas recomendadas para esta gestação foram aplicadas. ✓
              </Text>
            ) : (
              <View style={{ marginTop: 6 }}>
                {pending.map((v, i) => {
                  const flag = v.flags?.includes('not_yet')
                    ? ' (ainda não é hora)'
                    : v.flags?.includes('late') ? ' (fora da janela ideal)' : '';
                  return (
                    <Text key={v.code || i} style={s.pendingItem}>
                      · {v.short_name || v.name}
                      {v.schedule_text ? ` — ${v.schedule_text}` : ''}
                      {flag ? <Text style={s.pendingFlag}>{flag}</Text> : null}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, marginTop: 10, textAlign: 'center' },
  retryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Warm.accentDeep },
  retryText: { color: '#fff', fontFamily: Fonts.uiSemibold, fontSize: 13 },

  title: { fontFamily: Fonts.display, fontSize: 22, color: Status.ink, lineHeight: 26 },
  subtitle: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 2 },

  // Aplicadas na gestação
  takenRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  checkBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Status.okSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: Status.ok, fontFamily: Fonts.uiHeavy, fontSize: 18 },
  takenHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  takenName: { flex: 1, fontSize: 13, color: Status.ink, fontFamily: Fonts.uiBold },
  takenIG: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.num },
  takenDate: { fontSize: 11, color: Status.slate, fontFamily: Fonts.num, marginTop: 2 },
  takenNote: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, marginTop: 4, lineHeight: 16 },

  // Pré-gestacionais
  prevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  prevDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: Status.slateLight },
  prevName: { flex: 1, fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold },
  prevNote: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, flexShrink: 1, textAlign: 'right' },

  // Card warm informativo
  warmCard: {
    backgroundColor: Warm.cream,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Status.borderSoft,
  },
  warmEyebrow: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiBold, letterSpacing: 0.4, textTransform: 'uppercase' },
  warmText: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, marginTop: 6, lineHeight: 18 },
  pendingItem: { fontSize: 12, color: Status.ink, fontFamily: Fonts.ui, lineHeight: 18 },
  pendingFlag: { fontSize: 11, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic' },
});
