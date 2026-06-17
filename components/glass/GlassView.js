// GlassView — wrapper Liquid Glass (Fase 1: BlurView; Fase 3: LiquidGlassView nativo).
//
// Liquid Glass design da Apple (iOS 18+/26 — refração e specular highlights
// reativos ao conteúdo) só fica autêntico via SwiftUI Material. Por enquanto
// usamos `expo-blur` (UIVisualEffectView no iOS, dimezisBlurView no Android)
// que entrega ~90% do efeito visual (blur dinâmico, sem refração).
//
// Quando o módulo nativo `modules/liquid-glass` da Fase 3 estiver disponível,
// este wrapper detecta iOS 16+ e prefere o nativo automaticamente.
//
// Props:
//   material:      'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial'
//                | 'systemThickMaterial' | 'systemChromeMaterial' (+ Light/Dark)
//                | 'light' | 'dark' | 'default' | 'regular' | 'prominent'
//                Default: 'systemChromeMaterial'.
//   intensity:    0-100, default 50. Usado só no BlurView (não no Material).
//   tint:         alias de `material` pra clareza. Aceita os mesmos valores.
//   fallbackColor: cor sólida quando ReduceTransparency está on. Default branco translúcido.
//   refractive:   true → tenta usar nativo (Fase 3); false → BlurView clássico.
//   style:        estilo extra (StyleSheet).
//   children:     conteúdo sobreposto ao blur.
//
// Exemplos:
//   <GlassView material="systemChromeMaterial" style={StyleSheet.absoluteFillObject} />
//   <GlassView intensity={80} tint="systemMaterialDark" />
//   <GlassView material="systemUltraThinMaterial" refractive style={{ borderRadius: 16 }}>
//     <Text>conteúdo</Text>
//   </GlassView>

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { requireNativeModule } from 'expo';

// Expo Go não compila módulos nativos custom — força o fallback BlurView. Sem isso, o
// require('../../modules/liquid-glass') CARREGA o JS (o try/catch abaixo não pega), mas o
// view nativo não existe no Expo Go → "Unimplemented component: ViewManagerAdapter_LiquidGlass".
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// Módulo nativo da Fase 3 — SwiftUI Material com refração autêntica (iOS 16+/26).
// Carregamento defensivo: se o módulo nativo não estiver disponível (Expo Go,
// build sem prebuild rodado), cai automaticamente pro BlurView clássico.
let LiquidGlassView = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LiquidGlassView = require('../../modules/liquid-glass').LiquidGlassView;
} catch (_) {
  LiquidGlassView = null;
}

// IMPORTANTE: o require acima carrega o JS mesmo quando o módulo NATIVO não está no binário
// (build sem o módulo compilado/linkado) — `requireNativeView` devolve um componente que, ao
// renderizar, vira "Unimplemented component: ViewManagerAdapter_LiquidGlass". Por isso só
// confiamos no view nativo quando `requireNativeModule` ACHA o módulo registrado de fato.
let NATIVE_GLASS_AVAILABLE = false;
try {
  if (Platform.OS !== 'web') { requireNativeModule('LiquidGlass'); NATIVE_GLASS_AVAILABLE = true; }
} catch (_) {
  NATIVE_GLASS_AVAILABLE = false;
}

// Converte o nome "systemXMaterial" do BlurView/Apple para o nome curto do nosso módulo SwiftUI.
function shortMaterialName(material) {
  const map = {
    systemUltraThinMaterial: 'ultraThin',
    systemThinMaterial: 'thin',
    systemMaterial: 'regular',
    systemThickMaterial: 'thick',
    systemChromeMaterial: 'chrome',
    systemUltraThinMaterialDark: 'ultraThinDark',
    systemThinMaterialDark: 'thinDark',
    systemMaterialDark: 'regularDark',
    systemThickMaterialDark: 'thickDark',
    systemChromeMaterialDark: 'chromeDark',
  };
  return map[material] || 'regular';
}

export function GlassView(props) {
  const {
    material = 'systemChromeMaterial',
    intensity = 50,
    tint,
    fallbackColor = 'rgba(255,255,255,0.85)',
    refractive = false,
    style,
    children,
    ...rest
  } = props;

  // Quando o LiquidGlassView nativo estiver disponível E iOS 16+, prefere o nativo.
  // Refractive=true ativa Liquid Glass autêntico do iOS 26+ (refração + specular).
  // iOS 16-25: cai pro SwiftUI Material clássico (ainda nativo, mas sem refração).
  const iosVer = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) || 0 : 0;
  if (LiquidGlassView && NATIVE_GLASS_AVAILABLE && !IS_EXPO_GO && Platform.OS === 'ios' && iosVer >= 16) {
    return (
      <LiquidGlassView
        material={shortMaterialName(material)}
        refractive={refractive}
        fallbackColor={fallbackColor}
        style={[StyleSheet.absoluteFillObject, style]}
        {...rest}
      >
        {children}
      </LiquidGlassView>
    );
  }

  // Fallback Android sem suporte real ou web: usa cor sólida translúcida.
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          style,
          { backgroundColor: fallbackColor, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  // iOS + Android: BlurView nativo. `tint` aceita os Materials no iOS (UIVisualEffectView)
  // e cai pra light/dark/default no Android.
  const resolvedTint = tint || material;
  return (
    <BlurView
      tint={resolvedTint}
      intensity={intensity}
      // Cor de fallback quando o usuário ativa "Reduzir Transparência" no iOS
      // ou quando o BlurView não pode renderizar (Android sem SDK 31+).
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      style={[StyleSheet.absoluteFillObject, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}

export default GlassView;
