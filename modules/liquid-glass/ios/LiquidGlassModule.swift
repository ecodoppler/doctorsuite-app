// LiquidGlassModule.swift
// Define o módulo Expo + o View binding pro React Native.
//
// O nome 'LiquidGlass' precisa bater com o `requireNativeView('LiquidGlass')` no index.ts.

import ExpoModulesCore

public class LiquidGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiquidGlass")

    View(LiquidGlassUIView.self) {
      Prop("material") { (view: LiquidGlassUIView, value: String) in
        view.material = value
      }
      Prop("refractive") { (view: LiquidGlassUIView, value: Bool) in
        view.refractive = value
      }
      Prop("fallbackColor") { (view: LiquidGlassUIView, value: String) in
        view.fallbackColorHex = value
      }
    }
  }
}
