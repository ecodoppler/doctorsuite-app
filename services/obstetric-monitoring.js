export const DELETE_REASONS = Object.freeze({
  typing_error: 'Erro de digitação',
  time_error: 'Erro de horário',
});

export function localDateParts(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
}

export function localDateTimeToIso(dateText, timeText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateText || ''))) return null;
  if (!/^\d{2}:\d{2}$/.test(String(timeText || ''))) return null;
  const [year, month, day] = dateText.split('-').map(Number);
  const [hour, minute] = timeText.split(':').map(Number);
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    Number.isNaN(value.getTime())
    || value.getFullYear() !== year
    || value.getMonth() !== month - 1
    || value.getDate() !== day
    || value.getHours() !== hour
    || value.getMinutes() !== minute
  ) return null;
  return value.toISOString();
}

export function requestId(prefix = 'monitoring') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function alertBadge(status) {
  if (status === 'urgent') return { label: 'Urgência', tone: 'urgent' };
  if (status === 'attention') return { label: 'Atenção', tone: 'attention' };
  return null;
}

export function showPatientAlert(AlertApi, patientAlert) {
  if (!patientAlert) return;
  AlertApi.alert(
    patientAlert.title || 'Atenção',
    patientAlert.message || 'Siga as orientações da sua equipe de saúde.',
    [{ text: 'Entendi' }],
  );
}
