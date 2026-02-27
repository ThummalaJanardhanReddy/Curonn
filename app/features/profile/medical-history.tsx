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
  getResponsiveSpacing,
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
  const [newCondition, setNewCondition] = useState({
    condition: '',
    status: 'active',
  });
  // Dropdown for master data (categoryId=13)
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [masterOptions, setMasterOptions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
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
        fromDate: "1900-01-01",
        toDate: formattedDate,
        groupName: "",
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

  // Prefetch master options when Add modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchMasterOptions('');
    }
  }, [modalVisible]);

  const fetchMasterOptions = useCallback(async (q: string = '') => {
    try {
      setDropdownLoading(true);
      const url = `${ApiRoutes.Master.getmasterdata(13)}&search=${encodeURIComponent(q || '')}`;
      console.log('[MedicalHistory] fetching master options URL:', url);
      const response: any = await axiosClient.get(url);

      let items: any[] = [];
      if (Array.isArray(response)) items = response;
      else if (Array.isArray(response?.data)) items = response.data;
      else if (Array.isArray(response?.data?.data)) items = response.data.data;
      else if (Array.isArray(response?.data?.result)) items = response.data.result;
      else if (Array.isArray(response?.items)) items = response.items;
      else if (response?.isSuccess && Array.isArray(response.data)) items = response.data;

      const mapped = (items || []).map((it: any) => ({
        id: it.masterDataId ?? it.id ?? it.value ?? Math.random(),
        name: it.name ?? it.displayName ?? String(it),
      }));
      setMasterOptions(mapped);
    } catch (err) {
      console.error('Failed to fetch master options:', err);
      setMasterOptions([]);
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  // Merge master options and existing conditions for search modal suggestions
  const suggestions = React.useMemo(() => {
    const fromMaster = masterOptions.map((m) => ({ id: m.id, name: m.name, status: undefined as string | undefined }));
    const fromHistory = (conditions || []).map((c) => ({ id: `h-${c.medicalHistoryId}`, name: c.historyName, status: c.status }));
    const map = new Map<string, { id: any; name: string; status?: string }>();
    [...fromMaster, ...fromHistory].forEach((it) => {
      const key = (it.name || '').toString().toLowerCase().trim();
      if (!map.has(key)) map.set(key, it);
      else {
        const prev = map.get(key)!;
        if (!prev.status && it.status) map.set(key, it);
      }
    });
    const arr = Array.from(map.values());
    const q = (searchQuery || '').toLowerCase();
    if (!q) return arr;
    return arr.filter((it) => it.name.toLowerCase().includes(q));
  }, [masterOptions, conditions, searchQuery]);

  const filteredResults = suggestions;

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddCondition = () => {
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchQuery('');
    setSearchModalVisible(true);
    setDropdownVisible(false);
    fetchMasterOptions('');
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  const handleSelectCondition = (item: { id: any; name: string; status?: string }) => {
    setNewCondition({ ...newCondition, condition: item.name, status: item.status ?? newCondition.status });
    handleCloseSearchModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDropdownVisible(false);
    setSearchQuery('');
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
        totalCount: 0,
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

      if (response || response === "OK") {
        await fetchMedicalHistory();
      }
    } catch (error) {
      console.error('Delete medical history error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return colors.error;
      case 'resolved': return colors.success;
      case 'chronic': return colors.warning;
      default: return colors.textSecondary;
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
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCondition(item.medicalHistoryId)}
        >
          {/* <Image source={images.icons.close} style={styles.deleteIcon} /> */}
          <Text style={styles.deleteButtonText}>Delete</Text>
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : conditions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No medical history recorded</Text>
              <Text style={styles.emptySubtext}>
                Add conditions to track medical history
              </Text>
            </View>
          ) : (
            conditions.map((condition) => (
              <View key={condition.medicalHistoryId} style={styles.conditionCardWrapper}>
                {renderConditionCard({ item: condition })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Medical Condition Modal */}
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
              {/* Medical Condition Dropdown — same pattern as FamilyHistory relationship dropdown */}
              <View style={[styles.inputGroup, { zIndex: 2 }]}>
                <Text style={styles.inputLabel}>Medical Condition</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                  >
                    <Text style={styles.dropdownText}>
                      {newCondition.condition || 'Select medical condition'}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {dropdownVisible && (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownBackdrop}
                        onPress={() => setDropdownVisible(false)}
                        activeOpacity={1}
                      />
                      <View style={styles.dropdownOptions}>
                        {dropdownLoading ? (
                          <View style={{ padding: getResponsiveSpacing(12), alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                          </View>
                        ) : masterOptions && masterOptions.length > 0 ? (
                          masterOptions.map((item) => (
                            <TouchableOpacity
                              key={String(item.id)}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewCondition({ ...newCondition, condition: item.name });
                                setDropdownVisible(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{item.name}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No options</Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}
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
                      onPress={() => setNewCondition({ ...newCondition, status: option.value })}
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
              {filteredResults.map((item, index) => (
                <TouchableOpacity
                  key={String(item.id) + '-' + index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectCondition(item)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.searchResultText}>{item.name}</Text>
                    {item.status ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor(item.status) },
                          ]}
                        />
                        <Text style={{ color: '#666', fontSize: getResponsiveFontSize(12) }}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
              {filteredResults.length === 0 && (
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
  conditionsContainer: {
    padding: getResponsiveSpacing(20),
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
    shadowOffset: { width: 0, height: 2 },
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
  // Modal styles
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
    overflow: 'visible',
    zIndex: 1000,
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
    overflow: 'visible',
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
    zIndex: 1,
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
  },
  // Dropdown styles — matching FamilyHistoryScreen pattern
  dropdownContainer: {
    position: 'relative',
    zIndex: 99999,
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
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99998,
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
    maxHeight: getResponsiveSpacing(200),
    zIndex: 100000,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
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
  // Radio button styles
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
  // Footer
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
  saveButton: {
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(45),
    width: '100%',
  },
  // Loading/empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing(40),
  },
  emptyContainer: {
    padding: getResponsiveSpacing(40),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(8),
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Search modal styles
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
  deleteButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.error,
    fontWeight: "500",
  },
});
