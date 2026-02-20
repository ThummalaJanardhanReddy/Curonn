import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { images } from '../../assets';
import CommonHeader from '../shared/components/CommonHeader';
import PrescriptionUploadModal from '../shared/components/PrescriptionUploadModal';
import commonStyles, { colors } from '../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from '../shared/utils/responsive';
import axiosClient from '../../src/api/axiosClient';
import ApiRoutes from '../../src/api/employee/employee';
// Dynamically import expo-image-picker at runtime to avoid crash when the native module
// isn't available in the running binary (causes "Cannot find native module 'ExponentImagePicker'").
// We'll lazy-load inside the handlers and guard accordingly.
import { useUser } from '../shared/context/UserContext';
import { fontStyles, fonts } from "../shared/styles/fonts";

export default function MedicinesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation] = useState('New York, NY');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const { userData } = useUser();
  const patientId = userData?.e_id ?? undefined;

  const [drugGroups, setDrugGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; fileName?: string }>>([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Helper: dynamic import so the app doesn't crash at module-evaluation time when the
  // native module is missing. Returns null when import fails.
  const getImagePicker = useCallback(async () => {
    try {
      // dynamic import keeps the top-level require from throwing during app init
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import('expo-image-picker');
      return mod as any;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('expo-image-picker dynamic import failed', e);
      return null;
    }
  }, []);

  // Debug: log ImagePicker runtime info when screen mounts
  useEffect(() => {
    (async () => {
      const mod = await getImagePicker();
      // eslint-disable-next-line no-console
      console.log('ImagePicker runtime object (dynamic):', mod);
      // eslint-disable-next-line no-console
      console.log('launchImageLibraryAsync type:', typeof (mod as any)?.launchImageLibraryAsync);
      // eslint-disable-next-line no-console
      console.log('launchCameraAsync type:', typeof (mod as any)?.launchCameraAsync);
    })();
  }, [getImagePicker]);

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await axiosClient.get(ApiRoutes.MedicalOrders.getDrugGroups, { params: { patientId } });
        // axiosClient returns response.data (see axiosClient.ts). The API may return an array
        // or an object with `items` or `data`. Normalize to an array here.
        const groups = Array.isArray(res)
          ? res
          : (res as any)?.items ?? (res as any)?.data ?? [];
        // Debug: log groups received
        // eslint-disable-next-line no-console
        console.log('Loaded drugGroups:', groups);
        setDrugGroups(groups ?? []);
        setGroupsError(null);
      } catch (err: any) {
        console.warn('Failed to load drug groups', err?.message || err);
        setGroupsError('Failed to load groups');
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, [patientId]);

  const categories = useMemo(() => {
    if (drugGroups && drugGroups.length > 0) {
      return drugGroups.map((g: any) => ({
        id: (g.drugGroup ?? g.name ?? '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: g.drugGroup ?? g.name ?? 'Untitled',
        image: g.imageUrl,
        backgroundColor: '#F5F5F5',
      }));
    }
    return [];
  }, [drugGroups]);

  const icons = images.icons as any;
  const prescriptionOptions = [
    { id: 'gallery', title: 'Gallery', icon: icons.gallery ?? icons.calendar },
    { id: 'camera', title: 'Take a Photo', icon: icons.camera ?? icons.calendar },
    { id: 'curonn', title: 'Curonn Rx', icon: icons.pill ?? icons.calendar },
  ];

  const pickFromGallery = useCallback(async () => {
    try {
      const ImagePicker = await getImagePicker();
      if (!ImagePicker || typeof ImagePicker.launchImageLibraryAsync !== 'function') {
        Alert.alert('Image picker not available', 'The image picker native module is not available in this runtime. Run the app in Expo Go (npx expo start) or build a dev client.');
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions required', 'Please grant gallery permissions to select images.');
        return;
      }
      const remaining = 3 - selectedImages.length;
      // if (remaining <= 0) {
      //   Alert.alert('Limit reached', 'You can select up to 3 images only.');
      //   return;
      // }
      const res: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      } as any);
      if (res.canceled === true || res.cancelled === true) return;
      const assets: any[] = res.assets ?? [];
      if (!assets.length && res.uri) assets.push({ uri: res.uri });
      if (!assets.length) return;
      const picked = assets.map(a => ({ uri: a.uri, fileName: a.fileName ?? a.uri?.split('/').pop() }));
      const combined = [...selectedImages, ...picked].slice(0, 3);
      setSelectedImages(combined);
      setConfirmModalVisible(true);
    } catch (e) {
      console.error('Gallery pick failed', e);
      Alert.alert('Error', 'Failed to pick images from gallery');
    }
  }, [selectedImages]);

  const takePhoto = useCallback(async () => {
    try {
      const ImagePicker = await getImagePicker();
      if (!ImagePicker || typeof ImagePicker.launchCameraAsync !== 'function') {
        Alert.alert('Camera not available', 'The camera module is not available in this runtime. Run the app in Expo Go (npx expo start) or build a dev client.');
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions required', 'Please grant camera permissions to take photos.');
        return;
      }
      const remaining = 3 - selectedImages.length;
      if (remaining <= 0) {
        Alert.alert('Limit reached', 'You can select up to 3 images only.');
        return;
      }
      const res: any = await ImagePicker.launchCameraAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions.Images,
        quality: 0.8,
      } as any);
      if (res.canceled === true || res.cancelled === true) return;
      const assets: any[] = res.assets ?? [];
      if (!assets.length && res.uri) assets.push({ uri: res.uri });
      if (!assets.length) return;
      const picked = assets.map(a => ({ uri: a.uri, fileName: a.fileName ?? a.uri?.split('/').pop() }));
      const combined = [...selectedImages, ...picked].slice(0, 3);
      setSelectedImages(combined);
      setConfirmModalVisible(true);
    } catch (e) {
      console.error('Camera failed', e);
      Alert.alert('Error', 'Failed to open camera');
    }
  }, [selectedImages]);

  const removeSelectedImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearSelectedImages = useCallback(() => {
    setSelectedImages([]);
    setConfirmModalVisible(false);
  }, []);

  const handleConfirmNext = useCallback(async (notes: string, option: 'all' | 'specific') => {
    console.log('Confirm next', { notes, option, images: selectedImages });
    setConfirmModalVisible(false);
  }, [selectedImages]);

  const renderPrescriptionCard = useCallback(
    ({ item }: { item: { id: string; title: string; icon: any } }) => (
      <TouchableOpacity
        style={styles.prescriptionCard}
        onPress={() => {
          if (item.id === 'gallery') pickFromGallery();
          else if (item.id === 'camera') takePhoto();
          else setUploadModalVisible(true);
        }}
      >
        <Image source={item.icon} style={styles.prescriptionIcon} />
        <Text style={styles.prescriptionText}>{item.title}</Text>
      </TouchableOpacity>
    ),
    [pickFromGallery, takePhoto]
  );

  const renderCategoryCard = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.backgroundColor || '#fff' }]}
      onPress={() => {
        // Navigate to MedicineListScreen and pass the selected drug group as groupName
        const encoded = encodeURIComponent(item.title || '');
        router.push(`/features/medicines/medicine-list?groupName=${encoded}` as any);
      }}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#ffffffff" />
      <CommonHeader
        currentLocation={currentLocation}
        onProfilePress={() => console.log('Profile pressed')}
        onCartPress={() => router.push('/cart' as any)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for medicines"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
                <Image source={icons.close} style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.prescriptionSection}>
          <Text style={styles.prescriptionTitle}>Upload a prescription and get a medicine</Text>
          <View style={styles.prescriptionCardsContainer}>
            {prescriptionOptions.map(option => (
              <View key={option.id} style={styles.prescriptionCardWrapper}>
                {renderPrescriptionCard({ item: option })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(category => (
              <View key={category.id} style={styles.categoryCardWrapper}>
                {renderCategoryCard({ item: category })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <PrescriptionUploadModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        selectedImages={selectedImages}
        onRemove={removeSelectedImage}
        onUploadMoreGallery={pickFromGallery}
        onTakePhoto={takePhoto}
        onNext={handleConfirmNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(15),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#f9f9f9',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    paddingVertical: getResponsiveSpacing(4),
    color: '#333',
  },
  clearButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  clearIcon: {
    ...getResponsiveImageSize(16, 16),
    tintColor: '#999',
  },
  prescriptionSection: {
    paddingBottom: getResponsiveSpacing(30),
  },
  prescriptionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: getResponsiveSpacing(20),
    textAlign: 'center',
  },
  prescriptionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prescriptionCardWrapper: {
    flex: 1,
    marginHorizontal: getResponsiveSpacing(4),
  },
  prescriptionCard: {
    backgroundColor: '#BABCBA',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSpacing(100),
  },
  prescriptionIcon: {
    ...getResponsiveImageSize(32, 32),
    marginBottom: getResponsiveSpacing(8),
    tintColor: '#333',
  },
  prescriptionText: {
    fontSize: getResponsiveFontSize(12),
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoriesSection: {
    paddingBottom: getResponsiveSpacing(30),
  },
  categoriesTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#4B334E',
    marginBottom: getResponsiveSpacing(20),
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCardWrapper: {
    width: '48%',
    marginBottom: getResponsiveSpacing(12),
  },
  categoryCard: {
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(8),
    minHeight: getResponsiveSpacing(60),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    color:"#000000",
    flex: 1,
        fontFamily: fonts.semiBold,

    marginRight: getResponsiveSpacing(8),
  },
  categoryImage: {
    ...getResponsiveImageSize(60, 60),
    borderRadius: getResponsiveSpacing(8),
  },
  groupsSection: {
    paddingBottom: getResponsiveSpacing(20),
  },
  groupsTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: getResponsiveSpacing(12),
  },
  groupList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
