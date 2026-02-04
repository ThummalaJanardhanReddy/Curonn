import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

export default function MedicinesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation] = useState('New York, NY');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // Medicine categories data
  const categories = useMemo(
    () => [
      {
        id: 'vitamins-supplements',
        title: 'Vitamins & Supplements',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa0b2b?w=100&h=100&fit=crop',
        backgroundColor: '#FFE5B4',
      },
      {
        id: 'sexual-wellness',
        title: 'Sexual Wellness',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        backgroundColor: '#E6F3FF',
      },
      {
        id: 'skin-hair-care',
        title: 'Skin & Hair Care',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
        backgroundColor: '#F0E6FF',
      },
      {
        id: 'pain-relief',
        title: 'Pain Relief',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        backgroundColor: '#FFE6E6',
      },
      {
        id: 'digestive-health',
        title: 'Digestive Health',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa0b2b?w=100&h=100&fit=crop',
        backgroundColor: '#E6FFE6',
      },
      {
        id: 'diabetes-care',
        title: 'Diabetes Care',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        backgroundColor: '#FFF0E6',
      },
    ],
    []
  );

  const handlePrescriptionUpload = useCallback((type: 'gallery' | 'camera' | 'curonn') => {
    console.log(`Upload prescription via ${type}`);
    // TODO: Implement actual upload functionality
    switch (type) {
      case 'gallery':
        // Open gallery
        break;
      case 'camera':
        // Open camera
        break;
      case 'curonn':
        // Open Curonn prescription
        break;
    }
  }, []);

  const handleUploadPress = useCallback(() => {
    setUploadModalVisible(true);
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/features/medicines/medicine-list?category=${categoryId}`);
  }, []);

  const renderPrescriptionCard = useCallback(
    ({ item }: { item: { id: string; title: string; icon: any } }) => (
      <TouchableOpacity
        style={styles.prescriptionCard}
        onPress={handleUploadPress}
      >
        <Image source={item.icon} style={styles.prescriptionIcon} />
        <Text style={styles.prescriptionText}>{item.title}</Text>
      </TouchableOpacity>
    ),
    [handleUploadPress]
  );

  const renderCategoryCard = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: item.backgroundColor }]}
        onPress={() => handleCategoryPress(item.id)}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <Image source={{ uri: item.image }} style={styles.categoryImage} />
        </View>
      </TouchableOpacity>
    ),
    [handleCategoryPress]
  );

  const prescriptionOptions = useMemo(
    () => [
      {
        id: 'gallery',
        title: 'Gallery',
        icon: images.icons.calendar, // Using existing icon as placeholder
      },
      {
        id: 'camera',
        title: 'Take a photo',
        icon: images.icons.calendar, // Using existing icon as placeholder
      },
      {
        id: 'curonn',
        title: 'Curonn prescription',
        icon: images.icons.calendar, // Using existing icon as placeholder
      },
    ],
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor='#ffffffff'/>
      {/* Header */}
      <CommonHeader
        currentLocation={currentLocation}
        onProfilePress={() => console.log('Profile pressed')}
        onCartPress={() => console.log('Cart pressed')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={images.icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for medicines"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Image source={images.icons.close} style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Prescription Upload Section */}
        <View style={styles.prescriptionSection}>
          <Text style={styles.prescriptionTitle}>Upload a prescription and get a medicine</Text>
          <View style={styles.prescriptionCardsContainer}>
            {prescriptionOptions.map((option) => (
              <View key={option.id} style={styles.prescriptionCardWrapper}>
                {renderPrescriptionCard({ item: option })}
              </View>
            ))}
          </View>
        </View>

        {/* Popular Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryCardWrapper}>
                {renderCategoryCard({ item: category })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Prescription Upload Modal */}
      <PrescriptionUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUpload={handlePrescriptionUpload}
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
    // paddingHorizontal: getResponsiveSpacing(20),
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
    // paddingHorizontal: getResponsiveSpacing(20),
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
    // paddingHorizontal: getResponsiveSpacing(20),
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
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: getResponsiveSpacing(8),
  },
  categoryImage: {
    ...getResponsiveImageSize(60, 60),
    borderRadius: getResponsiveSpacing(8),
  },
});
