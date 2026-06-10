import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { getToken } from './api';

const API_BASE = 'https://doctorsuite.app';

// Solicita permissões de câmera + localização (idempotente; OS lembra "permitir/negar").
export async function requestPontoPermissions() {
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  if (!cam.granted) {
    Alert.alert(
      'Permissão de câmera necessária',
      'Para registrar ponto com selfie, conceda acesso à câmera nas configurações do app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ]
    );
    return { camera: false, location: false };
  }
  const loc = await Location.requestForegroundPermissionsAsync();
  if (!loc.granted) {
    Alert.alert(
      'Permissão de localização necessária',
      'Para registrar ponto, conceda acesso à localização (Portaria 671/2021 exige rastreabilidade).',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ]
    );
    return { camera: true, location: false };
  }
  return { camera: true, location: true };
}

// Abre câmera frontal nativa, captura selfie, retorna { uri, mime, name } ou null se cancelado.
export async function captureSelfie() {
  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    allowsEditing: false,
    quality: 0.7,
    base64: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mime: a.mimeType || 'image/jpeg',
    name: a.fileName || `selfie-${Date.now()}.jpg`,
  };
}

// Lat/lng com timeout. Retorna { lat, lng } ou null se falhar.
export async function getCurrentLocation() {
  try {
    const pos = await Location.getCurrentPositionAsync({
      // v0.0.502: High (~10m) em vez de Balanced (~100m) — evita posicionar o
      // funcionário fora/dentro do raio do geofence por imprecisão do GPS.
      accuracy: Location.Accuracy.High,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (e) {
    console.warn('[location]', e?.message);
    return null;
  }
}

// Monta multipart e envia POST /api/ponto/registrar.
// Backend (server.js:23287) aceita: record_type, latitude, longitude, source, selfie (file).
export async function registrarPonto(recordType, { selfie, lat, lng } = {}) {
  const form = new FormData();
  form.append('record_type', recordType);
  form.append('source', Platform.OS === 'ios' ? 'mobile-ios' : 'mobile-android');
  if (lat != null && lng != null) {
    form.append('latitude', String(lat));
    form.append('longitude', String(lng));
  }
  if (selfie?.uri) {
    form.append('selfie', {
      uri: selfie.uri,
      name: selfie.name,
      type: selfie.mime,
    });
  }
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/ponto/registrar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Falha ao registrar (${res.status})`);
  }
  return await res.json();
}
