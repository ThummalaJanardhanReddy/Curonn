import React, { useRef, useState, useCallback, useEffect } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { images } from "../../../assets";
import BackButton from "../../shared/components/BackButton";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { colors } from "../../shared/styles/commonStyles";
import { fonts, fontStyles } from '@/app/shared/styles/fonts';
import { useUser } from "../../shared/context/UserContext";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import Toast from '@/app/shared/components/Toast';
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from "@/src/store/UserStore";
interface FoodAllergy {
  id: string;
  foodId: string;
  allergen: string;
  reactions: string;
  status: "active" | "inactive";
}

interface FoodAllergiesModalProps {
  visible: boolean;
  onClose: () => void;
  onDataStatusChange?: (hasData: boolean) => void;
}

export default function FoodAllergiesModal({
  visible,
  onClose,
  onDataStatusChange
}: FoodAllergiesModalProps) {
  const [allergies, setAllergies] = useState<FoodAllergy[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [newAllergy, setNewAllergy] = useState({
    allergen: "",
    reactions: "",
    status: "active" as "active" | "inactive",
  });
  const [showReactionDropdown, setShowReactionDropdown] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [masterOptions, setMasterOptions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [reactionOptions, setreactionOptionss] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [showToast, setShowToast] = useState(false);
  const [foodDropdownModal, setFoodDropdownModal] = useState(false);
  const { userData } = useUser();
  

const { restoreUserData, user } = useUserStore();
  useEffect(() => {
    restoreUserData();
  }, []);
const patientId = Number(userData?.e_id || user?.eId);
  const filteredMasterOptions = React.useMemo(() => {
    if (!dropdownSearch) return masterOptions;
    return masterOptions.filter(item =>
      item.name.toLowerCase().includes(dropdownSearch.toLowerCase())
    );
  }, [masterOptions, dropdownSearch]);

  const fetchallallergies = async () => {
    try {

      const payload = {
        patientId: patientId
      };
      const response: any = await axiosClient.post(
        ApiRoutes.FoodAllergies.getAll, payload
      );
      console.log('DEBUG: fetch All Allergies response:', response);
      // If response is an array, use it directly
      const list = Array.isArray(response) ? response : response.items || [];
      setAllergies(list);
      if (onDataStatusChange) {
        onDataStatusChange(list.length > 0);
      }
    } catch (error) {
      console.error("Failed to fetch relation types", error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchMasterOptions('');
    }
  }, [modalVisible]);

  const fetchMasterOptions = useCallback(async (q: string = '') => {
    try {
      setDropdownLoading(true);
      const url = `${ApiRoutes.Master.getmasterdata(8)}&search=${encodeURIComponent(q || '')}`;
      console.log('[FoodAllergies] fetching master options URL:', url);
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

  useEffect(() => {
    fetchallallergies();
  }, []);

  const suggestions = React.useMemo(() => {
    const fromMaster = masterOptions.map((m) => ({ id: m.id, name: m.name }));
    const fromHistory = (allergies || []).map((a) => ({ id: `h-${a.foodId}`, name: a.allergen }));
    const map = new Map<string, { id: any; name: string }>();
    [...fromMaster, ...fromHistory].forEach((it) => {
      const key = (it.name || '').toString().toLowerCase().trim();
      if (!map.has(key)) map.set(key, it);
    });
    const arr = Array.from(map.values());
    const q = (searchQuery || '').toLowerCase();
    if (!q) return arr;
    return arr.filter((it) => it.name.toLowerCase().includes(q));
  }, [masterOptions, allergies, searchQuery]);

  React.useEffect(() => {
    const fetchreactions = async () => {
      try {
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(9)
        );
        console.log('DEBUG: fetchreactionss response:', response);
        // If response is an array, use it directly
        if (Array.isArray(response)) {
          const filteredreactions = response
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setreactionOptionss(filteredreactions);
          console.log('DEBUG: New reactionc:', filteredreactions);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          // fallback for old API shape
          const filteredreactions = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setreactionOptionss(filteredreactions);
          console.log('DEBUG: New reactionc:', filteredreactions);
        }
      } catch (error) {
        console.error("Failed to fetch relation types", error);
      }
    };
    fetchreactions();
  }, []);


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
    setDropdownVisible(false);
    fetchMasterOptions('');
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectFood = (food: any) => {
    setNewAllergy({ ...newAllergy, allergen: food.name });
    handleCloseSearchModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDropdownVisible(false);
    setDropdownSearch('');
    setShowReactionDropdown(false);
    setNewAllergy({
      allergen: "",
      reactions: "",
      status: "active",
    });
  };

  const handleSaveAllergy = () => {
    if (newAllergy.allergen.trim() && newAllergy.reactions.trim()) {
      // Duplicate check
      const isDuplicate = allergies.some(
        (a) => (a.allergen || '').toLowerCase().trim() === newAllergy.allergen.toLowerCase().trim()
      );

      if (isDuplicate) {
        Alert.alert('Record already exists', 'This food/allergen is already recorded in your allergies.');
        return;
      }

      setSaveLoading(true);
      const payload = {
        foodId: 0,
        patientId: patientId,
        allergen: newAllergy.allergen.trim(),
        reactions: newAllergy.reactions.trim(),
        status: newAllergy.status,
      };
      console.log("Saving allergy with payload:", payload);
      axiosClient.post(ApiRoutes.FoodAllergies.saveUpdate, payload)
        .then(async response => {
          setToastMessage({
            title: "Allergy Saved Successfully",
            subtitle: response?.data?.message || "Saved successfully!",
            type: "success"
          });

          setShowToast(true);
          fetchallallergies();
        })
        .catch(error => {
          let errorMsg = 'Something went wrong';
          if (error && typeof error === 'object') {
            if ('response' in error && error.response && error.response.data && error.response.data.message) {
              errorMsg = error.response.data.message;
            } else if ('message' in error) {
              errorMsg = error.message;
            }
          }
          setToastMessage({
            title: "Save Failed",
            subtitle: errorMsg,
            type: "error"
          });
          setShowToast(true);
        })
        .finally(() => {
          setSaveLoading(false);
        });
      handleCloseModal();
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this record?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const response: any = await axiosClient.delete(ApiRoutes.FoodAllergies.getdeleteById(id));
              console.log("Delete allergy response:", response);
              // If response is true, show toast and refresh
              if (response === true || (response && response.data === true)) {
                setToastMessage({
                  title: "Allergy Deleted Successfully",
                  subtitle: "Deleted successfully!",
                  type: "success"
                });
                setShowToast(true);
                fetchallallergies();
              }
            } catch (error) {
              setToastMessage({
                title: "Delete Failed",
                subtitle: "Something went wrong",
                type: "error"
              });
              setShowToast(true);
              console.error("Delete allergy error:", error);
            }
          }
        }
      ]
    );
  };

  const renderAllergyCard = useCallback(
    ({ item }: { item: FoodAllergy }) => (
      <View style={styles.allergyCard}>
        <View style={styles.allergyContent}>
          <Text style={styles.allergenName}>{item.allergen}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.reactionText}>{item.reactions}</Text>
            <Text style={styles.divider}>|</Text>

            <Text style={[styles.statusText, { color: item.status === "active" ? colors.success : colors.textLight }]}>
              {item.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAllergy(item.foodId)}
        >
          <Text style={styles.deletetext}>Delete</Text>
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
      <>

        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={styles.container}>
            {/* Header - Food Allergies Screen */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <BackButton title="" onPress={handleBack} style={styles.backButton} color={colors.black} />

                <Text style={styles.headerTitle}>Food Allergies</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAllergy}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>+ADD</Text>
              </TouchableOpacity>
            </View>

            {/* Divider with shadow */}
            {/* <View style={styles.divider} /> */}

            {/* Allergies List */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.allergiesContainer}>
                {allergies.length === 0 ? (
                  <Text style={{ fontFamily: fonts.regular, textAlign: 'center', color: '#737274', marginTop: 32, fontSize: 16 }}>
                    No Data Available
                  </Text>
                ) :

                  (allergies.map((allergy, index) => (
                    <View key={allergy.id || index} style={styles.allergyCardWrapper}>
                      {renderAllergyCard({ item: allergy })}
                    </View>
                  ))
                  )}
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
                    <Text style={styles.modalTitle}>Add Food Allergy</Text>
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
                    {/* Allergen/Food Dropdown */}
                    <View style={[styles.inputGroup]}>
                      <Text style={styles.inputLabel}>Allergen/Food</Text>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => {
                            setFoodDropdownModal(true);
                            fetchMasterOptions('');
                          }}
                        >
                          <Text style={styles.dropdownText}>
                            {newAllergy.allergen || "Select food allergen"}
                          </Text>
                          <Text style={styles.dropdownIcon}>▼</Text>
                        </TouchableOpacity>

                        {/* Dropdown Options */}
                        <Modal
                          visible={foodDropdownModal}
                          transparent
                          animationType="fade"
                          onRequestClose={() => setFoodDropdownModal(false)}
                        >
                          <TouchableOpacity
                            style={styles.dropdownModalOverlay}
                            activeOpacity={1}
                            onPress={() => setFoodDropdownModal(false)}
                          >
                            <View style={styles.dropdownModalContainer}>

                              <TextInput
                                style={styles.dropdownSearchInput}
                                placeholder="Search food allergen..."
                                placeholderTextColor="#999"
                                value={dropdownSearch}
                                onChangeText={setDropdownSearch}
                              />

                              <ScrollView
                                style={{ maxHeight: 400 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator
                              >
                                {dropdownLoading ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={colors.primary}
                                    style={{ marginTop: 20 }}
                                  />
                                ) : filteredMasterOptions.length > 0 ? (
                                  filteredMasterOptions.map((item) => (
                                    <TouchableOpacity
                                      key={String(item.id)}
                                      style={styles.dropdownOption}
                                      onPress={() => {
                                        setNewAllergy({
                                          ...newAllergy,
                                          allergen: item.name,
                                        });

                                        setFoodDropdownModal(false);
                                        setDropdownSearch("");
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
                          </TouchableOpacity>
                        </Modal>
                      </View>
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
                            {newAllergy.reactions || "Select reaction type"}
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
                                  key={option.masterDataId || index}
                                  style={styles.dropdownOption}
                                  onPress={() => {
                                    setNewAllergy({
                                      ...newAllergy,
                                      reactions: option.name,
                                    });
                                    setShowReactionDropdown(false);
                                  }}
                                >
                                  <Text style={styles.dropdownOptionText}>
                                    {option.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Status Radio Buttons */}
                    <View style={styles.inputGroup1}>
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
                      title={saveLoading ? "Saving..." : "Save"}
                      onPress={handleSaveAllergy}
                      style={styles.saveButton}
                      disabled={
                        !newAllergy.allergen.trim() || !newAllergy.reactions.trim() || saveLoading
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
                        placeholder="Search"
                        placeholderTextColor="#000"
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
                      {suggestions.map((item, index) => (
                        <TouchableOpacity
                          key={String(item.id) + '-' + index}
                          style={styles.searchResultItem}
                          onPress={() => handleSelectFood(item)}
                        >
                          <Text style={styles.searchResultText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {suggestions.length === 0 && (
                        <View style={styles.noResultsContainer}>
                          <Text style={styles.noResultsText}>No results found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </SafeAreaView>
              </View>
            </Modal>
          </View>
        </SafeAreaView>
      </>
      <Toast
        visible={showToast}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        type={toastMessage.type}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </Modal>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(15),
    // paddingBottom: getResponsiveSpacing(15),
    borderBottomWidth: 1,
        borderColor: '#DADADA',
    backgroundColor: "#fff",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    color: '#000',
  },
  headerTitle: {
    ...fontStyles.headercontent,
    color: colors.black,
  },
  addButton: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(6),
    paddingBottom: getResponsiveSpacing(4),
    // backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(6),
  },
  addButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },

  dropdownModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    maxHeight: "70%",
  },
  divider: {
    color: "#000",
    marginHorizontal: getResponsiveSpacing(5),
  },
  content: {
    flex: 1,
    backgroundColor: colors.bg_primary,
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
   borderWidth: 1,
        borderColor: '#DADADA',
    flexDirection: "row",
    alignItems: "flex-start",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  allergyContent: {
    flex: 1,
  },
  allergenName: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
    fontFamily: fonts.bold
  },
  reactionText: {
    fontSize: getResponsiveFontSize(13),
    color: '#000000',
    marginTop: getResponsiveSpacing(2),
    fontFamily: fonts.regular
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
    fontFamily: fonts.regular,
    marginTop: getResponsiveSpacing(2),
  },
  deleteButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  deletetext: {
    fontFamily: fonts.regular,
    fontSize: getResponsiveFontSize(12),
    color: colors.error,
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
    fontFamily: fonts.semiBold
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(15),
    fontWeight: "600",
    color: colors.text,
    fontFamily: fonts.semiBold
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
    marginBottom: getResponsiveSpacing(10),
  },

  inputGroup1: {
    marginTop: getResponsiveSpacing(10),
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
    color: colors.text,
    marginBottom: getResponsiveSpacing(3),
    fontFamily: fonts.medium
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#A7A7A7",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    backgroundColor: "#fff",
    height: getResponsiveSpacing(48),
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#A7A7A7",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    backgroundColor: "#fff",
    height: getResponsiveSpacing(40),
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontFamily: fonts.regular,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "transparent",
  },
  dropdownOptions: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    maxHeight: 450,
    zIndex: 10001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: getResponsiveSpacing(4),
  },
  dropdownOption: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontWeight: "500",
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
    paddingTop: 3,
  },
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),

  },
  saveButton: {
    borderRadius: getResponsiveSpacing(30),
    height: getResponsiveSpacing(40),
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
  },
  // Search input styles
  searchInputText: {
    fontSize: getResponsiveFontSize(13),
    flex: 1,
    fontFamily: fonts.regular,
    paddingTop: 3,
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
    color: colors.text,
    ...fontStyles.headercontent,
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
    borderColor: "#A7A7A7",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(0),
    backgroundColor: "#fff",
    marginBottom: getResponsiveSpacing(15),
    height: getResponsiveSpacing(40),
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(13),
    color: colors.text,
    fontFamily: fonts.regular,
    // outline: 'none',
    backgroundColor: "transparent",
    paddingBottom: 5,
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
    fontFamily: fonts.regular,
  },
  dropdownSearchInput: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontSize: getResponsiveFontSize(14),
    fontFamily: fonts.regular,
    color: colors.text,
  },
  noResultsContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },
});
