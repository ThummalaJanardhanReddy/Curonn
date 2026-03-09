import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
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
import { fonts } from '@/app/shared/styles/fonts';
import UploadIcon from '../../../assets/AppIcons/Curonn_icons/uploadmore.svg';
import TakeaphotoIcon from '../../../assets/AppIcons/Curonn_icons/takeaphoto.svg';
import { SafeAreaView } from 'react-native-safe-area-context';


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
      <SafeAreaView style={{ flex: 1}} edges={['top','bottom']}>
         <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -33}
        >
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
                <UploadIcon style={styles.uploadIcon} width={15} height={15} />
                <Text style={styles.primaryBtnText}>
                   
                  {selectedImages.length > 0 ? 'Upload More' : 'Upload from Gallery'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onTakePhoto}>
                <TakeaphotoIcon style={styles.uploadIcon} width={15} height={15} />
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
</View>
            {/* Order option radio buttons */}
            <View style={styles.bottombox}>
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
             </View>

            {/* Next button */}
            <View style={styles.nextRow}>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          
        </View>
      </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingBottom: getResponsiveSpacing(8),
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
    fontSize: getResponsiveFontSize(15),
    fontWeight: '600',
    fontFamily: fonts.semiBold,
    color: '#000'
  },
  closePill: {
    backgroundColor: '#ffdfe6',
    paddingHorizontal: getResponsiveSpacing(15),
    paddingVertical: getResponsiveSpacing(6),
    borderRadius: getResponsiveSpacing(20),
  },
  closePillText: {
    color: '#ff0000',
    fontWeight: '600',
     fontFamily: fonts.semiBold,
     fontSize: getResponsiveFontSize(11),
  },
  modalBodyLarge: {
    
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(8),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing(8),
  },
  primaryBtn: {
    flex: 1,
    marginRight: getResponsiveSpacing(8),
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: getResponsiveSpacing(33),
  },
  primaryBtnText: {
    color: colors.primary,
    fontWeight: '500',
    fontFamily: fonts.medium,
    fontSize: getResponsiveFontSize(12),

  },
  uploadIcon: {
    marginRight: getResponsiveSpacing(6),
    marginTop: -1,
  },
  secondaryBtn: {
    flex: 1,
    marginRight: getResponsiveSpacing(8),
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: getResponsiveSpacing(33),
  },
  secondaryBtnText: {
     color: colors.primary,
    fontWeight: '500',
    fontFamily: fonts.medium,
    fontSize: getResponsiveFontSize(12),
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#D9D9D9',
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
    fontFamily: fonts.regular,
  },
  bottombox: {
      marginTop: getResponsiveSpacing(12),
      backgroundColor: '#F5F4F9',
      paddingHorizontal: getResponsiveSpacing(18),
      marginBottom: getResponsiveSpacing(12),
  },
  optionRow: {
    marginTop: getResponsiveSpacing(5),
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
    fontSize: getResponsiveFontSize(13),
    color: '#000',
    flex: 1,
    fontFamily: fonts.semiBold,
  },
  notesInput: {
    borderRadius: getResponsiveSpacing(8),
    minHeight: getResponsiveSpacing(80),
    marginTop: getResponsiveSpacing(10),
    textAlignVertical: 'top',
    fontSize: getResponsiveFontSize(14),
        borderWidth: 1,
    borderColor: "#9D9D9F",
    padding: 12,
    paddingBottom: 8,
    paddingTop: 9,
    backgroundColor: "#fff",
    fontFamily: fonts.regular,
    color: "#000",
    fontWeight: '500',
    marginBottom: getResponsiveSpacing(12),
  },
  nextRow: {
    marginTop: getResponsiveSpacing(18),
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(18),
    marginBottom: getResponsiveSpacing(10),
  },
  nextBtn: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: getResponsiveSpacing(12), 
    borderRadius: getResponsiveSpacing(30), 
    alignItems: 'center'

  },
  nextText: {
    color: '#fff', fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(15), fontWeight: '500'

  },
});
