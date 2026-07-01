import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE, getToken } from './api';

export const DEFAULT_APP_CONFIG = {
  brand: {
    appName: 'DoctorSuite',
    subtitle: 'Sistema Médico',
    logoUrl: null,
    privacyUrl: 'https://doctorsuite.app/privacy',
  },
  locale: {
    defaultCrmUf: null,
  },
  tenant: {
    clinicId: null,
    clinicName: null,
    specialty: 'obstetrics',
    specialtyLabel: 'Obstetrícia',
  },
  patient: {
    features: {
      appointments: true,
      reports: true,
      documents: true,
      exams: true,
      profile: true,
      chat: true,
      pregnancy: true,
      vaccines: true,
      birthPlan: true,
      alerts: true,
    },
    examsMode: 'pregnancy',
    navigation: {
      home: 'Início',
      pregnancy: 'Pré-natal',
      chat: 'Chat',
      exams: 'Exames',
      profile: 'Perfil',
    },
    shortcuts: {
      noPregnancy: [
        { key: 'appointments', label: 'Consultas', icon: 'calendar-outline', target: '/(paciente)/agendamentos' },
        { key: 'reports', label: 'Laudos', icon: 'document-text-outline', target: '/(paciente)/laudos' },
        { key: 'documents', label: 'Documentos', icon: 'shield-checkmark-outline', target: '/(paciente)/documentos' },
        { key: 'profile', label: 'Perfil', icon: 'person-circle-outline', target: '/(paciente)/perfil' },
      ],
      pregnancy: [
        { key: 'appointments', label: 'Consultas', icon: 'calendar-outline', target: '/(paciente)/agendamentos' },
        { key: 'reports', label: 'Laudos', icon: 'document-text-outline', target: '/(paciente)/laudos' },
        { key: 'documents', label: 'Documentos', icon: 'shield-checkmark-outline', target: '/(paciente)/documentos' },
        { key: 'vaccines', label: 'Vacinas', icon: 'medkit-outline', target: '/(paciente)/vacinas' },
        { key: 'birthPlan', label: 'Plano', icon: 'clipboard-outline', target: '/(paciente)/plano' },
      ],
    },
    chat: {
      responseSlaText: 'Resposta em até 24h em dias úteis.',
      inactiveReason: 'Aguarde uma nova gestação ou converse com sua clínica.',
      doctorFallbackLabel: 'Seu médico',
    },
    emergency: {
      enabled: true,
      title: 'Em caso de emergência',
      listTitle: 'Procure imediatamente se',
      carePlaceLabel: 'maternidade',
      callToAction: 'LIGAR',
      primaryLabel: 'SAMU',
      primaryPhone: '192',
      hint:
        'Sinais de alerta como sangramento intenso, dor abdominal forte, perda de líquido ou ausência de movimento fetal exigem atendimento imediato.',
      signs: [
        { icon: '!', title: 'Sangramento intenso', detail: 'Principalmente se vier com dor ou tontura.' },
        { icon: '~', title: 'Perda de líquido', detail: 'Procure atendimento mesmo sem dor.' },
        { icon: '+', title: 'Dor forte ou persistente', detail: 'Dor abdominal, dor de cabeça forte ou visão turva.' },
        { icon: '!', title: 'Movimentos do bebê diminuídos', detail: 'Se você percebeu redução importante dos movimentos.' },
      ],
    },
  },
  clinicalModules: {
    pregnancy: {
      enabled: 'auto',
      labels: {
        cardTitle: 'Cartão da Gestante',
        inactiveTitle: 'Sem gestação ativa',
        gestationalAge: 'Idade gestacional',
        dueDate: 'DPP',
        bloodType: 'Tipo sanguíneo',
        nextAppointment: 'Próxima consulta',
        currentWeight: 'Peso atual',
        parity: 'Paridade',
        complications: 'Intercorrências da gestação',
        alerts: 'Sinais de alerta',
        alertSubtitle: 'Quando procurar a maternidade imediatamente',
      },
    },
  },
};

const AppConfigContext = createContext({
  config: DEFAULT_APP_CONFIG,
  loading: false,
  reload: async () => DEFAULT_APP_CONFIG,
  isFeatureEnabled: () => true,
});

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (!isPlainObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base?.[key])) {
      out[key] = deepMerge(base[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function normalizeConfig(raw, user) {
  const payload = raw?.config || raw || {};
  const tenantFromUser = {
    tenant: {
      clinicId: user?.clinic_id || user?.clinicId || null,
      clinicName: user?.clinic_name || user?.clinicName || null,
    },
  };
  return deepMerge(deepMerge(DEFAULT_APP_CONFIG, tenantFromUser), payload);
}

async function fetchMobileConfig(user) {
  try {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/mobile-config`, { headers });
    if (res.status === 401 || res.status === 404) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) return null;
    return normalizeConfig(data, user);
  } catch {
    return null;
  }
}

export function AppConfigProvider({ children, user }) {
  const [config, setConfig] = useState(() => normalizeConfig(null, user));
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const fallback = normalizeConfig(null, user);
    const remote = await fetchMobileConfig(user);
    const next = remote || fallback;
    setConfig(next);
    setLoading(false);
    return next;
  }, [user?.clinic_id, user?.clinic_name, user?.clinicId, user?.clinicName]);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => ({
    config,
    loading,
    reload,
    isFeatureEnabled: (key) => config.patient?.features?.[key] !== false,
  }), [config, loading, reload]);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
