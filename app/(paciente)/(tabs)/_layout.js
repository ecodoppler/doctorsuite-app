import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { usePregnancy } from '../../../services/pregnancy-context';

// Barra de abas NATIVA (UITabBar) — iOS 26 aplica o Liquid Glass automaticamente.
// Apenas as 5 abas reais ficam aqui: Início · Pré-natal · Chat · Exames · Perfil.
// Pré-natal só na gestação; Chat só quando o chat está ativo (puerpério ACTIVE/CLOSING).
// As telas secundárias (Laudos/Consultas/Documentos/Vacinas/Plano/Notificações/etc.) NÃO
// são abas — vivem no Stack pai (app/(paciente)/_layout.js) e são empilhadas via push,
// porque rota `hidden` de NativeTabs NÃO é navegável por router.push.
export default function TabsLayout() {
  const { data } = usePregnancy();
  const hasPregnancy = !!data?.pregnancy;
  const chatActive = ['ACTIVE', 'CLOSING'].includes(data?.chat?.state);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="inicio">
        <Icon sf={{ default: 'heart.circle', selected: 'heart.circle.fill' }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prenatal" hidden={!hasPregnancy}>
        <Icon sf={{ default: 'waveform.path.ecg', selected: 'waveform.path.ecg' }} />
        <Label>Pré-natal</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat" hidden={!chatActive}>
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exames">
        <Icon sf={{ default: 'cross.case', selected: 'cross.case.fill' }} />
        <Label>Exames</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
