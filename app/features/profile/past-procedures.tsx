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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import PrimaryButton from '../../shared/components/PrimaryButton';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";
import { colors } from "../../shared/styles/commonStyles";
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import Toast from "@/app/shared/components/Toast";
import { fonts, fontStyles } from "@/app/shared/styles/fonts";

interface Procedure {
  surgicalHistoryId: number;
  historyName: string;
  surgeryDate: string;
}

interface PastProceduresScreenProps {
  onClose?: () => void;
}

export default function PastProceduresScreen({
  onClose,
}: PastProceduresScreenProps) {
  const { userData } = useUser();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [newProcedure, setNewProcedure] = useState({
    procedureName: "",
    procedureId: 0,
    date: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    subtitle: string;
    type: "success" | "error";
  }>({ title: "", subtitle: "", type: "success" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [masterOptions, setMasterOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddProcedure = () => {
    setModalVisible(true);
  };
    const patientId = Number(userData?.e_id || userData?.eId);
  const fetchSurgicalHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const today = new Date();
      const payload = {
        pageNo: 1,
        pageSize: 100,
        search: "",
        patientId: patientId,
        fromDate: "1900-01-01",
        toDate: today.toISOString().split("T")[0],
        groupName: "",
      };

      console.log('📤 Surgical History Request Payload:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(
        ApiRoutes.SurgicalHistory.getAll,
        payload
      );
      console.log('📥 Surgical History Response:', JSON.stringify(response, null, 2));
      if (response?.items && Array.isArray(response.items)) {
        setProcedures(response.items);
      } else if (response?.isSuccess && Array.isArray(response.data)) {
        setProcedures(response.data);
      } else if (Array.isArray(response)) {
        setProcedures(response);
      }
    } catch (error) {
      console.error("Error fetching surgical history:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    fetchSurgicalHistory();
  }, [fetchSurgicalHistory]);

  const fetchMasterOptions = async (q: string = "") => {
    try {
      setDropdownLoading(true);
      const url = `${ApiRoutes.Master.getmasterdata(
        14
      )}&search=${encodeURIComponent(q || "")}`;
      console.log('📤 Fetch Master Options URL:', url);
      const response: any = await axiosClient.get(url);
      console.log('📥 Fetch Master Options Response:', JSON.stringify(response, null, 2));
      let items: any[] = [];
      if (Array.isArray(response)) items = response;
      else if (Array.isArray(response?.data)) items = response.data;
      else if (response?.isSuccess && Array.isArray(response.data))
        items = response.data;

      const mapped = items.map((it: any) => ({
        id: it.masterDataId ?? it.id ?? 0,
        name: it.name ?? it.displayName ?? String(it),
      }));
      setMasterOptions(mapped);
    } catch (err) {
      console.error("Failed to fetch master data:", err);
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setDropdownSearch(query);
    fetchMasterOptions(query);
  };

  const handleDateInputChange = (text: string) => {
    // Remove non-numeric characters for easier processing
    const cleanText = text.replace(/[^0-9]/g, "");
    let formattedDate = cleanText;

    if (cleanText.length > 4) {
      formattedDate = `${cleanText.substring(0, 4)}-${cleanText.substring(4, 6)}`;
    }
    if (cleanText.length > 6) {
      formattedDate = `${cleanText.substring(0, 4)}-${cleanText.substring(
        4,
        6
      )}-${cleanText.substring(6, 8)}`;
    }

    setNewProcedure({ ...newProcedure, date: formattedDate });
  };

  const handleSelectProcedure = (item: { id: number; name: string }) => {
    setNewProcedure({ ...newProcedure, procedureName: item.name, procedureId: item.id });
    setDropdownVisible(false);
    setDropdownSearch("");
  };

  const handleNativeDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativeDatePicker(false);
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        setNewProcedure({ ...newProcedure, date: dateString });
        setSelectedDate(date);
      }
    } else {
      // iOS
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleDoneDatePicker = () => {
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setNewProcedure({ ...newProcedure, date: dateString });
    setSelectedDate(tempDate);
    setShowNativeDatePicker(false);
  };

  const handleCancelDatePicker = () => {
    setShowNativeDatePicker(false);
  };

  const handleOpenNativeDatePicker = () => {
    let initialDate = new Date();
    if (newProcedure.date) {
      const parts = newProcedure.date.split('-');
      if (parts.length === 3) {
        initialDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    setSelectedDate(initialDate);
    setTempDate(initialDate);
    setShowNativeDatePicker(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDropdownVisible(false);
    setDropdownSearch("");
    setNewProcedure({
      procedureName: '',
      procedureId: 0,
      date: '',
    });
  };

  const handleSaveProcedure = async () => {
    if (!newProcedure.procedureName.trim() || !patientId) return;

    // Duplicate check
    const isDuplicate = procedures.some(
      (p) =>
        (p.historyName || "").toLowerCase().trim() ===
        newProcedure.procedureName.toLowerCase().trim()
    );

    if (isDuplicate) {
      Alert.alert(
        "Record already exists",
        "This procedure is already in your history."
      );
      return;
    }

    setSaveLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedToday = `${yyyy}-${mm}-${dd}`;

      // Normalize date format if user typed it without hyphens (YYYYMMDD -> YYYY-MM-DD)
      let finalSurgeryDate = newProcedure.date || formattedToday;
      if (finalSurgeryDate && finalSurgeryDate.length === 8 && !finalSurgeryDate.includes('-')) {
        finalSurgeryDate = `${finalSurgeryDate.substring(0, 4)}-${finalSurgeryDate.substring(4, 6)}-${finalSurgeryDate.substring(6, 8)}`;
      }

      const payload = {
        surgicalHistoryId: 0,
        patientId: patientId,
        historyName: newProcedure.procedureName.trim(),
        historyId: newProcedure.procedureId, // Added historyId as requested "bind like historyname"
        surgeryDate: finalSurgeryDate, // Ensuring YYYY-MM-DD
        bodySite: "",
        anesthesiaType: "",
        ischemicHh: 0,
        ischemicMm: 0,
        coldHh: 0,
        coldMm: 0,
        notes: "",
        appointmentId: 0,
        createdOn: new Date().toISOString(),
        createdBy: patientId,
        totalCount: 0,
      };

      console.log('📤 Save Surgical History Request Payload:', JSON.stringify(payload, null, 2));
      const response: any = await axiosClient.post(
        ApiRoutes.SurgicalHistory.save,
        payload
      );
      console.log('📥 Save Surgical History Response:', JSON.stringify(response, null, 2));
      setToastMessage({
        title: "Success",
        subtitle: response?.message || "Record saved successfully!",
        type: "success",
      });
      setShowToast(true);
      fetchSurgicalHistory();
      handleCloseModal();
    } catch (error) {
      setToastMessage({
        title: "Error",
        subtitle: "Failed to save record",
        type: "error",
      });
      setShowToast(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProcedure = useCallback((id: number) => {
    console.log(`🗑️ Attempting to delete procedure with ID: ${id}`);
    if (!patientId) {
      console.warn("⚠️ Cannot delete record: patientId is missing");
      return;
    }

    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this record?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            console.log(`🔥 User confirmed deletion of ID: ${id}`);
            try {
              const url = ApiRoutes.SurgicalHistory.delete(id, patientId || 0);
              console.log('📤 Delete Surgical History Request URL:', url);
              const response: any = await axiosClient.delete(url);
              console.log('📥 Delete Surgical History Response:', JSON.stringify(response, null, 2));
              setToastMessage({
                title: "Deleted",
                subtitle: response?.message || "Record removed successfully",
                type: "success",
              });
              setShowToast(true);
              fetchSurgicalHistory();
            } catch (error) {
              console.error("❌ Delete failed:", error);
              setToastMessage({
                title: "Error",
                subtitle: "Failed to delete record",
                type: "error",
              });
              setShowToast(true);
            }
          },
        },
      ]
    );
  }, [patientId, fetchSurgicalHistory]);

  const renderProcedureCard = useCallback(
    ({ item }: { item: Procedure }) => (
      <View style={styles.procedureCard}>
        <View style={styles.procedureContent}>
          <Text style={styles.procedureNameText}>{item.historyName}</Text>
          <Text style={styles.dateText}>
            Date: {item.surgeryDate ? item.surgeryDate.split('T')[0] : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProcedure(item.surgicalHistoryId)}
        >
          {/* <Image source={images.icons.close} style={styles.deleteIcon} /> */}
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleDeleteProcedure]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton
            title="Surgical History"
            color={colors.black}
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.headerTitle}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProcedure}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Procedures List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.proceduresContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : procedures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No surgical history found</Text>
            </View>
          ) : (
            procedures.map((procedure) => (
              <View
                key={procedure.surgicalHistoryId}
                style={styles.procedureCardWrapper}
              >
                {renderProcedureCard({ item: procedure })}
              </View>
            ))
          )}
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
              <Text style={styles.modalTitle}>Add Surgical History</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Procedure Name Dropdown — following MedicalHistoryScreen pattern */}
              <View style={[styles.inputGroup, { zIndex: 2 }]}>
                <Text style={styles.inputLabel}>Surgical History Name</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      const willBeVisible = !dropdownVisible;
                      setDropdownVisible(willBeVisible);
                      if (willBeVisible) fetchMasterOptions("");
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {newProcedure.procedureName || 'e.g., Appendectomy, Knee Surgery'}
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
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="Search procedure..."
                          placeholderTextColor="#999"
                          value={dropdownSearch}
                          onChangeText={handleSearchChange}
                        />
                        <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                          {dropdownLoading ? (
                            <View style={{ padding: getResponsiveSpacing(12), alignItems: 'center' }}>
                              <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                          ) : masterOptions && masterOptions.length > 0 ? (
                            masterOptions.map((item) => (
                              <TouchableOpacity
                                key={String(item.id)}
                                style={styles.dropdownOption}
                                onPress={() => handleSelectProcedure(item)}
                              >
                                <Text style={styles.dropdownOptionText}>{item.name}</Text>
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

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                    value={newProcedure.date}
                    onChangeText={handleDateInputChange}
                    maxLength={10}
                    keyboardType="numeric"
                    selectionColor={colors.primary}
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity
                    style={styles.calendarIconContainer}
                    onPress={handleOpenNativeDatePicker}
                  >
                    <Image source={images.icons.calendar} style={styles.calendarImage} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <PrimaryButton
                title={saveLoading ? "Saving..." : "Save"}
                onPress={handleSaveProcedure}
                style={styles.saveButton}
                disabled={!newProcedure.procedureName.trim() || saveLoading}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {showNativeDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showNativeDatePicker}
            onRequestClose={handleCancelDatePicker}
          >
            <View style={styles.pickerModalOverlay}>
              <TouchableOpacity
                style={styles.pickerModalBackdrop}
                onPress={handleCancelDatePicker}
              />
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={handleCancelDatePicker}>
                    <Text style={styles.pickerHeaderButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDoneDatePicker}>
                    <Text style={[styles.pickerHeaderButtonText, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleNativeDateChange}
                  maximumDate={new Date()}
                  textColor="black"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleNativeDateChange}
            maximumDate={new Date()}
          />
        )
      )}

      <Toast
        visible={showToast}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        type={toastMessage.type}
        onHide={() => setShowToast(false)}
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
  procedureNameText: {
    fontSize: getResponsiveFontSize(16),
    //fontWeight: "bold",
    color: colors.black,
    marginBottom: getResponsiveSpacing(4),
    fontFamily: fonts.regular,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  dateText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
    fontFamily: fonts.regular,
  },
  deleteButton: {
    padding: getResponsiveSpacing(12),
    minWidth: getResponsiveSpacing(60),
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  inputGroup: {
    marginBottom: getResponsiveSpacing(20),
  },
  inputLabel: {
     fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
    fontFamily: fonts.medium,
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
  noResultsContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10000,
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
    fontFamily: fonts.regular,
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
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    maxHeight: getResponsiveSpacing(200),
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
  dropdownSearchInput: {
    padding: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
  },
  loadingContainer: {
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
    justifyContent: 'center',
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
  calendarImage: {
    ...getResponsiveImageSize(20, 20),
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSpacing(15),
    borderTopRightRadius: getResponsiveSpacing(15),
    paddingBottom: getResponsiveSpacing(30),
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerHeaderButtonText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  deleteButtonText: {
    fontFamily: fonts.regular,
    fontSize: getResponsiveFontSize(12),
    color: colors.error,
  },
});
