// import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing
} from '../../shared/utils/responsive';

interface SocialHabit {
  id: string;
  type: 'smoking' | 'alcohol';
  status: 'current' | 'past' | 'non-smoker' | 'non-drinker';
  quantity?: string;
  frequency?: 'habitual' | 'occasional';
}

interface SocialHabitsScreenProps {
  onClose?: () => void;
}

export default function SocialHabitsScreen({ onClose }: SocialHabitsScreenProps) {
  const [habits, setHabits] = useState<SocialHabit[]>([
    {
      id: '1',
      type: 'smoking',
      status: 'current',
      quantity: '10',
      frequency: 'habitual',
    },
    {
      id: '2',
      type: 'alcohol',
      status: 'current',
      quantity: '2',
      frequency: 'occasional',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'smoking' | 'alcohol'>('smoking');
  const [socialHabits, setSocialHabits] = useState({
    smoking: {
      status: 'non-smoker' as 'current' | 'past' | 'non-smoker',
      quantity: '',
      frequency: 'habitual' as 'habitual' | 'occasional',
    },
    alcohol: {
      status: 'non-drinker' as 'current' | 'past' | 'non-drinker',
      quantity: '',
      frequency: 'habitual' as 'habitual' | 'occasional',
    },
  });
  const [showSmokingFrequencyDropdown, setShowSmokingFrequencyDropdown] = useState(false);
  const [showAlcoholFrequencyDropdown, setShowAlcoholFrequencyDropdown] = useState(false);

  const smokingFrequencyOptions = [
    'Habitual',
    'Occasional',
  ];

  const alcoholFrequencyOptions = [
    'Habitual',
    'Occasional',
  ];

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };


  const handleAddHabit = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowSmokingFrequencyDropdown(false);
    setShowAlcoholFrequencyDropdown(false);
    setSelectedTab('smoking');
    setSocialHabits({
      smoking: {
        status: 'non-smoker',
        quantity: '',
        frequency: 'habitual',
      },
      alcohol: {
        status: 'non-drinker',
        quantity: '',
        frequency: 'habitual',
      },
    });
  };

  const handleSaveHabit = () => {
    // Save both smoking and alcohol habits if they have been set
    const newHabits: SocialHabit[] = [];
    
    if (socialHabits.smoking.status !== 'non-smoker') {
      newHabits.push({
        id: Date.now().toString() + '_smoking',
        type: 'smoking',
        status: socialHabits.smoking.status,
        quantity: socialHabits.smoking.quantity,
        frequency: socialHabits.smoking.frequency,
      });
    }
    
    if (socialHabits.alcohol.status !== 'non-drinker') {
      newHabits.push({
        id: Date.now().toString() + '_alcohol',
        type: 'alcohol',
        status: socialHabits.alcohol.status,
        quantity: socialHabits.alcohol.quantity,
        frequency: socialHabits.alcohol.frequency,
      });
    }
    
    if (newHabits.length > 0) {
      setHabits((prev) => [...prev, ...newHabits]);
    }
    
    handleCloseModal();
  };

  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  };

  const handleSmokingStatusChange = (status: 'current' | 'past' | 'non-smoker') => {
    setSocialHabits(prev => ({
      ...prev,
      smoking: {
        ...prev.smoking,
        status,
        quantity: status === 'current' ? prev.smoking.quantity : '',
        frequency: status === 'current' ? prev.smoking.frequency : 'habitual',
      }
    }));
  };

  const handleSmokingQuantityChange = (quantity: string) => {
    setSocialHabits(prev => ({
      ...prev,
      smoking: {
        ...prev.smoking,
        quantity,
      }
    }));
  };

  const handleSmokingFrequencyChange = (frequency: 'habitual' | 'occasional') => {
    setSocialHabits(prev => ({
      ...prev,
      smoking: {
        ...prev.smoking,
        frequency,
      }
    }));
    setShowSmokingFrequencyDropdown(false);
  };

  const handleAlcoholStatusChange = (status: 'current' | 'past' | 'non-drinker') => {
    setSocialHabits(prev => ({
      ...prev,
      alcohol: {
        ...prev.alcohol,
        status,
        quantity: status === 'current' ? prev.alcohol.quantity : '',
        frequency: status === 'current' ? prev.alcohol.frequency : 'habitual',
      }
    }));
  };

  const handleAlcoholQuantityChange = (quantity: string) => {
    setSocialHabits(prev => ({
      ...prev,
      alcohol: {
        ...prev.alcohol,
        quantity,
      }
    }));
  };

  const handleAlcoholFrequencyChange = (frequency: 'habitual' | 'occasional') => {
    setSocialHabits(prev => ({
      ...prev,
      alcohol: {
        ...prev.alcohol,
        frequency,
      }
    }));
    setShowAlcoholFrequencyDropdown(false);
  };

  const renderHabitCard = (item: SocialHabit) => (
    <View style={styles.habitCard}>
      <View style={styles.habitContent}>
        <View style={styles.habitHeader}>
          <View style={styles.placeholderIcon}>
            <Text style={styles.placeholderText}>
              {item.type === 'smoking' ? '🚬' : '🍷'}
            </Text>
          </View>
          <Text style={styles.habitTitle}>
            {item.type === 'smoking' ? 'Smoking' : 'Alcohol'}
          </Text>
        </View>
        <Text style={styles.habitStatus}>
          Status: {item.status === 'current' ? 'Current' : 
                  item.status === 'past' ? 'Past' : 
                  item.type === 'smoking' ? 'Non Smoker' : 'Non Drinker'}
        </Text>
        {item.status === 'current' && item.quantity && (
          <Text style={styles.habitDetails}>
            Quantity: {item.quantity} {item.type === 'smoking' ? 'cigarettes' : 'drinks'} per day
          </Text>
        )}
        {item.status === 'current' && item.frequency && (
          <Text style={styles.habitDetails}>
            Frequency: {item.frequency}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteHabit(item.id)}
      >
        <Image source={images.icons.close} style={styles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderSmokingCard = () => (
    <View style={styles.habitCard}>
      <View style={styles.cardHeader}>
        <View style={styles.placeholderIcon}>
          <Text style={styles.placeholderText}>🚬</Text>
        </View>
        <Text style={styles.habitTitle}>Smoking</Text>
      </View>
      
      <View style={styles.radioContainer}>
        <Text style={styles.radioGroupLabel}>Smoking Status</Text>
        {[
          { value: 'current', label: 'Current Smoker' },
          { value: 'past', label: 'Past Smoker' },
          { value: 'non-smoker', label: 'Non Smoker' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => handleSmokingStatusChange(option.value as 'current' | 'past' | 'non-smoker')}
          >
            <View style={styles.radioButton}>
              {socialHabits.smoking.status === option.value && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {socialHabits.smoking.status === 'current' && (
        <View style={styles.conditionalFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (cigarettes per day)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 10, 20"
              placeholderTextColor="#999"
              value={socialHabits.smoking.quantity}
              onChangeText={handleSmokingQuantityChange}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSmokingFrequencyDropdown(!showSmokingFrequencyDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {socialHabits.smoking.frequency}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {showSmokingFrequencyDropdown && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    onPress={() => setShowSmokingFrequencyDropdown(false)}
                    activeOpacity={1}
                  />
                  <View style={styles.dropdownOptions}>
                    {smokingFrequencyOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownOption}
                        onPress={() => handleSmokingFrequencyChange(option as 'habitual' | 'occasional')}
                      >
                        <Text style={styles.dropdownOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderAlcoholCard = () => (
    <View style={styles.habitCard}>
      <View style={styles.cardHeader}>
        <View style={styles.placeholderIcon}>
          <Text style={styles.placeholderText}>🍷</Text>
        </View>
        <Text style={styles.habitTitle}>Alcohol</Text>
      </View>
      
      <View style={styles.radioContainer}>
        <Text style={styles.radioGroupLabel}>Alcohol Consumption Status</Text>
        {[
          { value: 'current', label: 'Current Drinker' },
          { value: 'past', label: 'Past Drinker' },
          { value: 'non-drinker', label: 'Non Drinker' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => handleAlcoholStatusChange(option.value as 'current' | 'past' | 'non-drinker')}
          >
            <View style={styles.radioButton}>
              {socialHabits.alcohol.status === option.value && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {socialHabits.alcohol.status === 'current' && (
        <View style={styles.conditionalFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (drinks per day)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 2, 3"
              placeholderTextColor="#999"
              value={socialHabits.alcohol.quantity}
              onChangeText={handleAlcoholQuantityChange}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowAlcoholFrequencyDropdown(!showAlcoholFrequencyDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {socialHabits.alcohol.frequency}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {showAlcoholFrequencyDropdown && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    onPress={() => setShowAlcoholFrequencyDropdown(false)}
                    activeOpacity={1}
                  />
                  <View style={styles.dropdownOptions}>
                    {alcoholFrequencyOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownOption}
                        onPress={() => handleAlcoholFrequencyChange(option as 'habitual' | 'occasional')}
                      >
                        <Text style={styles.dropdownOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
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
          <Text style={styles.headerTitle}>Social Habits</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddHabit}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+Add</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Habits List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.habitsContainer}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCardWrapper}>
              {renderHabitCard(habit)}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
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
              <Text style={styles.modalTitle}>Add Social Habit</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Tab Cards */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabCard, selectedTab === 'smoking' && styles.tabCardSelected]}
                  onPress={() => setSelectedTab('smoking')}
                >
                  <View style={styles.tabImageContainer}>
                    <Text style={styles.tabImage}>🚬</Text>
                  </View>
                  <Text style={[styles.tabText, selectedTab === 'smoking' && styles.tabTextSelected]}>
                    Smoking
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.tabCard, selectedTab === 'alcohol' && styles.tabCardSelected]}
                  onPress={() => setSelectedTab('alcohol')}
                >
                  <View style={styles.tabImageContainer}>
                    <Text style={styles.tabImage}>🍷</Text>
                  </View>
                  <Text style={[styles.tabText, selectedTab === 'alcohol' && styles.tabTextSelected]}>
                    Alcohol
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.habitsContainer}>
                {selectedTab === 'smoking' && (
                  <View style={styles.habitCardWrapper}>
                    {renderSmokingCard()}
                  </View>
                )}
                {selectedTab === 'alcohol' && (
                  <View style={styles.habitCardWrapper}>
                    {renderAlcoholCard()}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveHabit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
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
  closeButton: {
    padding: getResponsiveSpacing(4),
  },
  closeIcon: {
    ...getResponsiveImageSize(20, 20),
    tintColor: colors.textSecondary,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(16),
    backgroundColor: '#fff',
  },
  tabCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(12),
    marginHorizontal: getResponsiveSpacing(4),
    backgroundColor: '#f8f9fa',
    borderRadius: getResponsiveSpacing(8),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabImageContainer: {
    marginBottom: getResponsiveSpacing(8),
  },
  tabImage: {
    fontSize: getResponsiveFontSize(24),
  },
  tabText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  habitsContainer: {
    padding: getResponsiveSpacing(20),
  },
  habitCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  habitContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  habitStatus: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
  },
  habitDetails: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
  },
  deleteButton: {
    padding: getResponsiveSpacing(8),
  },
  deleteIcon: {
    ...getResponsiveImageSize(18, 18),
    tintColor: colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  habitIcon: {
    ...getResponsiveImageSize(24, 24),
    tintColor: colors.primary,
    marginRight: getResponsiveSpacing(12),
  },
  placeholderIcon: {
    width: getResponsiveSpacing(32),
    height: getResponsiveSpacing(32),
    borderRadius: getResponsiveSpacing(16),
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing(12),
  },
  placeholderText: {
    fontSize: getResponsiveFontSize(16),
  },
  habitTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.text,
  },
  radioContainer: {
    marginBottom: getResponsiveSpacing(16),
  },
  radioGroupLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveSpacing(12),
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
    marginRight: getResponsiveSpacing(12),
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
  conditionalFields: {
    marginTop: getResponsiveSpacing(16),
    paddingTop: getResponsiveSpacing(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    width: '100%',
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
    width: '100%',
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
    width: '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    backgroundColor: '#fff',
    minHeight: getResponsiveSpacing(48),
    width: '100%',
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10000,
    overflow: 'visible',
  },
  dropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  dropdownOptions: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderBottomWidth: 0,
    borderTopLeftRadius: getResponsiveSpacing(8),
    borderTopRightRadius: getResponsiveSpacing(8),
    maxHeight: getResponsiveSpacing(150),
    zIndex: 100000,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: getResponsiveSpacing(2),
    flexDirection: 'column-reverse',
  },
  dropdownOption: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: '500',
  },
  saveButtonContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
    height: '100%',
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
  modalBody: {
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
});
