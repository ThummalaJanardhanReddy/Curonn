// import { router } from 'expo-router';
import React, { useCallback, useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import BackButton from "../../shared/components/BackButton";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { colors } from "../../shared/styles/commonStyles";
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";

interface MenstrualRecord {
  id: string;
  frequency: "regular" | "irregular";
  menorrhagia: "yes" | "no";
  menopauseAge: string;
}

interface MenstrualHistoryScreenProps {
  onClose?: () => void;
}

export default function MenstrualHistoryScreen({
  onClose,
}: MenstrualHistoryScreenProps) {
  const [records, setRecords] = useState<MenstrualRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // fetch user id from context
  const { userData } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    frequency: "regular" as "regular" | "irregular",
    menorrhagia: "no" as "yes" | "no",
    menopauseAge: "",
  });

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddRecord = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewRecord({
      frequency: "regular",
      menorrhagia: "no",
      menopauseAge: "",
    });
  };

  const handleSaveRecord = () => {
    const record: MenstrualRecord = {
      id: Date.now().toString(),
      frequency: newRecord.frequency,
      menorrhagia: newRecord.menorrhagia,
      menopauseAge: newRecord.menopauseAge.trim(),
    };
    setRecords((prev) => [...prev, record]);
    handleCloseModal();
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  // Fetch menstrual history from API when screen opens / user is available
  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        if (!userData || !userData.e_id) return;
        setLoading(true);
        setError(null);
  // axiosClient imported at top
        const payload = {
          pageNo: 0,
          pageSize: 0,
          search: "",
          createdBy: userData.e_id,
          patientId: userData.e_id,
          fromDate: null,
          toDate: null,
          groupName: "",
        };
        const res: any = await axiosClient.post("/Histories/GetAllMenstral", payload);
        const list = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
        if (!mounted) return;
        const mapped: MenstrualRecord[] = (list || []).map((item: any, idx: number) => ({
          id: String(item.historyId ?? item.id ?? idx),
          frequency: (item.frequency || item.cycleFrequency || "regular").toString().toLowerCase().includes("irregular") ? "irregular" : "regular",
          menorrhagia: (item.menorrhagia || item.heavyFlow || item.menorrhagiaFlag) ? (String(item.menorrhagia).toLowerCase() === "yes" || item.menorrhagia === true ? "yes" : "no") : "no",
          menopauseAge: String(item.menopauseAge ?? item.menopauseAgeYears ?? item.age ?? ""),
        }));
        setRecords(mapped);
      } catch (err: any) {
        console.error("Failed to fetch menstrual history:", err);
        if (mounted) setError("Failed to load menstrual history");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [/* run once on mount or when userData changes */ userData?.e_id]);

  const renderRecordCard = useCallback(
    ({ item }: { item: MenstrualRecord }) => (
      <View style={styles.recordCard}>
        <View style={styles.recordContent}>
          <Text style={styles.recordTitle}>Menstrual History</Text>
          <Text style={styles.recordDetails}>
            Frequency:{" "}
            {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
          </Text>
          <Text style={styles.recordDetails}>
            Menorrhagia:{" "}
            {item.menorrhagia.charAt(0).toUpperCase() +
              item.menorrhagia.slice(1)}
          </Text>
          {item.menopauseAge && (
            <Text style={styles.recordDetails}>
              Menopause Age: {item.menopauseAge} years
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRecord(item.id)}
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
          <BackButton title="" onPress={handleBack} style={styles.backButton} />
          <Text style={styles.headerTitle}>Menstrual History</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddRecord}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+Add</Text>
        </TouchableOpacity>
      </View>

      {/* Divider with shadow */}
      <View style={styles.divider} />

      {/* Records List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recordsContainer}>
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          ) : error ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.error }}>{error}</Text>
            </View>
          ) : null}
          {records.map((record) => (
            <View key={record.id} style={styles.recordCardWrapper}>
              {renderRecordCard({ item: record })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Record Modal */}
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
              <Text style={styles.modalTitle}>Add Menstrual Record</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Frequency Radio Buttons */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setNewRecord({ ...newRecord, frequency: "regular" })
                    }
                  >
                    <View style={styles.radioButton}>
                      {newRecord.frequency === "regular" && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Regular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setNewRecord({ ...newRecord, frequency: "irregular" })
                    }
                  >
                    <View style={styles.radioButton}>
                      {newRecord.frequency === "irregular" && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Irregular</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menorrhagia Radio Buttons */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Menorrhagia</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setNewRecord({ ...newRecord, menorrhagia: "yes" })
                    }
                  >
                    <View style={styles.radioButton}>
                      {newRecord.menorrhagia === "yes" && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setNewRecord({ ...newRecord, menorrhagia: "no" })
                    }
                  >
                    <View style={styles.radioButton}>
                      {newRecord.menorrhagia === "no" && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menopause Age Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Menopause at Age (Optional)
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter age"
                  placeholderTextColor="#999"
                  value={newRecord.menopauseAge}
                  onChangeText={(text) =>
                    setNewRecord({ ...newRecord, menopauseAge: text })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <PrimaryButton
                title="Save"
                onPress={handleSaveRecord}
                style={styles.saveButton}
                disabled={false}
              />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(50),
    paddingBottom: getResponsiveSpacing(15),
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
  recordsContainer: {
    padding: getResponsiveSpacing(20),
  },
  recordCardWrapper: {
    marginBottom: getResponsiveSpacing(12),
  },
  recordCard: {
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
  recordContent: {
    flex: 1,
    marginRight: getResponsiveSpacing(12),
  },
  dateRange: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: colors.text,
    marginBottom: getResponsiveSpacing(4),
  },
  cycleLength: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
  },
  flowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveSpacing(8),
  },
  flowIndicator: {
    width: getResponsiveSpacing(10),
    height: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(5),
    marginRight: getResponsiveSpacing(6),
  },
  flowText: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    fontWeight: "500",
  },
  symptoms: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
  },
  notes: {
    fontSize: getResponsiveFontSize(12),
    color: colors.textSecondary,
    fontStyle: "italic",
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
    overflow: "hidden",
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
    paddingVertical: getResponsiveSpacing(10),
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    backgroundColor: "#fff",
  },
  notesInput: {
    height: getResponsiveSpacing(80),
    textAlignVertical: "top",
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
  modalFooter: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(30),
  },
  saveButton: {
    borderRadius: getResponsiveSpacing(6),
    height: getResponsiveSpacing(45),
    width: "100%",
  },
  recordTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: colors.text,
    marginBottom: getResponsiveSpacing(8),
  },
  recordDetails: {
    fontSize: getResponsiveFontSize(14),
    color: colors.textSecondary,
    marginBottom: getResponsiveSpacing(4),
  },
  radioGroup: {
    flexDirection: "row",
    marginTop: getResponsiveSpacing(8),
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: getResponsiveSpacing(24),
  },
  radioButton: {
    width: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    borderRadius: getResponsiveSpacing(10),
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: getResponsiveSpacing(8),
    alignItems: "center",
    justifyContent: "center",
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
});
