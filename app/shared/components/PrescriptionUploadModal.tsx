import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { images } from '../../../assets';
import { colors } from '../styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from '../utils/responsive';

interface PrescriptionUploadModalProps {
  visible: boolean;
  onClose: () => void;
  selectedImages: Array<{ uri: string; fileName?: string }>; // selected images from picker (expo-image-picker shape)
  onRemove: (index: number) => void;
  onUploadMoreGallery: () => void;
  onTakePhoto: () => void;
  onNext: (notes: string, option: 'all' | 'specific') => void;
}

export default function PrescriptionUploadModal({
  visible,
  onClose,
  selectedImages,
  onRemove,
  onUploadMoreGallery,
  onTakePhoto,
  onNext,
}: PrescriptionUploadModalProps) {
  const [option, setOption] = useState<'all' | 'specific'>('all');
  const [notes, setNotes] = useState('');

  // ensure we always show exactly 3 placeholders
  const placeholders = useMemo(() => {
    const arr: Array<{ uri?: string; fileName?: string } | undefined> = [...selectedImages];
    while (arr.length < 3) arr.push(undefined);
    return arr.slice(0, 3);
  }, [selectedImages]);

  const handleNext = () => {
    if (!selectedImages || selectedImages.length === 0) {
      Alert.alert('Select images', 'Please select at least one prescription image to continue.');
      return;
    }
    // Preserve existing callback
    try {
      console.log('PrescriptionUploadModal - onNext triggered', { notes, option, selectedImagesCount: selectedImages.length });
      onNext(notes, option);
    } catch (e) {
      console.warn('PrescriptionUploadModal - onNext callback threw', e);
    }

    // Navigate to the pay-later booking screen and mark as medical flow
    try {
      
      const path = `/features/booking/bookingpaylater`;
      console.log('PrescriptionUploadModal - navigating to', path);
      router.push((path) as unknown as any);
    } catch (e) {
      console.error('PrescriptionUploadModal - navigation to BookingPayLater failed', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentLarge}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Prescription</Text>
            <TouchableOpacity onPress={onClose} style={styles.closePill}>
              <Text style={styles.closePillText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBodyLarge}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onUploadMoreGallery}>
                <Text style={styles.primaryBtnText}>Upload More</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onTakePhoto}>
                <Text style={styles.secondaryBtnText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.thumbsRow}>
              {placeholders.map((p, idx) => (
                <View key={idx} style={styles.thumbWrapper}>
                  {p ? (
                    <>
                      <Image source={{ uri: p.uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(idx)}>
                        <Text style={styles.removeX}>✕</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.placeholderBox} />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.optionRow}>
              <TouchableOpacity style={styles.optionItem} onPress={() => setOption('all')}>
                <View style={[styles.radio, option === 'all' && styles.radioSelected]} />
                <Text style={styles.optionText}>Order Everything as per the Prescription</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionRow}>
              <TouchableOpacity style={styles.optionItem} onPress={() => setOption('specific')}>
                <View style={[styles.radio, option === 'specific' && styles.radioSelected]} />
                <Text style={styles.optionText}>Mention Specific Medicine</Text>
              </TouchableOpacity>
            </View>

            {option === 'specific' && (
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add the details of medication (ex: Dolo 500mg for 3days)"
                placeholderTextColor="#999"
                style={styles.notesInput}
                multiline
              />
            )}

            <View style={styles.nextRow}>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalContentLarge: {
    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveSpacing(16),
    borderTopRightRadius: getResponsiveSpacing(16),
    width: '100%',
    maxWidth: 680,
    alignSelf: 'stretch',
    marginBottom: 0,
    paddingBottom: getResponsiveSpacing(20),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: { padding: getResponsiveSpacing(4) },
  closeIcon: { ...getResponsiveImageSize(24, 24), tintColor: colors.text },
  closePill: { backgroundColor: '#ffdfe6', paddingHorizontal: getResponsiveSpacing(12), paddingVertical: getResponsiveSpacing(6), borderRadius: getResponsiveSpacing(20) },
  closePillText: { color: '#E04F85', fontWeight: '700' },
  modalBodyLarge: { padding: getResponsiveSpacing(18) },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: getResponsiveSpacing(12) },
  primaryBtn: { backgroundColor: '#fff', borderColor: colors.primary, borderWidth: 1, paddingVertical: getResponsiveSpacing(10), paddingHorizontal: getResponsiveSpacing(14), borderRadius: getResponsiveSpacing(8) },
  primaryBtnText: { color: colors.primary, fontWeight: '600' },
  secondaryBtn: { backgroundColor: colors.primary, paddingVertical: getResponsiveSpacing(10), paddingHorizontal: getResponsiveSpacing(14), borderRadius: getResponsiveSpacing(8) },
  secondaryBtnText: { color: '#fff', fontWeight: '600' },
  thumbsRow: { flexDirection: 'row', paddingVertical: getResponsiveSpacing(12) },
  thumbWrapper: { width: getResponsiveSpacing(80), height: getResponsiveSpacing(80), marginRight: getResponsiveSpacing(12), borderRadius: getResponsiveSpacing(8), overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  removeX: { color: '#fff', fontWeight: '700' },
  placeholderBox: { width: getResponsiveSpacing(80), height: getResponsiveSpacing(80), backgroundColor: '#f2f2f2', borderRadius: getResponsiveSpacing(8) },
  optionRow: { marginTop: getResponsiveSpacing(12) },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: getResponsiveSpacing(8) },
  radio: { width: getResponsiveSpacing(18), height: getResponsiveSpacing(18), borderRadius: getResponsiveSpacing(9), borderWidth: 1, borderColor: '#ccc', marginRight: getResponsiveSpacing(10) },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: getResponsiveFontSize(14), color: '#333' },
  notesInput: { borderWidth: 1, borderColor: '#eee', borderRadius: getResponsiveSpacing(8), padding: getResponsiveSpacing(10), minHeight: getResponsiveSpacing(80), marginTop: getResponsiveSpacing(10), textAlignVertical: 'top' },
  nextRow: { marginTop: getResponsiveSpacing(14), alignItems: 'center', paddingHorizontal: getResponsiveSpacing(18) },
  nextBtn: { backgroundColor: colors.primary, paddingVertical: getResponsiveSpacing(16), width: '100%', borderRadius: getResponsiveSpacing(30), alignItems: 'center' },
  nextText: { color: '#fff', fontWeight: '700', fontSize: getResponsiveFontSize(16) },
  modalBody: { padding: getResponsiveSpacing(20) },
  uploadOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: getResponsiveSpacing(16), paddingHorizontal: getResponsiveSpacing(12), borderRadius: getResponsiveSpacing(8), backgroundColor: '#f9f9f9', marginBottom: getResponsiveSpacing(12) },
  uploadIcon: { ...getResponsiveImageSize(24, 24), marginRight: getResponsiveSpacing(12), tintColor: colors.primary },
  uploadText: { fontSize: getResponsiveFontSize(16), color: colors.text, fontWeight: '500' },
});


