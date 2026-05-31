// Liquid Glass — entry point do módulo nativo.
// Exporta o componente View pra ser usado pelo wrapper GlassView.

import { requireNativeView } from 'expo';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type LiquidGlassMaterial =
  | 'ultraThin' | 'thin' | 'regular' | 'thick' | 'chrome'
  | 'ultraThinDark' | 'thinDark' | 'regularDark' | 'thickDark' | 'chromeDark';

export type LiquidGlassViewProps = {
  /**
   * Material visual. iOS 16+: SwiftUI Material (.ultraThinMaterial, .regularMaterial, etc).
   * iOS 26+ com refractive=true: Liquid Glass com refração + specular real.
   * Android: cor sólida correspondente (fallback).
   */
  material?: LiquidGlassMaterial;

  /**
   * Tenta usar Liquid Glass refrativo do iOS 26+. Cai pro Material clássico em iOS 16-25.
   */
  refractive?: boolean;

  /**
   * Cor sólida usada quando o usuário ativa "Reduzir Transparência" no iOS,
   * ou no Android quando o blur não está disponível.
   */
  fallbackColor?: string;
} & ViewProps;

// requireNativeView pega o componente nativo registrado pelo módulo.
// Nome 'LiquidGlassView' deve bater com o que o native module expõe (Module.View).
const NativeView: React.ComponentType<LiquidGlassViewProps> =
  requireNativeView('LiquidGlass');

export function LiquidGlassView(props: LiquidGlassViewProps) {
  // Sem JSX: este arquivo é .ts (Metro não transpila JSX em .ts). createElement é equivalente
  // a <NativeView {...props} /> (children já vão em props.children). v0.0.401.
  return React.createElement(NativeView, props);
}

export default LiquidGlassView;
