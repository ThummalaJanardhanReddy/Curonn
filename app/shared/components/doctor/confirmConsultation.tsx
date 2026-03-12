import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Image,
  TextInput,
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
import { router, useNavigation } from "expo-router";
import Toast from "../Toast";
import { useUserStore } from "@/src/store/UserStore";
import { useUser } from "../../context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes, { EmployeeApi, MasterApi } from "@/src/api/employee/employee";
import {
  ICreateAppointmentRequest,
  IMaster,
  IRelation,
} from "@/src/constants/constants";
import { fonts } from "@/app/shared/styles/fonts";
import { images } from "@/assets";
import { getResponsiveSpacing } from "../../utils/responsive";
import { navigate } from "expo-router/build/global-state/routing";
import { useVideoStore } from "@/src/store/VideoStore";

const SLOT_GROUPS = {
  morning: ["08:00 AM", "09:30 AM"],
  afternoon: ["12:00 PM", "05:00 PM"],
  evening: ["05:00 PM", "08:00 PM"],
};
const labTimeSlots = [
  "08:00 AM - 12:00 PM",
  "12:00 PM - 05:00 PM",
  "05:00 PM - 08:00 PM",
];
const familyRelationTypeId = 5;

export interface IFamilyMember {
  empRelationId: number;
  relationId: number;

  relationTypeName: string; // From Master table (Brother, Mother...)
  name: string; // Actual name (Test bro)

  age: number;
  gender: string;
  imagePath: string;
  patientId: number;
  createdOn: string;
}

const AppointmentStatusCodes = {
  pending: 2709,
  requested: 2867,
};

