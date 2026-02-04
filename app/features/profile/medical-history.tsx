// import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

interface MedicalCondition {
  id: string;
  condition: string;
  status: 'active' | 'resolved' | 'chronic';
}

interface MedicalHistoryScreenProps {
  onClose?: () => void;
}

export default function MedicalHistoryScreen({ onClose }: MedicalHistoryScreenProps) {
  const [conditions, setConditions] = useState<MedicalCondition[]>([
    {
      id: '1',
      condition: 'Hypertension',
      status: 'active',
    },
    {
      id: '2',
      condition: 'Diabetes Type 2',
      status: 'active',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState({
    condition: '',
    status: 'active' as 'active' | 'resolved' | 'chronic',
  });


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

  const handleSaveCondition = () => {
    if (newCondition.condition.trim()) {
      const condition: MedicalCondition = {
        id: Date.now().toString(),
        condition: newCondition.condition.trim(),
        status: newCondition.status,
      };
      setConditions((prev) => [...prev, condition]);
      handleCloseModal();
    }
  };

  const handleDeleteCondition = (id: string) => {
    setConditions((prev) => prev.filter((condition) => condition.id !== id));
  };

  const renderConditionCard = useCallback(
    ({ item }: { item: MedicalCondition }) => (
      <View style={styles.conditionCard}>
        <View style={styles.conditionContent}>
          <Text style={styles.conditionName}>{item.condition}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { 
                  backgroundColor: 
                    item.status === 'active' ? colors.error :
                    item.status === 'resolved' ? colors.success : 
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
          onPress={() => handleDeleteCondition(item.id)}
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
        <View style={styles.conditionsContainer}>
          {conditions.map((condition) => (
            <View key={condition.id} style={styles.conditionCardWrapper}>
              {renderConditionCard({ item: condition })}
            </View>
          ))}
        </View>
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
                <TouchableOpacity
                  style={styles.conditionInputContainer}
                  onPress={handleOpenSearchModal}
                >
                  <Text style={[styles.conditionInputText, newCondition.condition ? styles.conditionInputTextFilled : styles.conditionInputTextPlaceholder]}>
                    {newCondition.condition || 'e.g., Hypertension, Diabetes'}
                  </Text>
                  <Text style={styles.searchIcon}>🔍</Text>
                </TouchableOpacity>
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
                title="Save"
                onPress={handleSaveCondition}
                style={styles.saveButton}
                disabled={!newCondition.condition.trim()}
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
});
