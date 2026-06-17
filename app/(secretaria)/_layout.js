import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

// Barra de abas NATIVA (UITabBar) — iOS 26 aplica o Liquid Glass automaticamente.
// Cabeçalho de cada tela é feito pelo componente ScreenHeader (NativeTabs não traz header).
export default function SecretariaLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="agendas">
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Agendas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ponto">
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <Label>Ponto</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
