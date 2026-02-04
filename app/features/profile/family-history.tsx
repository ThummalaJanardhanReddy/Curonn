// import { router } from 'expo-router';
import axiosClient from "@/src/api/axiosClient";
import { ApiRoutes } from "@/src/api/employee/employee";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import BackButton from "../../shared/components/BackButton";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { colors } from "../../shared/styles/commonStyles";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";

interface FamilyMember {
  id: string;
  relationship: string;
  condition: string;
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [newMember, setNewMember] = useState({
    relationship: "",
    condition: "",
  });
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddMember = () => {
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchModalVisible(true);
    // Simulate API call to fetch medical conditions
    setSearchResults([
      "Diabetes",
      "Thyroid",
      "Hypertension",
      "Asthma",
      "Arthritis",
      "Migraine",
      "Depression",
      "Anxiety",
      "Heart Disease",
      "Cancer",
      "Stroke",
      "Kidney Disease",
      "Liver Disease",
      "Lung Disease",
      "Alzheimer's",
      "Parkinson's",
    ]);
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery("");
  };

  const handleSelectCondition = (condition: string) => {
    setNewMember({ ...newMember, condition });
    handleCloseSearchModal();
  };

  const filteredResults = searchResults.filter((result) =>
    result.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowRelationshipDropdown(false);
    setNewMember({
      relationship: "",
      condition: "",
    });
  };

  const handleSaveMember = async () => {
    if (newMember.relationship.trim() && newMember.condition.trim()) {
      const memberData: FamilyMemberData = {
        relationship: newMember.relationship.trim(),
        condition: newMember.condition.trim(),
        // Add employeeId if needed from user context
      };

      const success = await saveFamilyMember(memberData);
      if (success) {
        handleCloseModal();
      }
    }
  };

  const handleDeleteMember = useCallback(async (id: string) => {
    await deleteFamilyMember(id);
  }, []);

  // API Functions
  const fetchAllFamilyMembers = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = (await axiosClient.get(
        ApiRoutes.FamilyHistory.getAll
      )) as FamilyHistoryResponse;

      if (response?.isSuccess && response?.data) {
        setFamilyMembers(response.data);
      } else {
        setError(response?.message || "Failed to fetch family history");
      }
    } catch (error: any) {
      console.error("Error fetching family members:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveFamilyMember = async (memberData: FamilyMemberData) => {
    try {
      setIsSaving(true);
      setError("");
      const response = (await axiosClient.post(
        ApiRoutes.FamilyHistory.save,
        memberData
      )) as FamilyHistoryResponse;

      if (response?.isSuccess) {
        // Refresh the list after successful save
        await fetchAllFamilyMembers();
        return true;
      } else {
        setError(response?.message || "Failed to save family member");
        return false;
      }
    } catch (error: any) {
      console.error("Error saving family member:", error);
      setError("Network error. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFamilyMember = async (id: string) => {
    try {
      setError("");
      const response = (await axiosClient.delete(
        ApiRoutes.FamilyHistory.delete(id)
      )) as FamilyHistoryResponse;

      if (response?.isSuccess) {
        // Remove from local state
        setFamilyMembers((prev) => prev.filter((member) => member.id !== id));
        return true;
      } else {
        setError(response?.message || "Failed to delete family member");
        return false;
      }
    } catch (error: any) {
      console.error("Error deleting family member:", error);
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
          <Text style={styles.condition}>{item.condition}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMember(item.id)}
        >
          <Image source={images.icons.close} style={styles.deleteIcon} />
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
          <Text style={styles.addButtonText}>+Add</Text>
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
              <View key={member.id} style={styles.memberCardWrapper}>
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

              {/* Condition Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical Condition</Text>
                <TouchableOpacity
                  style={styles.conditionInputContainer}
                  onPress={handleOpenSearchModal}
                >
                  <Text
                    style={[
                      styles.conditionInputText,
                      newMember.condition
                        ? styles.conditionInputTextFilled
                        : styles.conditionInputTextPlaceholder,
                    ]}
                  >
                    {newMember.condition ||
                      "e.g., Heart Disease, Diabetes, Cancer"}
                  </Text>
                  <Text style={styles.searchIcon}>🔍</Text>
                </TouchableOpacity>
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
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
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
    fontWeight: "600",
    color: "#fff",
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
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
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
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
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
    overflow: "visible",
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
    zIndex: 1,
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
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
});
