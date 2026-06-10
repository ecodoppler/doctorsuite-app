import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE = 'https://doctorsuite.app';

const STORAGE_KEYS = { token: 'ds_auth_token', user: 'ds_auth_user' };

let _token = null;
let _user = null;
let _onLogout = null;
let _restored = false;

// Web (expo web) não tem SecureStore — fallback p/ localStorage.
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

export function setLogoutHandler(fn) { _onLogout = fn; }

export async function setAuth(token, user) {
  _token = token;
  _user = user;
  await storage.set(STORAGE_KEYS.token, token || '');
  await storage.set(STORAGE_KEYS.user, JSON.stringify(user || null));
}

export function getUser() { return _user; }
export function getToken() { return _token; }

// Carrega sessão persistida na inicialização. Chamar antes de qualquer redirect.
export async function restoreAuth() {
  if (_restored) return { token: _token, user: _user };
  _restored = true;
  try {
    const token = await storage.get(STORAGE_KEYS.token);
    const userStr = await storage.get(STORAGE_KEYS.user);
    if (token) _token = token;
    if (userStr) {
      try { _user = JSON.parse(userStr); } catch { _user = null; }
    }
  } catch (_) {}
  return { token: _token, user: _user };
}

export async function login(email, password, totpCode) {
  const body = { email, password };
  if (totpCode) body.totp_code = totpCode;
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  // v0.0.401: 2FA — backend devolve { need_2fa:true } (401/403). Sinaliza p/ a tela pedir o código.
  if (!res.ok) {
    if (data && data.need_2fa) return { need_2fa: true, error: data.error };
    throw new Error(data.error || 'Erro no login');
  }
  await setAuth(data.token, data.user);
  return data;
}

export async function loginAsPatient(cpf, dob, clinic_id) {
  const body = { cpf, dob };
  if (clinic_id) body.clinic_id = clinic_id;
  const res = await fetch(`${API_BASE}/api/auth/patient-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no login');
  if (data.choose_clinic) return data;
  await setAuth(data.token, data.user);
  return data;
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    await _clearLocal();
    if (_onLogout) _onLogout();
    throw new Error('Sessão expirada');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

async function _clearLocal() {
  _token = null;
  _user = null;
  await storage.del(STORAGE_KEYS.token);
  await storage.del(STORAGE_KEYS.user);
}

export async function logout() {
  if (_token) {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${_token}` },
    }).catch(() => {});
  }
  await _clearLocal();
  try {
    const bio = await import('./biometric');
    await bio.clearEnabled();
    await bio.clearActivity();
  } catch {}
  if (_onLogout) _onLogout();
}
