// Simple global event bus for cross-tab navigation
let _pendingPatient = null;
let _listeners = [];

export function setPendingPatient(patient) {
  _pendingPatient = patient;
  _listeners.forEach(fn => fn(patient));
}

export function getPendingPatient() {
  const p = _pendingPatient;
  _pendingPatient = null;
  return p;
}

export function onPendingPatient(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}
