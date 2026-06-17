// GlassView — wrapper Liquid Glass.
//   • iOS 26+: módulo OFICIAL `expo-glass-effect` (Liquid Glass real — refração + specular).
//   • iOS < 26 / Android: `expo-blur` BlurView (vidro fosco — ~90% do efeito).
//   • Web: cor translúcida + backdrop-filter.
//
// (Antes usava o módulo artesanal modules/liquid-glass, que não linkava no build da EAS e
//  causava "Unimplemented component: ViewManagerAdapter_LiquidGlass". Trocado pelo oficial.)
//
// Props:
//   material / tint:  material do BlurView no fallback (systemChromeMaterial, systemThinMaterial, light…).
//   intensity:        0-100 do BlurView (fallback). Default 50.
//   glassStyle:       'regular' | 'clear' | 'none' — estilo do Liquid Glass nativo (iOS 26). Default 'regular'.
//   tintColor:        tint do Liquid Glass nativo (iOS 26).
//   fallbackColor:    cor sólida (web / Reduzir Transparência).
//   style, children.

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

// Carregamento defensivo do módulo oficial. isLiquidGlassAvailable() só retorna true no iOS 26+
// (com a API de glass disponível); em qualquer outro caso caímos no BlurView.
let ExpoGlassView = null;
let LIQUID_GLASS_OK = false;
try {
  const glass = require('expo-glass-effect');
  ExpoGlassView = glass.GlassView || null;
  LIQUID_GLASS_OK = typeof glass.isLiquidGlassAvailable === 'function' && glass.isLiquidGlassAvailable() === true;
} catch (_) {
  ExpoGlassView = null;
  LIQUID_GLASS_OK = false;
}

// Exposto pros layouts decidirem o visual da barra: glass real (iOS 26) vs. fallback claro.
export const isLiquidGlass = LIQUID_GLASS_OK;

export function GlassView(props) {
  const {
    material = 'systemChromeMaterial',
    intensity = 50,
    tint,
    fallbackColor = 'rgba(255,255,255,0.85)',
    glassStyle = 'regular',
    tintColor,
    refractive, // compat: ignorado (o glass nativo do iOS 26 já é refrativo)
    style,
    children,
    ...rest
  } = props;
  void refractive;

  // iOS 26+: Liquid Glass nativo oficial.
  if (ExpoGlassView && LIQUID_GLASS_OK && Platform.OS === 'ios') {
    return (
      <ExpoGlassView
        glassEffectStyle={glassStyle}
        tintColor={tintColor}
        style={[StyleSheet.absoluteFillObject, style]}
        {...rest}
      >
        {children}
      </ExpoGlassView>
    );
  }

  // Web: translúcido + backdrop-filter.
  if (Platform.OS === 'web') {
    return (
      <View
        style={[style, { backgroundColor: fallbackColor, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  // iOS < 26 + Android: BlurView (vidro fosco). `tint` aceita os Materials no iOS.
  const resolvedTint = tint || material;
  return (
    <BlurView
      tint={resolvedTint}
      intensity={intensity}
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      style={[StyleSheet.absoluteFillObject, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}

export default GlassView;
