import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, api, getToken, getUser } from '../../services/api';
import { Colors, Radius, Spacing } from '../../services/theme';
import ScreenHeader from '../../components/ScreenHeader';

const STATUS = { planning: 'Planejamento', scheduled: 'Agendada', confirmed: 'Confirmada', performed: 'Realizada', cancelled: 'Cancelada' };
const emptyForm = (doctorId = '') => ({ patient_id: '', primary_doctor_id: doctorId, procedure_name: '', status: 'planning', scheduled_date: '', scheduled_time: '', duration_min: '120', custom_location: '', hospital_booking_status: 'pending', authorization_status: 'pending', authorization_code: '', total_fee: '', patient_instructions: '', internal_notes: '', assistants: '' });
const moneyCents = (value) => Math.round((Number(String(value || '').replace(/\./g, '').replace(',', '.')) || 0) * 100);
const teamFromText = (value) => String(value || '').split(',').map(part => part.trim()).filter(Boolean).map(part => { const [display_name, percent] = part.split('|'); return { role: 'assistant', display_name: display_name.trim(), fee_factor: (Number(percent) || 30) / 100 }; });
const dateText = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : 'Sem data';

export default function CirurgiasScreen() {
  const { id: deepId } = useLocalSearchParams();
  const user = getUser();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ doctors: [], hospitals: [] });
  const [patients, setPatients] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, metadata, patientList] = await Promise.all([api(`/api/surgeries?month=${month}&status=all`), api('/api/surgeries/meta'), api('/api/patients?limit=500')]);
      setRows(Array.isArray(list) ? list : []); setMeta(metadata || {}); setPatients(Array.isArray(patientList) ? patientList : (patientList?.items || patientList?.patients || []));
    } catch (error) { Alert.alert('Cirurgias', error.message); }
    finally { setLoading(false); }
  }, [month]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const days = useMemo(() => {
    const [year, mon] = month.split('-').map(Number); const offset = (new Date(year, mon - 1, 1).getDay() + 6) % 7; const total = new Date(year, mon, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, index) => index + 1)];
  }, [month]);
  const dayRows = rows.filter(row => String(row.scheduled_date || '').slice(0, 10) === selectedDay);

  const changeMonth = (delta) => { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + delta); setMonth(date.toISOString().slice(0, 7)); };
  const startNew = () => { setEditing(null); setForm(emptyForm(user?.doctor_id || meta.doctors?.[0]?.id)); };
  const open = async (row) => {
    try {
      const item = await api(`/api/surgeries/${row.id}`); setEditing(item);
      setForm({ ...emptyForm(item.primary_doctor_id), ...item, scheduled_date: String(item.scheduled_date || '').slice(0, 10), scheduled_time: String(item.scheduled_time || '').slice(0, 5), duration_min: String(item.duration_min || 120), authorization_code: item.authorization_code || '', total_fee: item.total_fee_cents ? (Number(item.total_fee_cents) / 100).toFixed(2).replace('.', ',') : '', assistants: (item.team || []).filter(member => member.role === 'assistant').map(member => `${member.display_name}|${Number(member.fee_factor || .3) * 100}`).join(', ') });
    } catch (error) { Alert.alert('Cirurgias', error.message); }
  };
  useEffect(() => { const row=rows.find(value=>String(value.id)===String(deepId||'')); if(row) open(row); }, [deepId, rows]);
  const save = async () => {
    if (!form.patient_id || !form.procedure_name.trim()) return Alert.alert('Campos obrigatórios', 'Informe paciente e procedimento.');
    const team = teamFromText(form.assistants);
    const payload = { ...form, scheduled_date: form.scheduled_date || null, scheduled_time: form.scheduled_time || null, duration_min: Number(form.duration_min || 120), hospital_id: form.hospital_id || null, insurance_id: form.insurance_id || null, total_fee_cents: moneyCents(form.total_fee), team, expected_revision: editing?.revision };
    try { await api(editing ? `/api/surgeries/${editing.id}` : '/api/surgeries', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }); setEditing(null); setForm(null); await load(); }
    catch (error) { Alert.alert('Não foi possível salvar', error.message); }
  };
  const cancel = () => Alert.alert('Cancelar cirurgia?', 'O registro será preservado no histórico.', [{ text: 'Voltar' }, { text: 'Cancelar cirurgia', style: 'destructive', onPress: async () => { try { await api(`/api/surgeries/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, status: 'cancelled', cancellation_reason: 'Cancelada pelo aplicativo', expected_revision: editing.revision, total_fee_cents: moneyCents(form.total_fee), team: teamFromText(form.assistants) }) }); setEditing(null); setForm(null); load(); } catch (error) { Alert.alert('Erro', error.message); } } }]);
  const uploadPhoto = async () => { try { const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.85}); if(result.canceled)return; const asset=result.assets[0]; const data=new FormData(); data.append('file',{uri:asset.uri,name:asset.fileName||`cirurgia-${Date.now()}.jpg`,type:asset.mimeType||'image/jpeg'}); data.append('category','other'); data.append('visibility','internal'); const response=await fetch(`${API_BASE}/api/surgeries/${editing.id}/attachments`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:data}); const body=await response.json().catch(()=>({})); if(!response.ok)throw new Error(body.error||'Falha no envio.'); await open(editing); } catch(error){Alert.alert('Anexo',error.message);} };
  const sendTerm = async templateId => { try { await api(`/api/surgeries/${editing.id}/consents`,{method:'POST',body:JSON.stringify({template_id:templateId})}); await open(editing); Alert.alert('Termo enviado','A paciente recebeu uma notificação.'); } catch(error){Alert.alert('Termo',error.message);} };
  const field = (label, key, props = {}) => <View style={s.field}><Text style={s.label}>{label}</Text><TextInput style={[s.input, props.multiline && s.multiline]} value={String(form?.[key] ?? '')} onChangeText={(value) => setForm(current => ({ ...current, [key]: value }))} placeholderTextColor={Colors.textMuted} {...props} /></View>;

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} /></View>;
  return <View style={s.container}>
    <ScreenHeader title="Cirurgias" right={user?.clinic_name} />
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.monthHead}><Pressable onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color={Colors.text} /></Pressable><Text style={s.monthTitle}>{new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text><Pressable onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color={Colors.text} /></Pressable></View>
      <View style={s.week}>{['S','T','Q','Q','S','S','D'].map((label,index)=><Text key={`${label}${index}`} style={s.weekText}>{label}</Text>)}</View>
      <View style={s.grid}>{days.map((day,index) => { if (!day) return <View key={`b${index}`} style={s.day} />; const iso=`${month}-${String(day).padStart(2,'0')}`; const count=rows.filter(row=>String(row.scheduled_date||'').slice(0,10)===iso).length; return <Pressable key={iso} style={[s.day,selectedDay===iso&&s.daySelected]} onPress={()=>setSelectedDay(iso)}><Text style={[s.dayText,selectedDay===iso&&s.dayTextSelected]}>{day}</Text>{count ? <View style={s.dot}><Text style={s.dotText}>{count}</Text></View>:null}</Pressable>; })}</View>
      {rows.some(row=>!row.scheduled_date) ? <Pressable style={s.unscheduled} onPress={()=>setSelectedDay('')}><Ionicons name="time-outline" size={18} color={Colors.warning}/><Text>{rows.filter(row=>!row.scheduled_date).length} cirurgia(s) sem data</Text></Pressable>:null}
      <Text style={s.section}>{selectedDay ? dateText(selectedDay) : 'Sem data definida'}</Text>
      {(selectedDay ? dayRows : rows.filter(row=>!row.scheduled_date)).map(row=><Pressable key={row.id} style={s.card} onPress={()=>open(row)}><View style={s.cardHead}><Text style={s.patient}>{row.patient_name}</Text><Text style={s.badge}>{STATUS[row.status]||row.status}</Text></View><Text style={s.procedure}>{row.procedure_name}</Text><Text style={s.detail}>{String(row.scheduled_time||'').slice(0,5)||'Horário pendente'} · {row.hospital_name||row.custom_location||'Local pendente'}{row.gestational?.at_surgery?.label ? ` · IG ${row.gestational.at_surgery.label}`:''}</Text></Pressable>)}
    </ScrollView>
    <Pressable style={s.fab} onPress={startNew}><Ionicons name="add" size={28} color="#fff" /></Pressable>
    <Modal visible={!!form} animationType="slide" onRequestClose={()=>setForm(null)}><View style={s.modal}><View style={s.modalHead}><Pressable onPress={()=>setForm(null)}><Text style={s.link}>Fechar</Text></Pressable><Text style={s.modalTitle}>{editing?'Editar cirurgia':'Nova cirurgia'}</Text><Pressable onPress={save}><Text style={s.link}>Salvar</Text></Pressable></View><ScrollView contentContainerStyle={s.form}>
      <Text style={s.label}>Paciente</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{patients.map(patient=><Pressable key={patient.id} onPress={()=>setForm(current=>({...current,patient_id:patient.id}))} style={[s.choice,form.patient_id===patient.id&&s.choiceOn]}><Text style={form.patient_id===patient.id?s.choiceTextOn:s.choiceText}>{patient.name}</Text></Pressable>)}</ScrollView>
      {field('Procedimento *','procedure_name')}
      <View style={s.row}>{field('Data (AAAA-MM-DD)','scheduled_date')}{field('Horário (HH:MM)','scheduled_time')}</View>
      {field('Local / hospital avulso','custom_location')}
      <Text style={s.label}>Hospital cadastrado</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><Pressable onPress={()=>setForm(current=>({...current,hospital_id:null}))} style={[s.choice,!form.hospital_id&&s.choiceOn]}><Text style={!form.hospital_id?s.choiceTextOn:s.choiceText}>Nenhum</Text></Pressable>{(meta.hospitals||[]).map(hospital=><Pressable key={hospital.id} onPress={()=>setForm(current=>({...current,hospital_id:hospital.id}))} style={[s.choice,form.hospital_id===hospital.id&&s.choiceOn]}><Text style={form.hospital_id===hospital.id?s.choiceTextOn:s.choiceText}>{hospital.name}</Text></Pressable>)}</ScrollView>
      <Text style={s.label}>Situação</Text><View style={s.choices}>{Object.entries(STATUS).map(([key,label])=><Pressable key={key} onPress={()=>setForm(current=>({...current,status:key}))} style={[s.choice,form.status===key&&s.choiceOn]}><Text style={form.status===key?s.choiceTextOn:s.choiceText}>{label}</Text></Pressable>)}</View>
      <Text style={s.label}>Hospital</Text><View style={s.choices}>{[['pending','Pendente'],['requested','Solicitado'],['scheduled','Agendado'],['confirmed','Confirmado'],['issue','Pendência']].map(([key,label])=><Pressable key={key} onPress={()=>setForm(current=>({...current,hospital_booking_status:key}))} style={[s.choice,form.hospital_booking_status===key&&s.choiceOn]}><Text style={form.hospital_booking_status===key?s.choiceTextOn:s.choiceText}>{label}</Text></Pressable>)}</View>
      <Text style={s.label}>Autorização</Text><View style={s.choices}>{[['not_required','Não exige'],['pending','Pendente'],['in_analysis','Em análise'],['authorized','Autorizada'],['issue','Pendência'],['denied','Negada']].map(([key,label])=><Pressable key={key} onPress={()=>setForm(current=>({...current,authorization_status:key}))} style={[s.choice,form.authorization_status===key&&s.choiceOn]}><Text style={form.authorization_status===key?s.choiceTextOn:s.choiceText}>{label}</Text></Pressable>)}</View>
      <View style={s.row}>{field('Honorário total (R$)','total_fee',{keyboardType:'decimal-pad'})}{field('Duração (min)','duration_min',{keyboardType:'number-pad'})}</View>
      {field('Auxiliares: Nome|30, Nome|20','assistants')}
      <Text style={s.help}>Cada percentual é calculado sobre o cirurgião principal; o padrão é 30%.</Text>
      {field('Código de autorização','authorization_code')}
      {field('Orientações à paciente','patient_instructions',{multiline:true})}{field('Observações internas','internal_notes',{multiline:true})}
      {editing?<View style={s.mobileDocs}><Text style={s.label}>Documentos e termos</Text><Pressable style={s.secondaryBtn} onPress={uploadPhoto}><Ionicons name="camera-outline" size={18} color={Colors.primary}/><Text style={s.secondaryText}>Anexar foto ou guia digitalizada</Text></Pressable>{(editing.attachments||[]).map(file=><Text key={file.id} style={s.help}>• {file.filename}</Text>)}{(meta.templates||[]).map(template=><Pressable key={template.id} style={s.secondaryBtn} onPress={()=>sendTerm(template.id)}><Ionicons name="document-text-outline" size={18} color={Colors.primary}/><Text style={s.secondaryText}>Enviar {template.name}</Text></Pressable>)}</View>:null}
      {editing&&editing.status!=='cancelled'?<Pressable style={s.cancel} onPress={cancel}><Text style={s.cancelText}>Cancelar cirurgia</Text></Pressable>:null}
    </ScrollView></View></Modal>
  </View>;
}

const s=StyleSheet.create({container:{flex:1,backgroundColor:Colors.bg},center:{flex:1,alignItems:'center',justifyContent:'center'},content:{padding:Spacing.md,paddingBottom:100},monthHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},monthTitle:{fontSize:18,fontWeight:'700',textTransform:'capitalize',color:Colors.text},week:{flexDirection:'row'},weekText:{width:'14.285%',textAlign:'center',fontSize:11,color:Colors.textMuted,fontWeight:'700'},grid:{flexDirection:'row',flexWrap:'wrap',backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.sm,padding:4},day:{width:'14.285%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:Radius.sm},daySelected:{backgroundColor:Colors.primary},dayText:{color:Colors.text,fontWeight:'600'},dayTextSelected:{color:'#fff'},dot:{position:'absolute',right:3,bottom:3,minWidth:14,height:14,borderRadius:7,backgroundColor:Colors.warning,alignItems:'center'},dotText:{fontSize:9,color:'#fff',fontWeight:'700'},unscheduled:{flexDirection:'row',gap:8,alignItems:'center',padding:12,marginTop:12,backgroundColor:Colors.warningBg,borderRadius:Radius.sm},section:{fontSize:13,fontWeight:'700',color:Colors.textMuted,textTransform:'uppercase',marginTop:20,marginBottom:8},card:{backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.sm,padding:12,marginBottom:8},cardHead:{flexDirection:'row',justifyContent:'space-between',gap:8},patient:{fontWeight:'700',color:Colors.text,flex:1},badge:{fontSize:10,color:Colors.primary,fontWeight:'700'},procedure:{color:Colors.textSecondary,marginTop:4},detail:{fontSize:12,color:Colors.textMuted,marginTop:5},fab:{position:'absolute',right:20,bottom:24,width:54,height:54,borderRadius:27,backgroundColor:Colors.primary,alignItems:'center',justifyContent:'center'},modal:{flex:1,backgroundColor:Colors.bg},modalHead:{paddingTop:58,paddingHorizontal:16,paddingBottom:12,backgroundColor:Colors.card,borderBottomWidth:1,borderColor:Colors.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},modalTitle:{fontSize:17,fontWeight:'700'},link:{color:Colors.primary,fontWeight:'700'},form:{padding:16,paddingBottom:60,gap:12},field:{flex:1,gap:5},label:{fontSize:12,fontWeight:'700',color:Colors.textSecondary},input:{backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.sm,paddingHorizontal:12,paddingVertical:10,color:Colors.text},multiline:{height:90,textAlignVertical:'top'},row:{flexDirection:'row',gap:10},choices:{flexDirection:'row',flexWrap:'wrap',gap:6},choice:{borderWidth:1,borderColor:Colors.border,borderRadius:99,paddingHorizontal:11,paddingVertical:7,marginRight:6},choiceOn:{backgroundColor:Colors.primary,borderColor:Colors.primary},choiceText:{fontSize:12,color:Colors.text},choiceTextOn:{fontSize:12,color:'#fff'},help:{fontSize:11,color:Colors.textMuted},mobileDocs:{gap:8,borderTopWidth:1,borderColor:Colors.border,paddingTop:12},secondaryBtn:{flexDirection:'row',alignItems:'center',gap:7,borderWidth:1,borderColor:Colors.primary,borderRadius:Radius.sm,padding:10},secondaryText:{color:Colors.primary,fontWeight:'700'},cancel:{marginTop:18,padding:13,borderWidth:1,borderColor:Colors.danger,borderRadius:Radius.sm,alignItems:'center'},cancelText:{color:Colors.danger,fontWeight:'700'}});
