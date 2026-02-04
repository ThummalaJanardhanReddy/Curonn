import React from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
  onUpload: (type: 'gallery' | 'camera' | 'curonn') => void;
}

export default function PrescriptionUploadModal({
  visible,
  onClose,
  onUpload,
}: PrescriptionUploadModalProps) {
  const handleUpload = (type: 'gallery' | 'camera' | 'curonn') => {
    onUpload(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Prescription</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image source={images.icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => handleUpload('gallery')}
            >
              <Image source={images.icons.calendar} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => handleUpload('camera')}
            >
              <Image source={images.icons.calendar} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => handleUpload('curonn')}
            >
              <Image source={images.icons.calendar} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>Curonn Prescription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    width: '90%',
    maxWidth: getResponsiveSpacing(400),
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
  closeButton: {
    padding: getResponsiveSpacing(4),
  },
  closeIcon: {
    ...getResponsiveImageSize(24, 24),
    tintColor: colors.text,
  },
  modalBody: {
    padding: getResponsiveSpacing(20),
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(12),
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#f9f9f9',
    marginBottom: getResponsiveSpacing(12),
  },
  uploadIcon: {
    ...getResponsiveImageSize(24, 24),
    marginRight: getResponsiveSpacing(12),
    tintColor: colors.primary,
  },
  uploadText: {
    fontSize: getResponsiveFontSize(16),
    color: colors.text,
    fontWeight: '500',
  },
});
