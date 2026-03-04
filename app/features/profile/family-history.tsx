// import { router } from 'expo-router';
import axiosClient from "@/src/api/axiosClient";
import { ApiRoutes } from "@/src/api/employee/employee";
import React, { useCallback, useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import BackButton from "../../shared/components/BackButton";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { colors } from "../../shared/styles/commonStyles";
import { fonts, fontStyles } from "@/app/shared/styles/fonts";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";
import { useUser } from "../../shared/context/UserContext";
import Toast from '@/app/shared/components/Toast';

interface FamilyMember {
  familyHistoryId: number;
  relationship: string;
  historyName: string;
  status: string;
}

interface FamilyHistoryScreenProps {
  onClose?: () => void;
}

// API Response interfaces
interface FamilyHistoryResponse {
  isSuccess?: boolean;
  message?: string;
  data?: any;
}

interface FamilyMemberData {
  id?: string;
  relationship: string;
  condition: string;
  employeeId?: string;
}

export default function FamilyHistoryScreen({
  onClose,
}: FamilyHistoryScreenProps) {
  const { userData } = useUser();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  // Master data options for conditions (categoryId=13)
  const [masterOptions, setMasterOptions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [dropdownSearch, setDropdownSearch] = useState('');

  const filteredMasterOptions = React.useMemo(() => {
    if (!dropdownSearch) return masterOptions;
    return masterOptions.filter(item =>
      item.name.toLowerCase().includes(dropdownSearch.toLowerCase())
    );
  }, [masterOptions, dropdownSearch]);
  const [newMember, setNewMember] = useState({
    relationship: "",
    condition: "",
  });
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '', type: 'success' as 'success' | 'error' });

  const relationshipOptions = [
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Grandfather (Paternal)",
    "Grandmother (Paternal)",
    "Grandfather (Maternal)",
    "Grandmother (Maternal)",
    "Uncle",
    "Aunt",
    "Cousin",
    "Other",
  ];
  const patientId = Number(userData?.e_id || userData?.eId);
  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddMember = () => {
    setModalVisible(true);
    fetchMasterOptions('');
  };

  const handleOpenSearchModal = () => {
    console.log('[FamilyHistory] Opening search modal - prefetch master options');
    setSearchModalVisible(true);
    fetchMasterOptions('');
  };

  const fetchMasterOptions = async (q: string = '') => {
    try {
      setDropdownLoading(true);
      console.log('[FamilyHistory] fetchMasterOptions q=', q);
      const url = `${ApiRoutes.Master.getmasterdata(13)}&search=${encodeURIComponent(q || '')}`;
      const response: any = await axiosClient.get(url);
      console.log('[FamilyHistory] master options response:', response);
      let items: any[] = [];
      if (Array.isArray(response)) items = response;
      else if (Array.isArray(response?.data)) items = response.data;
      else if (Array.isArray(response?.items)) items = response.items;
      else if (response?.isSuccess && Array.isArray(response.data)) items = response.data;

      const mapped = (items || []).map((it: any) => ({ id: it.masterDataId ?? it.id ?? it.value ?? Math.random(), name: it.name ?? it.displayName ?? String(it) }));
      setMasterOptions(mapped);
      // Initialize searchResults as names for immediate display
      setSearchResults(mapped.map(m => m.name));
    } catch (err) {
      console.error('Failed to fetch master options for family history:', err);
      // fallback to empty
      setMasterOptions([]);
      setSearchResults([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery("");
  };

  const handleSelectCondition = (item: { id: any; name: string; status?: string }) => {
    setNewMember({ ...newMember, condition: item.name });
    handleCloseSearchModal();
  };

  // Merge master options and existing family members to include status when applicable
  const suggestions = React.useMemo(() => {
    const fromMaster = masterOptions.map(m => ({ id: m.id, name: m.name, status: undefined as string | undefined }));
    const fromFamily = (familyMembers || []).map(fm => ({ id: `f-${fm.familyHistoryId}`, name: fm.historyName, status: fm.status }));
    const map = new Map<string, { id: any; name: string; status?: string }>();
    [...fromMaster, ...fromFamily].forEach(it => {
      const key = (it.name || '').toLowerCase().trim();
      if (!map.has(key)) map.set(key, it);
      else {
        const prev = map.get(key)!;
        if (!prev.status && it.status) map.set(key, it);
      }
    });
    const arr = Array.from(map.values());
    const q = (searchQuery || '').toLowerCase();
    if (!q) return arr;
    return arr.filter(it => it.name.toLowerCase().includes(q));
  }, [masterOptions, familyMembers, searchQuery]);

  const filteredResults = suggestions;

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowRelationshipDropdown(false);
    setShowConditionDropdown(false);
    setNewMember({
      relationship: "",
      condition: "",
    });
    setDropdownSearch('');
  };

  const handleSaveMember = async () => {
    if (newMember.relationship.trim() && newMember.condition.trim()) {
      // Duplicate check
      const isDuplicate = familyMembers.some(
        (m: any) =>
          ((m.relationship || m.relationName || '').toLowerCase().trim() === newMember.relationship.toLowerCase().trim()) &&
          ((m.historyName || '').toLowerCase().trim() === newMember.condition.toLowerCase().trim())
      );

      if (isDuplicate) {
        Alert.alert('Record already exists', 'This family history record is already present.');
        return;
      }
      console.log('Saving family member with data:', newMember);
      const memberData: FamilyMemberData = {
        relationship: newMember.relationship.trim(),
        condition: newMember.condition.trim(),
      };

      const success = await saveFamilyMember(memberData);
      if (success) {
        handleCloseModal();
      }
    }
  };

  const handleDeleteMember = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this record?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            await deleteFamilyMember(id);
          },
        },
      ],
      { cancelable: true }
    );
  }, [patientId]);

  // API Functions
  const fetchAllFamilyMembers = async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      setError("");

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        pageNo: 1,
        pageSize: 100,
        search: "",
        patientId: patientId,
        fromDate: "1900-01-01",
        toDate: formattedDate,
        groupName: ""
      };

      console.log('📤 Family History Request Payload:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(
        ApiRoutes.FamilyHistory.getAll,
        payload
      );
      console.log('📥 Family History Response:', JSON.stringify(response, null, 2));

      if (response?.items && Array.isArray(response.items)) {
        const mapped = response.items.map((it: any) => ({
          ...it,
          relationship: it.relationName || it.relationship || ""
        }));
        setFamilyMembers(mapped);
      } else if (response?.isSuccess && Array.isArray(response.data)) {
        const mapped = response.data.map((it: any) => ({
          ...it,
          relationship: it.relationName || it.relationship || ""
        }));
        setFamilyMembers(mapped);
      } else if (Array.isArray(response)) {
        const mapped = response.map((it: any) => ({
          ...it,
          relationship: it.relationName || it.relationship || ""
        }));
        setFamilyMembers(mapped);
      } else {
        setError("Failed to fetch family history");
      }
    } catch (error: any) {
      console.error("Error fetching family members:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveFamilyMember = async (memberData: FamilyMemberData) => {
    if (!patientId) return;
    try {
      setIsSaving(true);
      setError("");

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        familyHistoryId: 0,
        patientId: patientId,
        historyName: memberData.condition,
        relationId: 0,
        onsetDate: formattedDate,
        appointmentId: 0,
        isActive: true,
        createdOn: formattedDate,
        createdBy: patientId,
        deletedOn: formattedDate,
        deletedBy: 0,
        modifiedOn: formattedDate,
        modifiedBy: 0,
        relationName: memberData.relationship,
        totalCount: 0
      };

      console.log('📤 Save Family History Request:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(
        ApiRoutes.FamilyHistory.save,
        payload
      );
      console.log('📥 Save Family History Response:', JSON.stringify(response, null, 2));

      if (response) {
        setToastMessage({
          title: "Family Member Saved",
          subtitle: response?.message || "Saved successfully!",
          type: "success"
        });
        setShowToast(true);
        // Refresh the list after successful save
        await fetchAllFamilyMembers();
        return true;
      } else {
        setToastMessage({
          title: "Save Failed",
          subtitle: "Failed to save family member",
          type: "error"
        });
        setShowToast(true);
        setError("Failed to save family member");
        return false;
      }
    } catch (error: any) {
      console.error("Error saving family member:", error);
      setToastMessage({
        title: "Save Failed",
        subtitle: error?.response?.data?.message || error?.message || "Something went wrong",
        type: "error"
      });
      setShowToast(true);
      setError("Network error. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFamilyMember = async (id: string) => {
    if (!patientId) return;
    try {
      setError("");
      console.log(`📤 Deleting Family History item: ${id}, deletedBy: ${patientId}`);
      const response: any = await axiosClient.delete(
        ApiRoutes.FamilyHistory.delete(id, patientId)
      );
      console.log('📥 Delete Family History Response:', JSON.stringify(response, null, 2));

      if (response || response === "OK") {
        setToastMessage({
          title: "Family Member Deleted",
          subtitle: "Deleted successfully!",
          type: "success"
        });
        setShowToast(true);
        // Refresh the list after successful delete
        await fetchAllFamilyMembers();
        return true;
      } else {
        setToastMessage({
          title: "Delete Failed",
          subtitle: "Failed to delete family member",
          type: "error"
        });
        setShowToast(true);
        setError("Failed to delete family member");
        return false;
      }
    } catch (error: any) {
      console.error("Error deleting family member:", error);
      setToastMessage({
        title: "Delete Failed",
        subtitle: error?.response?.data?.message || error?.message || "Something went wrong",
        type: "error"
      });
      setShowToast(true);
      setError("Network error. Please try again.");
      return false;
    }
  };

  // Load family members on component mount
  useEffect(() => {
    fetchAllFamilyMembers();
  }, []);

  const renderMemberCard = useCallback(
    ({ item }: { item: FamilyMember }) => (
      <View style={styles.memberCard}>
        <View style={styles.memberContent}>
          <Text style={styles.relationship}>{item.relationship}</Text>
          <Text style={styles.condition}>{item.historyName}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMember(String(item.familyHistoryId))}
        >
          {/* <Image source={images.icons.close} style={styles.deleteIcon} /> */}
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleDeleteMember]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton
            title="Family History"
            color={colors.black}
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.headerTitle}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMember}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Error Display */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => setError("")}
            style={styles.errorCloseButton}
          >
            <Text style={styles.errorCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Family Members List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.membersContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading family history...</Text>
            </View>
          ) : familyMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No family history recorded</Text>
              <Text style={styles.emptySubtext}>
                Add family members to track medical history
              </Text>
            </View>
          ) : (
            familyMembers.map((member) => (
              <View key={member.familyHistoryId} style={styles.memberCardWrapper}>
                {renderMemberCard({ item: member })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Family Member Modal */}
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
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Relationship Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowRelationshipDropdown(!showRelationshipDropdown);
                      setShowConditionDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {newMember.relationship || "Select relationship"}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {showRelationshipDropdown && (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownBackdrop}
                        onPress={() => setShowRelationshipDropdown(false)}
                        activeOpacity={1}
                      />
                      <View style={styles.dropdownOptions}>
                        {relationshipOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewMember({
                                ...newMember,
                                relationship: option,
                              });
                              setShowRelationshipDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Medical Condition Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical Condition</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowConditionDropdown(!showConditionDropdown);
                      setShowRelationshipDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {newMember.condition || "Select medical condition"}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {showConditionDropdown && (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownBackdrop}
                        onPress={() => setShowConditionDropdown(false)}
                        activeOpacity={1}
                      />
                      <View style={styles.dropdownOptions}>
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="Search condition..."
                          placeholderTextColor="#999"
                          value={dropdownSearch}
                          onChangeText={setDropdownSearch}
                        />
                        <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                          {dropdownLoading ? (
                            <View style={{ padding: getResponsiveSpacing(12), alignItems: 'center' }}>
                              <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                          ) : filteredMasterOptions && filteredMasterOptions.length > 0 ? (
                            filteredMasterOptions.map((item) => (
                              <TouchableOpacity
                                key={String(item.id)}
                                style={styles.dropdownOption}
                                onPress={() => {
                                  setNewMember({
                                    ...newMember,
                                    condition: item.name,
                                  });
                                  setShowConditionDropdown(false);
                                  setDropdownSearch('');
                                }}
                              >
                                <Text style={styles.dropdownOptionText}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.noResultsContainer}>
                              <Text style={styles.noResultsText}>No options</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <PrimaryButton
                title={isSaving ? "Saving..." : "Save"}
                onPress={handleSaveMember}
                style={styles.saveButton}
                disabled={
                  !newMember.relationship.trim() ||
                  !newMember.condition.trim() ||
                  isSaving
                }
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
            <ScrollView
              style={styles.searchResultsContainer}
              showsVerticalScrollIndicator={false}
            >
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
                        <View style={[styles.statusIndicator, { width: 10, height: 10, borderRadius: 5, marginRight: 8, backgroundColor: item.status.toLowerCase() === 'active' ? colors.error : item.status.toLowerCase() === 'resolved' ? colors.success : colors.warning }]} />
                        <Text style={{ color: '#666', fontSize: getResponsiveFontSize(12) }}>{item.status}</Text>
                      </View>
                    ) : null}
                  </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(20),
    // paddingBottom: getResponsiveSpacing(15),
    backgroundColor: "#fff",
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  headerTitle: {
    ...fontStyles.headercontent,
    color: colors.black,
  },
  addButton: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    backgroundColor: "transparent",
  },
  addButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "600",
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    shadowColor: "#000",
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
  membersContainer: {
    padding: getResponsiveSpacing(20),
  },
  memberCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  memberCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "flex-start",
  },
  memberContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  relationship: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: colors.black,
    marginBottom: getResponsiveSpacing(4),
    fontFamily: fonts.bold,
  },
  condition: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
    fontWeight: "600",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
    maxHeight: "80%",
    overflow: "visible",
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(15),
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.semiBold,
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
    overflow: "visible",
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
    fontFamily: fonts.medium,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    backgroundColor: "#fff",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    backgroundColor: "#fff",
    minHeight: getResponsiveSpacing(48),
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    flex: 1,
    fontFamily: fonts.regular,
  },
  dropdownIcon: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 99999,
    overflow: "visible",
  },
  dropdownBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99998,
    backgroundColor: "transparent",
  },
  dropdownOptions: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderBottomWidth: 0,
    borderTopLeftRadius: getResponsiveSpacing(8),
    borderTopRightRadius: getResponsiveSpacing(8),
    maxHeight: getResponsiveSpacing(200),
    zIndex: 100000,
    elevation: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: getResponsiveSpacing(2),
    flexDirection: "column-reverse",
  },
  dropdownSearchInput: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
  },
  dropdownOption: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: "500",
  },
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
  saveButton: {
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(45),
    width: "100%",
  },
  conditionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    backgroundColor: "#fff",
    minHeight: getResponsiveSpacing(48),
    zIndex: 1,
  },
  conditionInputText: {
    fontSize: getResponsiveFontSize(14),
    flex: 1,
  },
  conditionInputTextFilled: {
    color: colors.text,
  },
  conditionInputTextPlaceholder: {
    color: "#999",
  },
  searchIcon: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
  },
  searchModalContent: {
    backgroundColor: "#fff",
    flex: 1,
    overflow: "hidden",
  },
  searchModalBody: {
    padding: getResponsiveSpacing(20),
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    backgroundColor: "#fff",
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
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  searchResultText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: "500",
  },
  noResultsContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: "center",
  },
  noResultsText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  // New styles for API integration
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderColor: "#f44336",
    borderWidth: 1,
    borderRadius: getResponsiveSpacing(8),
    padding: getResponsiveSpacing(12),
    margin: getResponsiveSpacing(16),
  },
  errorText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    color: "#d32f2f",
    fontWeight: "500",
  },
  errorCloseButton: {
    marginLeft: getResponsiveSpacing(8),
    padding: getResponsiveSpacing(4),
  },
  errorCloseText: {
    fontSize: getResponsiveFontSize(18),
    color: "#d32f2f",
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: getResponsiveSpacing(40),
    alignItems: "center",
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: getResponsiveSpacing(40),
    alignItems: "center",
  },
  emptyText: {
    fontSize: getResponsiveFontSize(16),
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: getResponsiveSpacing(8),
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    textAlign: "center",
  },
  statusIndicator: {
    width: getResponsiveSpacing(10),
    height: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(5),
    marginRight: getResponsiveSpacing(6),
  },
 deleteButtonText: {
    fontFamily: fonts.regular,
    fontSize: getResponsiveFontSize(12),
    color: colors.error,
  },
});
