import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { getResponsiveSpacing } from "@/app/shared/utils/responsive";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { Button, RadioButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import PrimaryButton from "../../shared/components/PrimaryButton";
import SecondaryButton from "../../shared/components/SecondaryButton";
import Toast from "../../shared/components/Toast";
import {
  orderManager,
  PatientDetails,
  ServiceAddress,
} from "../../shared/utils/orderManager";
import LocationSelection from "../location/location-selection";

interface BookingScreenProps {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  servicePrice: number;
  isAtHome: boolean;
}

export default function BookingScreen({
  visible,
  onClose,
  serviceName,
  servicePrice,
  isAtHome,
}: BookingScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [patientType, setPatientType] = useState("self");
  const [relationType, setRelationType] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLocationSelection, setShowLocationSelection] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    houseNumber: string;
    landmark: string;
    nickname: string;
  } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: "", subtitle: "" });

  // Sample time slots (would come from API)
  const timeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  const relationTypes = [
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Son",
    "Daughter",
    "Spouse",
    "Other",
  ];

  const genderOptions = ["Male", "Female", "Other"];

  const handleBookNow = () => {
    // Validate required fields
    if (!selectedDate) {
      alert("Please select a date for sample collection");
      return;
    }

    if (!selectedTimeSlot) {
      alert("Please select a time slot");
      return;
    }

    if (patientType === "other") {
      if (!relationType || !fullName || !age || !gender) {
        alert("Please fill all patient details");
        return;
      }
    }

    // Create patient details
    const patientDetails: PatientDetails = {
      type: patientType as "self" | "other",
      ...(patientType === "other" && {
        relationType,
        fullName,
        age,
        gender,
      }),
    };

    // Create service address if location is selected
    const serviceAddress: ServiceAddress | undefined = selectedLocation
      ? {
          address: selectedLocation.address,
          houseNumber: selectedLocation.houseNumber,
          landmark: selectedLocation.landmark,
          nickname: selectedLocation.nickname,
        }
      : undefined;

    // Format date for storage
    const formattedDate = selectedDate.toISOString().split("T")[0];

    // Create order
    orderManager.createOrder({
      serviceName,
      servicePrice,
      isAtHome,
      patientDetails,
      serviceAddress,
      scheduledDate: formattedDate,
      scheduledTime: selectedTimeSlot,
    });

    // Show success toast
    setToastMessage({
      title: "Booking Confirmed",
      subtitle: `Your ${serviceName.toLowerCase()} was successfully created`,
    });
    setShowToast(true);

    // Close booking screen after a short delay
    setTimeout(() => {
      onClose();
      // Navigate to orders screen
      router.push("/(main)/orders");
    }, 1500);
  };

  const handleAddAddress = () => {
    setShowLocationSelection(true);
  };

  const handleLocationSelected = (locationData: any) => {
    setSelectedLocation({
      address: locationData.address,
      houseNumber: locationData.houseNumber,
      landmark: locationData.landmark,
      nickname: locationData.nickname,
    });
    setShowLocationSelection(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image source={images.icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Service Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Information</Text>
              <View style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{serviceName}</Text>
                  <Text style={styles.serviceLocation}>
                    {isAtHome ? "At HOME" : "At Lab"}
                  </Text>
                </View>
                <Text style={{ fontSize: 8, color: "#4B334E" }}>
                  Report within 10-12 hours
                </Text>

                {/* Divider */}
                <View style={styles.serviceDivider} />

                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>
                    Starting from ₹{servicePrice}
                  </Text>
                  <SecondaryButton
                    title="Edit"
                    onPress={() => console.log("Edit service")}
                    width={60}
                    height={25}
                  />
                </View>
              </View>
            </View>

            {/* Service Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Address</Text>
              {selectedLocation ? (
                <View style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressNickname}>
                        {selectedLocation.nickname.charAt(0).toUpperCase() +
                          selectedLocation.nickname.slice(1)}
                      </Text>
                      <Text style={styles.addressText}>
                        {selectedLocation.houseNumber &&
                          `${selectedLocation.houseNumber}, `}
                        {selectedLocation.address}
                      </Text>
                      {selectedLocation.landmark && (
                        <Text style={styles.landmarkText}>
                          Near {selectedLocation.landmark}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.editAddressButton}
                      onPress={handleAddAddress}
                    >
                      <Text style={styles.editAddressText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "#FBFBFB",
                    borderRadius: 8,
                    padding: 10,
                    // paddingHorizontal: 20
                    alignItems: "center",
                  }}
                >
                  <Button
                    style={{
                      borderRadius: 8,
                      width: "60%",
                      borderColor: "#0580FA",
                      borderStyle: "solid",
                      borderWidth: 1,
                    }}
                    labelStyle={{ color: "#0580FA" }}
                    onPress={handleAddAddress}
                  >
                    Add your service address
                  </Button>
                </View>
              )}
            </View>

            {/* Sample Pickup Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sample Pickup Date & Time</Text>
              <View style={styles.dateTimeCard}>
                {/* Date Selection */}
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
                      {selectedDate ? formatDate(selectedDate) : "dd/mm/yyyy"}
                    </Text>
                    <Image
                      source={images.icons.calendar}
                      style={styles.calendarIcon}
                    />
                  </TouchableOpacity>
                </View>

                {/* Time Slots */}
                <View style={styles.timeSection}>
                  <Text style={styles.fieldLabel}>Select Time Slot</Text>
                  <View style={styles.timeSlotsContainer}>
                    {timeSlots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.timeSlot,
                          selectedTimeSlot === slot && styles.selectedTimeSlot,
                        ]}
                        onPress={() => setSelectedTimeSlot(slot)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            selectedTimeSlot === slot &&
                              styles.selectedTimeSlotText,
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Patient Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Details</Text>
              <View style={styles.patientCard}>
                <View style={styles.radioGroup}>
                  <View style={styles.radioOption}>
                    <RadioButton
                      value="self"
                      status={patientType === "self" ? "checked" : "unchecked"}
                      onPress={() => setPatientType("self")}
                      color="#C15E9C"
                    />
                    <Text style={styles.radioLabel}>Self Service</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton
                      value="others"
                      status={
                        patientType === "others" ? "checked" : "unchecked"
                      }
                      onPress={() => setPatientType("others")}
                      color="#C15E9C"
                    />
                    <Text style={styles.radioLabel}>For Others</Text>
                  </View>
                </View>

                {/* For Others Form */}
                {patientType === "others" && (
                  <View style={styles.othersForm}>
                    {/* Relation Type */}
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Relation Type</Text>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setShowRelationDropdown(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {relationType || "Select Relation"}
                        </Text>
                        <Image
                          source={images.icons.edit}
                          style={styles.dropdownIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Full Name */}
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Full Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter full name"
                        placeholderTextColor="#999"
                      />
                    </View>

                    {/* Age */}
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Age</Text>
                      <TextInput
                        style={styles.textInput}
                        value={age}
                        onChangeText={setAge}
                        placeholder="Enter age"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Gender */}
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Gender</Text>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setShowGenderDropdown(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {gender || "Select Gender"}
                        </Text>
                        <Image
                          source={images.icons.edit}
                          style={styles.dropdownIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Cancellation Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <View style={styles.policyCard}>
                <Text style={styles.policyText}>
                  Free cancellation is done more than 2 hrs before the service
                  or if a professional isn&apos;t assigned. A fee will be
                  charged otherwise.
                </Text>
                <TouchableOpacity style={styles.learnMoreButton}>
                  <Text style={styles.learnMoreText}>Learn more</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Book Now Button */}
          <View style={styles.footer}>
            <PrimaryButton
              title={`Confirm & Pay ${servicePrice}`}
              onPress={handleBookNow}
              style={{ width: "100%" }}
            />
          </View>

          {/* Relation Type Dropdown Modal */}
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
                {relationTypes.map((relation, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRelationType(relation);
                      setShowRelationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{relation}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

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
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>
                      {genderOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Location Selection Modal */}
          <LocationSelection
            visible={showLocationSelection}
            onClose={() => setShowLocationSelection(false)}
            onLocationSelected={handleLocationSelected}
          />
        </View>
      </SafeAreaView>

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    ...commonStyles.container_header,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202427",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  section: {
    marginTop: getResponsiveSpacing(10),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: getResponsiveSpacing(12),
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B334E",
    flex: 1,
  },
  serviceLocation: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C15E9C",
  },
  serviceDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  dateTimeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
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
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  selectedTimeSlot: {
    backgroundColor: "#C15E9C",
    borderColor: "#C15E9C",
  },
  timeSlotText: {
    fontSize: 12,
    color: "#333",
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  radioGroup: {
    // marginBottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9DEE6",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    width: "49%",
    // marginBottom: 4,
  },
  radioLabel: {
    fontSize: 14,
    color: "#2B2B2B",
    // marginLeft: 4,
  },
  othersForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  formField: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: "#666",
  },
  policyCard: {
    // backgroundColor: '#fff',
    // borderRadius: 12,
    // padding: 16,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  policyText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  learnMoreButton: {
    alignSelf: "flex-start",
  },
  learnMoreText: {
    fontSize: 14,
    color: "#0881FC",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addressInfo: {
    flex: 1,
    marginRight: 12,
  },
  addressNickname: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C15E9C",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 14,
    color: "#666",
  },
  editAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C15E9C",
  },
  editAddressText: {
    fontSize: 14,
    color: "#C15E9C",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    // marginTop: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    maxHeight: 300,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
});
