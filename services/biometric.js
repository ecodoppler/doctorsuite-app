import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = { enabled: 'ds_biometric_enabled', lastActive: 'ds_last_active_at' };

export const RELOCK_THRESHOLD_MS = 5 * 60 * 1000;

const storage = {
  async get(key) {
    if (Platform.OS === 'web') {
      try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
    }
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async set(key, value) {
    if (Platform.OS === 'web') {
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch {}
      return;
    }
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async del(key) {
    if (Platform.OS === 'web') {
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {}
      return;
    }
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

export async function isSupported() {
  if (Platform.OS === 'web') return false;
  try {
    const hw = await LocalAuthentication.hasHardwareAsync();
    if (!hw) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch { return false; }
}

export async function getBiometricLabel() {
  if (Platform.OS === 'web') return 'Biometria';
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const FACIAL = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
    const FINGER = LocalAuthentication.AuthenticationType.FINGERPRINT;
    if (types.includes(FACIAL)) return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento facial';
    if (types.includes(FINGER)) return Platform.OS === 'ios' ? 'Touch ID' : 'Digital';
    return 'Biometria';
  } catch { return 'Biometria'; }
}

export async function isEnabled() {
  const v = await storage.get(KEYS.enabled);
  return v === '1';
}

export async function setEnabled(enabled) {
  await storage.set(KEYS.enabled, enabled ? '1' : '0');
}

export async function clearEnabled() {
  await storage.del(KEYS.enabled);
}

export async function authenticate(reason = 'Entrar no app') {
  if (Platform.OS === 'web') return { success: false, error: 'web_unsupported' };
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
      fallbackLabel: 'Usar senha do aparelho',
    });
    return res;
  } catch (e) {
    return { success: false, error: String(e?.message || e) };
  }
}

export async function touchActive() {
  await storage.set(KEYS.lastActive, String(Date.now()));
}

export async function shouldRelock(thresholdMs = RELOCK_THRESHOLD_MS) {
  const v = await storage.get(KEYS.lastActive);
  if (!v) return true;
  const last = Number(v);
  if (!Number.isFinite(last)) return true;
  return Date.now() - last > thresholdMs;
}

export async function clearActivity() {
  await storage.del(KEYS.lastActive);
}
