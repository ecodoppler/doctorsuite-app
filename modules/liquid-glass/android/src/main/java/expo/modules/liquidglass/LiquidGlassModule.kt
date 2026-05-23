// LiquidGlassModule.kt
// Android fallback: Liquid Glass não existe nativamente. Renderiza cor sólida
// translúcida (configurável via prop fallbackColor) ou usa o Window blur do
// Android 12+ se quisermos no futuro (RenderEffect.createBlurEffect).
//
// Mantém a API idêntica ao iOS pra que o wrapper JS não precise saber a diferença.

package expo.modules.liquidglass

import android.content.Context
import android.graphics.Color
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView

class LiquidGlassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiquidGlass")

    View(LiquidGlassView::class) {
      Prop("material") { view: LiquidGlassView, value: String ->
        view.applyMaterial(value)
      }
      Prop("refractive") { _: LiquidGlassView, _: Boolean ->
        // Android não tem refração — ignora.
      }
      Prop("fallbackColor") { view: LiquidGlassView, value: String ->
        view.applyFallbackColor(value)
      }
    }
  }
}

class LiquidGlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var currentFallback: Int = Color.parseColor("#CCFFFFFF")
  private var currentMaterial: String = "regular"

  init {
    setBackgroundColor(currentFallback)
  }

  fun applyMaterial(material: String) {
    currentMaterial = material
    // Mapeia material name pra cor translúcida sensata.
    val color = when (material) {
      "ultraThin", "ultraThinDark" -> Color.argb(140, 255, 255, 255)
      "thin", "thinDark"           -> Color.argb(170, 255, 255, 255)
      "regular", "regularDark"     -> Color.argb(200, 255, 255, 255)
      "thick", "thickDark"         -> Color.argb(225, 255, 255, 255)
      "chrome", "chromeDark"       -> Color.argb(240, 255, 255, 255)
      else                          -> currentFallback
    }
    // Dark variants ganham overlay escuro
    val finalColor = if (material.endsWith("Dark")) {
      Color.argb(Color.alpha(color), 20, 20, 24)
    } else color
    setBackgroundColor(finalColor)
  }

  fun applyFallbackColor(hex: String) {
    try {
      currentFallback = Color.parseColor(hex)
      setBackgroundColor(currentFallback)
    } catch (_: IllegalArgumentException) { /* keep current */ }
  }
}
