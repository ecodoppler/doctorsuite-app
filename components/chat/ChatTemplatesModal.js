import { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getUser } from '../../services/api';
import { Colors } from '../../services/theme';

const VARIABLES = [
  { key: '$paciente$', label: 'Nome completo' },
  { key: '$primeiro_nome$', label: 'Primeiro nome' },
  { key: '$ig$', label: 'IG (28s 3d)' },
  { key: '$dpp$', label: 'DPP' },
];

// Modal reutilizável: lista templates pessoais + globais, busca, criar/editar
export default function ChatTemplatesModal({ visible, onClose, onPick }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // template object ou null
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formGlobal, setFormGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAdmin = !!getUser()?.is_admin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/api/chat-templates');
      setTemplates(Array.isArray(r) ? r : []);
    } catch {
      setTemplates([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  const filtered = templates.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (t.title || '').toLowerCase().includes(q) || (t.body || '').toLowerCase().includes(q);
  });
  const personal = filtered.filter(t => !t.is_global);
  const global = filtered.filter(t => t.is_global);

  const openNew = () => { setEditing(null); setFormTitle(''); setFormBody(''); setFormGlobal(false); setShowForm(true); };
  const openEdit = (tpl) => { setEditing(tpl); setFormTitle(tpl.title); setFormBody(tpl.body); setFormGlobal(!!tpl.is_global); setShowForm(true); };

  const save = async () => {
    if (!formTitle.trim() || !formBody.trim()) return Alert.alert('Preencha título e mensagem');
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/chat-templates/${editing.id}`, {
          method: 'PUT', body: JSON.stringify({ title: formTitle.trim(), body: formBody.trim() }),
        });
      } else {
        await api('/api/chat-templates', {
          method: 'POST', body: JSON.stringify({ title: formTitle.trim(), body: formBody.trim(), is_global: formGlobal && isAdmin }),
        });
      }
      setShowForm(false);
      await load();
    } catch (e) { Alert.alert('Erro', e?.message || 'Tente novamente.'); }
    finally { setSaving(false); }
  };

  const remove = (tpl) => {
    Alert.alert('Excluir template?', `"${tpl.title}" será removido.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await api(`/api/chat-templates/${tpl.id}`, { method: 'DELETE' });
          await load();
        } catch (e) { Alert.alert('Erro', e?.message || 'Tente novamente.'); }
      }},
    ]);
  };

  const insertVar = (v) => setFormBody(prev => prev + ' ' + v);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          {showForm ? (
            <>
              <View style={s.header}>
                <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                  <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={s.headerTitle}>{editing ? 'Editar template' : 'Novo template'}</Text>
                <View style={{ width: 24 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
                <Text style={s.label}>Título</Text>
                <TextInput style={s.input} value={formTitle} onChangeText={setFormTitle} placeholder="Ex: Orientação pós-coleta" maxLength={80} />
                <Text style={s.label}>Mensagem</Text>
                <TextInput style={[s.input, { minHeight: 110, textAlignVertical: 'top' }]} value={formBody} onChangeText={setFormBody} multiline placeholder="Você pode usar $paciente$, $primeiro_nome$, $ig$, $dpp$" maxLength={2000} />
                <Text style={s.helper}>Variáveis (toque pra inserir):</Text>
                <View style={s.varsWrap}>
                  {VARIABLES.map(v => (
                    <Pressable key={v.key} onPress={() => insertVar(v.key)} style={s.varChip}>
                      <Text style={s.varChipKey}>{v.key}</Text>
                      <Text style={s.varChipLabel}>{v.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {isAdmin && !editing && (
                  <Pressable onPress={() => setFormGlobal(!formGlobal)} style={s.globalToggle}>
                    <Ionicons name={formGlobal ? 'checkbox' : 'square-outline'} size={20} color={Colors.primary} />
                    <Text style={s.globalToggleText}>Template global (todos os médicos da clínica usam)</Text>
                  </Pressable>
                )}
              </ScrollView>
              <View style={s.formActions}>
                <Pressable onPress={() => setShowForm(false)} style={s.btnCancel}><Text style={s.btnCancelText}>Cancelar</Text></Pressable>
                <Pressable onPress={save} disabled={saving} style={[s.btnSave, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnSaveText}>Salvar</Text>}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={s.header}>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
                <Text style={s.headerTitle}>Templates</Text>
                <Pressable onPress={openNew} hitSlop={8}>
                  <Ionicons name="add" size={26} color={Colors.primary} />
                </Pressable>
              </View>
              <View style={s.searchWrap}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <TextInput style={s.searchInput} placeholder="Buscar template..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
              </View>
              {loading ? (
                <View style={s.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
              ) : (templates.length === 0) ? (
                <View style={s.empty}>
                  <Ionicons name="reader-outline" size={42} color={Colors.textMuted} />
                  <Text style={s.emptyTitle}>Nenhum template ainda</Text>
                  <Text style={s.emptyText}>Toque em + para criar seu primeiro.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                  {personal.length > 0 && (
                    <>
                      <Text style={s.sectionLabel}>⭐ Pessoais</Text>
                      {personal.map(t => (
                        <TemplateItem key={t.id} tpl={t} canEdit canDelete onPick={() => onPick(t)} onEdit={() => openEdit(t)} onDelete={() => remove(t)} />
                      ))}
                    </>
                  )}
                  {global.length > 0 && (
                    <>
                      <Text style={s.sectionLabel}>🏥 Da clínica</Text>
                      {global.map(t => (
                        <TemplateItem key={t.id} tpl={t} canEdit={isAdmin} canDelete={isAdmin} onPick={() => onPick(t)} onEdit={() => openEdit(t)} onDelete={() => remove(t)} />
                      ))}
                    </>
                  )}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function TemplateItem({ tpl, canEdit, canDelete, onPick, onEdit, onDelete }) {
  return (
    <View style={s.itemRow}>
      <Pressable style={s.itemMain} onPress={onPick}>
        <Text style={s.itemTitle} numberOfLines={1}>{tpl.title}</Text>
        <Text style={s.itemBody} numberOfLines={2}>{tpl.body}</Text>
      </Pressable>
      <View style={s.itemActions}>
        {canEdit && (
          <Pressable onPress={onEdit} hitSlop={6} style={s.itemActionBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
        {canDelete && (
          <Pressable onPress={onDelete} hitSlop={6} style={s.itemActionBtn}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, height: '85%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },

  loader: { padding: 40, alignItems: 'center' },
  empty: { alignItems: 'center', padding: 30, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 12.5, color: Colors.textMuted, textAlign: 'center' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },

  itemRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemMain: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemBody: { fontSize: 12.5, color: Colors.textMuted, marginTop: 3, lineHeight: 17 },
  itemActions: { flexDirection: 'row', paddingRight: 10 },
  itemActionBtn: { padding: 8 },

  label: { fontSize: 12.5, fontWeight: '700', color: Colors.text, marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: '#fff' },
  helper: { fontSize: 11.5, color: Colors.textMuted, marginTop: 14, marginBottom: 6 },
  varsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  varChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  varChipKey: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: '#4338ca' },
  varChipLabel: { fontSize: 11, color: '#4338ca' },
  globalToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 8 },
  globalToggleText: { fontSize: 13, color: Colors.text, flex: 1 },

  formActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 10 },
  btnCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#f1f5f9' },
  btnCancelText: { fontWeight: '600', color: Colors.text },
  btnSave: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.primary },
  btnSaveText: { fontWeight: '700', color: '#fff' },
});
