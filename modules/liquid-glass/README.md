# Liquid Glass — Native Module

Custom Expo Module local que expõe `LiquidGlassView` — wrapper React Native do **SwiftUI Material** (iOS 16+) com suporte ao **Liquid Glass autêntico do iOS 26+** (`.glassBackgroundEffect()` com refração e specular highlights reativos ao conteúdo).

## Por que existe

A doc oficial Apple mostra que Liquid Glass só está disponível via SwiftUI. O `expo-blur` entrega ~90% do visual (UIVisualEffectView clássico) mas não tem refração. Esse módulo bridge resolve.

## Estratégia de fallback

| Plataforma | Comportamento |
|---|---|
| iOS 26+ com `refractive=true` | Liquid Glass autêntico (refração + specular) |
| iOS 16-25 (ou `refractive=false`) | SwiftUI Material clássico (blur dinâmico real, sem refração) |
| iOS 13-15 | Não suportado — wrapper `GlassView.js` cai pro `expo-blur` (UIVisualEffectView) |
| Android | Cor sólida translúcida + `RenderEffect.blur()` no futuro (TODO) |
| Web | Cor sólida + `backdrop-filter: blur()` CSS (gerenciado pelo wrapper) |

## Como usar

Importe via wrapper `GlassView` (recomendado — ele decide qual implementação usar):

```jsx
import { GlassView } from '../../components/glass/GlassView';

<GlassView material="systemChromeMaterial" intensity={70} refractive
  style={StyleSheet.absoluteFillObject} />
```

Ou direto (raro):

```jsx
import { LiquidGlassView } from '../../modules/liquid-glass';

<LiquidGlassView material="regular" refractive style={{ flex: 1 }} />
```

## Props

| Prop | Tipo | Default | Notas |
|---|---|---|---|
| `material` | string | `"regular"` | `ultraThin`, `thin`, `regular`, `thick`, `chrome` + variants `Dark` |
| `refractive` | bool | `false` | true em iOS 26+ ativa o Liquid Glass refrativo |
| `fallbackColor` | hex string | `"#FFFFFFCC"` | Cor usada quando "Reduzir Transparência" está on, ou no Android |

## Build setup (EAS)

Como envolve código nativo Swift+Kotlin, **Expo Go não funciona**. Precisa Dev Client via EAS Build:

```bash
# 1. Configure EAS (uma vez)
npx eas login
npx eas init

# 2. Prebuild (gera diretórios ios/ e android/ baseados no app.json + módulos)
npx expo prebuild --clean

# 3. Build de development (gera dev client com Liquid Glass embedded)
npx eas build --profile development --platform ios

# 4. Instale o .ipa no iPhone físico (TestFlight ou direto) e rode `npx expo start --dev-client`
```

## Arquivos

- `expo-module.config.json` — registra módulo nas plataformas iOS/Android
- `ios/LiquidGlass.podspec` — CocoaPods spec
- `ios/LiquidGlassView.swift` — SwiftUI View com fallback por versão iOS
- `ios/LiquidGlassModule.swift` — Bridge React Native + prop binding
- `android/build.gradle` + `LiquidGlassModule.kt` + `LiquidGlassView.kt` — fallback solid
- `index.ts` — exporta `LiquidGlassView` componente React

## TODO futuro

- Android: usar `RenderEffect.createBlurEffect()` (API 31+) pra blur real em vez de só cor sólida
- iOS: adicionar prop `interactive` que ativa specular highlight ao tocar (efeito Apple Music)
- iOS: respeitar `prefersReducedTransparency` com listener nativo + transição animada pro fallback
