// ScrollAwareHeader — header com glass que aparece progressivamente conforme
// o usuário rola a tela. Padrão iOS Music / Mail / Settings.
//
// Comportamento:
//   - Tela começa com gradient warm visível, header transparente.
//   - Conforme `scrollY` passa de `fadeStart` (default 80) até `fadeEnd` (default 160):
//     • GlassView (frosted) interpola opacity 0 → 1
//     • Título "sobe" do baixo pro lugar final (Y: 24 → 0)
//     • Linha de separação aparece no bottom
//   - Sem `scrollY` (uso passivo) renderiza só o glass+título estáticos.
//
// Uso típico (telas com Animated.ScrollView):
//
//   import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
//   import { ScrollAwareHeader } from '../../components/glass/ScrollAwareHeader';
//
//   const scrollY = useSharedValue(0);
//   const onScroll = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
//
//   return (
//     <View style={{ flex: 1 }}>
//       <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 120 }}>
//         ...conteúdo (incluindo o gradient warm como background)...
//       </Animated.ScrollView>
//       <ScrollAwareHeader scrollY={scrollY} title="Cartão da Gestante" />
//     </View>
//   );

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from './GlassView';

const DEFAULT_HEIGHT = 56; // altura útil do conteúdo (sem safe-area)

export function ScrollAwareHeader({
  scrollY,
  title,
  rightSlot,
  leftSlot,
  fadeStart = 80,
  fadeEnd = 160,
  material = 'systemChromeMaterial',
  intensity = 70,
  height = DEFAULT_HEIGHT,
  titleColor = '#0f172a',
}) {
  const insets = useSafeAreaInsets();
  const totalHeight = insets.top + height;

  // Animação do glass (opacity 0 → 1) e do título (translateY 24 → 0).
  // Quando scrollY não é fornecido (passivo), fallback: tudo visível.
  const glassStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1 };
    const o = interpolate(scrollY.value, [fadeStart, fadeEnd], [0, 1], Extrapolation.CLAMP);
    return { opacity: o };
  });

  const titleStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1, transform: [{ translateY: 0 }] };
    const o = interpolate(scrollY.value, [fadeStart, fadeEnd], [0, 1], Extrapolation.CLAMP);
    const ty = interpolate(scrollY.value, [fadeStart, fadeEnd], [24, 0], Extrapolation.CLAMP);
    return { opacity: o, transform: [{ translateY: ty }] };
  });

  const separatorStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1 };
    return { opacity: interpolate(scrollY.value, [fadeStart, fadeEnd], [0, 1], Extrapolation.CLAMP) };
  });

  return (
    <View style={[styles.container, { height: totalHeight }]} pointerEvents="box-none">
      {/* Glass background — fade in com scroll */}
      <Animated.View style={[StyleSheet.absoluteFillObject, glassStyle]} pointerEvents="none">
        <GlassView material={material} intensity={intensity} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      {/* Bottom hairline (linha de separação iOS, aparece com o glass) */}
      <Animated.View style={[styles.separator, { bottom: 0 }, separatorStyle]} pointerEvents="none" />

      {/* Conteúdo do header (sempre clicável) */}
      <View style={[styles.content, { paddingTop: insets.top, height: totalHeight }]}>
        <View style={styles.side}>{leftSlot}</View>
        <Animated.Text
          style={[styles.title, { color: titleColor }, titleStyle]}
          numberOfLines={1}
        >
          {title}
        </Animated.Text>
        <View style={styles.side}>{rightSlot}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  separator: {
    position: 'absolute',
    left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
});

export default ScrollAwareHeader;
