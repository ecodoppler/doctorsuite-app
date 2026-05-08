import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login, loginAsPatient } from '../../services/api';
import { Colors, Spacing, FontSize, Radius } from '../../services/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [mode, setMode] = useState('profissional');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  // Multi-clinic
  const [clinics, setClinics] = useState(null);
  const [cpfForClinic, setCpfForClinic] = useState('');
  const [dobForClinic, setDobForClinic] = useState('');
  const router = useRouter();

  const formatCpf = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatDob = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const handleProfessionalLogin = async () => {
    if (!email || !password) return Alert.alert('Atenção', 'Preencha email e senha.');
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      const role = data.user?.role;
      if (role === 'admin' || role === 'medico') {
        router.replace('/(medico)/agenda');
      } else if (role === 'secretaria') {
        router.replace('/(secretaria)/agendas');
      } else {
        router.replace('/(paciente)/agendamentos');
      }
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível fazer login.');
    } finally { setLoading(false); }
  };

  const handlePatientLogin = async (selectedClinicId) => {
    const cpfVal = selectedClinicId ? cpfForClinic : cpf.replace(/\D/g, '');
    const dobVal = selectedClinicId ? dobForClinic : (() => {
      const parts = dob.split('/');
      return parts.length === 3 && parts[2].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
    })();

    if (!selectedClinicId) {
      if (cpfVal.length !== 11) return Alert.alert('Atenção', 'Informe um CPF válido com 11 dígitos.');
      if (!dobVal) return Alert.alert('Atenção', 'Informe a data no formato DD/MM/AAAA.');
      setCpfForClinic(cpfVal);
      setDobForClinic(dobVal);
    }

    setLoading(true);
    try {
      const data = await loginAsPatient(cpfVal, dobVal, selectedClinicId || undefined);
      if (data.choose_clinic) {
        setClinics(data.clinics);
        setLoading(false);
        return;
      }
      setClinics(null);
      router.replace('/(paciente)/agendamentos');
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível verificar seus dados.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Image source={require('../../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>DoctorSuite</Text>
        <Text style={s.subtitle}>Sistema Médico</Text>

        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, mode === 'profissional' && s.tabActive]} onPress={() => setMode('profissional')}>
            <Text style={[s.tabText, mode === 'profissional' && s.tabTextActive]}>Profissional</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, mode === 'paciente' && s.tabActive]} onPress={() => setMode('paciente')}>
            <Text style={[s.tabText, mode === 'paciente' && s.tabTextActive]}>Paciente</Text>
          </TouchableOpacity>
        </View>

        <View style={s.form}>
          {mode === 'profissional' ? (
            <>
              <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.textMuted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={email} onChangeText={setEmail} />
              <TextInput style={s.input} placeholder="Senha" placeholderTextColor={Colors.textMuted}
                secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={handleProfessionalLogin} />
              <TouchableOpacity style={s.btn} onPress={handleProfessionalLogin} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput style={s.input} placeholder="CPF" placeholderTextColor={Colors.textMuted}
                keyboardType="numeric" value={cpf} onChangeText={(t) => setCpf(formatCpf(t))} maxLength={14} />
              <TextInput style={s.input} placeholder="Data de Nascimento (DD/MM/AAAA)" placeholderTextColor={Colors.textMuted}
                keyboardType="numeric" value={dob} onChangeText={(t) => setDob(formatDob(t))} maxLength={10}
                onSubmitEditing={() => handlePatientLogin()} />
              <TouchableOpacity style={s.btn} onPress={() => handlePatientLogin()} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Acessar Meus Dados</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Multi-clinic picker modal */}
      <Modal visible={!!clinics} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Escolha a clínica</Text>
            <Text style={s.modalSubtitle}>Seu CPF está cadastrado em mais de uma clínica.</Text>
            <FlatList
              data={clinics || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.clinicBtn} onPress={() => handlePatientLogin(item.id)} activeOpacity={0.7}>
                  <Ionicons name="business-outline" size={20} color={Colors.primary} />
                  <Text style={s.clinicName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setClinics(null)}>
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  logo: { width: 80, height: 80, marginBottom: Spacing.md },
  title: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textMuted, marginBottom: Spacing.lg },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
    width: '100%', maxWidth: 360, overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
  form: { width: '100%', maxWidth: 360 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md,
    color: Colors.text, marginBottom: Spacing.sm,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.lg },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  clinicBtn: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md,
    marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  clinicName: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  cancelBtn: { marginTop: Spacing.sm, alignItems: 'center', padding: Spacing.sm },
  cancelText: { fontSize: FontSize.md, color: Colors.textMuted },
});
