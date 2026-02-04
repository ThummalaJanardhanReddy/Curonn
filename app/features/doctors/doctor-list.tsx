import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import PrimaryButton from '../../shared/components/PrimaryButton';
import SecondaryButton from '../../shared/components/SecondaryButton';
import { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
  hp,
  wp,
} from '../../shared/utils/responsive';

interface Doctor {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  experience: string;
  languages: string[];
  image: string;
  rating: number;
  consultationFee: string;
  nextAvailable: string;
}

export default function DoctorListScreen() {
  const { specialistType } = useLocalSearchParams<{ specialistType: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Mock API data - in real app this would come from API based on specialistType
  const doctors: Doctor[] = useMemo(
    () => [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        qualification: 'MBBS, MD (General Medicine)',
        specialty: 'Physician',
        experience: '10 years',
        languages: ['English', 'Telugu'],
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop',
        rating: 4.8,
        consultationFee: '₹500',
        nextAvailable: 'Today, 2:00 PM',
      },
      {
        id: '2',
        name: 'Dr. Michael Chen',
        qualification: 'MBBS, MD (Dermatology)',
        specialty: 'Dermatologist',
        experience: '8 years',
        languages: ['English', 'Hindi'],
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop',
        rating: 4.9,
        consultationFee: '₹600',
        nextAvailable: 'Tomorrow, 10:00 AM',
      },
      {
        id: '3',
        name: 'Dr. Emily Rodriguez',
        qualification: 'MBBS, MD (Pediatrics)',
        specialty: 'Pediatrician',
        experience: '12 years',
        languages: ['English', 'Spanish'],
        image: 'https://images.unsplash.com/photo-1594824374896-9881d8c1f1e3?w=150&h=150&fit=crop',
        rating: 4.7,
        consultationFee: '₹450',
        nextAvailable: 'Friday, 3:00 PM',
      },
      {
        id: '4',
        name: 'Dr. David Kim',
        qualification: 'MBBS, MS (Orthopedics)',
        specialty: 'Orthopedist',
        experience: '15 years',
        languages: ['English', 'Korean'],
        image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop',
        rating: 4.6,
        consultationFee: '₹700',
        nextAvailable: 'Today, 4:30 PM',
      },
    ],
    []
  );

  const filteredDoctors = useMemo(() => {
    if (!searchQuery) return doctors;
    
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.qualification.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [doctors, searchQuery]);

  const handleBack = () => {
    router.back();
  };

  const handleKnowMore = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setModalVisible(true);
    }
  };

  const handleConsultNow = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      router.push({
        pathname: '/features/symptoms/symptoms',
        params: { 
          doctorId: doctorId,
          doctorName: doctor.name
        }
      });
    }
  };

  const renderDoctorCard = useCallback(
    ({ item }: { item: Doctor }) => (
      <View style={styles.doctorCard}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.doctorImageContainer}>
            <Image source={{ uri: item.image }} style={styles.doctorImage} />
            <Text style={styles.experienceText}>{item.experience}</Text>
          </View>
          
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.qualification}>{item.qualification}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
            <Text style={styles.languages}>
              {item.languages.join(', ')}
            </Text>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <SecondaryButton
            title="Know More"
            onPress={() => handleKnowMore(item.id)}
            style={styles.knowMoreButton}
            textStyle={styles.knowMoreButtonText}
          />
          <PrimaryButton
            title="Consult Now"
            onPress={() => handleConsultNow(item.id)}
            style={styles.consultButton}
          />
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          title="Choose your specialist"
          onPress={handleBack}
          style={styles.backButton}
          textStyle={styles.headerTitle}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={images.icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for doctor, specialist"
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

        {/* Showing Text */}
        <View style={styles.showingContainer}>
          <Text style={styles.showingText}>Showing earliest available doctors</Text>
        </View>

        {/* Doctors List */}
        <View style={styles.doctorsList}>
          {filteredDoctors.map((doctor) => (
            <View key={doctor.id}>
              {renderDoctorCard({ item: doctor })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Doctor Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDoctor && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Doctor Details</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalDoctorInfo}>
                    <Image source={{ uri: selectedDoctor.image }} style={styles.modalDoctorImage} />
                    <View style={styles.modalDoctorDetails}>
                      <Text style={styles.modalDoctorName}>{selectedDoctor.name}</Text>
                      <Text style={styles.modalQualification}>{selectedDoctor.qualification}</Text>
                      <Text style={styles.modalSpecialty}>{selectedDoctor.specialty}</Text>
                      <Text style={styles.modalExperience}>Experience: {selectedDoctor.experience}</Text>
                      <Text style={styles.modalLanguages}>Languages: {selectedDoctor.languages.join(', ')}</Text>
                      <Text style={styles.modalRating}>Rating: ⭐ {selectedDoctor.rating}</Text>
                      <Text style={styles.modalFee}>Consultation Fee: {selectedDoctor.consultationFee}</Text>
                      <Text style={styles.modalAvailable}>Next Available: {selectedDoctor.nextAvailable}</Text>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <SecondaryButton
                      title="Close"
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseButton}
                    />
                    <PrimaryButton
                      title="Book Consultation"
                      onPress={() => {
                        setModalVisible(false);
                        handleConsultNow(selectedDoctor.id);
                      }}
                      style={styles.modalBookButton}
                    />
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.black,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
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
  showingContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
  },
  showingText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  doctorsList: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(8),
    marginBottom: getResponsiveSpacing(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topSection: {
    flexDirection: 'row',
    padding: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  doctorImageContainer: {
    alignItems: 'center',
    marginRight: getResponsiveSpacing(16),
  },
  doctorImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    marginBottom: getResponsiveSpacing(6),
  },
  experienceText: {
    fontSize: getResponsiveFontSize(12),
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  qualification: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  specialty: {
    fontSize: getResponsiveFontSize(14),
    color: colors.primary,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(4),
  },
  languages: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomSection: {
    flexDirection: 'row',
    padding: getResponsiveSpacing(12),
    gap: getResponsiveSpacing(8),
  },
  knowMoreButton: {
    flex: 1,
    backgroundColor: '#FDEDF8',
    borderColor: '#FDEDF8',
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(32),
  },
  knowMoreButtonText: {
    color: colors.black,
    fontSize: getResponsiveFontSize(12),
  },
  consultButton: {
    flex: 1,
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(32),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    width: wp(90),
    maxHeight: hp(80),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSpacing(16),
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
    ...getResponsiveImageSize(20, 20),
    tintColor: colors.textSecondary,
  },
  modalBody: {
    padding: getResponsiveSpacing(16),
  },
  modalDoctorInfo: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(20),
  },
  modalDoctorImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    marginRight: getResponsiveSpacing(16),
  },
  modalDoctorDetails: {
    flex: 1,
  },
  modalDoctorName: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  modalQualification: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  modalSpecialty: {
    fontSize: getResponsiveFontSize(14),
    color: colors.primary,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(8),
  },
  modalExperience: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  modalLanguages: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  modalRating: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  modalFee: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  modalAvailable: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(12),
  },
  modalCloseButton: {
    flex: 1,
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(40),
  },
  modalBookButton: {
    flex: 1,
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(40),
  },
});