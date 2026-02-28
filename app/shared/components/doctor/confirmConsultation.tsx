import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useDoctorConsultationStore } from "@/src/store/doctor-consultation";
import { colors } from "../../styles/commonStyles";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import PrimaryButton from "../PrimaryButton";
import { useNavigation } from "expo-router";
import Toast from "../Toast";

const SLOT_GROUPS = {
  morning: ["09:00 AM", "09:30 AM", "10:00 AM"],
  afternoon: ["01:00 PM", "01:30 PM", "02:00 PM"],
  evening: ["06:00 PM", "06:30 PM", "07:00 PM"],
};

export default function ConfirmConsultationScreen() {
  const { departmentName, symptoms, slotTime, setSlot, patientId, setPatient } =
    useDoctorConsultationStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(
    slotTime,
  );
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showConfirm, setShowConfirm] = useState(false);

  const mockFamily = [
    { id: 1, name: "Self" },
    { id: 2, name: "Mother" },
    { id: 3, name: "Father" },
  ];

  const selectedMember =
    mockFamily.find((m) => m.id === patientId) || mockFamily[0];

  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
    setSlot(1, time);
  };

  const handleConfirm = () => {
    // console.log("Confirm Consultation");
    setShowConfirm(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirm Order</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* SERVICE INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.serviceImageContainer}>
              <Ionicons name="videocam" size={24} color="#3B5BDB" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{departmentName}</Text>

              {/* Department Description */}
              <Text style={styles.departmentDescription}>
                Consultation with certified specialist doctors.
              </Text>

              {/* Consultation Type Badge */}
              <View style={styles.consultTypeBadge}>
                <Text style={styles.consultTypeText}>Video Consultation</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SYMPTOMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Symptoms</Text>

          <View style={styles.card}>
            <View style={styles.chipContainer}>
              {symptoms?.map((s: string, i: number) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* DATE PICKER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Appointment Slot</Text>

          <View style={styles.card}>
            {/* DATE SELECTOR */}
            <TouchableOpacity
              style={styles.dateBox}
              activeOpacity={0.7}
              onPress={() => {
                setShowDatePicker(true);
              }}
            >
              <View style={styles.dateLeft}>
                <Ionicons name="calendar-outline" size={18} color="#3B5BDB" />
                <Text style={styles.dateText}>
                  {dayjs(selectedDate).format("DD MMM YYYY")}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} />
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              {Object.entries(SLOT_GROUPS).map(([group, times]) => (
                <View key={group} style={{ marginBottom: 16 }}>
                  <Text style={styles.slotGroupTitle}>
                    {group.toUpperCase()}
                  </Text>

                  <View style={styles.chipContainer}>
                    {times.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.slotChip,
                          selectedSlot === time && styles.selectedSlotChip,
                        ]}
                        onPress={() => handleSlotSelect(time)}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            selectedSlot === time && {
                              color: "#fff",
                            },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* CONSULT FOR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consult For</Text>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setFamilyModalVisible(true)}
          >
            <View style={styles.serviceImageContainer}>
              <Ionicons name="person" size={22} color="#3B5BDB" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{selectedMember.name}</Text>
              <Text style={styles.infoSubtitle}>Family Member</Text>
            </View>

            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowDatePicker(false);

              if (event.type === "set" && date) {
                setSelectedDate(date);
              }
            }}
          />
        )}
      </ScrollView>

      {/* CONFIRM BUTTON */}
      <TouchableOpacity
        style={[styles.confirmButton, { bottom: insets.bottom + 20 }]}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmText}>Confirm Consultation</Text>
      </TouchableOpacity>
      {/* Toast Notification */}

      {/* FAMILY BOTTOM MODAL */}
      <Modal visible={familyModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setFamilyModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContainer, { marginBottom: insets.bottom }]}
          >
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Family Member</Text>
              <TouchableOpacity onPress={() => setFamilyModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>

            {/* FAMILY LIST */}
            {mockFamily.map((member) => {
              const isSelected = member.id === patientId;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={styles.familyCard}
                  onPress={() => {
                    setPatient(member.id);
                    setFamilyModalVisible(false);
                  }}
                >
                  {/* LEFT - IMAGE + DETAILS */}
                  <View style={styles.familyLeft}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color="#666" />
                    </View>

                    <View>
                      <Text style={styles.familyName}>{member.name}</Text>
                      <Text style={styles.familyRelation}>
                        {member.name === "Self" ? "Self" : member.name}
                      </Text>
                    </View>
                  </View>

                  {/* RIGHT - RADIO */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Toast
        visible={showConfirm}
        title={"Booking Confirmed"}
        subtitle={"Your doctor consultation was successfully created."}
        type={"success"}
        onHide={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    // backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  /* SCROLL */
  scrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },

  /* SECTION */
  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  /* CARD BASE */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  label: {
    fontSize: 13,
    color: "#888",
    marginTop: 10,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },

  /* CONSULT FOR */
  consultBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  /* CONFIRM BUTTON */
  confirmButton: {
    position: "absolute",
    // bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  /* MODAL OVERLAY */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  /* FAMILY CARD */
  familyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  familyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  familyName: {
    fontSize: 15,
    fontWeight: "600",
  },

  familyRelation: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },

  /* RADIO */
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#3B5BDB",
    justifyContent: "center",
    alignItems: "center",
  },

  radioSelected: {
    borderColor: "#3B5BDB",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B5BDB",
  },
  /* INFO CARD (with left icon) */
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  serviceImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  infoSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  changeText: {
    fontSize: 14,
    color: "#3B5BDB",
    fontWeight: "500",
  },

  /* SLOT */
  slotGroupTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#6B7280",
  },

  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },

  selectedSlotChip: {
    backgroundColor: "#3B5BDB",
  },

  slotText: {
    fontSize: 13,
    color: "#374151",
  },

  /* SYMPTOM CHIP */
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  chipText: {
    fontSize: 12,
    color: "#3B5BDB",
  },
  departmentDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  consultTypeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#E0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  consultTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B5BDB",
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dateBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  dateText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});
