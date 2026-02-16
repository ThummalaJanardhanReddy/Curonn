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
import AddressSelection from "../address/address-selection";
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
// import RazorpayCheckout from 'react-native-razorpay';
import RazorpayPaymentScreen from "../razorpay/RazorpayPaymentScreen";

type ServiceType = "lab-test" | "health-checks" | "scans";

interface BookingScreenProps {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  servicePrice: number;
  isAtHome: boolean;
  masterId?: number;
  type?: ServiceType;
  reportTime?: string;
}

export default function BookingScreen({
  visible,
  onClose,
  serviceName,
  servicePrice,
  reportTime,
  isAtHome,
  masterId,
  type,
}: BookingScreenProps) {

  // Dynamic discount percentage (can be fetched from API in future)

  const discountPercent = 10; // Example: 10%
  const discountAmount = Math.round((servicePrice * discountPercent) / 100);
  const totalAmount = servicePrice - discountAmount;
  console.log("DEBUG: totalAmount calculated as", totalAmount);
  const { userData } = useUser();
  // StatusId for 'Requested' (categoryId=7)
  const [statusId, setStatusId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [errors, setErrors] = useState("");
  const [patientType, setPatientType] = useState("self");
  const [relationType, setRelationType] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLocationSelection, setShowLocationSelection] = useState(false);
  const [showAllAddress, setShowAllAdderss] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [addressVisible, setAddressVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  // TypeScript fix: use 'any' for SavedAddress if type is missing
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [editAddressId, setEditAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    addressId: number;
    address: string;
    houseNumber: string;
    landmark: string;
    nickname: string;
  } | null>(null);

  const [showPayment, setShowPayment] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  // Fetch statusId for 'Requested' from MasterData API (categoryId=7)
  const fetchStatusId = async () => {
    try {
      const response: any = await axiosClient.get(ApiRoutes.Master.getmasterdata(7));
      let status = 0;
      if (Array.isArray(response)) {
        const requested = response.find((item: any) => item.name === 'Requested' && item.isActive);
        if (requested) status = requested.masterDataId;
      } else if (response.isSuccess && Array.isArray(response.data)) {
        const requested = response.data.find((item: any) => item.name === 'Requested' && item.isActive);
        if (requested) status = requested.masterDataId;
      }
      setStatusId(status);
    } catch (error) {
      console.error('Failed to fetch statusId for Requested', error);
    }
  };
  fetchStatusId();
  // Fetch addresses and set the first as selectedLocation on mount
  React.useEffect(() => {
    if (userData?.e_id) {
      fetchAddresses();
    }
    // eslint-disable-next-line
  }, [userData?.e_id]);



  // Helper to build lab order payload
  const buildLabOrderPayload = (paymentData?: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    const isSelfService = patientType === "self";
    const payload: any = {
      labOrderId: 0,
      testName: serviceName,
      patientId: userData?.e_id || 0,
      address: selectedLocation?.address || "",
      hNo: selectedLocation?.houseNumber || "",
      landMark: selectedLocation?.landmark || "",
      addressNickname: selectedLocation?.nickname
        ? selectedLocation.nickname.charAt(0).toUpperCase() + selectedLocation.nickname.slice(1)
        : "",
      serviceDate: selectedDate ? formatDate(selectedDate) : "",
      timeSlot: selectedTimeSlot,
      isSelfService,
      paymentDetails: String(totalAmount), // must be string for API
      isPaymentDone: !!paymentData,
      createdBy: userData?.e_id || 0, // set to patientId
      labPartnerId: 0,
      statusId: statusId, // Use fetched statusId for 'Requested'
      paymentAmount: totalAmount,
      razorpayOrderId: paymentData?.razorpayOrderId || "",
      razorpayPaymentId: paymentData?.razorpayPaymentId || "",
      razorpaySignature: paymentData?.razorpaySignature || "",

    };
    // Relation details
    if (isSelfService) {
      payload.relationId = 0;
      payload.relationName = "";
      payload.relationAge = 0;
      payload.relationGender = "";
    } else if (selectedRelation) {
      payload.relationId = selectedRelation.masterDataId;
      payload.relationName = fullName;
      payload.relationAge = age ? Number(age) : 0;
      payload.relationGender = gender;
    }
    // Master IDs and testType
    if (type === "lab-test") {
      payload.testType = "Single Test";
      payload.labTestMasterId = masterId || 0;
      payload.labPackageMasterId = 0;
      payload.xrayMasterId = 0;
    } else if (type === "health-checks") {
      payload.testType = "Package";
      payload.labTestMasterId = 0;
      payload.labPackageMasterId = masterId || 0;
      payload.xrayMasterId = 0;
    } else if (type === "scans") {
      payload.testType = "Scan";
      payload.labTestMasterId = 0;
      payload.labPackageMasterId = 0;
      payload.xrayMasterId = masterId || 0;
    }
    return payload;
  };

  // Save lab order after payment
  const saveLabOrder = async (paymentData: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    const payload = buildLabOrderPayload(paymentData);
    payload.createdBy = 1; // Fix createdBy to 1
    payload.req = "web"; // Ensure req field is present
    console.log("Lab order payload after payment:", payload);
    try {
      const response: any = await axiosClient.post(ApiRoutes.LabOrders.saveUpdate, payload);
      console.log("Lab order API response:", response);
      if (response.success) {
        setToastMessage({
          title: "Order Success",
          subtitle: response.message || "Your lab order was placed successfully!",
          type: "success"
        });
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setShowPayment(false);
          onClose();
          router.push("/(main)/orders");
        }, 1500);
      } else {
        console.log("Order failed, response message:", response.message);
        setToastMessage({
          title: "Order Failed",
          subtitle: response.message || "Failed to place order.",
          type: "error"
        });
        setShowToast(true);
      }
    } catch (error) {
      console.log("Order error:", error);
      setToastMessage({
        title: "Order Error",
        subtitle: "Something went wrong.",
        type: "error"
      });
      setShowToast(true);
    }
  };


  // Sample time slots (would come from API)
  const timeSlots = [
    "07:00 AM - 08:00 AM",
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 PM",
  ];

  // Dynamic relationship types from MasterData API
  const [relationTypes, setRelationTypes] = useState<{
    masterDataId: number;
    name: string;
  }[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);

  // Gender options for dropdown
  const genderOptions = ["Male", "Female", "Other"];

  React.useEffect(() => {
    console.log('DEBUG: useEffect for relationTypes called');
    // Fetch relationship types from MasterData API (categoryId=5)
    const fetchRelationTypes = async () => {
      try {
        console.log('DEBUG: fetchRelationTypes called');
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(5)
        );
        console.log('DEBUG: fetchRelationTypes response:', response);
        // If response is an array, use it directly
        if (Array.isArray(response)) {
          const filtered = response
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setRelationTypes(filtered);
          console.log('DEBUG: setRelationTypes:', filtered);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          // fallback for old API shape
          const filtered = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setRelationTypes(filtered);
          console.log('DEBUG: setRelationTypes:', filtered);
        }
      } catch (error) {
        console.error("Failed to fetch relation types", error);
      }
    };
    fetchRelationTypes();
  }, []);

  const handleBookNow = async () => {
    // Validate required fields
    if (!selectedDate || !formatDate(selectedDate).trim()) {
      setErrors("Please select service start date");
      return;
    }
    if (!selectedTimeSlot.trim()) {
      setErrors("Please select time slot");
      return;
    }
    if (patientType === "other" && (!selectedRelation || !fullName || !age || !gender)) {
      setErrors("Please fill all patient details");
      return;
    }

    setErrors(""); // Clear errors if validation passes

    // Get Razorpay order_id from backend (GET method)
    try {
      const query = `?amount=${totalAmount * 100}&patientId=${userData?.e_id || 0}`;
      const orderRes: any = await axiosClient.get(ApiRoutes.LabOrders.RazopayOrder + query);
      if (orderRes && orderRes.isSuccess && orderRes.order_id) {
        setRazorpayOrderId(orderRes.order_id);
        setShowPayment(true);
      } else {
        setToastMessage({
          title: "Order Error",
          subtitle: orderRes?.message || "Failed to create payment order.",
          type: "error"
        });
        setShowToast(true);
      }
    } catch (err) {
      setToastMessage({
        title: "Order Error",
        subtitle: "Failed to create payment order.",
        type: "error"
      });
      setShowToast(true);
    }
  };

  const handleViewAddress = () => {
    setAddressVisible(true);
  };

  const handleAddAddress = () => {
    setShowLocationSelection(true);
  };

  const handleLocationSelected = (locationData: any) => {
    setSelectedLocation({
      addressId: locationData.addressId,
      address: locationData.address,
      houseNumber: locationData.houseNumber,
      landmark: locationData.landmark,
      nickname: locationData.nickname,
    });
    setShowLocationSelection(false);
  };

  const handleAddressSelected = (locationData: any) => {
    setSelectedLocation({
      addressId: locationData.addressId,
      address: locationData.address,
      houseNumber: locationData.houseNumber,
      landmark: locationData.landmark,
      nickname: locationData.nickname,
    });
    setShowLocationSelection(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      if (errors === "Please select service start date") setErrors("");
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      // Ensure patientId is defined
      const patientId = userData?.e_id;
      if (!patientId) {
        throw new Error("Patient ID is not available");
      }
      const responcedata: any = await axiosClient.get(
        ApiRoutes.Address.getAddressByPatientId(patientId)
      );

      console.log("Fetched addresses:", responcedata);
      if (responcedata.isSuccess && Array.isArray(responcedata.data) && responcedata.data.length > 0) {
        // Find the default address (isDefault: true)
        const defaultAddress = responcedata.data.find((addr: any) => addr.isDefault === true);
        if (defaultAddress) {
          setSelectedLocation({
            addressId: defaultAddress.addressId,
            address: defaultAddress.address,
            houseNumber: defaultAddress.hNo,
            landmark: defaultAddress.landMark,
            nickname: defaultAddress.addressNickname,
          });
        } else {
          setSelectedLocation(null);
        }
      } else {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error("Fetch address error:", error);
      setSelectedLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressById = async (addressId: string) => {
    try {
      setLoading(true);
      const response: any = await axiosClient.get(
        ApiRoutes.Address.getAddressById(addressId)
      );
      console.log("Fetched address by ID:", response); // <-- Add this
      if (response.isSuccess && response.data) {
        const addr = response.data;
        setSelectedLocation({
          addressId: addr.addressId,
          address: addr.address,
          houseNumber: addr.hNo,
          landmark: addr.landMark,
          nickname: addr.addressNickname,
        });
      }
    } catch (error) {
      console.error("Fetch address by ID error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
  const handleEdit = () => {
    onClose();
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
                  Report within {reportTime}
                </Text>

                {/* Divider */}
                <View style={styles.serviceDivider} />

                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>
                    ₹{servicePrice}
                  </Text>
                  <SecondaryButton
                    title="Edit"
                    onPress={handleEdit}
                    width={60}
                    height={25}
                  />
                </View>
              </View>
            </View>

            {/* Service Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Address</Text>
              {selectedLocation && (
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
                      onPress={() => {
                        // Use the same logic as address-selection.tsx: onEdit(item.addressId)
                        if (selectedLocation && selectedLocation.addressId) {
                          setEditAddressId(selectedLocation.addressId);
                          setLocationModalVisible(true);
                        }
                      }}
                    >
                      <Text style={styles.editAddressText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Button
                    style={{
                      borderRadius: 8,
                      width: "80%",
                      borderColor: "#0580FA",
                      borderStyle: "solid",
                      borderWidth: 1,
                      marginTop: 12,
                    }}
                    labelStyle={{ color: "#0580FA" }}
                    onPress={handleViewAddress}
                  >
                    + Add your sample collection address
                  </Button>
                </View>
              )}
              <View
                style={{
                  backgroundColor: "#FBFBFB",
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  marginTop: selectedLocation ? 12 : 0,
                }}
              >

              </View>
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
                  {errors === "Please select service start date" && (
                    <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{errors}</Text>
                  )}
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
                        onPress={() => {
                          setSelectedTimeSlot(slot);
                          if (errors === "Please select time slot") setErrors("");
                        }}
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
                  {errors === "Please select time slot" && (
                    <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{errors}</Text>
                  )}
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
                      color="#ff0000"
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
                        onPress={() => {
                          console.log('DEBUG: relationTypes:', relationTypes);
                          setShowRelationDropdown(true);
                        }}
                      >
                        <Text style={styles.dropdownText}>
                          {selectedRelation ? selectedRelation.name : "Select Relation"}
                        </Text>
                        {/* TypeScript fix: Replace SVG Image with a placeholder View */}
                        <View style={styles.dropdownIcon} />
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
                        {/* TypeScript fix: Replace SVG Image with a placeholder View */}
                        <View style={styles.dropdownIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Delivery Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.deliveryCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, color: "#333" }}>Item Price</Text>
                  <Text style={{ fontSize: 16, color: "#333" }}>₹{servicePrice}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, color: "#333" }}>Offer Discount ({discountPercent}%)</Text>
                  <Text style={{ fontSize: 16, color: "#C15E9C" }}>-₹{discountAmount}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 8 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>To Pay</Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>₹{totalAmount}</Text>
                </View>
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
              title={`Confirm &  Pay ₹${totalAmount}`}
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
                <ScrollView style={{ maxHeight: 250 }}>
                  {relationTypes.map((relation) => (
                    <TouchableOpacity
                      key={relation.masterDataId}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setSelectedRelation(relation);
                        setShowRelationDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{relation.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
          {/* Razorpay Payment Modal (Full Screen, no close button) */}
          <Modal
            visible={showPayment}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => {
              setShowPayment(false);
              setToastMessage({
                title: "Payment Not Completed",
                subtitle: "You exited before completing the payment.",
                type: "error"
              });
              setShowToast(true);
            }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <RazorpayPaymentScreen
               key={razorpayOrderId}
                amount={totalAmount * 100}
                name={userData?.fullName || ""}
                email={userData?.emailAddress || ""}
                contact={userData?.mobileNo || ""}
                orderId={razorpayOrderId}
                onSuccess={data => {
                  setShowPayment(false);
                  console.log("Payment success, Razorpay details:", data);
                  // Save lab order after payment
                  saveLabOrder({
                    razorpayOrderId: data.razorpay_order_id || razorpayOrderId || "",
                    razorpayPaymentId: data.razorpay_payment_id || "",
                    razorpaySignature: data.razorpay_signature || "",
                  });
                }}
                onFailure={(err) => {
                  console.log("Payment failed:", err);

                  // Close confirm modal if open
                  setShowConfirmExit(false);

                  // Small delay ensures WebView unmounts properly
                  setTimeout(() => {
                    setShowPayment(false);

                    if (err?.cancelled) {
                      setToastMessage({
                        title: "Payment Cancelled",
                        subtitle: "Payment not completed.",
                        type: "error"
                      });
                    } else {
                      setToastMessage({
                        title: "Payment Failed",
                        subtitle: "Your payment was not completed.",
                        type: "error"
                      });
                    }

                    setShowToast(true);
                  }, 300);
                }}
              />
            </SafeAreaView>
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

          {/* All Address View Modal */}
          {userData?.e_id && (
            <AddressSelection
              visible={addressVisible}
              patientId={userData?.e_id}
              onSelect={(addressId) => {
                console.log("Selected address:", addressId);
                setAddressVisible(false);
                if (addressId) {
                  fetchAddressById(addressId.toString());
                }
              }}
              onAddNew={() => {
                console.log("Add new address");
                setEditAddressId(null);
                setAddressVisible(false);
                setLocationModalVisible(true);
              }}

              onEdit={(addressId) => {
                console.log("Edit addressId:", addressId); // Check value here
                setAddressVisible(false);
                setEditAddressId(addressId); // Store the addressId for editing
                setLocationModalVisible(true);
              }}

              onClose={() => setAddressVisible(false)}
            />
          )}

          {/* Location Selection Modal */}
          <LocationSelection
            visible={locationModalVisible}
            addressId={editAddressId} // Pass addressId for editing
            onClose={() => setLocationModalVisible(false)}
            onLocationSelected={(newAddress) => {
              setSavedAddresses((prev) => [
                ...prev,
                { id: Date.now().toString(), ...newAddress },
              ]);
              setLocationModalVisible(false);
              setAddressVisible(true); // Open AddressSelection modal
            }}
          />

        </View>
      </SafeAreaView>

      {/* Toast Notification */}
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
    fontSize: 11,
    fontWeight: "400",
    color: "#251729",
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
    fontSize: 14,
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
  deliveryCard: {
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
    maxHeight: 400,
    overflow: 'hidden',
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
  razorpaycloseButton: {
    position: 'relative',
    top: 40,
    backgroundColor: '#fff',
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    padding: 8,
  }
});
