const API_BASE = 'https://doctorsuite.app';

let _token = null;
let _user = null;
let _onLogout = null;

export function setLogoutHandler(fn) { _onLogout = fn; }

export function setAuth(token, user) {
  _token = token;
  _user = user;
}

export function getUser() { return _user; }
export function getToken() { return _token; }

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no login');
  _token = data.token;
  _user = data.user;
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
  // Multi-clinic: return data without setting auth (let caller handle)
  if (data.choose_clinic) return data;
  _token = data.token;
  _user = data.user;
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
    _token = null;
    _user = null;
    if (_onLogout) _onLogout();
    throw new Error('Sessão expirada');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export function logout() {
  if (_token) {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${_token}` },
    }).catch(() => {});
  }
  _token = null;
  _user = null;
  if (_onLogout) _onLogout();
}