export default function ConfirmConsultationScreen() {
  const {
    departmentName,
    symptoms,
    slotTime,
    setSlot,
    patientId,
    setPatient,
    departmentId,
    departmentImage,
    slotId,
    consultationType,
    consultationTypeId,
  } = useDoctorConsultationStore();
  const { user } = useUserStore();
  const [errors, setErrors] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    relation: "",
    fullName: "",
    age: "",
    gender: "",
  });
  const [patientType, setPatientType] = useState("self");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);
  const [labRelationTypes, setLabRelationTypes] = useState<
    { masterDataId: number; name: string }[]
  >([]);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(
    slotTime,
  );
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<IFamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  const self: IFamilyMember = {
    name: user?.fullName || "",
    age: Number(user?.age) || 0,
    gender: user?.gender || "",
    createdOn: "",
    empRelationId: 0,
    imagePath: "",
    patientId: user?.eId || 0,
    relationId: 0,
    relationTypeName: "Self",
  };

  const genderOptions = ["Male", "Female", "Other"];
  const selectedMember =
    familyMembers.find((m) => m.empRelationId === patientId) ||
    familyMembers[0];

  useEffect(() => {
    const initialize = async () => {
      setFamilyMembers([self]);
      await fetchPatientRelations();
    };

    initialize();
  }, []);

  useEffect(() => {
    const fetchRelationTypes = async () => {
      try {
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(5),
        );
        if (Array.isArray(response)) {
          const filtered = response
            .filter((item: any) => item.isActive)
            .map((item: any) => ({
              masterDataId: item.masterDataId,
              name: item.name,
            }));
          setLabRelationTypes(filtered);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          const filtered = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({
              masterDataId: item.masterDataId,
              name: item.name,
            }));
          setLabRelationTypes(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch relation types", error);
      }
    };
    fetchRelationTypes();
  }, []);

  const fetchPatientRelations = async () => {
    if (!user) return;
    try {
      //   const masterRelationData = await axiosClient.get<IMaster[]>(
      //     MasterApi.getmasterdata(familyRelationTypeId),
      //   );
      //   const res = await axiosClient.get<IRelation[]>(
      //     EmployeeApi.GetPatientRelations(user?.eId),
      //   );

      const [masterRes, relationRes] = await Promise.all([
        axiosClient.get<any>(MasterApi.getmasterdata(familyRelationTypeId)),
        axiosClient.get<any>(EmployeeApi.GetPatientRelations(user.eId)),
      ]);

      const masterList = masterRes;
      const relationList = relationRes;
      // Create lookup map (O(1) access)
      const masterMap = new Map<number, IMaster>();
      masterList?.forEach((m) => {
        masterMap.set(m.masterDataId, m);
      });

      const familyMembers = relationList?.map((rel) => {
        const master = masterMap.get(rel.relationId);

        return {
          empRelationId: rel.empRelationId,
          patientId: rel.patientId,

          relationId: rel.relationId,
          relationTypeName: master?.name ?? "Unknown",

          name: rel.relationName,
          age: rel.age,
          gender: rel.gender,

          imagePath: master?.imagePath ?? null,
          createdOn: rel.createdOn,
        };
      });

      console.log("Family Members:", familyMembers);
      setFamilyMembers([self, ...familyMembers]);
      //   if (res) {
      //     console.log("relations : ", res);
      //   }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
    setSlot(1, time);
  };
  const validateFields = () => {
    let hasError = false;
    if (patientType === "others") {
      let newFieldErrors = { relation: "", fullName: "", age: "", gender: "" };

      if (!selectedRelation) {
        newFieldErrors.relation = "Please select relation type";
        hasError = true;
      }
      if (!fullName.trim()) {
        newFieldErrors.fullName = "Please enter full name";
        hasError = true;
      }
      if (!age.trim()) {
        newFieldErrors.age = "Please enter age";
        hasError = true;
      }
      if (!gender.trim()) {
        newFieldErrors.gender = "Please select gender";
        hasError = true;
      }
      setFieldErrors(newFieldErrors);
      setErrors("");
    }
    return hasError;
  };
  const handleConfirm = async () => {
    if (!user) return;
    if (validateFields()) return;
    try {
      let payload: ICreateAppointmentRequest = {
        patientId: user.eId,
        specialityId: departmentId || 0,
        isAppointmentAssigned: true,

        patientName: user.fullName,
        patientMobile: user.mobileNo,
        patientGender: user.gender,
        patientAge: user.age,

        scheduleDate: selectedDate ? formatDateLab(selectedDate) : "",
        scheduleBetween: selectedSlot || "",

        scheduleTypeId: consultationTypeId || 1340,
        scheduledBy: user.eId,
        statusId: AppointmentStatusCodes.pending,
        createdBy: user.eId,
        symptoms: symptoms?.join(",") || "",
        ...(patientType === "others" && {
          relationName: fullName?.trim() || "",
          relationAge: age ? Number(age) : 0,
          relationGender: gender?.trim() || "",
        }),
      };

      const res = await axiosClient.post<ICreateAppointmentRequest>(
        ApiRoutes.Appointments.save,
        payload,
      );
      useVideoStore.getState().setAppointment(res);

      console.log("Video consultation appointment confirm: ", res);
    } catch (error) {
      console.log("error: ", error);
    }
    setShowConfirm(true);
    setTimeout(() => {
      router.push("/(main)/orders");
    }, 1000);
  };

  const formatDateLab = (date: Date) => {
    return dayjs(date).format("YYYY-MM-DD");
  };

  const handleServiceEdit = () => {
    // navigate("/(main)/my-doctor");
    router.replace("/(main)/my-doctor");
  };
  const fetchRelationDetails = async (relationId: number) => {
    try {
      setLoading(true);
      const patientId = user?.eId;
      if (!patientId) return;
      const response: any = await axiosClient.get(
        ApiRoutes.Employee.getRelation(relationId, patientId),
      );

      // Handle both wrapped response { isSuccess: true, data: {...} } and raw response {...}
      const detail =
        response && response.isSuccess && response.data
          ? response.data
          : response;

      if (detail && (detail.relationName || detail.fullName)) {
        setFullName(detail.relationName || detail.fullName || "");
        setAge(detail.age ? detail.age.toString() : "");
        // Capitalize gender if it's 'male'/'female'
        const g = detail.gender || "";
        setGender(g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());
      } else {
        // Clear fields if no detail found for this relation type
        setFullName("");
        setAge("");
        setGender("");
      }
    } catch (error) {
      // console.error('Fetch relation details error:', error);
      setFullName("");
      setAge("");
      setGender("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
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
              <Image
                defaultSource={{
                  uri: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop`,
                }}
                source={{
                  uri: departmentImage,
                }}
                style={styles.specialistImage}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{departmentName}</Text>

              {/* Department Description */}
              <Text style={styles.departmentDescription}>
                Consultation with certified specialist doctors.
              </Text>

              {/* Consultation Type Badge */}
              <View style={styles.consultTypeBadge}>
                <Text style={styles.consultTypeText}>
                  {consultationType} Consultation
                </Text>
              </View>
            </View>
            <View
              style={{
                alignItems: "flex-start",
                justifyContent: "flex-start",
                alignSelf: "flex-start",
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 2,
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: "#C15E9C",
                  alignContent: "flex-start",
                  justifyContent: "flex-start",
                }}
                onPress={handleServiceEdit}
              >
                <Text style={{ fontSize: 14, color: colors.primary }}>
                  Edit
                </Text>
              </TouchableOpacity>
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

        {/* Sample Pickup Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Pickup Date & Time</Text>
          <View style={styles.dateTimeCard}>
            <View style={styles.dateSection}>
              <Text style={styles.fieldLabel}>Service Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    !selectedDate && styles.placeholderText,
                  ]}
                >
                  {selectedDate ? formatDateLab(selectedDate) : "dd/mm/yyyy"}
                </Text>
                <Image
                  source={images.icons.calendar}
                  style={styles.calendarIcon}
                />
              </TouchableOpacity>
              {errors === "Please select service start date" && (
                <Text
                  style={{
                    color: "#ff0000",
                    fontSize: 13,
                    marginTop: 4,
                    fontFamily: fonts.regular,
                  }}
                >
                  {errors}
                </Text>
              )}
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.fieldLabel}>Select Time Slot</Text>
              <View style={styles.timeSlotsContainer}>
                {labTimeSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      selectedSlot === slot && styles.selectedTimeSlot,
                    ]}
                    onPress={() => {
                      setSelectedSlot(slot);
                      if (errors === "Please select time slot") setErrors("");
                    }}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        selectedSlot === slot && styles.selectedTimeSlotText,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* </View> */}
              </View>
              {errors === "Please select time slot" && (
                <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>
                  {errors}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Patient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.patientCard}>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  patientType === "self" && styles.selectedRadioOption,
                ]}
                onPress={() => setPatientType("self")}
              >
                <View
                  style={[
                    styles.customRadio,
                    patientType === "self" && styles.customRadioSelected,
                  ]}
                >
                  {patientType === "self" && (
                    <View style={styles.customRadioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    patientType === "self" && styles.selectedRadioLabel,
                  ]}
                >
                  Self Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  patientType === "others" && styles.selectedRadioOption,
                ]}
                onPress={() => setPatientType("others")}
              >
                <View
                  style={[
                    styles.customRadio,
                    patientType === "others" && styles.customRadioSelected,
                  ]}
                >
                  {patientType === "others" && (
                    <View style={styles.customRadioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    patientType === "others" && styles.selectedRadioLabel,
                  ]}
                >
                  For Others
                </Text>
              </TouchableOpacity>
            </View>

            {patientType === "others" && (
              <View style={styles.othersForm}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Relation Type</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowRelationDropdown(true)}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedRelation
                        ? selectedRelation.name
                        : "Select Relation"}
                    </Text>
                    <Image
                      source={images.icons.edit as any}
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>
                  {fieldErrors.relation ? (
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                    >
                      {fieldErrors.relation}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                      }
                    }}
                    placeholder="Enter"
                    placeholderTextColor="#999"
                  />
                  {fieldErrors.fullName ? (
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                    >
                      {fieldErrors.fullName}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={(text) => {
                      setAge(text);
                      if (fieldErrors.age) {
                        setFieldErrors((prev) => ({ ...prev, age: "" }));
                      }
                    }}
                    placeholder="Enter"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  {fieldErrors.age ? (
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                    >
                      {fieldErrors.age}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowGenderDropdown(true)}
                  >
                    <Text style={styles.dropdownText}>
                      {gender || "Select"}
                    </Text>
                    <Image
                      source={images.icons.edit as any}
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>
                  {fieldErrors.gender ? (
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                    >
                      {fieldErrors.gender}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
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
                console.log("date selected: ", date.toString());
                setSelectedDate(date);
              }
            }}
          />
        )}
      </ScrollView>

      {/* CONFIRM BUTTON */}
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Confirm"
          onPress={handleConfirm}
          style={styles.proceedButton}
        />
      </View>

      {/* Toast Notification */}

      {/* Relation Type Dropdown Modal */}
      <View style={{ flex: 1 }}>
        <Modal
          visible={showRelationDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRelationDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowRelationDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              {labRelationTypes.map((relation, index) => (
                <TouchableOpacity
                  key={relation.masterDataId}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedRelation(relation);
                    if (fieldErrors && typeof setFieldErrors === "function") {
                      setFieldErrors((prev) => ({ ...prev, relation: "" }));
                    }
                    fetchRelationDetails(relation.masterDataId);
                    setShowRelationDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{relation.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Gender Dropdown Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            {genderOptions.map((genderOption, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  setGender(genderOption);
                  if (fieldErrors && typeof setFieldErrors === "function") {
                    setFieldErrors((prev) => ({ ...prev, gender: "" }));
                  }
                  setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{genderOption}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
            {familyMembers.length > 0 &&
              familyMembers?.map((member) => {
                const isSelected = member.empRelationId === patientId;

                return (
                  <TouchableOpacity
                    key={member.empRelationId}
                    style={styles.familyCard}
                    onPress={() => {
                      setPatient(member.empRelationId);
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
                          {member.gender}, {member.age}yrs,{" "}
                          {member.relationTypeName === "Self"
                            ? "Self"
                            : member.relationTypeName}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // colors.bg_primary,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
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
    backgroundColor: colors.bg_primary
  },

  /* SECTION */
  section: {
    marginBottom: 12,
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
    borderColor: "#d1d1d2",
    borderWidth: 1,
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
    // elevation: 3,
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
    justifyContent: "center",
    alignItems: "center",
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
    borderColor: "#d1d1d2",
    borderWidth: 1,
    // elevation: 3,
    // shadowColor: "#000",
    // shadowOpacity: 0.06,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 4 },
  },
  serviceImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    marginRight: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  // infoSubtitle: {
  //   fontSize: 13,
  //   color: "#6B7280",
  //   marginTop: 4,
  // },

  // changeText: {
  //   fontSize: 14,
  //   color: "#3B5BDB",
  //   fontWeight: "500",
  // },

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
    backgroundColor: colors.primary,
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
  // dateLeft: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 8,
  // },

  // dateBox: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   paddingVertical: 14,
  //   paddingHorizontal: 12,
  //   borderRadius: 12,
  //   backgroundColor: "#F9FAFB",
  //   borderWidth: 1,
  //   borderColor: "#E5E7EB",
  // },

  // dateText: {
  //   fontSize: 14,
  //   fontWeight: "500",
  //   marginLeft: 8,
  // },

  dateTimeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    // borderWidth: 1,
    // borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
    borderColor: "#d1d1d2",
    borderWidth: 1,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  dateSection: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#333",
    marginBottom: 1,
    fontFamily: fonts.medium,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 13,
    color: "#333",
    fontFamily: fonts.regular,
  },
  placeholderText: {
    color: "#999",
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },
  timeSection: {
    marginTop: 6,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  // timeSlot: {
  //   paddingHorizontal: 12,
  //   paddingVertical: 5,
  //   borderRadius: 20,
  //   borderWidth: 1,
  //   borderColor: "#ddd",
  //   backgroundColor: "#fff",
  //   color: "#333",
  //   fontFamily: fonts.regular,
  // },
  // selectedTimeSlot: {
  //   backgroundColor: "#C15E9C",
  //   borderColor: "#C15E9C",
  // },
  // timeSlotText: {
  //   fontSize: 11,
  //   color: "#333",
  //   fontFamily: fonts.regular,
  // },
  // selectedTimeSlotText: {
  //   color: "#fff",
  // },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
    padding: 16,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9DEE6",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    width: "48%",
  },
  customRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D9DEE6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  customRadioSelected: {
    borderColor: "#C15E9C",
  },
  customRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C15E9C",
  },
  radioLabel: {
    fontSize: 13,
    color: "#2B2B2B",
    fontFamily: fonts.regular,
  },
  othersForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  selectedRadioOption: {
    borderColor: "#C15E9C",
  },
  selectedRadioLabel: {
    fontFamily: fonts.semiBold,
  },
  formField: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 10,
    color: "#333",
    backgroundColor: "#fff",
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 10,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 13,
    color: "#333",
    fontFamily: fonts.regular,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: "#666",
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    maxHeight: 400,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
    fontFamily: fonts.regular,
  },
  buttonContainer: {
    position: "absolute",
    bottom: getResponsiveSpacing(60),
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSpacing(20),
    // paddingBottom: getResponsiveSpacing(30),
    // paddingTop: getResponsiveSpacing(15),
    backgroundColor: colors.bg_primary,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  proceedButton: {
    borderRadius: getResponsiveSpacing(23),
    height: getResponsiveSpacing(45),
    width: "100%",
  },

  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#333",
    fontFamily: fonts.regular,
  },
  selectedTimeSlot: {
    backgroundColor: "#C15E9C",
    borderColor: "#C15E9C",
  },
  timeSlotText: {
    fontSize: 11,
    color: "#333",
    fontFamily: fonts.regular,
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  specialistImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
