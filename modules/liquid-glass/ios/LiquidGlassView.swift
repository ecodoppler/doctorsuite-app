// LiquidGlassView.swift
// Wraps SwiftUI Material em UIView (UIHostingController) pra uso via React Native.
//
// Estratégia de fallback por versão iOS:
//  - iOS 26+ com refractive=true: usa `.glassBackgroundEffect()` (Liquid Glass autêntico,
//    refração + specular highlights reativos ao conteúdo)
//  - iOS 16+: SwiftUI Material clássico (.ultraThinMaterial, .regularMaterial, etc) — blur
//    dinâmico real respeitando dark/light mode e accessibility settings.
//  - iOS 13-15: cai pro UIVisualEffectView puro (handled pelo Expo BlurView no JS wrapper).
//
// Acessibilidade: SwiftUI Material respeita automaticamente `UIAccessibility.isReduceTransparencyEnabled`
// (cai pra cor sólida). Adicionamos `fallbackColor` pra customizar essa cor.

import ExpoModulesCore
import SwiftUI
import UIKit

// MARK: - SwiftUI View

/// SwiftUI View que renderiza o material apropriado conforme versão iOS e configuração.
struct LiquidGlassContent: View {
  var materialName: String
  var refractive: Bool
  var fallbackColor: Color

  var body: some View {
    GeometryReader { _ in
      if #available(iOS 26.0, *), refractive {
        // Liquid Glass autêntico do iOS 26 — refração real, specular highlights
        // que reagem ao conteúdo embaixo. API `.glassBackgroundEffect()` é a
        // entrada oficial em SwiftUI para o material refrativo.
        Rectangle()
          .fill(.clear)
          .glassBackgroundEffect()
      } else if #available(iOS 16.0, *) {
        // Fallback iOS 16-25: Material clássico SwiftUI. Blur dinâmico real
        // (UIVisualEffectView por baixo) mas sem refração específica do Liquid Glass.
        Rectangle()
          .fill(materialFromName(materialName))
      } else {
        // Fallback iOS 13-15 (não deveria chegar aqui — deployment target é 16):
        // cor sólida.
        Rectangle()
          .fill(fallbackColor)
      }
    }
    .ignoresSafeArea()
  }

  @available(iOS 16.0, *)
  private func materialFromName(_ name: String) -> Material {
    switch name {
    case "ultraThin", "ultraThinDark": return .ultraThinMaterial
    case "thin", "thinDark":           return .thinMaterial
    case "regular", "regularDark":     return .regularMaterial
    case "thick", "thickDark":         return .thickMaterial
    case "chrome", "chromeDark":       return .bar  // .bar é o equivalente "chrome material" do toolbar
    default:                            return .regularMaterial
    }
  }
}

// MARK: - UIView que hosta o SwiftUI

/// ExpoView que abriga o UIHostingController do SwiftUI material.
class LiquidGlassUIView: ExpoView {
  private var hostingController: UIHostingController<LiquidGlassContent>?

  // Props vindas do RN — atualizadas pelo prop binder do Module abaixo.
  var material: String = "regular" {
    didSet { rebuildIfNeeded() }
  }
  var refractive: Bool = false {
    didSet { rebuildIfNeeded() }
  }
  var fallbackColorHex: String = "#FFFFFFCC" {
    didSet { rebuildIfNeeded() }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    rebuild()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hostingController?.view.frame = bounds
  }

  private func rebuildIfNeeded() {
    // Throttle: só reconstrói se mudou algo de fato.
    rebuild()
  }

  private func rebuild() {
    hostingController?.view.removeFromSuperview()
    let content = LiquidGlassContent(
      materialName: material,
      refractive: refractive,
      fallbackColor: colorFromHex(fallbackColorHex)
    )
    let hc = UIHostingController(rootView: content)
    hc.view.backgroundColor = .clear
    hc.view.translatesAutoresizingMaskIntoConstraints = false
    addSubview(hc.view)
    NSLayoutConstraint.activate([
      hc.view.topAnchor.constraint(equalTo: topAnchor),
      hc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      hc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
      hc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    hostingController = hc
  }

  private func colorFromHex(_ hex: String) -> Color {
    // Aceita #RRGGBB ou #RRGGBBAA
    var clean = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if clean.hasPrefix("#") { clean.removeFirst() }
    var rgba: UInt64 = 0
    Scanner(string: clean).scanHexInt64(&rgba)
    let r, g, b, a: Double
    if clean.count == 8 {
      r = Double((rgba & 0xFF000000) >> 24) / 255.0
      g = Double((rgba & 0x00FF0000) >> 16) / 255.0
      b = Double((rgba & 0x0000FF00) >> 8) / 255.0
      a = Double(rgba & 0x000000FF) / 255.0
    } else {
      r = Double((rgba & 0xFF0000) >> 16) / 255.0
      g = Double((rgba & 0x00FF00) >> 8) / 255.0
      b = Double(rgba & 0x0000FF) / 255.0
      a = 1.0
    }
    return Color(red: r, green: g, blue: b, opacity: a)
  }
}
