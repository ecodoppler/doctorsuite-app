import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { PregnancyProvider, usePregnancy } from '../../services/pregnancy-context';
import { NotificationsProvider, useNotifications } from '../../services/notifications-context';
import { registerForPushNotifications, setupNotificationTapHandler } from '../../services/pushNotifications';

function TabsInner() {
  const { data } = usePregnancy();
  const { reload: reloadNotifs } = useNotifications();
  const router = useRouter();

  // v0.0.102: registra push token + handler de toque (deep_link → tela relevante).
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
    const cleanup = setupNotificationTapHandler(router, '/(paciente)');
    return cleanup;
  }, [router]);

  // Recarrega badge quando algo muda nas notificações (best-effort, sem polling agressivo)
  useEffect(() => {
    const interval = setInterval(() => reloadNotifs(), 60000);
    return () => clearInterval(interval);
  }, [reloadNotifs]);

  // Abas obstétricas só aparecem na gestação. Enquanto carrega, data é null → ficam escondidas
  // (evita "flash" + clique acidental). Chat segue o estado do PRÓPRIO chat (puerpério ACTIVE/CLOSING).
  // Documentos vira aba visível quando NÃO-gestante (atalho central); na gestação fica via push.
  const hasPregnancy = !!data?.pregnancy;
  const chatActive = ['ACTIVE', 'CLOSING'].includes(data?.chat?.state);

  // Barra de abas NATIVA (UITabBar) — iOS 26 aplica o Liquid Glass automaticamente.
  // Cada tela traz o próprio cabeçalho (ScreenHeader ou header próprio). `hidden` controla
  // o que aparece na barra; rotas hidden continuam navegáveis (push / navegação interna).
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
      <NativeTabs.Trigger name="vacinas" hidden={!hasPregnancy}>
        <Icon sf={{ default: 'syringe', selected: 'syringe.fill' }} />
        <Label>Vacinas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plano" hidden={!hasPregnancy}>
        <Icon sf={{ default: 'list.clipboard', selected: 'list.clipboard.fill' }} />
        <Label>Plano</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="documentos" hidden={hasPregnancy}>
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Documentos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>

      {/* Rotas navegáveis, mas fora da barra (abertas por push ou navegação interna) */}
      <NativeTabs.Trigger name="exame-detalhe" hidden />
      <NativeTabs.Trigger name="alertas" hidden />
      <NativeTabs.Trigger name="notificacoes" hidden />
      <NativeTabs.Trigger name="agendamentos" hidden />
      <NativeTabs.Trigger name="laudos" hidden />
    </NativeTabs>
  );
}

export default function PacienteLayout() {
  return (
    <NotificationsProvider>
      <PregnancyProvider>
        <TabsInner />
      </PregnancyProvider>
    </NotificationsProvider>
  );
}
