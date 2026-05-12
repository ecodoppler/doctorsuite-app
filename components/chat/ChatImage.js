import { useState } from 'react';
import { Image, Pressable, Modal, View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChatImageSource } from '../../services/chatImage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Balão de imagem clicável (abre full screen com fechar)
export default function ChatImage({ imageKey, maxWidth = 220 }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const source = getChatImageSource(imageKey);
  if (!source) return null;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.thumbWrap, { width: maxWidth }]}>
        {loading && (
          <View style={[styles.placeholder, { width: maxWidth, height: maxWidth * 0.75 }]}>
            <ActivityIndicator size="small" color="#888" />
          </View>
        )}
        <Image
          source={source}
          style={[styles.thumb, { width: maxWidth, height: maxWidth * 0.75 }, loading && { position: 'absolute', opacity: 0 }]}
          resizeMode="cover"
          onLoadEnd={() => setLoading(false)}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Image source={source} style={styles.fullImage} resizeMode="contain" />
          <Pressable style={styles.closeBtn} onPress={() => setOpen(false)} hitSlop={12}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  thumb: { borderRadius: 12, backgroundColor: '#e5e7eb' },
  placeholder: { borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: SCREEN_W, height: SCREEN_H - 80 },
  closeBtn: { position: 'absolute', top: 40, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
