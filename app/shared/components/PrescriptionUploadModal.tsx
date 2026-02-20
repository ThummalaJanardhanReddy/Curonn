import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from '../utils/responsive';
import {
  prescriptionStore,
  PrescriptionImage,
} from '../utils/prescriptionStore';

export interface PrescriptionUploadModalProps {
  visible: boolean;
  onClose: () => void;
  selectedImages: PrescriptionImage[];
  onRemove: (index: number) => void;
  onUploadMoreGallery: () => void;
  onTakePhoto: () => void;
  onNext: (notes: string, option: 'all' | 'specific') => void;
  /** Pre-filled notes when re-opening for edit */
  initialNotes?: string;
  /** Pre-filled option when re-opening for edit */
  initialOption?: 'all' | 'specific';
}

export default function PrescriptionUploadModal({
  visible,
  onClose,
  selectedImages,
  onRemove,
  onUploadMoreGallery,
  onTakePhoto,
  onNext,
  initialNotes = '',
  initialOption = 'all',
}: PrescriptionUploadModalProps) {
  const [option, setOption] = useState<'all' | 'specific'>(initialOption);
  const [notes, setNotes] = useState(initialNotes);

  // Sync internal state whenever the modal becomes visible with pre-filled data
  useEffect(() => {
    if (visible) {
      setNotes(initialNotes);
      setOption(initialOption);
    }
  }, [visible, initialNotes, initialOption]);

  // Show up to 5 thumbnails; remaining ones as empty placeholders up to 3
  const placeholders = useMemo(() => {
    const arr: Array<PrescriptionImage | undefined> = [...selectedImages];
    while (arr.length < 3) arr.push(undefined);
    return arr;
  }, [selectedImages]);

  const handleNext = () => {
    if (!selectedImages || selectedImages.length === 0) {
      Alert.alert(
        'Select images',
        'Please select at least one prescription image to continue.',
      );
      return;
    }

    // Notify parent (e.g., to update its own state)
    try {
      onNext(notes, option);
    } catch (e) {
      console.warn('PrescriptionUploadModal - onNext callback threw', e);
    }

    // Persist to store so BookingPayLaterScreen can read it
    prescriptionStore.set({
      images: selectedImages,
      notes,
      option,
      isEditMode: false,
    });

    // Navigate to booking pay-later screen
    console.log('[PrescriptionUploadModal] Navigating to /bookingpaylater');
    try {
      // Use short route (app/bookingpaylater.tsx) for better reliability
      router.push('/bookingpaylater' as any);
    } catch (e) {
      console.error('[PrescriptionUploadModal] navigation to BookingPayLater failed', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentLarge}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Prescription</Text>
            <TouchableOpacity onPress={onClose} style={styles.closePill}>
              <Text style={styles.closePillText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBodyLarge}>
            {/* Upload action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onUploadMoreGallery}>
                <Text style={styles.primaryBtnText}>
                  {selectedImages.length > 0 ? 'Add More' : 'Upload from Gallery'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onTakePhoto}>
                <Text style={styles.secondaryBtnText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Image thumbnails — scrollable if >3 */}
            {selectedImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbsScroll}
                contentContainerStyle={styles.thumbsContent}
              >
                {selectedImages.map((img, idx) => (
                  <View key={`img-${idx}`} style={styles.thumbWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.thumb} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(idx)}>
                      <Text style={styles.removeX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.thumbsRow}>
                {placeholders.map((p, idx) => (
                  <View key={`ph-${idx}`} style={styles.thumbWrapper}>
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
            )}

            {/* Image count indicator */}
            {selectedImages.length > 0 && (
              <Text style={styles.imageCount}>
                {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
              </Text>
            )}

            {/* Order option radio buttons */}
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

            {/* Notes input (only for specific) */}
            {option === 'specific' && (
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add the details of medication (ex: Dolo 500mg for 3 days)"
                placeholderTextColor="#999"
                style={styles.notesInput}
                multiline
              />
            )}

            {/* Next button */}
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
    alignSelf: 'stretch',
    paddingBottom: getResponsiveSpacing(24),
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
  closePill: {
    backgroundColor: '#ffdfe6',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    borderRadius: getResponsiveSpacing(20),
  },
  closePillText: {
    color: '#E04F85',
    fontWeight: '700',
  },
  modalBodyLarge: {
    padding: getResponsiveSpacing(18),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing(12),
  },
  primaryBtn: {
    flex: 1,
    marginRight: getResponsiveSpacing(8),
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: getResponsiveSpacing(10),
    paddingHorizontal: getResponsiveSpacing(14),
    borderRadius: getResponsiveSpacing(8),
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveSpacing(10),
    paddingHorizontal: getResponsiveSpacing(14),
    borderRadius: getResponsiveSpacing(8),
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  thumbsScroll: {
    marginVertical: getResponsiveSpacing(10),
    maxHeight: getResponsiveSpacing(100),
  },
  thumbsContent: {
    alignItems: 'center',
    paddingBottom: getResponsiveSpacing(4),
  },
  thumbsRow: {
    flexDirection: 'row',
    paddingVertical: getResponsiveSpacing(12),
  },
  thumbWrapper: {
    width: getResponsiveSpacing(80),
    height: getResponsiveSpacing(80),
    marginRight: getResponsiveSpacing(12),
    borderRadius: getResponsiveSpacing(8),
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeX: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  placeholderBox: {
    width: getResponsiveSpacing(80),
    height: getResponsiveSpacing(80),
    backgroundColor: '#f2f2f2',
    borderRadius: getResponsiveSpacing(8),
  },
  imageCount: {
    fontSize: getResponsiveFontSize(12),
    color: '#888',
    marginBottom: getResponsiveSpacing(4),
  },
  optionRow: {
    marginTop: getResponsiveSpacing(10),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(8),
  },
  radio: {
    width: getResponsiveSpacing(18),
    height: getResponsiveSpacing(18),
    borderRadius: getResponsiveSpacing(9),
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: getResponsiveSpacing(10),
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: getResponsiveFontSize(14),
    color: '#333',
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: getResponsiveSpacing(8),
    padding: getResponsiveSpacing(10),
    minHeight: getResponsiveSpacing(80),
    marginTop: getResponsiveSpacing(10),
    textAlignVertical: 'top',
    fontSize: getResponsiveFontSize(14),
    color: '#333',
  },
  nextRow: {
    marginTop: getResponsiveSpacing(18),
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveSpacing(16),
    width: '100%',
    borderRadius: getResponsiveSpacing(30),
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveFontSize(16),
  },
});
