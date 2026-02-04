import React, { useCallback, useState } from "react";
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

interface FoodAllergy {
  id: string;
  allergen: string;
  reaction: string;
  status: "active" | "inactive";
}

interface FoodAllergiesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FoodAllergiesModal({
  visible,
  onClose,
}: FoodAllergiesModalProps) {
  const [allergies, setAllergies] = useState<FoodAllergy[]>([
    {
      id: "1",
      allergen: "Peanuts",
      reaction: "Severe allergic reaction",
      status: "active",
    },
    {
      id: "2",
      allergen: "Shellfish",
      reaction: "Mild skin rash",
      status: "active",
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [newAllergy, setNewAllergy] = useState({
    allergen: "",
    reaction: "",
    status: "active" as "active" | "inactive",
  });
  const [showReactionDropdown, setShowReactionDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const reactionOptions = [
    "Mild skin rash",
    "Severe allergic reaction",
    "Nausea and vomiting",
    "Difficulty breathing",
    "Swelling of face/lips",
    "Hives",
    "Anaphylaxis",
    "Other",
  ];

  const foodSearchOptions = [
    "Peanuts",
    "Tree nuts",
    "Shellfish",
    "Fish",
    "Eggs",
    "Milk",
    "Soy",
    "Wheat",
    "Sesame",
    "Gluten",
    "Lactose",
    "Strawberries",
    "Tomatoes",
    "Chocolate",
    "Citrus fruits",
  ];

  const handleBack = () => {
    onClose(); // Close the modal
  };

  const handleAddAllergy = () => {
    console.log("Add button pressed");
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchModalVisible(true);
    setSearchQuery("");
    setSearchResults(foodSearchOptions);
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = foodSearchOptions.filter((food) =>
        food.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(foodSearchOptions);
    }
  };

  const handleSelectFood = (food: string) => {
    setNewAllergy({ ...newAllergy, allergen: food });
    handleCloseSearchModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowReactionDropdown(false);
    setNewAllergy({
      allergen: "",
      reaction: "",
      status: "active",
    });
  };

  const handleSaveAllergy = () => {
    if (newAllergy.allergen.trim() && newAllergy.reaction.trim()) {
      const allergy: FoodAllergy = {
        id: Date.now().toString(),
        allergen: newAllergy.allergen.trim(),
        reaction: newAllergy.reaction.trim(),
        status: newAllergy.status,
      };
      setAllergies((prev) => [...prev, allergy]);
      handleCloseModal();
    }
  };

  const handleDeleteAllergy = (id: string) => {
    setAllergies((prev) => prev.filter((allergy) => allergy.id !== id));
  };

  const renderAllergyCard = useCallback(
    ({ item }: { item: FoodAllergy }) => (
      <View style={styles.allergyCard}>
        <View style={styles.allergyContent}>
          <Text style={styles.allergenName}>{item.allergen}</Text>
          <Text style={styles.reactionText}>{item.reaction}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    item.status === "active"
                      ? colors.success
                      : colors.textLight,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAllergy(item.id)}
        >
          <Image source={images.icons.close} style={styles.deleteIcon} />
        </TouchableOpacity>
      </View>
    ),
    []
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header - Food Allergies Screen */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton
              title=""
              onPress={handleBack}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Food Allergies</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAllergy}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+Add</Text>
          </TouchableOpacity>
        </View>

        {/* Divider with shadow */}
        <View style={styles.divider} />

        {/* Allergies List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.allergiesContainer}>
            {allergies.map((allergy) => (
              <View key={allergy.id} style={styles.allergyCardWrapper}>
                {renderAllergyCard({ item: allergy })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add Allergy Modal */}
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
                <Text style={styles.modalTitle}>Add food allergy</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.modalCloseButton}
                >
                  <Image
                    source={images.icons.close}
                    style={styles.modalCloseIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Modal Divider */}
              <View style={styles.modalDivider} />

              {/* Modal Body */}
              <View style={styles.modalBody}>
                {/* Allergen/Food Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Allergen/Food</Text>
                  <TouchableOpacity
                    style={styles.searchInputContainer}
                    onPress={handleOpenSearchModal}
                  >
                    <Text
                      style={[
                        styles.searchInputText,
                        newAllergy.allergen
                          ? styles.searchInputTextSelected
                          : styles.searchInputTextPlaceholder,
                      ]}
                    >
                      {newAllergy.allergen || "Search for food allergen"}
                    </Text>
                    <Text style={styles.searchIcon}>🔍</Text>
                  </TouchableOpacity>
                </View>

                {/* Reaction Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reaction</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => {
                        setShowReactionDropdown(!showReactionDropdown);
                      }}
                    >
                      <Text style={styles.dropdownText}>
                        {newAllergy.reaction || "Select reaction type"}
                      </Text>
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>

                    {/* Dropdown Options */}
                    {showReactionDropdown && (
                      <>
                        <TouchableOpacity
                          style={styles.dropdownBackdrop}
                          onPress={() => setShowReactionDropdown(false)}
                          activeOpacity={1}
                        />
                        <View style={styles.dropdownOptions}>
                          {reactionOptions.map((option, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewAllergy({
                                  ...newAllergy,
                                  reaction: option,
                                });
                                setShowReactionDropdown(false);
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

                {/* Status Radio Buttons */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() =>
                        setNewAllergy({ ...newAllergy, status: "active" })
                      }
                    >
                      <View style={styles.radioButton}>
                        {newAllergy.status === "active" && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() =>
                        setNewAllergy({ ...newAllergy, status: "inactive" })
                      }
                    >
                      <View style={styles.radioButton}>
                        {newAllergy.status === "inactive" && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>Inactive</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <View style={styles.modalFooter}>
                <PrimaryButton
                  title="Save"
                  onPress={handleSaveAllergy}
                  style={styles.saveButton}
                  disabled={
                    !newAllergy.allergen.trim() || !newAllergy.reaction.trim()
                  }
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* Search Modal */}
        <Modal
          visible={searchModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseSearchModal}
        >
          <View style={styles.searchModalOverlay}>
            <SafeAreaView style={styles.searchModalContent}>
              <View style={styles.searchModalHeader}>
                <Text style={styles.searchModalTitle}>
                  Search of Food Allergies
                </Text>
                <TouchableOpacity
                  onPress={handleCloseSearchModal}
                  style={styles.searchModalCloseButton}
                >
                  <Image
                    source={images.icons.close}
                    style={styles.searchModalCloseIcon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.searchModalBody}>
                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for food allergens..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearchQueryChange}
                    autoFocus
                    selectionColor="transparent"
                    underlineColorAndroid="transparent"
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    blurOnSubmit={false}
                    returnKeyType="search"
                  />
                  <Text style={styles.searchInputIcon}>🔍</Text>
                </View>

                {/* Search Results */}
                <ScrollView
                  style={styles.searchResultsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.map((food, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectFood(food)}
                    >
                      <Text style={styles.searchResultText}>{food}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
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
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
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
  allergiesContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(20),
  },
  allergyCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  allergyCard: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  allergyContent: {
    flex: 1,
  },
  allergenName: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  reactionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(8),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: getResponsiveSpacing(8),
    height: getResponsiveSpacing(8),
    borderRadius: getResponsiveSpacing(4),
    marginRight: getResponsiveSpacing(6),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    fontWeight: "500",
  },
  deleteButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  deleteIcon: {
    ...getResponsiveImageSize(20, 20),
    tintColor: colors.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: colors.text,
  },
  modalCloseButton: {
    padding: getResponsiveSpacing(4),
  },
  modalCloseIcon: {
    ...getResponsiveImageSize(20, 20),
    tintColor: colors.textSecondary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: getResponsiveSpacing(20),
  },
  modalBody: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(20),
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
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
    paddingVertical: getResponsiveSpacing(12),
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
    zIndex: 10000,
  },
  dropdownBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
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
    maxHeight: getResponsiveSpacing(150),
    zIndex: 10001,
    elevation: 20,
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
  radioGroup: {
    flexDirection: "row",
    gap: getResponsiveSpacing(20),
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(10),
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: getResponsiveSpacing(8),
  },
  radioSelected: {
    width: getResponsiveSpacing(10),
    height: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(5),
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
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
  // Search input styles
  searchInputText: {
    fontSize: getResponsiveFontSize(14),
    flex: 1,
  },
  searchInputTextSelected: {
    color: colors.text,
  },
  searchInputTextPlaceholder: {
    color: "#999",
  },
  searchIcon: {
    fontSize: getResponsiveFontSize(16),
    marginLeft: getResponsiveSpacing(8),
  },
  // Search modal styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchModalContent: {
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  searchModalBody: {
    padding: getResponsiveSpacing(20),
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchModalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: colors.text,
  },
  searchModalCloseButton: {
    padding: getResponsiveSpacing(4),
  },
  searchModalCloseIcon: {
    ...getResponsiveImageSize(20, 20),
    tintColor: colors.textSecondary,
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
    borderWidth: 0,
    // outline: 'none',
    backgroundColor: "transparent",
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
  },
});
