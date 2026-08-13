import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Colors, Radius, Spacing } from '../../services/theme';
import ScreenHeader from '../../components/ScreenHeader';

const labels={planning:'Em planejamento',scheduled:'Agendada',confirmed:'Confirmada',performed:'Realizada',cancelled:'Cancelada'};
const formatDate=value=>value?new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'long'}):'Data a definir';

export default function MinhasCirurgias(){
  const router=useRouter(); const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState('');
  const load=useCallback(async()=>{try{setError('');setRows(await api('/api/my-surgeries')||[]);}catch(e){setError(e.message);}finally{setLoading(false);setRefreshing(false);}},[]);
  useEffect(()=>{load();},[load]);
  return <View style={s.container}><ScreenHeader title="Minhas Cirurgias" />{loading?<View style={s.center}><ActivityIndicator color={Colors.primary}/></View>:<ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}}/>}>
    {error?<Text style={s.error}>{error}</Text>:null}
    {!rows.length&&!error?<View style={s.empty}><Ionicons name="medkit-outline" size={34} color={Colors.textMuted}/><Text style={s.emptyTitle}>Nenhuma cirurgia cadastrada</Text><Text style={s.muted}>Quando houver um planejamento, os detalhes aparecerão aqui.</Text></View>:null}
    {rows.map(row=><Pressable key={row.id} style={s.card} onPress={()=>router.push(`/(paciente)/cirurgias/${row.id}`)}><View style={s.head}><View style={s.dateIcon}><Ionicons name="calendar-outline" size={20} color={Colors.primary}/></View><View style={{flex:1}}><Text style={s.date}>{formatDate(row.scheduled_date)}{row.scheduled_time?` · ${String(row.scheduled_time).slice(0,5)}`:''}</Text><Text style={s.status}>{labels[row.status]||row.status}</Text></View><Ionicons name="chevron-forward" size={20} color={Colors.textMuted}/></View><Text style={s.procedure}>{row.procedure_name}</Text><Text style={s.detail}>Dr(a). {row.doctor_name}</Text>{row.hospital_name?<Text style={s.detail}>{row.hospital_name}</Text>:null}{row.gestational?.at_surgery?.label?<View style={s.ig}><Ionicons name="heart-outline" size={14} color={Colors.primary}/><Text style={s.igText}>Idade gestacional prevista: {row.gestational.at_surgery.label}</Text></View>:null}</Pressable>)}
  </ScrollView>}</View>;
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:Colors.bg},center:{flex:1,alignItems:'center',justifyContent:'center'},content:{padding:Spacing.md,paddingBottom:50},card:{backgroundColor:Colors.card,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:14,marginBottom:10},head:{flexDirection:'row',gap:10,alignItems:'center'},dateIcon:{width:38,height:38,borderRadius:19,backgroundColor:Colors.primarySofter,alignItems:'center',justifyContent:'center'},date:{fontWeight:'700',color:Colors.text,textTransform:'capitalize'},status:{fontSize:12,color:Colors.primary,marginTop:2},procedure:{fontSize:16,fontWeight:'700',color:Colors.text,marginTop:13},detail:{fontSize:13,color:Colors.textSecondary,marginTop:4},ig:{flexDirection:'row',gap:6,alignItems:'center',backgroundColor:Colors.primarySofter,padding:8,borderRadius:Radius.sm,marginTop:10},igText:{fontSize:12,color:Colors.primary,fontWeight:'600'},empty:{alignItems:'center',padding:40},emptyTitle:{fontWeight:'700',fontSize:17,marginTop:12,color:Colors.text},muted:{color:Colors.textMuted,textAlign:'center',marginTop:5},error:{color:Colors.danger,backgroundColor:Colors.dangerBg,padding:12,borderRadius:Radius.sm}});
