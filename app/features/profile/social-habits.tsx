



import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useUser } from '../../shared/context/UserContext';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import Toast from '@/app/shared/components/Toast';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SocialHabit {
  socialHistoryId: number;
  patientId: number;
  smokingHistory: boolean;
  alcoholHistory: boolean;
  dietHistory: boolean;
  sleepingHistory: boolean;
  exerciseHistory: boolean;
  smokingQuantity: string;
  smokingFrquencyId: number;
  smokingStatus: number;
  alcoholQuantity: string;
  alcoholFrquencyId: number;
  alcoholStatus: number;
  appointmentId: number;
  createdOn: string;
  createdBy: number;
  totalCount: number;
}

interface SocialHabitsScreenProps {
  onClose?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// smokingStatus / alcoholStatus:  1 = Current, 2 = Past, 3 = Non
const SMOKING_STATUS_LABELS: Record<number, string> = {
  1: 'Current Smoker',
  2: 'Past Smoker',
  3: 'Non Smoker',
};
const ALCOHOL_STATUS_LABELS: Record<number, string> = {
  1: 'Current Drinker',
  2: 'Past Drinker',
  3: 'Non Drinker',
};
// frequencyId: 1 = Habitual, 2 = Occasional
const FREQUENCY_LABELS: Record<number, string> = {
  1: 'Habitual',
  2: 'Occasional',
};

const smokingStatusOptions = [
  { value: 1, label: 'Current Smoker' },
  { value: 2, label: 'Past Smoker' },
  { value: 3, label: 'Non Smoker' },
];

const alcoholStatusOptions = [
  { value: 1, label: 'Current Drinker' },
  { value: 2, label: 'Past Drinker' },
  { value: 3, label: 'Non Drinker' },
];

const frequencyOptions = [
  { value: 1, label: 'Habitual' },
  { value: 2, label: 'Occasional' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function SocialHabitsScreen({ onClose }: SocialHabitsScreenProps) {
  const { userData } = useUser();

  // List state
  const [habits, setHabits] = useState<SocialHabit[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'smoking' | 'alcohol'>('smoking');
  const [saveLoading, setSaveLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '', type: 'success' as 'success' | 'error' });

  // Form state – mirrors SaveSocial payload fields
  const [smokingStatus, setSmokingStatus] = useState<number>(3);
  const [smokingQuantity, setSmokingQuantity] = useState('');
  const [smokingFrequencyId, setSmokingFrequencyId] = useState<number>(1);
  const [alcoholStatus, setAlcoholStatus] = useState<number>(3);
  const [alcoholQuantity, setAlcoholQuantity] = useState('');
  const [alcoholFrequencyId, setAlcoholFrequencyId] = useState<number>(1);

  // Dropdown visibility
  const [showSmokingFreqDropdown, setShowSmokingFreqDropdown] = useState(false);
  const [showAlcoholFreqDropdown, setShowAlcoholFreqDropdown] = useState(false);

  // ── API calls ────────────────────────────────────────────────────────────────

  const fetchHabits = useCallback(async () => {
    if (!userData?.e_id) return;
    setLoading(true);
    try {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];

      const payload = {
        pageNo: 1,
        pageSize: 100,
        search: '',
        createdBy: userData.e_id,
        patientId: userData.e_id,
        fromDate: '1900-01-01',
        toDate: formattedDate,
        groupName: '',
      };

      console.log('📤 GetAllSocial Request:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(ApiRoutes.SocialHistory.getAll, payload);
      console.log('📥 GetAllSocial Response:', JSON.stringify(response, null, 2));

      if (Array.isArray(response)) {
        setHabits(response);
      } else if (response?.items && Array.isArray(response.items)) {
        setHabits(response.items);
      } else if (response?.isSuccess && Array.isArray(response.data)) {
        setHabits(response.data);
      } else if (Array.isArray(response?.data)) {
        setHabits(response.data);
      }
    } catch (error) {
      console.error('GetAllSocial error:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.e_id]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleBack = () => {
    if (onClose) onClose();
  };

  const resetForm = () => {
    setSmokingStatus(3);
    setSmokingQuantity('');
    setSmokingFrequencyId(1);
    setAlcoholStatus(3);
    setAlcoholQuantity('');
    setAlcoholFrequencyId(1);
    setSelectedTab('smoking');
    setShowSmokingFreqDropdown(false);
    setShowAlcoholFreqDropdown(false);
  };

  const handleOpenModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!userData?.e_id) return;
    setSaveLoading(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        socialHistoryId: 0,
        patientId: userData.e_id,
        smokingHistory: smokingStatus !== 3,
        alcoholHistory: alcoholStatus !== 3,
        dietHistory: false,
        sleepingHistory: false,
        exerciseHistory: false,
        smokingQuantity: smokingStatus === 1 ? smokingQuantity : '',
        smokingFrquencyId: smokingStatus === 1 ? smokingFrequencyId : 0,
        smokingStatus: smokingStatus,
        alcoholQuantity: alcoholStatus === 1 ? alcoholQuantity : '',
        alcoholFrquencyId: alcoholStatus === 1 ? alcoholFrequencyId : 0,
        alcoholStatus: alcoholStatus,
        appointmentId: 0,
        createdOn: now,
        createdBy: userData.e_id,
        totalCount: 0,
      };

      console.log('📤 SaveSocial Request:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(ApiRoutes.SocialHistory.save, payload);
      console.log('📥 SaveSocial Response:', JSON.stringify(response, null, 2));

      if (response !== undefined && response !== null) {
        setToastMessage({
          title: "Habit Saved Successfully",
          subtitle: response?.data?.message || "Saved successfully!",
          type: "success"
        });
        setShowToast(true);
        handleCloseModal();
        await fetchHabits();
      }
    } catch (error: any) {
      console.error('SaveSocial error:', error);
      setToastMessage({
        title: "Save Failed",
        subtitle: error?.response?.data?.message || error?.message || "Something went wrong",
        type: "error"
      });
      setShowToast(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!userData?.e_id) return;
    try {
      console.log(`📤 DeleteSocial id=${id}, deletedBy=${userData.e_id}`);
      const response: any = await axiosClient.delete(
        ApiRoutes.SocialHistory.delete(id, userData.e_id)
      );
      console.log('📥 DeleteSocial Response:', JSON.stringify(response, null, 2));
      setToastMessage({
        title: "Habit Deleted Successfully",
        subtitle: "Deleted successfully!",
        type: "success"
      });
      setShowToast(true);
      await fetchHabits();
    } catch (error: any) {
      console.error('DeleteSocial error:', error);
      setToastMessage({
        title: "Delete Failed",
        subtitle: error?.response?.data?.message || error?.message || "Something went wrong",
        type: "error"
      });
      setShowToast(true);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderHabitCard = (item: SocialHabit) => {
    const hasSmoking = item.smokingStatus !== 3 && item.smokingHistory;
    const hasAlcohol = item.alcoholStatus !== 3 && item.alcoholHistory;

    return (
      <View style={styles.habitCard} key={item.socialHistoryId}>
        <View style={styles.habitContent}>
          {hasSmoking && (
            <View style={styles.habitSection}>
              <View style={styles.habitHeader}>
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderText}>🚬</Text>
                </View>
                <Text style={styles.habitTitle}>Smoking</Text>
              </View>
              <Text style={styles.habitDetail}>
                Status: {SMOKING_STATUS_LABELS[item.smokingStatus] ?? 'Non Smoker'}
              </Text>
              {item.smokingStatus === 1 && item.smokingQuantity ? (
                <Text style={styles.habitDetail}>
                  Quantity: {item.smokingQuantity} cigarettes/day
                </Text>
              ) : null}
              {item.smokingStatus === 1 && item.smokingFrquencyId ? (
                <Text style={styles.habitDetail}>
                  Frequency: {FREQUENCY_LABELS[item.smokingFrquencyId] ?? '—'}
                </Text>
              ) : null}
            </View>
          )}

          {hasAlcohol && (
            <View style={[styles.habitSection, hasSmoking && styles.habitSectionBorder]}>
              <View style={styles.habitHeader}>
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderText}>🍷</Text>
                </View>
                <Text style={styles.habitTitle}>Alcohol</Text>
              </View>
              <Text style={styles.habitDetail}>
                Status: {ALCOHOL_STATUS_LABELS[item.alcoholStatus] ?? 'Non Drinker'}
              </Text>
              {item.alcoholStatus === 1 && item.alcoholQuantity ? (
                <Text style={styles.habitDetail}>
                  Quantity: {item.alcoholQuantity} drinks/day
                </Text>
              ) : null}
              {item.alcoholStatus === 1 && item.alcoholFrquencyId ? (
                <Text style={styles.habitDetail}>
                  Frequency: {FREQUENCY_LABELS[item.alcoholFrquencyId] ?? '—'}
                </Text>
              ) : null}
            </View>
          )}

          {!hasSmoking && !hasAlcohol && (
            <Text style={styles.habitDetail}>No active habits recorded.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.socialHistoryId)}
        >
          {/* <Image source={images.icons.close} style={styles.deleteIcon} /> */}
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSmokingForm = () => (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.placeholderIcon}>
          <Text style={styles.placeholderText}>🚬</Text>
        </View>
        <Text style={styles.habitTitle}>Smoking</Text>
      </View>

      <View style={styles.radioContainer}>
        <Text style={styles.radioGroupLabel}>Smoking Status</Text>
        {smokingStatusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => setSmokingStatus(option.value)}
          >
            <View style={styles.radioButton}>
              {smokingStatus === option.value && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {smokingStatus === 1 && (
        <View style={styles.conditionalFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (cigarettes per day)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 10, 20"
              placeholderTextColor="#999"
              value={smokingQuantity}
              onChangeText={setSmokingQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSmokingFreqDropdown(!showSmokingFreqDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {FREQUENCY_LABELS[smokingFrequencyId] ?? 'Select'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              {showSmokingFreqDropdown && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    onPress={() => setShowSmokingFreqDropdown(false)}
                    activeOpacity={1}
                  />
                  <View style={styles.dropdownOptions}>
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSmokingFrequencyId(option.value);
                          setShowSmokingFreqDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
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

  const renderAlcoholForm = () => (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.placeholderIcon}>
          <Text style={styles.placeholderText}>🍷</Text>
        </View>
        <Text style={styles.habitTitle}>Alcohol</Text>
      </View>

      <View style={styles.radioContainer}>
        <Text style={styles.radioGroupLabel}>Alcohol Consumption Status</Text>
        {alcoholStatusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => setAlcoholStatus(option.value)}
          >
            <View style={styles.radioButton}>
              {alcoholStatus === option.value && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {alcoholStatus === 1 && (
        <View style={styles.conditionalFields}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (drinks per day)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 2, 3"
              placeholderTextColor="#999"
              value={alcoholQuantity}
              onChangeText={setAlcoholQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowAlcoholFreqDropdown(!showAlcoholFreqDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {FREQUENCY_LABELS[alcoholFrequencyId] ?? 'Select'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              {showAlcoholFreqDropdown && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    onPress={() => setShowAlcoholFreqDropdown(false)}
                    activeOpacity={1}
                  />
                  <View style={styles.dropdownOptions}>
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setAlcoholFrequencyId(option.value);
                          setShowAlcoholFreqDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
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

  // ── JSX ───────────────────────────────────────────────────────────────────────

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
          onPress={handleOpenModal}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.habitsContainer}>
            {habits.length > 0 ? (
              habits.map((item) => (
                <View key={item.socialHistoryId} style={styles.habitCardWrapper}>
                  {renderHabitCard(item)}
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No social habits found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add/Save Modal */}
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Social Habit</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Tab selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabCard, selectedTab === 'smoking' && styles.tabCardSelected]}
                  onPress={() => setSelectedTab('smoking')}
                >
                  <Text style={styles.tabImage}>🚬</Text>
                  <Text style={[styles.tabText, selectedTab === 'smoking' && styles.tabTextSelected]}>
                    Smoking
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabCard, selectedTab === 'alcohol' && styles.tabCardSelected]}
                  onPress={() => setSelectedTab('alcohol')}
                >
                  <Text style={styles.tabImage}>🍷</Text>
                  <Text style={[styles.tabText, selectedTab === 'alcohol' && styles.tabTextSelected]}>
                    Alcohol
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.habitsContainer}>
                {selectedTab === 'smoking' && renderSmokingForm()}
                {selectedTab === 'alcohol' && renderAlcoholForm()}
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, saveLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      <Toast
        visible={showToast}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        type={toastMessage.type}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: getResponsiveSpacing(60),
  },
  habitsContainer: {
    padding: getResponsiveSpacing(20),
  },
  habitCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  noDataContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
  },
  noDataText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Habit card (list view)
  habitCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'flex-start',
  },
  habitContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  habitSection: {
    marginBottom: getResponsiveSpacing(8),
  },
  habitSectionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: getResponsiveSpacing(8),
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(4),
  },
  habitTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: colors.text,
  },
  habitDetail: {
    fontSize: getResponsiveFontSize(13),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(2),
    marginLeft: getResponsiveSpacing(4),
  },
  placeholderIcon: {
    width: getResponsiveSpacing(30),
    height: getResponsiveSpacing(30),
    borderRadius: getResponsiveSpacing(15),
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing(10),
  },
  placeholderText: {
    fontSize: getResponsiveFontSize(14),
  },
  deleteButton: {
    padding: getResponsiveSpacing(8),
  },
  deleteIcon: {
    ...getResponsiveImageSize(18, 18),
    tintColor: colors.error,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    height: '85%',
    width: '100%',
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
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
    paddingTop: getResponsiveSpacing(12),
  },
  // Tab selector
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(16),
    backgroundColor: '#fff',
    gap: getResponsiveSpacing(12),
  },
  tabCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(14),
    paddingHorizontal: getResponsiveSpacing(12),
    backgroundColor: '#f8f9fa',
    borderRadius: getResponsiveSpacing(8),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabImage: {
    fontSize: getResponsiveFontSize(22),
    marginBottom: getResponsiveSpacing(6),
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
  // Form card (inside modal)
  formCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  radioContainer: {
    marginBottom: getResponsiveSpacing(8),
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
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(16),
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 10000,
    overflow: 'visible',
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
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(8),
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10001,
  },
  dropdownOption: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '700',
    color: '#fff',
  },
  deleteButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.error,
    fontWeight: "500",
  },
});
