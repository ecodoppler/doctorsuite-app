import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import VFHeader from '../../../components/pregnancy/VFHeader';
import Card from '../../../components/pregnancy/Card';
import SectionTitle from '../../../components/pregnancy/SectionTitle';
import { api } from '../../../services/api';
import { Fonts, Status, Warm } from '../../../services/theme';

const TRIM_KEYS = ['T1', 'T2', 'T3'];

export default function ExamesScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const d = await api('/api/my-pregnancy');
      setData(d);
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
  if (!pregnancy) {
    return (
      <View style={s.container}><View style={[s.loaderWrap, { padding: 24 }]}>
        <Ionicons name="heart-outline" size={48} color={Warm.accentDeep} />
        <Text style={s.emptyTitle}>Sem gestação ativa</Text>
        <Text style={s.emptySub}>Exames aparecem aqui quando o seu médico iniciar uma nova gestação.</Text>
      </View></View>
    );
  }

  const labsByTrim = data?.labs?.byTrimester || {};
  const trims = TRIM_KEYS
    .map(k => labsByTrim[k])
    .filter(t => t && Array.isArray(t.sessions) && t.sessions.length > 0);

  const usg = data?.imaging?.usg || [];
  const ecoFetal = data?.imaging?.ecoFetal || [];

  const hasAnyLab = trims.length > 0;
  const hasAnyImaging = usg.length > 0 || ecoFetal.length > 0;

  const onLabClick = (id, name) => {
    router.push({ pathname: '/(paciente)/exame-detalhe', params: { id, name } });
  };

  return (
    <View style={s.container}>
      <VFHeader patient={patient} pregnancy={pregnancy} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Warm.accentDeep} />}
      >
        {/* Laboratoriais */}
        <View style={s.section}>
          <SectionTitle>Laboratoriais</SectionTitle>
          {!hasAnyLab ? (
            <Card padding={16}>
              <Text style={s.empty}>Nenhum exame laboratorial registrado nesta gestação ainda.</Text>
            </Card>
          ) : trims.map((trim, ti) => (
            <View key={ti} style={{ marginBottom: 14 }}>
              <Text style={s.trimLabel}>{trim.label}</Text>
              {trim.sessions.map((session, si) => (
                <View key={si} style={{ marginBottom: 8 }}>
                  <View style={s.sessionHeader}>
                    <Text style={s.sessionDate}>
                      {(session.date || '').slice(0, 5)} <Text style={s.sessionIG}>{session.ig}</Text>
                    </Text>
                  </View>
                  <Card padding={0}>
                    {session.items.map((item, i) => {
                      const hasSeries = !!item.hasSeries;
                      const isLast = i === session.items.length - 1;
                      return (
                        <Pressable
                          key={i}
                          disabled={!hasSeries}
                          onPress={() => onLabClick(item.id, item.name)}
                          style={({ pressed }) => [
                            s.labRow,
                            !isLast && s.labRowBorder,
                            hasSeries && pressed && { backgroundColor: '#fafafa' },
                          ]}
                        >
                          <View style={s.labNameWrap}>
                            <Text style={s.labName} numberOfLines={1}>{item.name}</Text>
                            {hasSeries && (
                              <View style={s.evolBadge}>
                                <Text style={s.evolText}>EVOLUÇÃO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={s.labResult} numberOfLines={1}>{item.result}</Text>
                          {hasSeries ? <Text style={s.chev}>›</Text> : null}
                        </Pressable>
                      );
                    })}
                  </Card>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Ultrassonografias */}
        {usg.length > 0 && (
          <View style={[s.section, { paddingTop: 4 }]}>
            <SectionTitle>Ultrassonografias</SectionTitle>
            <Card padding={0}>
              {usg.map((u, i) => (
                <View key={i} style={[s.imgRow, i < usg.length - 1 && s.imgRowBorder]}>
                  <View style={s.imgHeader}>
                    <Text style={s.imgKind}>{u.kind}</Text>
                    {u.ig ? <Text style={s.imgIG}>{u.ig}</Text> : null}
                  </View>
                  {u.date ? <Text style={s.imgDate}>{u.date}</Text> : null}
                  {u.finding ? <Text style={s.imgFinding}>{u.finding}</Text> : null}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Ecocardiografia fetal */}
        {ecoFetal.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Ecocardiografia fetal</SectionTitle>
            <Card padding={0}>
              {ecoFetal.map((e, i) => (
                <View key={i} style={[s.imgRow, i < ecoFetal.length - 1 && s.imgRowBorder]}>
                  <View style={s.imgHeader}>
                    <Text style={s.imgKind}>{e.kind}</Text>
                    {e.ig ? <Text style={s.imgIG}>{e.ig}</Text> : null}
                  </View>
                  {e.date ? <Text style={s.imgDate}>{e.date}</Text> : null}
                  {e.finding ? <Text style={s.imgFinding}>{e.finding}</Text> : null}
                </View>
              ))}
            </Card>
          </View>
        )}

        {!hasAnyLab && !hasAnyImaging && (
          <View style={s.section}>
            <Text style={s.emptySub}>Nenhum exame registrado ainda.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  section: { paddingHorizontal: 16, paddingTop: 14 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 8, backgroundColor: Warm.accentDeep, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontFamily: Fonts.uiBold, fontSize: 13 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 22, color: Warm.rose, marginTop: 4 },
  emptySub: { fontSize: 13, color: Status.slate, fontFamily: Fonts.ui, textAlign: 'center', lineHeight: 20 },
  empty: { fontSize: 12, color: Status.slate, fontFamily: Fonts.ui, fontStyle: 'italic', textAlign: 'center' },

  // Trimestre / sessão
  trimLabel: { fontSize: 11, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4, paddingBottom: 6 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 4 },
  sessionDate: { fontSize: 11, color: Status.ink, fontFamily: Fonts.numHeavy },
  sessionIG: { color: Status.slate, fontFamily: Fonts.num, marginLeft: 4 },

  // Lab item
  labRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  labRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  labNameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  labName: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiSemibold, flexShrink: 1 },
  labResult: { fontSize: 12, color: Status.ink, fontFamily: Fonts.numHeavy, marginLeft: 6 },
  chev: { color: Status.slateLight, fontSize: 16, marginLeft: 2, fontFamily: Fonts.uiBold },

  // Badge EVOLUÇÃO
  evolBadge: { backgroundColor: Warm.accentSoft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 },
  evolText: { fontSize: 9, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy, letterSpacing: 0.3 },

  // Imagem (USG, eco)
  imgRow: { padding: 12 },
  imgRowBorder: { borderBottomWidth: 1, borderBottomColor: Status.borderSoft },
  imgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  imgKind: { fontSize: 12, color: Status.ink, fontFamily: Fonts.uiBold, flex: 1, marginRight: 8 },
  imgIG: { fontSize: 10, color: Warm.accentDeep, fontFamily: Fonts.uiHeavy },
  imgDate: { fontSize: 10, color: Status.slate, fontFamily: Fonts.num },
  imgFinding: { fontSize: 11, color: Status.ink, fontFamily: Fonts.ui, marginTop: 4, lineHeight: 16 },
});
