import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { usePregnancy } from '../../../services/pregnancy-context';
import { useAppConfig } from '../../../services/app-config';

// Barra de abas NATIVA (UITabBar) — iOS 26 aplica o Liquid Glass automaticamente.
// Apenas as 5 abas reais ficam aqui: Início · Pré-natal · Chat · Exames · Perfil.
// Pré-natal só na gestação; Chat só quando o chat está ativo (puerpério ACTIVE/CLOSING).
// As telas secundárias (Laudos/Consultas/Documentos/Vacinas/Plano/Notificações/etc.) NÃO
// são abas — vivem no Stack pai (app/(paciente)/_layout.js) e são empilhadas via push,
// porque rota `hidden` de NativeTabs NÃO é navegável por router.push.
export default function TabsLayout() {
  const { data } = usePregnancy();
  const { config, isFeatureEnabled } = useAppConfig();
  const nav = config.patient?.navigation || {};
  const pregnancyModule = config.clinicalModules?.pregnancy || {};
  const hasPregnancy = isFeatureEnabled('pregnancy') && pregnancyModule.enabled !== false && !!data?.pregnancy;
  const chatActive = isFeatureEnabled('chat') && ['ACTIVE', 'CLOSING'].includes(data?.chat?.state);
  const showExams = isFeatureEnabled('exams') && (hasPregnancy || config.patient?.examsMode === 'general');

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="inicio">
        <Icon sf={{ default: 'heart.circle', selected: 'heart.circle.fill' }} />
        <Label>{nav.home || 'Início'}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prenatal" hidden={!hasPregnancy}>
        <Icon sf={{ default: 'waveform.path.ecg', selected: 'waveform.path.ecg' }} />
        <Label>{nav.pregnancy || 'Pré-natal'}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat" hidden={!chatActive}>
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>{nav.chat || 'Chat'}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exames" hidden={!showExams}>
        <Icon sf={{ default: 'cross.case', selected: 'cross.case.fill' }} />
        <Label>{nav.exams || 'Exames'}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil" hidden={!isFeatureEnabled('profile')}>
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>{nav.profile || 'Perfil'}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
