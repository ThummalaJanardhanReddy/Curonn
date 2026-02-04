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
  View
} from 'react-native';
import { images } from '../../assets';
import CommonHeader from '../shared/components/CommonHeader';
import commonStyles, { colors } from '../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
  wp
} from '../shared/utils/responsive';

export default function MyDoctorScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('New York, NY');

  // Specialist categories data
  const specialists = useMemo(
    () => [
      {
        id: 'physician',
        name: 'Physician',
        description: 'General Medicine',
        image: { uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop' },
      },
      {
        id: 'orthopedician',
        name: 'Orthopedician',
        description: 'Bone & Joint Care',
        image: { uri: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=400&fit=crop' },
      },
      {
        id: 'skincare',
        name: 'Skin Care',
        description: 'Dermatology',
        image: { uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=400&fit=crop' },
      },
      {
        id: 'cardiologist',
        name: 'Cardiologist',
        description: 'Heart Specialist',
        image: { uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop' },
      },
      {
        id: 'pediatrician',
        name: 'Pediatrician',
        description: 'Child Specialist',
        image: { uri: 'https://images.unsplash.com/photo-1594824374896-9881d8c1f1e3?w=300&h=400&fit=crop' },
      },
      {
        id: 'gynecologist',
        name: 'Gynecologist',
        description: 'Women\'s Health',
        image: { uri: 'https://images.unsplash.com/photo-1594824374896-9881d8c1f1e3?w=300&h=400&fit=crop' },
      },
      {
        id: 'neurologist',
        name: 'Neurologist',
        description: 'Brain & Nerve',
        image: { uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop' },
      },
      {
        id: 'psychiatrist',
        name: 'Psychiatrist',
        description: 'Mental Health',
        image: { uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=400&fit=crop' },
      },
    ],
    []
  );

  const filteredSpecialists = useMemo(() => {
    if (!searchQuery) return specialists;
    
    return specialists.filter(
      (specialist) =>
        specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialist.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [specialists, searchQuery]);

  const handleSpecialistSelect = (specialistId: string) => {
    console.log('Selected specialist:', specialistId);
    // Navigate to doctor list page with specialist type
    router.push({
      pathname: '/features/doctors/doctor-list',
      params: { specialistType: specialistId }
    });
  };

  const renderSpecialistCard = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.specialistCard}
        onPress={() => handleSpecialistSelect(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.specialistImageContainer}>
          <Image source={item.image} style={styles.specialistImage} />
        </View>
        <View style={styles.specialistTextContainer}>
          <Text style={styles.specialistName}>{item.name}</Text>
          <Text style={styles.specialistDescription}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor='#ffffffff'/>
      <CommonHeader
        currentLocation={currentLocation}
        onProfilePress={() => console.log('Profile pressed')}
        onCartPress={() => console.log('Cart pressed')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={images.icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search specialists..."
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

        {/* Choose Your Specialist Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Choose your specialist</Text>
        </View>

        {/* Specialists Grid */}
        <View style={styles.specialistsContainer}>
          <View style={styles.specialistsGrid}>
            {filteredSpecialists.map((specialist) => (
              <View key={specialist.id} style={styles.specialistCardWrapper}>
                {renderSpecialistCard({ item: specialist })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    // backgroundColor: colors.bg_primary,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(10),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#fff',
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
  titleContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  titleText: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'left',
  },
  specialistsContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  specialistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing(8),
  },
  specialistCardWrapper: {
    width: wp(28),
    marginBottom: getResponsiveSpacing(8),
  },
  specialistCard: {
    width: '100%',
    height: wp(32),
    borderRadius: getResponsiveSpacing(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  specialistImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  specialistImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  specialistTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: getResponsiveSpacing(6),
    zIndex: 1,
  },
  specialistName: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: getResponsiveSpacing(1),
    textAlign: 'center',
  },
  specialistDescription: {
    fontSize: getResponsiveFontSize(8),
    color: '#fff',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(10),
  },
});
