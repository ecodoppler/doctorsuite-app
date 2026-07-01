import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_BASE, getToken } from './api';

// Solicita permissão + abre picker + faz upload. Retorna image_url (R2 key) ou null.
// patientId: obrigatório quando médico envia. Paciente pode omitir.
export async function pickAndUploadChatImage(patientId = null) {
  // Permissão
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permissão negada', 'Conceda acesso à galeria pra enviar imagens.');
    return null;
  }

  // Picker — qualidade reduzida pra economizar banda
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.7,
    base64: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];

  // Upload via multipart/form-data
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName || `chat-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
    if (patientId) formData.append('patient_id', patientId);

    const token = getToken();
    const res = await fetch(`${API_BASE}/api/chat-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha (${res.status})`);
    }
    const data = await res.json();
    return data.image_url;
  } catch (e) {
    Alert.alert('Erro ao enviar imagem', e?.message || 'Tente novamente.');
    return null;
  }
}

// Retorna source pra <Image> autenticado (servidor faz stream do R2)
export function getChatImageSource(imageKey) {
  if (!imageKey) return null;
  return {
    uri: `${API_BASE}/api/chat-image/${imageKey}`,
    headers: { Authorization: `Bearer ${getToken()}` },
  };
}
