import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/app/shared/utils/responsive";
import CartItemsList from "@/app/shared/components/CartItemsList";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState, useEffect, useMemo } from "react";
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
import { useCart } from "../../shared/context/CartContext";
// import RazorpayCheckout from "../../shared/components/RazorpayCheckout";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import RazorpayPaymentScreen from "../razorpay/RazorpayPaymentScreen";
import { fonts } from '@/app/shared/styles/fonts';
// Guarded access to expo-router's useSearchParams hook (for medicine flow).
let maybeUseSearchParams: any = null;
try {
  const rr = require("expo-router");
  maybeUseSearchParams =
    rr && typeof rr.useSearchParams === "function" ? rr.useSearchParams : null;
} catch (e) {
  maybeUseSearchParams = null;
}

type ServiceType = "lab-test" | "health-checks" | "scans";

interface BookingScreenProps {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  servicePrice: number;
  isAtHome: boolean;
  /** Lab-test flow only */
  masterId?: number;
  /** Lab-test flow only */
  type?: ServiceType;
  /** Lab-test flow only */
  reportTime?: string;
}

export default function BookingScreen({
  visible,
  onClose,
  serviceName,
  servicePrice,
  isAtHome,
  masterId,
  type,
  reportTime,
}: BookingScreenProps) {
  // ─── Shared context ────────────────────────────────────────────────
  const { userData } = useUser();

  // ─── Medicine-flow flag (parsed from search params / global) ───────
  const [isFromMedicalFlag, setIsFromMedicalFlag] = useState(false);
  const { cartItems, updateQuantity, removeItem } = useCart();
  // ─── Shared state ──────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [patientType, setPatientType] = useState("self");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ─── Lab-test flow state ───────────────────────────────────────────
  // Only use field-specific errors for relation, fullName, age, gender in LAB flow
  // All other errors (address, date, timeSlot) use a string
  const [errors, setErrors] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    relation: "",
    fullName: "",
    age: "",
    gender: ""
  });
  const [isTodayAvailable, setIsTodayAvailable] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(10);
  const discountAmount = Math.round((servicePrice * discountPercent) / 100);
  const totalAmount = servicePrice - discountAmount;
  const [statusId, setStatusId] = useState<number>(0);
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressVisible, setAddressVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editAddressId, setEditAddressId] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  // Unified address state (shared by both flows)
  const [selectedLocation, setSelectedLocation] = useState<{
    addressId: number;
    address: string;
    houseNumber: string;
    landmark: string;
    nickname: string;
  } | null>(null);
  // Lab-test: dynamic relation types from API
  const [labRelationTypes, setLabRelationTypes] = useState<
    { masterDataId: number; name: string }[]
  >([]);
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);
  // Lab-test toast has type
  const [showToastLab, setShowToastLab] = useState(false);
  const [toastMessageLab, setToastMessageLab] = useState<{
    title: string;
    subtitle: string;
    type: "success" | "error";
  }>({ title: "", subtitle: "", type: "success" });

  // ─── Medicine flow state ───────────────────────────────────────────
  const [relationType, setRelationType] = useState("");
  const [showToastMed, setShowToastMed] = useState(false);
  const [toastMessageMed, setToastMessageMed] = useState({
    title: "",
    subtitle: "",
    type: "success" as "success" | "error",
  });

  // ─── Shared constants ──────────────────────────────────────────────
  const genderOptions = ["Male", "Female", "Other"];

  // Lab-test time slots
  const labTimeSlots = [
    "07:00 AM - 08:00 AM",
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
  ];

  // Medicine time slots
  const medTimeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  // Medicine static relation types

  // ═══════════════════════════════════════════════════════════════════
  // LAB-TEST FLOW EFFECTS & HELPERS (only when isFromMedicalFlag === false)
  // ═══════════════════════════════════════════════════════════════════

  // Fetch discount percent from Employee API
  useEffect(() => {
    if (isFromMedicalFlag) return;
    async function fetchDiscount() {
      try {
        const patientId = userData?.e_id;
        if (!patientId) return;
        const res: any = await axiosClient.get(
          ApiRoutes.Employee.getById(patientId)
        );
        if (res && typeof res === "object") {
          let discount = 0;
          if (type === "lab-test") {
            discount =
              typeof res.discountLabOrder === "number" &&
                res.discountLabOrder != null
                ? res.discountLabOrder
                : 0;
          } else if (type === "health-checks") {
            discount =
              typeof res.discountLabPackage === "number" &&
                res.discountLabPackage != null
                ? res.discountLabPackage
                : 0;
          } else if (type === "scans") {
            discount =
              typeof res.discountScanXray === "number" &&
                res.discountScanXray != null
                ? res.discountScanXray
                : 0;
          }
          setDiscountPercent(discount);
        }
      } catch (e) {
        console.error("Failed to fetch discount percent", e);
      }
    }
    fetchDiscount();
  }, [userData?.e_id, type, isFromMedicalFlag]);

  // Fetch statusId for 'Requested' from MasterData API (categoryId=7)
  useEffect(() => {
    if (isFromMedicalFlag) return;
    const fetchStatusId = async () => {
      try {
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(7)
        );
        let status = 0;
        if (Array.isArray(response)) {
          const requested = response.find(
            (item: any) => item.name === "Requested" && item.isActive
          );
          if (requested) status = requested.masterDataId;
        } else if (response.isSuccess && Array.isArray(response.data)) {
          const requested = response.data.find(
            (item: any) => item.name === "Requested" && item.isActive
          );
          if (requested) status = requested.masterDataId;
        }
        setStatusId(status);
      } catch (error) {
        console.error("Failed to fetch statusId for Requested", error);
      }
    };
    fetchStatusId();
  }, [isFromMedicalFlag]);

  // Fetch relationship types from MasterData API (categoryId=5)
  useEffect(() => {
    if (isFromMedicalFlag) return;
    const fetchRelationTypes = async () => {
      try {
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(5)
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
  }, [isFromMedicalFlag]);

  // Fetch addresses and set the default as selectedLocation on mount (shared by both flows)
  useEffect(() => {
    if (userData?.e_id) {
      fetchAddresses();
    }
  }, [userData?.e_id]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const patientId = userData?.e_id;
      if (!patientId) throw new Error("Patient ID is not available");
      const responcedata: any = await axiosClient.get(
        ApiRoutes.Address.getAddressByPatientId(patientId)
      );
      if (
        responcedata.isSuccess &&
        Array.isArray(responcedata.data) &&
        responcedata.data.length > 0
      ) {
        const defaultAddress = responcedata.data.find(
          (addr: any) => addr.isDefault === true
        );
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

  // Build lab order payload
  const buildLabOrderPayload = (paymentData?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const isSelfService = patientType === "self";
    const payload: any = {
      labOrderId: 0,
      testName: serviceName,
      patientId: userData?.e_id || 0,
      address: selectedLocation?.address || "",
      hNo: selectedLocation?.houseNumber || "",
      landMark: selectedLocation?.landmark || "",
      addressNickname: selectedLocation?.nickname
        ? selectedLocation.nickname.charAt(0).toUpperCase() +
        selectedLocation.nickname.slice(1)
        : "",
      serviceDate: selectedDate ? formatDateLab(selectedDate) : "",
      timeSlot: selectedTimeSlot,
      isSelfService,
      paymentDetails: String(totalAmount),
      isPaymentDone: !!paymentData,
      createdBy: userData?.e_id || 0,
      labPartnerId: 0,
      statusId: statusId,
      paymentAmount: totalAmount,
      razorpayOrderId: paymentData?.razorpayOrderId || "",
      razorpayPaymentId: paymentData?.razorpayPaymentId || "",
      razorpaySignature: paymentData?.razorpaySignature || "",
    };
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
      payload.testType = "Xray";
      payload.labTestMasterId = 0;
      payload.labPackageMasterId = 0;
      payload.xrayMasterId = masterId || 0;
    }
    return payload;
  };

  // Save lab order after payment
  const saveLabOrder = async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const payload = buildLabOrderPayload(paymentData);
    payload.createdBy = userData?.e_id || 1;
    payload.req = "web";
    console.log("📤 Lab Save Order Request Payload:", JSON.stringify(payload, null, 2));
    try {
      const response: any = await axiosClient.post(
        ApiRoutes.LabOrders.saveUpdate,
        payload
      );
      console.log("📥 Lab Save Order Response:", JSON.stringify(response, null, 2));
      if (response && (response.success || response.isSuccess)) {
        setToastMessageLab({
          title: "Order Success",
          subtitle:
            response.message || "Your lab order was placed successfully!",
          type: "success",
        });
        setShowToastLab(true);
        setTimeout(() => {
          setShowToastLab(false);
          setShowPayment(false);
          if (onClose) onClose();
          router.replace("/(main)/orders");
        }, 1500);
      } else {
        setToastMessageLab({
          title: "Order Failed",
          subtitle: response.message || "Failed to place order.",
          type: "error",
        });
        setShowToastLab(true);
      }
    } catch (error) {
      console.error("[Booking] saveLabOrder error:", error);
      setToastMessageLab({
        title: "Order Error",
        subtitle: "Something went wrong.",
        type: "error",
      });
      setShowToastLab(true);
    }
  };

  // Lab-test date format: YYYY-MM-DD
  const formatDateLab = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Lab-test: handleBookNow
  const handleBookNowLab = async () => {
    // Validate address, date, timeSlot as string errors
    if (!selectedLocation) {
      setErrors("Please select or add new address");
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      return;
    }
    if (!selectedDate || !formatDateLab(selectedDate).trim()) {
      setErrors("Please select service start date");
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      return;
    }
    if (!selectedTimeSlot.trim()) {
      setErrors("Please select time slot");
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      return;
    }
    // Validate only relation, fullName, age, gender as field errors
    if (patientType === "others") {
      let newFieldErrors = { relation: "", fullName: "", age: "", gender: "" };
      let hasError = false;
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
      if (hasError) return;
    } else {
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      setErrors("");
    }
    try {
      const query = `?amount=${Math.round(totalAmount * 100)}&patientId=${userData?.e_id || 0}`;
      console.log("📤 Lab Razorpay Order Request:", ApiRoutes.LabOrders.RazopayOrder + query);
      const orderRes: any = await axiosClient.get(
        ApiRoutes.LabOrders.RazopayOrder + query
      );
      console.log("📥 Lab Razorpay Order Response:", JSON.stringify(orderRes, null, 2));
      if (orderRes && orderRes.isSuccess && orderRes.order_id) {
        setRazorpayOrderId(orderRes.order_id);
        setShowPayment(true);
      } else {
        setToastMessageLab({
          title: "Order Error",
          subtitle: orderRes?.message || "Failed to create payment order.",
          type: "error",
        });
        setShowToastLab(true);
      }
    } catch (err) {
      setToastMessageLab({
        title: "Order Error",
        subtitle: "Failed to create payment order.",
        type: "error",
      });
      setShowToastLab(true);
    }
  };

  const handleViewAddress = () => {
    setAddressVisible(true);
  };

  const handleAddAddress = () => {
    setEditAddressId(null);
    setAddressVisible(false);
    setLocationModalVisible(true);
  };

  const handleEditAddress = () => {
    if (selectedLocation && selectedLocation.addressId) {
      setEditAddressId(selectedLocation.addressId);
      setLocationModalVisible(true);
    }
  };

  const handleLabDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      if (errors === "Please select service start date") setErrors("");
    }
  };

  const handleEdit = () => {
    onClose();
  };

  // ═══════════════════════════════════════════════════════════════════
  // MEDICINE FLOW EFFECTS & HELPERS (only when isFromMedicalFlag === true)
  // ═══════════════════════════════════════════════════════════════════

  // Parse search params for cart items / isFromMedical
  const searchParams = maybeUseSearchParams ? maybeUseSearchParams() : null;

  useEffect(() => {
    try {
      const sp = searchParams;
      if (!sp) return;
      const flag =
        sp.isFromMedical === "true" ||
        sp.isFromMedical === true ||
        sp.isFromMedical === "1";
      setIsFromMedicalFlag(!!flag);
      if (sp.cartItems) {
        try {
          const decoded = decodeURIComponent(sp.cartItems as string);
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((it: any) => ({
              ...it,
              medicineName:
                it.medicineName ?? it.name ?? it.title ?? it.subtitle ?? "",
              medicineId: it.medicineId ?? it.id ?? it.productId ?? null,
            }));
            // Since we use the global Cart Context, we do not need to populate incoming cart items.
          }
        } catch (e) {
          console.warn("Failed to parse cartItems from query params", e);
        }
      }
    } catch (e) {
      console.warn("Error parsing search params", e);
    }
  }, [searchParams?.isFromMedical, searchParams?.cartItems]);

  // Fallback: global cart
  useEffect(() => {
    try {
      const g = (global as any).__BOOKING_CART;
      if (g && Array.isArray(g) && g.length > 0) {
        setIsFromMedicalFlag(true);
        try {
          (global as any).__BOOKING_CART = null;
        } catch (e) { }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Medicine cart totals
  const itemsTotal = useMemo(() => {
    return cartItems.reduce((sum: number, it: any) => {
      const p = Number(it.price || 0);
      const q = Number(it.quantity || 1);
      return sum + p * q;
    }, 0);
  }, [cartItems]);

  const deliveryCharges = useMemo(() => {
    if (itemsTotal === 0) return 0;
    return itemsTotal < 500 ? 50 : 0;
  }, [itemsTotal]);

  const displayedTotal = useMemo(
    () => itemsTotal + deliveryCharges,
    [itemsTotal, deliveryCharges]
  );

  // Quantity handlers for medical cart items
  const handleIncreaseQuantity = async (index: number) => {
    const item = cartItems[index];
    if (item && item.cartId) {
      await updateQuantity(item.cartId, item.quantity + 1, item.id);
    }
  };

  const handleDecreaseQuantity = async (index: number) => {
    const item = cartItems[index];
    if (!item) return;

    const currentQty = Number(item.quantity || 1);

    if (currentQty <= 1) {
      if (item.cartId) {
        await removeItem(item.cartId, item.id);
        setToastMessageMed({
          title: "Item Removed",
          subtitle: "Medicine removed from cart.",
          type: "success",
        });
        setShowToastMed(true);
      }
    } else {
      if (item.cartId) {
        await updateQuantity(item.cartId, currentQty - 1, item.id);
      }
    }
  };

  // Medicine: date format DD/MM/YYYY
  const formatDateMed = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  // Medicine: build order payload for /api/medicine-orders/save-order
  const buildMedOrderPayload = (paymentData?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const isSelfService = patientType === "self";

    // Get current date in yyyy-mm-dd format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const payload: any = {
      medicineOrderId: 0,
      orderType: "Medicine",
      patientId: userData?.e_id || 0,
      address: selectedLocation?.address || "",
      hNo: selectedLocation?.houseNumber || "",
      landMark: selectedLocation?.landmark || "",
      addressNickname: selectedLocation?.nickname
        ? selectedLocation.nickname.charAt(0).toUpperCase() + selectedLocation.nickname.slice(1)
        : "",
      deliveryDate: formattedDate,
      timeSlot: selectedTimeSlot || "",
      isSelfService,
      paymentDetails: displayedTotal.toFixed(2),
      isPaymentDone: !!paymentData,
      createdBy: userData?.e_id || 0,
      statusId: statusId,
      handlingFee: 0,
      deliveryCharges: deliveryCharges,
      expectedDeliveryDate: formattedDate,
      deliveryNotes: "",
      razorpayOrderId: paymentData?.razorpayOrderId || "",
      razorpayPaymentId: paymentData?.razorpayPaymentId || "",
      razorpaySignature: paymentData?.razorpaySignature || "",
      paymentAmount: Number(displayedTotal.toFixed(2)),
      cartItems: cartItems.map((ci: any) => ({
        cartId: ci.cartId || 0,
        medicineOrderId: 0,
        medicineId: ci.medicineId || 0,
        patientId: userData?.e_id || 0,
        medicineName: ci.medicineName || ci.name || "",
        quantity: ci.quantity || 1,
        price: ci.price || 0,
        offer: ci.offer || 0,
        discount: ci.discount || 0,
        totalPrice: Number(((ci.price || 0) * (ci.quantity || 1)).toFixed(2)),
        description: ci.description || "",
      })),
    };
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
    return payload;
  };
  console.log("buildMedOrderPayload:", JSON.stringify(buildMedOrderPayload(), null, 2));
  // Medicine: save order after payment
  const saveMedOrder = async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const payload = buildMedOrderPayload(paymentData);
    console.log("📤 Medicine Save Order Request Payload:", JSON.stringify(payload, null, 2));
    try {
      const response: any = await axiosClient.post(
        ApiRoutes.MedicalOrders.saveOrder,
        payload
      );
      console.log("📥 Medicine Save Order Response:", JSON.stringify(response, null, 2));
      if (response && (response.isSuccess || response.success)) {
        console.log("✅ Medicine Order Success. Showing toast and starting timeout...");
        setToastMessageMed({
          title: "Order Success",
          subtitle: response.message || "Your medicine order was placed successfully!",
          type: "success",
        });
        setShowToastMed(true);
        setTimeout(() => {
          console.log("🕒 Timeout finished. Closing modal and navigating...");
          setShowToastMed(false);
          setShowPayment(false);
          if (onClose) {
            console.log("Calling onClose...");
            onClose();
          }
          console.log("Navigating to orders screen...");
          router.replace("/(main)/orders");
        }, 1500);
      } else {
        console.log("❌ Medicine Order Failed:", response?.message);
        setToastMessageMed({
          title: "Order Failed",
          subtitle: response?.message || "Failed to place order.",
          type: "error",
        });
        setShowToastMed(true);
      }
    } catch (error) {
      console.error("[Booking] saveMedOrder error:", error);
      setToastMessageMed({
        title: "Order Error",
        subtitle: "Something went wrong.",
        type: "error",
      });
      setShowToastMed(true);
    }
  };

  // Medicine: handleBookNow (now like lab flow)
  const handleBookNowMed = async () => {
    if (cartItems.length === 0) {
      setToastMessageMed({
        title: "Cart Empty",
        subtitle: "No medicines selected",
        type: "error",
      });
      setShowToastMed(true);
      return;
    }

    // Validate address, date, timeSlot
    if (!selectedLocation) {
      setErrors("Please select or add new address");
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      return;
    }

    // Validate patient details
    if (patientType === "others") {
      let newFieldErrors = { relation: "", fullName: "", age: "", gender: "" };
      let hasError = false;
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
      if (hasError) return;
    } else {
      setFieldErrors({ relation: "", fullName: "", age: "", gender: "" });
      setErrors("");
    }

    try {
      const query = `?amount=${Math.round(displayedTotal * 100)}&patientId=${userData?.e_id || 0}`;
      console.log("📤 Razorpay Order Request:", ApiRoutes.LabOrders.RazopayOrder + query);
      const orderRes: any = await axiosClient.get(
        ApiRoutes.LabOrders.RazopayOrder + query
      );
      console.log("📥 Razorpay Order Response:", JSON.stringify(orderRes, null, 2));
      if (orderRes && orderRes.isSuccess && orderRes.order_id) {
        setRazorpayOrderId(orderRes.order_id);
        setShowPayment(true);
      } else {
        setToastMessageMed({
          title: "Order Error",
          subtitle: orderRes?.message || "Failed to create payment order.",
          type: "error",
        });
        setShowToastMed(true);
      }
    } catch (err) {
      setToastMessageMed({
        title: "Order Error",
        subtitle: "Failed to create payment order.",
        type: "error",
      });
      setShowToastMed(true);
    }
  };



  const handleMedDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      if (errors === "Please select delivery date") setErrors("");
    }
  };

  const closeHandler = () => {
    if (onClose) return onClose();
    router.back();
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  if (isFromMedicalFlag) {
    // ─── MEDICINE FLOW RENDER ─────────────────────────────────────────
    const content = (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order Info</Text>
            <TouchableOpacity onPress={closeHandler} style={styles.closeButton}>
              <Image source={images.icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Medicine List */}
            <CartItemsList
              items={cartItems.map((it: any, idx: number) => ({
                id: (it.medicineId ?? it.id ?? idx).toString(),
                name: it.medicineName || it.name || "",
                price: Number(it.price || 0),
                quantity: Number(it.quantity || 1),
                subtitle: it.pack || it.subtitle || "",
                description: it.description || "",
                cartId: it.cartId
              }))}
              onIncreaseQuantity={(id) => {
                const idx = cartItems.findIndex((it: any, i: number) => (it.medicineId ?? it.id ?? i).toString() === id);
                if (idx !== -1) handleIncreaseQuantity(idx);
              }}
              onDecreaseQuantity={(id) => {
                const idx = cartItems.findIndex((it: any, i: number) => (it.medicineId ?? it.id ?? i).toString() === id);
                if (idx !== -1) handleDecreaseQuantity(idx);
              }}
              itemsTotal={itemsTotal}
              deliveryCharges={deliveryCharges}
              displayedTotal={displayedTotal}
            />

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
                      onPress={handleEditAddress}
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
                    + Add your service address
                  </Button>
                </View>
              )}
              {errors === "Please select or add new address" && (
                <Text
                  style={{ color: "#ff0000", fontSize: 13, marginTop: 4, fontFamily: fonts.regular }}
                >
                  {errors}
                </Text>
              )}
              <View
                style={{
                  backgroundColor: "#FBFBFB",
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  marginTop: selectedLocation ? 12 : 0,
                }}
              />
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.relation}</Text>
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.fullName}</Text>
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.age}</Text>
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.gender}</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Cancellation Policy */}
            <View style={styles.cancellsection}>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <View style={styles.policyCard}>
                <Text style={styles.policyText}>
                  Free cancellation is done more than 2 hrs before the service
                  or if a professional isn&apos;t assigned. A fee will be charged
                  otherwise.
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
              title={`Confirm & Pay \u20B9${displayedTotal.toFixed(0)}`}
              onPress={handleBookNowMed}
              style={{ width: "100%" }}
            />
          </View>

          {/* Payment Gateway Modal for Medicine (like lab flow) */}
          <Modal
            visible={showPayment}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => {
              setShowPayment(false);
              setToastMessageMed({
                title: "Payment Not Completed",
                subtitle: "You exited before completing the payment.",
                type: "error",
              });
              setShowToastMed(true);
            }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <RazorpayPaymentScreen
                key={razorpayOrderId}
                amount={Math.round(displayedTotal * 100)}
                name={userData?.fullName || ""}
                email={userData?.emailAddress || ""}
                contact={userData?.mobileNo || ""}
                orderId={razorpayOrderId}
                onSuccess={(data) => {
                  setShowPayment(false);
                  saveMedOrder({
                    razorpayOrderId:
                      data.razorpay_order_id || razorpayOrderId || "",
                    razorpayPaymentId: data.razorpay_payment_id || "",
                    razorpaySignature: data.razorpay_signature || "",
                  });
                }}
                onFailure={(err) => {
                  setShowConfirmExit(false);
                  setTimeout(() => {
                    setShowPayment(false);
                    if (err?.cancelled) {
                      setToastMessageMed({
                        title: "Payment Cancelled",
                        subtitle: "Payment not completed.",
                        type: "error",
                      });
                      setShowToastMed(true);
                    } else {
                      setToastMessageMed({
                        title: "Payment Failed",
                        subtitle: "Your payment was not completed.",
                        type: "error",
                      });
                      setShowToastMed(true);
                    }
                  }, 300);
                }}
              />
            </SafeAreaView>
          </Modal>

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
                {labRelationTypes.map((relation, index) => (
                  <TouchableOpacity
                    key={relation.masterDataId}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedRelation(relation);
                      if (fieldErrors && typeof setFieldErrors === 'function') {
                        setFieldErrors((prev) => ({ ...prev, relation: "" }));
                      }
                      setShowRelationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{relation.name}</Text>
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
                      if (fieldErrors && typeof setFieldErrors === 'function') {
                        setFieldErrors((prev) => ({ ...prev, gender: "" }));
                      }
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
              onChange={handleMedDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* All Address View Modal */}
          {userData?.e_id && (
            <AddressSelection
              visible={addressVisible}
              patientId={userData?.e_id}
              onSelect={(addressId) => {
                setAddressVisible(false);
                if (addressId) {
                  fetchAddressById(addressId.toString());
                }
              }}
              onAddNew={() => {
                setEditAddressId(null);
                setAddressVisible(false);
                setLocationModalVisible(true);
              }}
              onEdit={(addressId) => {
                setAddressVisible(false);
                setEditAddressId(addressId);
                setLocationModalVisible(true);
              }}
              onClose={() => setAddressVisible(false)}
            />
          )}

          {/* Location Selection Modal */}
          <LocationSelection
            visible={locationModalVisible}
            addressId={editAddressId}
            onClose={() => setLocationModalVisible(false)}
            onLocationSelected={(newAddress) => {
              setSavedAddresses((prev) => [
                ...prev,
                { id: Date.now().toString(), ...newAddress },
              ]);
              setLocationModalVisible(false);
              setAddressVisible(true);
            }}
          />

          {/* Toast Notification */}
          <Toast
            visible={showToastMed}
            title={toastMessageMed.title}
            subtitle={toastMessageMed.subtitle}
            onHide={() => setShowToastMed(false)}
            duration={3000}
          />
        </View>
      </SafeAreaView>
    );

    // If this component was opened as a modal (visible prop provided), wrap content in Modal
    if (visible) {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeHandler}
        >
          {content}
        </Modal>
      );
    }
    return content;
  }

  // ─── LAB TEST FLOW RENDER ───────────────────────────────────────────
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
                    {isAtHome ? "AT HOME" : "AT Lab"}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: "#000000", fontFamily: fonts.regular }}>
                  Report within {reportTime}
                </Text>

                <View style={styles.serviceDivider} />

                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>
                    {"\u20B9"}
                    {servicePrice}
                  </Text>
                  <TouchableOpacity
                    style={styles.editAddressButton1}
                    onPress={handleEdit}
                  >
                    <Text style={styles.editAddressText}>Edit</Text>
                  </TouchableOpacity>

                  {/* <SecondaryButton
                    title="Edit"
                    onPress={handleEdit}
                    width={50}
                    height={25}
                  /> */}
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
                      onPress={handleEditAddress}
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
                    +  Add New Address
                  </Button>
                </View>
              ) : (
                <View style={styles.addressCard}>
                  <Text style={{ color: '#999', fontSize: 12, marginBottom: 0, fontFamily: fonts.regular }}>
                    No address found. Please add a new address.
                  </Text>
                  <TouchableOpacity
                    style={styles.addnewaddressButton}
                    onPress={handleViewAddress}
                  >
                    <Text style={styles.AddressText}>+ Add New Address</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors === "Please select or add new address" && (
                <Text
                  style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                >
                  {errors}
                </Text>
              )}
            </View>

            {/* Sample Pickup Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Sample Pickup Date & Time
              </Text>
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
                      {selectedDate
                        ? formatDateLab(selectedDate)
                        : "dd/mm/yyyy"}
                    </Text>
                    <Image
                      source={images.icons.calendar}
                      style={styles.calendarIcon}
                    />
                  </TouchableOpacity>
                  {errors === "Please select service start date" && (
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4, fontFamily: fonts.regular }}
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
                          selectedTimeSlot === slot && styles.selectedTimeSlot,
                        ]}
                        onPress={() => {
                          setSelectedTimeSlot(slot);
                          if (errors === "Please select time slot")
                            setErrors("");
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
                    <Text
                      style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                    >
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
                            : "Select"}
                        </Text>
                        <View style={styles.dropdownIcon} />
                      </TouchableOpacity>
                      {fieldErrors.relation ? (
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.relation}</Text>
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.fullName}</Text>
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
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.age}</Text>
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
                        <View style={styles.dropdownIcon} />
                      </TouchableOpacity>
                      {fieldErrors.gender ? (
                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>{fieldErrors.gender}</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.deliveryCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#333", fontFamily: fonts.regular }}>
                    Item Price
                  </Text>
                  <Text style={{ fontSize: 14, color: "#333", fontFamily: fonts.medium }}>
                    {"\u20B9"}
                    {servicePrice}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#333", fontFamily: fonts.regular }}>
                    Offer Discount ({discountPercent}%)
                  </Text>
                  <Text style={{ fontSize: 14, color: "#C15E9C", fontFamily: fonts.medium }}>
                    -{"\u20B9"}
                    {discountAmount}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#eee",
                    marginVertical: 8,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "#333", fontFamily: fonts.bold }}
                  >
                    To Pay
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 14,
                      color: colors.primary,
                    }}
                  >
                    {"\u20B9"}
                    {totalAmount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cancellation Policy */}
            <View style={styles.cancellsection}>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <View style={styles.policyCard}>
                <Text style={styles.policyText}>
                  Free cancellation is done more than 2 hrs before the service
                  or if a professional isn&apos;t assigned. A fee will be charged
                  otherwise.
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
              title={`Confirm &  Pay \u20B9${totalAmount}`}
              onPress={handleBookNowLab}
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
                {labRelationTypes.map((relation, index) => (
                  <TouchableOpacity
                    key={relation.masterDataId}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedRelation(relation);
                      if (fieldErrors && typeof setFieldErrors === 'function') {
                        setFieldErrors((prev) => ({ ...prev, relation: "" }));
                      }
                      setShowRelationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{relation.name}</Text>
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
                      if (fieldErrors && typeof setFieldErrors === 'function') {
                        setFieldErrors((prev) => ({ ...prev, gender: "" }));
                      }
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

          {/* Razorpay Payment Modal */}
          <Modal
            visible={showPayment}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => {
              setShowPayment(false);
              if (isFromMedicalFlag) {
                setToastMessageMed({
                  title: "Payment Not Completed",
                  subtitle: "You exited before completing the payment.",
                  type: "error",
                });
                setShowToastMed(true);
              } else {
                setToastMessageLab({
                  title: "Payment Not Completed",
                  subtitle: "You exited before completing the payment.",
                  type: "error",
                });
                setShowToastLab(true);
              }
            }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <RazorpayPaymentScreen
                key={razorpayOrderId}
                amount={isFromMedicalFlag ? Math.round(displayedTotal * 100) : totalAmount * 100}
                name={userData?.fullName || ""}
                email={userData?.emailAddress || ""}
                contact={userData?.mobileNo || ""}
                orderId={razorpayOrderId}
                onSuccess={(data) => {
                  setShowPayment(false);
                  if (isFromMedicalFlag) {
                    saveMedOrder({
                      razorpayOrderId:
                        data.razorpay_order_id || razorpayOrderId || "",
                      razorpayPaymentId: data.razorpay_payment_id || "",
                      razorpaySignature: data.razorpay_signature || "",
                    });
                  } else {
                    saveLabOrder({
                      razorpayOrderId:
                        data.razorpay_order_id || razorpayOrderId || "",
                      razorpayPaymentId: data.razorpay_payment_id || "",
                      razorpaySignature: data.razorpay_signature || "",
                    });
                  }
                }}
                onFailure={(err) => {
                  setShowConfirmExit(false);
                  setTimeout(() => {
                    setShowPayment(false);
                    if (err?.cancelled) {
                      if (isFromMedicalFlag) {
                        setToastMessageMed({
                          title: "Payment Cancelled",
                          subtitle: "Payment not completed.",
                          type: "error",
                        });
                        setShowToastMed(true);
                      } else {
                        setToastMessageLab({
                          title: "Payment Cancelled",
                          subtitle: "Payment not completed.",
                          type: "error",
                        });
                        setShowToastLab(true);
                      }
                    } else {
                      if (isFromMedicalFlag) {
                        setToastMessageMed({
                          title: "Payment Failed",
                          subtitle: "Your payment was not completed.",
                          type: "error",
                        });
                        setShowToastMed(true);
                      } else {
                        setToastMessageLab({
                          title: "Payment Failed",
                          subtitle: "Your payment was not completed.",
                          type: "error",
                        });
                        setShowToastLab(true);
                      }
                    }
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
              onChange={handleLabDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* All Address View Modal */}
          {userData?.e_id && (
            <AddressSelection
              visible={addressVisible}
              patientId={userData?.e_id}
              onSelect={(addressId) => {
                setAddressVisible(false);
                if (addressId) {
                  fetchAddressById(addressId.toString());
                }
              }}
              onAddNew={() => {
                setEditAddressId(null);
                setAddressVisible(false);
                setLocationModalVisible(true);
              }}
              onEdit={(addressId) => {
                setAddressVisible(false);
                setEditAddressId(addressId);
                setLocationModalVisible(true);
              }}
              onClose={() => setAddressVisible(false)}
            />
          )}

          {/* Location Selection Modal */}
          <LocationSelection
            visible={locationModalVisible}
            addressId={editAddressId}
            onClose={() => setLocationModalVisible(false)}
            onLocationSelected={(newAddress) => {
              setSavedAddresses((prev) => [
                ...prev,
                { id: Date.now().toString(), ...newAddress },
              ]);
              setLocationModalVisible(false);
              setAddressVisible(true);
            }}
          />
        </View>
      </SafeAreaView>

      {/* Toast Notification */}
      <Toast
        visible={showToastLab}
        title={toastMessageLab.title}
        subtitle={toastMessageLab.subtitle}
        type={toastMessageLab.type}
        onHide={() => setShowToastLab(false)}
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
  },
  headerTitle: {
    fontSize: 16,
    color: "#202427",
    fontFamily: fonts.semiBold
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
  cancellsection: {
    marginTop: getResponsiveSpacing(10),
    marginBottom: getResponsiveSpacing(10),
  },
  sectionTitle: {
    fontSize: 13,
    color: "#000000",
    marginBottom: getResponsiveSpacing(2),
    fontFamily: fonts.semiBold
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
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
  },
  serviceName: {
    fontSize: 15,
    color: "#000000",
    flex: 1,
    fontFamily: fonts.semiBold
  },
  serviceLocation: {
    fontSize: 11,
    fontWeight: "400",
    color: "#000",
    fontFamily: fonts.regular
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
    fontSize: 16,
    color: colors.primary,
    fontFamily: fonts.semiBold
  },
  dateTimeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
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
    marginBottom: 3,
    fontFamily: fonts.medium
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
    fontFamily: fonts.regular
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
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#333",
    fontFamily: fonts.regular
  },
  selectedTimeSlot: {
    backgroundColor: "#C15E9C",
    borderColor: "#C15E9C",
  },
  timeSlotText: {
    fontSize: 11,
    color: "#333",
    fontFamily: fonts.regular
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
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
  },
  radioLabel: {
    fontSize: 13,
    color: "#2B2B2B",
    fontFamily: fonts.regular
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
    paddingBottom: 8,
    paddingTop: 10,
    color: "#333",
    backgroundColor: "#fff",
    fontSize: 13,
    fontFamily: fonts.regular
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
    fontFamily: fonts.regular
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: "#666",
  },
  policyCard: {},
  policyText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: fonts.regular
  },
  learnMoreButton: {
    alignSelf: "flex-start",
  },
  learnMoreText: {
    fontSize: 13,
    color: "#0881FC",
    fontWeight: "500",
    textDecorationLine: "underline",
    fontFamily: fonts.medium
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
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
    color: "#C15E9C",
    marginBottom: 4,
    fontFamily: fonts.semiBold
  },
  addressText: {
    fontSize: 12,
    color: "#000",
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: fonts.regular
  },
  landmarkText: {
    fontSize: 12,
    color: "#666",
    fontFamily: fonts.regular
  },
  editAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C15E9C",
  },
  addnewaddressButton: {
    borderRadius: 8,
    width: "50%",
    borderColor: "#0580FA",
    borderStyle: "solid",
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 12,
    textAlign: "center",
    marginTop: 12,
    height: 28,
  },
  AddressText: {
    color: "#0580FA", fontSize: 13, fontFamily: fonts.medium
  },
  editAddressButton1: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C15E9C",
  },
  editAddressText: {
    fontSize: 12,
    color: "#C15E9C",
    fontWeight: "500",
    fontFamily: fonts.regular
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
    fontFamily: fonts.regular
  },
  razorpaycloseButton: {
    position: "relative",
    top: 40,
    backgroundColor: "#fff",
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    padding: 8,
  },
});
