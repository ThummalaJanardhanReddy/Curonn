import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import PrimaryButton from '../../shared/components/PrimaryButton';
import { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing
} from '../../shared/utils/responsive';
import { useUser } from '../../shared/context/UserContext';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';

interface MedicalCondition {
  medicalHistoryId: number;
  historyName: string;
  status: string;
  conditionType: string;
}

interface MedicalHistoryScreenProps {
  onClose?: () => void;
  showAddModal?: boolean;
}

export default function MedicalHistoryScreen({ onClose, showAddModal }: MedicalHistoryScreenProps) {
  const { userData } = useUser();
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState({
    condition: '',
    status: 'active',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchMedicalHistory = useCallback(async () => {
    if (!userData?.e_id) return;
    setLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        pageNo: 1,
        pageSize: 100,
        search: "",
        patientId: userData.e_id,
        fromDate: "1900-01-01", // Long range by default
        toDate: formattedDate,
        groupName: ""
      };

      console.log('📤 Medical History Request Payload:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(ApiRoutes.MedicalHistory.getAll, payload);
      console.log('📥 Medical History Response:', JSON.stringify(response, null, 2));

      if (response?.items && Array.isArray(response.items)) {
        setConditions(response.items);
      } else if (response?.isSuccess && Array.isArray(response.data)) {
        setConditions(response.data);
      } else if (Array.isArray(response)) {
        setConditions(response);
      }
    } catch (error) {
      console.error('Fetch medical history error:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.e_id]);

  useEffect(() => {
    fetchMedicalHistory();
  }, [fetchMedicalHistory]);

  useEffect(() => {
    if (showAddModal) {
      const timer = setTimeout(() => {
        setModalVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAddModal]);


  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddCondition = () => {
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchModalVisible(true);
    // Simulate API call to fetch medical conditions
    setSearchResults(['Diabetes', 'Thyroid', 'Hypertension', 'Asthma', 'Arthritis', 'Migraine', 'Depression', 'Anxiety', 'Heart Disease', 'Cancer']);
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  const handleSelectCondition = (condition: string) => {
    setNewCondition({ ...newCondition, condition });
    handleCloseSearchModal();
  };

  const filteredResults = searchResults.filter(result =>
    result.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewCondition({
      condition: '',
      status: 'active',
    });
  };

  const handleSaveCondition = async () => {
    if (!newCondition.condition.trim() || !userData?.e_id) return;

    setSaveLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        medicalHistoryId: 0,
        patientId: userData.e_id,
        historyName: newCondition.condition.trim(),
        reactions: "",
        status: newCondition.status,
        onsetDate: formattedDate,
        durationValue: 0,
        duration: "",
        notes: "",
        appointmentId: 0,
        isActive: true,
        conditionType: "Chronic",
        createdBy: userData.e_id,
        createdOn: formattedDate,
        totalCount: 0
      };

      console.log('📤 Save Medical History Request:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(ApiRoutes.MedicalHistory.save, payload);
      console.log('📥 Save Medical History Response:', JSON.stringify(response, null, 2));

      if (response) {
        handleCloseModal();
        await fetchMedicalHistory();
      }
    } catch (error) {
      console.error('Save medical history error:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCondition = async (id: number) => {
    if (!userData?.e_id) return;

    try {
      console.log(`📤 Deleting Medical History item: ${id}, deletedBy: ${userData.e_id}`);
      const response: any = await axiosClient.delete(ApiRoutes.MedicalHistory.delete(id, userData.e_id));
      console.log('📥 Delete Medical History Response:', JSON.stringify(response, null, 2));

      // Always fetch after delete attempt if it didn't throw, but check for generic success
      if (response || response === "OK") {
        await fetchMedicalHistory();
      }
    } catch (error) {
      console.error('Delete medical history error:', error);
    }
  };

  const renderConditionCard = useCallback(
    ({ item }: { item: MedicalCondition }) => (
      <View style={styles.conditionCard}>
        <View style={styles.conditionContent}>
          <Text style={styles.conditionName}>{item.historyName}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    item.status.toLowerCase() === 'active' ? colors.error :
                      item.status.toLowerCase() === 'resolved' ? colors.success :
                        colors.warning
                },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCondition(item.medicalHistoryId)}
        >
          <Image source={images.icons.close} style={styles.deleteIcon} />
        </TouchableOpacity>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton
            title="Medical History"
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.headerTitle}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCondition}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+Add</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Conditions List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.conditionsContainer}>
            {conditions.length > 0 ? (
              conditions.map((condition) => (
                <View key={condition.medicalHistoryId} style={styles.conditionCardWrapper}>
                  {renderConditionCard({ item: condition })}
                </View>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No medical history found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Condition Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={handleCloseModal}
          />
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medical Condition</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Condition Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical Condition</Text>
                <View style={styles.conditionInputContainer}>
                  <TextInput
                    style={styles.conditionInputText}
                    placeholder="e.g., Hypertension, Diabetes"
                    placeholderTextColor="#999"
                    value={newCondition.condition}
                    onChangeText={(text) => setNewCondition({ ...newCondition, condition: text })}
                    selectionColor="transparent"
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity onPress={handleOpenSearchModal}>
                    <Text style={styles.searchIcon}>🔍</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status Radio Buttons */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.radioContainer}>
                  {[
                    { value: 'active', label: 'Active' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'chronic', label: 'Chronic' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.radioOption}
                      onPress={() => setNewCondition({ ...newCondition, status: option.value as 'active' | 'resolved' | 'chronic' })}
                    >
                      <View style={styles.radioButton}>
                        {newCondition.status === option.value && (
                          <View style={styles.radioButtonSelected} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <PrimaryButton
                title={saveLoading ? "Saving..." : "Save"}
                onPress={handleSaveCondition}
                style={styles.saveButton}
                disabled={!newCondition.condition.trim() || saveLoading}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Search Medical Conditions Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={handleCloseSearchModal}
      >
        <SafeAreaView style={styles.searchModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Medical History</Text>
            <TouchableOpacity
              onPress={handleCloseSearchModal}
              style={styles.closeButton}
            >
              <Image source={images.icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchModalBody}>
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search medical conditions..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                selectionColor="transparent"
                underlineColorAndroid="transparent"
              />
              <Text style={styles.searchInputIcon}>🔍</Text>
            </View>

            {/* Search Results */}
            <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
              {filteredResults.map((condition, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectCondition(condition)}
                >
                  <Text style={styles.searchResultText}>{condition}</Text>
                </TouchableOpacity>
              ))}
              {filteredResults.length === 0 && searchQuery && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No conditions found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(20),
    // paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.black,
  },
  addButton: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(8),
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(22),
  },
  addButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  conditionsContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(10),
  },
  conditionCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  conditionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'flex-start',
  },
  conditionContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  conditionName: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: getResponsiveSpacing(10),
    height: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(5),
    marginRight: getResponsiveSpacing(6),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: getResponsiveSpacing(8),
  },
  deleteIcon: {
    ...getResponsiveImageSize(18, 18),
    tintColor: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(16),
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
    padding: getResponsiveSpacing(20),
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    backgroundColor: '#fff',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing(16),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12),
  },
  radioButton: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(10),
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: getResponsiveSpacing(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: getResponsiveSpacing(10),
    height: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(5),
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: '500',
  },
  conditionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    backgroundColor: '#fff',
    minHeight: getResponsiveSpacing(48),
  },
  conditionInputText: {
    fontSize: getResponsiveFontSize(14),
    flex: 1,
  },
  conditionInputTextFilled: {
    color: colors.text,
  },
  conditionInputTextPlaceholder: {
    color: '#999',
  },
  searchIcon: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
  },
  searchModalContent: {
    backgroundColor: '#fff',
    flex: 1,
    overflow: 'hidden',
  },
  searchModalBody: {
    padding: getResponsiveSpacing(20),
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    backgroundColor: '#fff',
    marginBottom: getResponsiveSpacing(16),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
  },
  searchInputIcon: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
    marginLeft: getResponsiveSpacing(8),
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultItem: {
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  searchResultText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
  saveButton: {
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(45),
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(40),
  },
});
