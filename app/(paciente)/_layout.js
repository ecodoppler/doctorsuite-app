import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { PregnancyProvider } from '../../services/pregnancy-context';
import { NotificationsProvider, useNotifications } from '../../services/notifications-context';
import { registerForPushNotifications, setupNotificationTapHandler } from '../../services/pushNotifications';

// Área do paciente = STACK que contém as abas (grupo `(tabs)`) + as telas secundárias.
// As secundárias (Laudos/Consultas/Documentos/Vacinas/Plano/Notificações/Exame-detalhe/Alertas)
// são EMPILHADAS sobre as abas (com botão voltar), porque aba `hidden` do NativeTabs não é
// navegável por router.push — esse era o bug dos atalhos do Início. Os caminhos não mudam:
// `(tabs)` é grupo transparente, então `/(paciente)/laudos` etc. continuam resolvendo.
function StackInner() {
  const router = useRouter();
  const { reload: reloadNotifs } = useNotifications();

  // v0.0.102: registra push token + handler de toque (deep_link → tela relevante).
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
    const cleanup = setupNotificationTapHandler(router, '/(paciente)');
    return cleanup;
  }, [router]);

  // Recarrega badge quando algo muda nas notificações (best-effort, sem polling agressivo).
  useEffect(() => {
    const interval = setInterval(() => reloadNotifs(), 60000);
    return () => clearInterval(interval);
  }, [reloadNotifs]);

  // headerShown:false — cada tela traz o próprio cabeçalho (NativeTabs/ScreenHeader/VFHeader/mini-header),
  // e os cabeçalhos das telas empilháveis mostram um "voltar" quando router.canGoBack().
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function PacienteLayout() {
  return (
    <NotificationsProvider>
      <PregnancyProvider>
        <StackInner />
      </PregnancyProvider>
    </NotificationsProvider>
  );
}
