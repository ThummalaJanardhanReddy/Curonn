import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LinearGradient } from "expo-linear-gradient";
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { prescriptionStore } from '../shared/utils/prescriptionStore';
import type { PrescriptionImage } from '../shared/utils/prescriptionStore';
import SeacrchIcon from '../../assets/AppIcons/Curonn_icons/search.svg';
import GalleryIcon from '../../assets/AppIcons/Curonn_icons/gallery.svg';
import CameraIcon from '../../assets/AppIcons/Curonn_icons/camera.svg';

export default function MedicinesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation] = useState('New York, NY');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const { userData } = useUser();
  const patientId = userData?.e_id ?? undefined;

  const [drugGroups, setDrugGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [selectedImages, setSelectedImages] = useState<PrescriptionImage[]>([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  // State for edit back-flow: pre-fill modal with previously entered data
  const [initialModalNotes, setInitialModalNotes] = useState('');
  const [initialModalOption, setInitialModalOption] = useState<'all' | 'specific'>('all');

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
      console.log('launchImageLibraryAsync type:', typeof (mod as any)?.launchImageLibraryAsync);
    })();
  }, [getImagePicker]);

  // Detect when returning from BookingPayLater after tapping "Edit"
  useFocusEffect(
    useCallback(() => {
      const stored = prescriptionStore.get();
      if (stored.isEditMode && stored.images.length > 0) {
        // Restore the images and notes so the modal pre-fills correctly
        setSelectedImages(stored.images);
        setInitialModalNotes(stored.notes);
        setInitialModalOption(stored.option);
        // Clear the editMode flag so this doesn't re-trigger
        prescriptionStore.set({ ...stored, isEditMode: false });
        setConfirmModalVisible(true);
      }
    }, []),
  );

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

  // List of background colors for categories
  const categoryColors = ['#f4ab9b', '#A4AAD8', '#7DA4DB', '#8E9867', '#BEC8F9', '#D6C57B', '#C9E0DD', '#F0E4DC'];
  // Helper to convert Google Drive share links to direct image links
  const getDirectImageUrl = (url: string) => {
  if (!url) return url;

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
};

  const categories = useMemo(() => {
    if (drugGroups && drugGroups.length > 0) {
      return drugGroups.map((g: any, idx: number) => {
        let imgUrl = g.imageUrl || '';
        if (imgUrl.includes('drive.google.com')) {
          const match = imgUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            imgUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
          }
        }
        const category = {
          id: (g.drugGroup ?? g.name ?? '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          title: g.drugGroup ?? g.name ?? 'Untitled',
          image: imgUrl,
          backgroundColor: categoryColors[idx % categoryColors.length],
        };
        console.log(`[MedicinesScreen] Category ${idx}:`, category);
        return category;
      });
    }
    console.warn('No drug groups available to create categories');
    return [];
  }, [drugGroups]);

  // Use imported SVG icons for prescription options
  const prescriptionOptions = [
    { id: 'gallery', title: 'Gallery', icon: GalleryIcon },
    { id: 'camera', title: 'Take a Photo', icon: CameraIcon },
    // { id: 'curonn', title: 'Curonn Rx', icon: icons.pill ?? icons.calendar },
  ];

  const pickFromGallery = useCallback(async (clearFirst?: boolean | any) => {
    const shouldClear = clearFirst === true;
    if (shouldClear) {
      setSelectedImages([]);
      setInitialModalNotes('');
      setInitialModalOption('all');
      prescriptionStore.set({ images: [], notes: '', option: 'all', isEditMode: false });
    }

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
      const currentImages = shouldClear ? [] : selectedImages;
      const res: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions.Images,
        allowsMultipleSelection: true,
      } as any);
      if (res.canceled === true || res.cancelled === true) return;
      const assets: any[] = res.assets ?? [];
      if (!assets.length && res.uri) assets.push({ uri: res.uri });
      if (!assets.length) return;
      const picked = assets.map(a => ({ uri: a.uri, fileName: a.fileName ?? a.uri?.split('/').pop() }));
      const combined = [...currentImages, ...picked];
      setSelectedImages(combined);
      setConfirmModalVisible(true);
    } catch (e) {
      console.error('Gallery pick failed', e);
      Alert.alert('Error', 'Failed to pick images from gallery');
    }
  }, [selectedImages, getImagePicker]);

  const takePhoto = useCallback(async (clearFirst?: boolean | any) => {
    const shouldClear = clearFirst === true;
    if (shouldClear) {
      setSelectedImages([]);
      setInitialModalNotes('');
      setInitialModalOption('all');
      prescriptionStore.set({ images: [], notes: '', option: 'all', isEditMode: false });
    }

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
      const currentImages = shouldClear ? [] : selectedImages;
      const res: any = await ImagePicker.launchCameraAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions.Images,
        quality: 0.8,
      } as any);
      if (res.canceled === true || res.cancelled === true) return;
      const assets: any[] = res.assets ?? [];
      if (!assets.length && res.uri) assets.push({ uri: res.uri });
      if (!assets.length) return;
      const picked = assets.map(a => ({ uri: a.uri, fileName: a.fileName ?? a.uri?.split('/').pop() }));
      const combined = [...currentImages, ...picked];
      setSelectedImages(combined);
      setConfirmModalVisible(true);
    } catch (e) {
      console.error('Camera failed', e);
      Alert.alert('Error', 'Failed to open camera');
    }
  }, [selectedImages, getImagePicker]);

  const removeSelectedImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearSelectedImages = useCallback(() => {
    setSelectedImages([]);
    setConfirmModalVisible(false);
  }, []);

  const handleConfirmNext = useCallback(async (notes: string, option: 'all' | 'specific') => {
    // Data is already in prescriptionStore (written by PrescriptionUploadModal);
    // just close the modal — navigation happens inside the modal.
    console.log('handleConfirmNext', { notes, option, imagesCount: selectedImages.length });
    setConfirmModalVisible(false);
  }, [selectedImages]);

  const renderPrescriptionCard = useCallback(
    ({ item, index }: { item: { id: string; title: string; icon: any }, index: number }) => (
      <TouchableOpacity
        style={[
          styles.prescriptionCard,
          index === 0 && { borderRightWidth: 1, borderColor: '#BABCBA' },
        ]}
        onPress={() => {
          if (item.id === 'gallery') pickFromGallery(true);
          else if (item.id === 'camera') takePhoto(true);
          else setUploadModalVisible(true);
        }}
      >
        <item.icon width={32} height={32} style={styles.prescriptionIcon} />
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
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.categoryImage} />
        ) : (
          <View style={[styles.categoryImage, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
        )}
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.defaultHeader}>
        <CommonHeader
          currentLocation={currentLocation}
          onProfilePress={() => console.log('Profile pressed')}
          onCartPress={() => router.push('/cart' as any)}
        />
      </View>


      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 1)",
          "rgba(247, 84, 10, 0.2)",
        ]}
        start={{ x: 0.1, y: 0.4 }}
        end={{ x: 0.1, y: 0.1 }}
        style={{
          paddingHorizontal: 20, // ✅ works
          paddingVertical: 5,
        }}
      >
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Medicines"
              placeholderTextColor="#000"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Image source={images.icons.close} style={styles.clearIcon} />
              </TouchableOpacity>


            )}
          </View>
        </View>
      </LinearGradient>
      <View style={styles.containercontent}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.prescriptionSection}>
            <Text style={styles.prescriptionTitle}>Upload a prescription and get a medicine</Text>
            <View style={styles.prescriptionCardsContainer}>
              {prescriptionOptions.map((option, idx) => (
                <View key={option.id} style={styles.prescriptionCardWrapper}>
                  {renderPrescriptionCard({ item: option, index: idx })}
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
      </View>

      <PrescriptionUploadModal
        visible={confirmModalVisible}
        onClose={() => {
          setConfirmModalVisible(false);
          // If user closes without proceeding, clear pre-fill state
          setInitialModalNotes('');
          setInitialModalOption('all');
        }}
        selectedImages={selectedImages}
        onRemove={removeSelectedImage}
        onUploadMoreGallery={() => pickFromGallery(false)}
        onTakePhoto={() => takePhoto(false)}
        onNext={handleConfirmNext}
        initialNotes={initialModalNotes}
        initialOption={initialModalOption}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(10),
    // Remove extra top padding as SafeAreaView handles it
    marginTop: Platform.OS === 'android' ? getResponsiveSpacing(10) : 0,
  },
  containercontent: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: getResponsiveSpacing(10),
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: "#fff",
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(4),
    height: getResponsiveSpacing(40),
    marginTop: getResponsiveSpacing(5)
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(12),
    paddingVertical: getResponsiveSpacing(4),
    color: "#000",
    paddingTop: getResponsiveSpacing(4),
    fontFamily: fonts.regular,
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
    paddingBottom: getResponsiveSpacing(20),
  },
  prescriptionTitle: {
    fontSize: getResponsiveFontSize(13),
    color: colors.primary,
    marginBottom: getResponsiveSpacing(5),
    textAlign: 'center',
    fontFamily: fonts.semiBold,
  },
  prescriptionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F6F1F1',
    padding: getResponsiveSpacing(0),
    borderRadius: getResponsiveSpacing(12),
    borderWidth: 1,
    borderColor: '#BABCBA',
  },
  prescriptionCardWrapper: {
    flex: 1,
    marginHorizontal: getResponsiveSpacing(4),
  },
  prescriptionCard: {
    padding: getResponsiveSpacing(16),
    alignItems: 'center',
    justifyContent: 'center',
    // minHeight: getResponsiveSpacing(100),
    // borderRightWidth and borderColor applied conditionally in render
  },
  prescriptionIcon: {
    ...getResponsiveImageSize(32, 32),
    marginBottom: getResponsiveSpacing(8),
    tintColor: '#000',
  },
  prescriptionText: {
    fontSize: getResponsiveFontSize(10),
    color: '#000',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  categoriesSection: {
    paddingBottom: getResponsiveSpacing(20),
  },
  categoriesTitle: {
    fontSize: getResponsiveFontSize(15),
    color: '#4B334E',
    marginBottom: getResponsiveSpacing(6),
    fontFamily: fonts.medium,
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
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing(8),
  },
  categoryTitle: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    color: "#000000",
    flex: 1,
    fontFamily: fonts.bold,

    marginRight: getResponsiveSpacing(8),
  },
  categoryImage: {
    // ...getResponsiveImageSize(30, 30),
    borderRadius: getResponsiveSpacing(4),
    height: getResponsiveSpacing(40),
    width: getResponsiveSpacing(40),
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
