// import { router } from 'expo-router';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import PrimaryButton from '../../shared/components/PrimaryButton';
import { colors } from '../../shared/styles/commonStyles';
import { StatusBar } from "expo-status-bar";
import { fonts, fontStyles } from '@/app/shared/styles/fonts';
import { useUser } from "../../shared/context/UserContext";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing
} from '../../shared/utils/responsive';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import Toast from '@/app/shared/components/Toast';

interface DrugAllergy {
  id: string;
  drugId: string;
  allergen: string;
  reactions: string;
  status: 'active' | 'inactive';
}

interface DrugAllergiesScreenProps {
  onClose?: () => void;
}

export default function DrugAllergiesScreen({ onClose }: DrugAllergiesScreenProps) {
  const [allergies, setAllergies] = useState<DrugAllergy[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
    const [reactionOptions, setreactionOptions] = useState<any[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [newAllergy, setNewAllergy] = useState({
    allergen: '',
    reactions: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [showReactionDropdown, setShowReactionDropdown] = useState(false);
  const [drugSearchOptions, setdrugSearchOptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [showToast, setShowToast] = useState(false);
  const { userData } = useUser();
  const patientId = userData?.e_id;

  const fetchallallergies = async () => {
      try {
        
const payload = {
        patientId: patientId
      };
        const response: any = await axiosClient.post(
          ApiRoutes.DrugAllergies.getAll,payload
        );
        console.log('DEBUG: fetch All Drug Allergies response:', response);
        // If response is an array, use it directly
        setAllergies(Array.isArray(response) ? response : response.items|| []);
      } catch (error) {
        console.error("Failed to fetch relation types", error);
      }
    };


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
          setreactionOptions(filteredreactions);
          console.log('DEBUG: New reactionc:', filteredreactions);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          // fallback for old API shape
          const filteredreactions = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setreactionOptions(filteredreactions);
          console.log('DEBUG: New reactionc:', filteredreactions);
        }
      } catch (error) {
        console.error("Failed to fetch reactions", error);
      }
    };
    fetchreactions();
    fetchallallergies();
  }, []);
    React.useEffect(() => {
    
    const fetchDrugallergies = async () => {
      try {
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(11)
        );
        console.log('DEBUG: fetchDrugAllergies response:', response);
        // If response is an array, use it directly
        if (Array.isArray(response)) {
          const filtered = response
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setdrugSearchOptions(filtered);
          console.log('DEBUG: New Drug Allergies:', filtered);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          // fallback for old API shape
          const filtered = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setdrugSearchOptions(filtered);
          console.log('DEBUG: Drug Allergies:', filtered);
        }
      } catch (error) {
        console.error("Failed to fetch Drug Alergies", error);
      }
    };
    fetchDrugallergies();
  }, []);


  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddAllergy = () => {
    setModalVisible(true);
  };

  const handleOpenSearchModal = () => {
    setSearchModalVisible(true);
    setSearchQuery('');
    setSearchResults(drugSearchOptions);
  };

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = drugSearchOptions.filter(drug =>
        drug.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(drugSearchOptions);
    }
  };

  const handleSelectDrug = (drug: string) => {
    setNewAllergy({ ...newAllergy, allergen: drug });
    handleCloseSearchModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowReactionDropdown(false);
    setNewAllergy({
      allergen: '',
      reactions: '',
      status: 'active',
    });
  };

 const handleSaveAllergy = () => {
    if (newAllergy.allergen.trim() && newAllergy.reactions.trim()) {
      const payload = {
        drugId: 0,
        patientId: patientId,
        allergen: newAllergy.allergen.trim(),
        reactions: newAllergy.reactions.trim(),
        status: newAllergy.status,
      };
      console.log("Saving allergy with payload:", payload);
      axiosClient.post(ApiRoutes.DrugAllergies.saveUpdate, payload)
      .then(async response => {
        setToastMessage({
          title: "Drug Allergy Saved Successfully",
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
      });
      //setAllergies((prev) => [...prev, allergy]);
      handleCloseModal();
    }
  };

  

   const handleDeleteAllergy = async (id: string) => {
    try {
      const response:any = await axiosClient.delete(ApiRoutes.DrugAllergies.getdeleteById(id));
      console.log("Delete allergy response:", response);
      // If response is true, show toast and refresh
      if (response === true || (response && response.data === true)) {
        setToastMessage({
          title: "Drug Allergy Deleted Successfully",
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
  };
  

  const renderAllergyCard = useCallback(
    ({ item }: { item: DrugAllergy }) => (
      <View style={styles.allergyCard}>
        <View style={styles.allergyContent}>
          <Text style={styles.drugName}>{item.allergen}</Text>
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
          onPress={() => handleDeleteAllergy(item.drugId)}
        >
           <Text style={styles.deletetext}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    []
  );

  return (<>
    <StatusBar style="dark" backgroundColor="#fff" animated />
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton
            title=""
            onPress={handleBack}
            style={styles.backButton}
            color='#000'
          />
          <Text style={styles.headerTitle}>Drug Allergies</Text>
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
          {allergies.length === 0 ? (
            <Text style={{ fontFamily:fonts.regular,textAlign: 'center', color: '#737274', marginTop: 32, fontSize: 16 }}>
              No Data Available
            </Text>
          ) : (
            allergies.map((allergy, index) => (
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Drug Allergy</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Drug Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Drug Name</Text>
                <TouchableOpacity
                  style={styles.searchInputContainer}
                  onPress={handleOpenSearchModal}
                >
                  <Text style={[styles.searchInputText, newAllergy.allergen ? styles.searchInputTextSelected : styles.searchInputTextPlaceholder]}>
                    {newAllergy.allergen || 'Search for drug name'}
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
                      {newAllergy.reactions || 'Select reaction type'}
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
                              setNewAllergy({ ...newAllergy, reactions: option.name });
                              setShowReactionDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{option.name}</Text>
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
                    onPress={() => setNewAllergy({ ...newAllergy, status: 'active' })}
                  >
                    <View style={styles.radioButton}>
                      {newAllergy.status === 'active' && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setNewAllergy({ ...newAllergy, status: 'inactive' })}
                  >
                    <View style={styles.radioButton}>
                      {newAllergy.status === 'inactive' && <View style={styles.radioSelected} />}
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
                disabled={!newAllergy.allergen.trim() || !newAllergy.reactions.trim()}
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
              <Text style={styles.searchModalTitle}>Search of Drug Allergies</Text>
              <TouchableOpacity
                onPress={handleCloseSearchModal}
                style={styles.searchModalCloseButton}
              >
                <Image source={images.icons.close} style={styles.searchModalCloseIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchModalBody}>
              {/* Search Input */}
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
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
              <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
              {searchResults.map((drug, index) => (
                <TouchableOpacity
                 key={drug.masterDataId || index}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectDrug(drug.name)}
                >
                  <Text style={styles.searchResultText}>{drug.name}</Text>
                </TouchableOpacity>
              ))}
              </ScrollView>
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
 </>);
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
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
    ...fontStyles.headercontent,
        color: "#202427",
  },
  addButton: {
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(6),
    paddingBottom: getResponsiveSpacing(4),
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(6),
  },
  addButtonText: {
      fontSize: getResponsiveFontSize(14),
    fontWeight: "600",
    color: "#fff",
    fontFamily: fonts.semiBold
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
    padding: getResponsiveSpacing(20),
  },
  allergyCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  allergyCard: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    borderWidth: 1,
    borderColor: "#B4B6B9",
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
    marginRight: getResponsiveSpacing(12),
  },
  drugName: {
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
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: getResponsiveSpacing(8),
  },
    deletetext: {
      fontFamily: fonts.regular,
      fontSize: getResponsiveFontSize(12),
      color: colors.error,
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
      fontSize: getResponsiveFontSize(15),
    fontWeight: "600",
    color: colors.text,
    fontFamily: fonts.semiBold
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
    marginBottom: getResponsiveSpacing(10),
  },
    inputGroup1: {
    marginTop: getResponsiveSpacing(20),
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
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(10),
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    backgroundColor: '#fff',
    height: getResponsiveSpacing(48),
  },
  notesInput: {
    height: getResponsiveSpacing(80),
    textAlignVertical: 'top',
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
    paddingTop:3
  },
  dropdownIcon: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10000,
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
    //maxHeight: getResponsiveSpacing(150),
    zIndex: 100001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowOpacity:0.2,
    shadowRadius: 6,
    marginBottom: getResponsiveSpacing(2),
    flexDirection: 'column-reverse',
  },
  dropdownOption: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(13),
    color: colors.text,
    fontWeight: '500',
    fontFamily: fonts.regular,
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
  radioGroup: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(20),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(10),
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#999',
  },
  searchIcon: {
    fontSize: getResponsiveFontSize(16),
    marginLeft: getResponsiveSpacing(8),
  },
  // Search modal styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalContent: {
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  searchModalBody: {
    padding: getResponsiveSpacing(20),
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
});
