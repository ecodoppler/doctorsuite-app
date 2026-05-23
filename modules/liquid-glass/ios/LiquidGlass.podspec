Pod::Spec.new do |s|
  s.name           = 'LiquidGlass'
  s.version        = '0.1.0'
  s.summary        = 'DoctorSuite Liquid Glass — Apple SwiftUI Material com refração autêntica.'
  s.description    = 'Bridge React Native pra SwiftUI Material (iOS 16+) com Liquid Glass refrativo (iOS 26+).'
  s.author         = 'Dr. Lucas P. Nunes'
  s.homepage       = 'https://doctorsuite.com.br'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility flags
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
