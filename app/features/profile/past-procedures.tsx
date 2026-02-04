// import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
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

interface Procedure {
  id: string;
  procedureName: string;
  date: string;
}

interface PastProceduresScreenProps {
  onClose?: () => void;
}

export default function PastProceduresScreen({ onClose }: PastProceduresScreenProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([
    {
      id: '1',
      procedureName: 'Appendectomy',
      date: '2020-03-15',
    },
    {
      id: '2',
      procedureName: 'Knee Arthroscopy',
      date: '2019-08-22',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newProcedure, setNewProcedure] = useState({
    procedureName: '',
    date: '',
  });

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddProcedure = () => {
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchModalVisible(true);
    // Simulate API call to fetch surgical procedures
    setSearchResults(['Appendectomy', 'Knee Arthroscopy', 'Gallbladder Removal', 'Hernia Repair', 'Cataract Surgery', 'Heart Bypass', 'Hip Replacement', 'Knee Replacement', 'Spine Surgery', 'Brain Surgery', 'Lung Surgery', 'Liver Surgery', 'Kidney Surgery', 'Prostate Surgery', 'Hysterectomy', 'C-Section']);
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  const handleSelectProcedure = (procedure: string) => {
    setNewProcedure({ ...newProcedure, procedureName: procedure });
    handleCloseSearchModal();
  };

  const filteredResults = searchResults.filter(result =>
    result.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDateSelect = (date: string) => {
    setNewProcedure({ ...newProcedure, date });
    setShowDatePicker(false);
  };

  const handleNativeDateChange = (event: any, selectedDate?: Date) => {
    setShowNativeDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setNewProcedure({ ...newProcedure, date: dateString });
    }
  };

  const handleOpenNativeDatePicker = () => {
    // Set the selected date to the current date value if it exists, otherwise use today
    if (newProcedure.date) {
      setSelectedDate(new Date(newProcedure.date));
    } else {
      setSelectedDate(new Date());
    }
    setShowNativeDatePicker(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewProcedure({
      procedureName: '',
      date: '',
    });
  };

  const handleSaveProcedure = () => {
    if (newProcedure.procedureName.trim() && newProcedure.date.trim()) {
      const procedure: Procedure = {
        id: Date.now().toString(),
        procedureName: newProcedure.procedureName.trim(),
        date: newProcedure.date.trim(),
      };
      setProcedures((prev) => [...prev, procedure]);
      handleCloseModal();
    }
  };

  const handleDeleteProcedure = (id: string) => {
    setProcedures((prev) => prev.filter((procedure) => procedure.id !== id));
  };

  const renderProcedureCard = useCallback(
    ({ item }: { item: Procedure }) => (
      <View style={styles.procedureCard}>
        <View style={styles.procedureContent}>
          <Text style={styles.procedureName}>{item.procedureName}</Text>
          <Text style={styles.date}>Date: {item.date}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProcedure(item.id)}
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
            title=""
            onPress={handleBack}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Surgical History</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProcedure}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+Add</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Procedures List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.proceduresContainer}>
          {procedures.map((procedure) => (
            <View key={procedure.id} style={styles.procedureCardWrapper}>
              {renderProcedureCard({ item: procedure })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Procedure Modal */}
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
              <Text style={styles.modalTitle}>ADD SURGICAL HISTORY</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Procedure Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surgical History Name</Text>
                <TouchableOpacity
                  style={styles.procedureInputContainer}
                  onPress={handleOpenSearchModal}
                >
                  <Text style={[styles.procedureInputText, newProcedure.procedureName ? styles.procedureInputTextFilled : styles.procedureInputTextPlaceholder]}>
                    {newProcedure.procedureName || 'e.g., Appendectomy, Knee Surgery'}
                  </Text>
                  <Text style={styles.searchIcon}>🔍</Text>
                </TouchableOpacity>
              </View>

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                    value={newProcedure.date}
                    onChangeText={(text) => setNewProcedure({ ...newProcedure, date: text })}
                    selectionColor="transparent"
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity
                    style={styles.calendarIconContainer}
                    onPress={handleOpenNativeDatePicker}
                  >
                    <Text style={styles.calendarIcon}>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <PrimaryButton
                title="Save"
                onPress={handleSaveProcedure}
                style={styles.saveButton}
                disabled={!newProcedure.procedureName.trim() || !newProcedure.date.trim()}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Search Surgical Procedures Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={handleCloseSearchModal}
      >
        <SafeAreaView style={styles.searchModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Surgical History</Text>
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
                  placeholder="Search surgical procedures..."
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
                {filteredResults.map((procedure, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectProcedure(procedure)}
                  >
                    <Text style={styles.searchResultText}>{procedure}</Text>
                  </TouchableOpacity>
                ))}
                {filteredResults.length === 0 && searchQuery && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No procedures found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContent}>
              <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 365 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateString = date.toISOString().split('T')[0];
                  const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  return (
                    <TouchableOpacity
                      key={dateString}
                      style={styles.dateOption}
                      onPress={() => handleDateSelect(dateString)}
                    >
                      <Text style={styles.dateOptionText}>{formattedDate}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Native Date Picker */}
      {showNativeDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleNativeDateChange}
          maximumDate={new Date()}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.black,
    marginLeft: getResponsiveSpacing(12),
  },
  addButton: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(6),
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
  proceduresContainer: {
    padding: getResponsiveSpacing(20),
  },
  procedureCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  procedureCard: {
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
  procedureContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  procedureName: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  date: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
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
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
  saveButton: {
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(45),
    width: '100%',
  },
  procedureInputContainer: {
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
  procedureInputText: {
    fontSize: getResponsiveFontSize(14),
    flex: 1,
  },
  procedureInputTextFilled: {
    color: colors.text,
  },
  procedureInputTextPlaceholder: {
    color: '#999',
  },
  searchIcon: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#fff',
    minHeight: getResponsiveSpacing(48),
  },
  dateTextInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
  },
  calendarIconContainer: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  calendarIcon: {
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
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
    maxHeight: '70%',
    overflow: 'hidden',
  },
  datePickerContent: {
    flex: 1,
  },
  dateList: {
    flex: 1,
  },
  dateOption: {
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  dateOptionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: '500',
  },
});
