
import React, { useEffect, useState } from "react";
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { RadioButton, Checkbox } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StatusBar } from 'react-native';
import { images } from "../../../assets";
import axiosClient from "@/src/api/axiosClient";
import DateTimePicker from "@react-native-community/datetimepicker";
import ApiRoutes from "@/src/api/employee/employee";
import { fontStyles, fonts } from "../../shared/styles/fonts";
import { Button } from "react-native-paper";
import { getResponsiveSpacing } from "@/app/shared/utils/responsive";
import Toast from "../../shared/components/Toast";
import { colors } from "../..//shared/styles/commonStyles";
import VideoOrderDetails from "@/app/shared/components/doctor/VideoOrderDetails";
interface OrderDetailsProps {
    visible: boolean;
    order: any;
    statusName: string;
    onClose: () => void;
    refreshOrders?: () => void | Promise<void>;
}
interface LabOrderDetails {
    success: boolean;
    data: {
        gender: string;
        age: number;
        patientName: string;
        labOrderId: number;
        bookingId: number;
        testName: string;
        patientId: number;
        address: string;
        hNo: string;
        landMark: string;
        addressNickname: string;
        serviceDate: string;
        timeSlot: string;
        isSelfService: boolean;
        relationId: number;
        relationName: string;
        relationAge: number;
        relationGender: string;
        paymentDetails: string;
        isPaymentDone: boolean;
        createdBy: number;
        labPartnerId: number;
        labTestMasterId: number;
        requestNo: string;
        statusId: number;
        cancelBooking: boolean;
        cancelReason: string | null;
        scaId: number | null;
        scaname: string | null;
        sampleCollectionDateTime: string | null;
        isVerified: boolean;
        createdOn: string;
    };
}


function OrderDetails({ visible, order, onClose, refreshOrders }: OrderDetailsProps) {
    const insets = useSafeAreaInsets();

    const handleCancelPress = () => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order?",
            [
                {
                    text: "No",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: () => setShowCancelModal(true)
                }
            ]
        );
    };
    // PDF preview state
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
    const [encodedPdfUrl, setEncodedPdfUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [labReports, setLabReports] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const SLOT_GROUPS = {
        morning: ["09:00 AM", "09:30 AM", "10:00 AM"],
        afternoon: ["01:00 PM", "01:30 PM", "02:00 PM"],
        evening: ["06:00 PM", "06:30 PM", "07:00 PM"],
    };

    const labTimeSlots =
        ["07:00 AM - 08:00 AM", "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM"];
    // Helper: get reports array from labReports (API)
    function getReports() {
        return labReports;
    }
    // Helper: get category and icon for report orderType
    function getCategoryAndIcon(orderType: string) {
        let category = '';
        let iconSource = null;
        switch (orderType) {
            case "Single Test":
                category = "Lab Test";
                iconSource = images.labicon;
                break;
            case "Package":
                category = "Health Check Up";
                iconSource = images.labicon;
                break;
            case "Xray":
                category = "Xray";
                iconSource = images.labicon;
                break;
            case "Medicine":
                category = "Medicine";
                iconSource = images.medicalicon;
                break;
            case "Consultation":
                category = "Consultation";
                iconSource = images.consultationicon;
                break;
            default:
                category = orderType || '';
                iconSource = null;
        }
        return { category, iconSource };
    }
    const navigation = useNavigation();
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [cancelReason, setCancelReason] = useState('Sample Collection agent not assigned');
    const [newRescheduleDate, setNewRescheduleDate] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
    const [errors, setErrors] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    // For patient profile
    const [patientProfile, setPatientProfile] = useState<any>(null);
    const [patientId, setPatientId] = useState<number | null>(null);
    // Status color maps based on serviceName

    const handleMedDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) {
            setSelectedDate(selectedDate);
            if (errors === "Please select reschedule date") setErrors("");
        }
    };
    const handleLabDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (date) {
            setSelectedDate(date);
            setNewRescheduleDate(formatDateLab(date));
            if (errors === "Please select service start date") setErrors("");
        }
    };

    const formatDateLab = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const statusColors: { [key: string]: string } = {
        Requested: "#d0eaff",
        Completed: "#ccface",
        Cancelled: "#ffd8d5",
        Inprogress: "#f8d7a7",
        Ongoing: "#f7cdff",
        Pending: "#ffeeba",
        Rescheduled: "#bbecf3",
    };
    const statusTextColors: { [key: string]: string } = {
        Requested: "#006cc5",
        Completed: "#4CAF50",
        Cancelled: "#F44336",
        Inprogress: "#FF9800",
        Ongoing: "#9C27B0",
        Pending: "#FFC107",
        Rescheduled: "#00BCD4",
    };
    // Use serviceName for color lookup, fallback to statusName, fallback to N/A
    const statusKey = (order && (order.serviceName || order.statusName)) || "N/A";
    const statusColor = statusColors[statusKey] || "#666";
    const statusTextColor = statusTextColors[statusKey] || "#000";
    useEffect(() => {
        console.log("Order in useEffect1:", order);
        if (!order) return;
        console.log("Checking statusName and patientId:", order.statusName, order.patientId);
        setLoading(true);
        // Fetch order details as before
        if (["Package", "Single Test", "Xray"].includes(order.orderType)) {
            fetchLabOrderById(order.masterId).then((data) => {
                // Ensure statusName is always present in data
                const labData = data.data || data || {};
                if (!labData.statusName && order.statusName) {
                    labData.statusName = order.statusName;
                }
                setOrderDetails({ type: "lab", data: labData });
                setLoading(false);
            });
        } else if (order.orderType === "Medicine") {
            fetchMedicineOrderById(order.masterId).then((data) => {
                setOrderDetails({ type: "medicine", data: data.data || data || {} });
                // Get patientId from first medicine item (all have same patientId)
                let medArr = Array.isArray(data) ? data : [];
                if (medArr.length > 0 && medArr[0].patientId) {
                    const pid = medArr[0].patientId;
                    setPatientId(pid);
                    axiosClient.get(ApiRoutes.Employee.getById(pid)).then((response) => {
                        const data = response?.data ?? response;
                        setPatientProfile(data);
                    }).catch(() => setPatientProfile(null));
                } else {
                    setPatientProfile(null);
                }
                setLoading(false);
            });
        } else if (order.orderType === "Consultation") {
            fetchConsultationById(order.masterId).then((data) => {
                setOrderDetails({ type: "consultation", data: data.data || data || {} });
                setLoading(false);
            });
        }
        else if (order.orderType === "Ambulance") {
            console.log("Fetching ambulance booking details for masterId:", order.masterId);
            fetchAmulanceOrderById(order.masterId).then((data) => {
                console.log("Ambulance Booking Details:", data);
                setOrderDetails({ type: "ambulance", data: data.data || data || {} });
                setLoading(false);
            });
        }
        else {
            setOrderDetails(null);
            setLoading(false);
        }
        // Removed: lab reports fetch logic now handled in a separate effect after orderDetails is set
        setLabReports([]);
    }, [order]);

    // Fetch lab reports after orderDetails is set and has patientId
    useEffect(() => {
        if (
            orderDetails &&
            (orderDetails.data.statusName === 'Completed' || orderDetails.data.statusName === 'completed' || orderDetails.statusName === 'Completed') &&
            orderDetails.data.labOrderId
        ) {
            console.log("Fetching lab reports for patientId (orderDetails):", orderDetails.data.labOrderId);
            axiosClient.get(ApiRoutes.LabOrders.GetReportsByLabOrderId(orderDetails.data.labOrderId)).then((response) => {
                console.log("Lab Reports Response (orderDetails):", response);
                if (Array.isArray(response)) {
                    setLabReports(response);
                } else if (Array.isArray(response?.data)) {
                    setLabReports(response.data);
                } else {
                    setLabReports([]);
                }
            }).catch(() => setLabReports([]));
        } else {
            setLabReports([]);
        }
    }, [orderDetails]);

    async function fetchLabOrderById(labOrderId: number): Promise<any> {
        try {
            const response = await axiosClient.get(ApiRoutes.LabOrders.getLabOrderById(labOrderId));
            console.log("Lab Order Details:", response);
            return response;
        } catch (error) {
            return { success: false, data: {} };
        }
    }


    async function fetchMedicineOrderById(medicineOrderId: number): Promise<any> {
        try {
            const response = await axiosClient.get(ApiRoutes.MedicalOrders.getMedicalOrderFullById(medicineOrderId));
            console.log("Medicine Order Details:", response);
            return response;
        } catch (error) {
            return { success: false, data: {} };
        }
    }


    async function fetchConsultationById(appointmentId: number): Promise<any> {
        try {
            const response = await axiosClient.get(ApiRoutes.ConsultationsData.getappointmentById(appointmentId));
            console.log("Consultation Details:", response);
            return response;
        } catch (error) {
            return { success: false, data: {} };
        }
    }

    async function fetchAmulanceOrderById(bookingId: number): Promise<any> {
        try {
            const response = await axiosClient.get(ApiRoutes.Ambulance.getbookingId(bookingId));
            console.log("Ambulance Order Details:", response);
            return response;
        } catch (error) {
            return { success: false, data: {} };
        }
    }

    const handleSlotSelect = (time: string) => {
        setSelectedSlot(time);
    };


    if (!order) return null;
    // Helper: statusName check for button display
    const canReschedule = ["Requested", "Inprogress"].includes(order.statusName);
    const canCancel = ["Requested", "Inprogress"].includes(order.statusName);
    const canCompleted = ["Completed"].includes(order.statusName);

    // Removed patientId effect; now handled after fetchMedicineOrderById resolves
    // Helper: Render Reschedule Modal
    const renderRescheduleModal = () => (
        <Modal visible={showRescheduleModal} transparent animationType="slide" onRequestClose={() => setShowRescheduleModal(false)}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomModal}>
                        <View style={styles.modalHeaderRow}>
                            {orderDetails?.type === 'consultation' && (
                                <Text style={styles.modalHeading}>Reschedule Consultation</Text>
                            )}
                            {orderDetails?.type === 'lab' && (
                                <Text style={styles.modalHeading}>Reschedule Order</Text>
                            )}
                            <TouchableOpacity onPress={() => setShowRescheduleModal(false)} style={styles.modalCloseBtn}>
                                <Image source={images.icons.close} style={styles.modalCloseIcon} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabelBold}>Reason for Reschedule</Text>
                        <View>
                            <TouchableOpacity
                                style={styles.radioButtonContainer}
                                onPress={() => setRescheduleReason("Professional not assigned")}
                            >
                                <RadioButton.Android
                                    value="Professional not assigned"
                                    status={rescheduleReason === "Professional not assigned" ? 'checked' : 'unchecked'}
                                    onPress={() => setRescheduleReason("Professional not assigned")}
                                    color="#C35E9D"
                                    uncheckedColor="#8E8E93"
                                />
                                <Text style={styles.radioButtonLabel}>Professional not assigned</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioButtonContainer}
                                onPress={() => setRescheduleReason("Service required at a different time")}
                            >
                                <RadioButton.Android
                                    value="Service required at a different time"
                                    status={rescheduleReason === "Service required at a different time" ? 'checked' : 'unchecked'}
                                    onPress={() => setRescheduleReason("Service required at a different time")}
                                    color="#C35E9D"
                                    uncheckedColor="#8E8E93"
                                />
                                <Text style={styles.radioButtonLabel}>Service required at a different time</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datesection}>
                        <Text style={styles.modalLabelBold}>Reschedule Date</Text>
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
                        {/* DateTimePicker rendered inside modal */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleLabDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                          {errors === "Please select date" && (
                                        <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>
                                          {errors}
                                        </Text>
                                      )}
                                      </View>

                        <View style={styles.timeSection}>
                            <Text style={styles.modalLabelBold}>Select Time Slot</Text>
                            <View style={styles.timeSlotsContainer}>
                                {orderDetails?.type === 'consultation' ? (
                                    <View style={{ marginTop: 0 }}>
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
                                ) : (
                                    <View style={{ marginTop: 0 }}>
                                        <View style={styles.chipContainer}>
                                            {labTimeSlots.map((time) => (
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
                                )}
                            </View>
                            {errors === "Please select time slot" && (
                                <Text style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}>
                                    {errors}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.rescheduleButton} onPress={async () => {
                            // Validation for required fields
                            if (orderDetails?.type === 'consultation') {
                               
                                if (!newRescheduleDate) {
                                    setErrors('Please select reschedule date');
                                    return;
                                }
                                if (!selectedSlot) {
                                    setErrors('Please select time slot');
                                    return;
                                }
                                const payload: any = {
                                    appointmentId: orderDetails.data.appointmentId,
                                    scheduleDate: newRescheduleDate,
                                    reason: rescheduleReason,
                                    scheduleBetween: selectedSlot,
                                    modifiedBy: orderDetails.data.patientId
                                };
                                console.log("Payload of consultation reschedule:", payload);
                                try {
                                    const responsce = await axiosClient.put(ApiRoutes.ConsultationsData.rescheduleAppointment, payload);
                                    console.log("Consultation Reschedule Response:", responsce);
                                    setShowRescheduleModal(false);
                                    setToastMessage({
                                        title: 'Reschedule Success',
                                        subtitle: 'Booking rescheduled successfully!',
                                        type: 'success',
                                    });
                                    setShowToast(true);
                                    // Clear fields after success
                                    setRescheduleReason('');
                                    setSelectedSlot(null);
                                    setSelectedDate(null);
                                    setNewRescheduleDate('');
                                    setErrors("");
                                    setTimeout(() => {
                                        setShowToast(false);
                                        if (refreshOrders) refreshOrders();
                                        onClose && onClose();
                                    }, 3500);
                                } catch (e) {
                                    setToastMessage({
                                        title: 'Reschedule Failed',
                                        subtitle: 'Failed to reschedule.',
                                        type: 'error',
                                    });
                                    setShowToast(true);
                                }
                            }
                            if (orderDetails?.type === 'lab') {
                                
                                if (!newRescheduleDate) {
                                    setErrors('Please select service start date');
                                    return;
                                }
                                if (!selectedSlot) {
                                    setErrors('Please select time slot');
                                    return;
                                }
                                const payload: any = {
                                    labOrderId: order.masterId,
                                    serviceDate: newRescheduleDate,
                                    timeSlot: selectedSlot,
                                    modifiedBy: orderDetails.data.patientId,
                                    reason: rescheduleReason
                                };
                                console.log("Payload of lab reschedule:", payload);
                                try {
                                    let responsce;
                                    responsce = await axiosClient.post(ApiRoutes.LabOrders.RescheduleLabScanOrders, payload);
                                    console.log("Lab Reschedule Response:", responsce);
                                    setShowRescheduleModal(false);
                                    setToastMessage({
                                        title: 'Reschedule Success',
                                        subtitle: 'Order rescheduled successfully!',
                                        type: 'success',
                                    });
                                    setShowToast(true);
                                    // Clear fields after success
                                    setRescheduleReason('');
                                    setSelectedSlot(null);
                                    setSelectedDate(null);
                                    setNewRescheduleDate('');
                                    setErrors("");
                                    setTimeout(() => {
                                        setShowToast(false);
                                        if (refreshOrders) refreshOrders();
                                        onClose && onClose();
                                    }, 3500);
                                } catch (e) {
                                    setToastMessage({
                                        title: 'Reschedule Failed',
                                        subtitle: 'Failed to reschedule.',
                                        type: 'error',
                                    });
                                    setShowToast(true);
                                }
                            }
                        }}>
                            {orderDetails?.type === 'consultation' && (
                                <Text style={styles.reshduletext}>Reschedule Booking</Text>
                            )}
                            {orderDetails?.type === 'lab' && (
                                <Text style={styles.reshduletext}>Reschedule Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );

    // Helper: Render Cancel Modal
    const renderCancelModal = () => (
        <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomModal}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalHeading}>Order cancel</Text>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)} style={styles.modalCloseBtn}>
                                <Image source={images.icons.close} style={styles.modalCloseIcon} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubheading}>Are you sure you want to cancel your order?</Text>

                        <Text style={styles.modalLabelBold}>Reason for cancellation</Text>

                        <View>
                            {[
                                "Sample Collection agent not assigned",
                                "Service required at a different time",
                                "High Price",
                                "Other reasons"
                            ].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={styles.radioButtonContainer}
                                    onPress={() => setCancelReason(reason)}
                                >
                                    <RadioButton.Android
                                        value={reason}
                                        status={cancelReason === reason ? 'checked' : 'unchecked'}
                                        onPress={() => setCancelReason(reason)}
                                        color="#C35E9D"
                                        uncheckedColor="#8E8E93"
                                    />
                                    <Text style={styles.radioButtonLabel}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            disabled={!cancelReason}
                            onPress={async () => {
                                if (!cancelReason || cancelReason.trim() === "") {
                                    setToastMessage({
                                        title: "Cancel Failed",
                                        subtitle: "Please select a reason for cancellation.",
                                        type: "error",
                                    });
                                    setShowToast(true);
                                    return;
                                }
                                try {
                                    if (orderDetails?.type === 'lab') {
                                        await axiosClient.post(
                                            `${ApiRoutes.LabOrders.cancelOrder}?labOrderId=${order.masterId}&cancelReason=${encodeURIComponent(cancelReason)}`,
                                            {}
                                        );
                                    } else if (orderDetails?.type === 'medicine') {
                                        await axiosClient.post(ApiRoutes.MedicalOrders.medicineCancel, {
                                            medicineOrderId: order.masterId,
                                            cancelReason: cancelReason
                                        });
                                    }
                                    setShowCancelModal(false);
                                    setToastMessage({
                                        title: 'Order Cancelled',
                                        subtitle: 'Order cancelled successfully!',
                                        type: 'success',
                                    });
                                    setShowToast(true);
                                    setTimeout(() => {
                                        setShowToast(false);
                                        if (refreshOrders) refreshOrders();
                                        onClose && onClose();
                                    }, 3500);
                                } catch (e) {
                                    setToastMessage({
                                        title: 'Cancel Failed',
                                        subtitle: 'Failed to cancel order.',
                                        type: 'error',
                                    });
                                    setShowToast(true);
                                }
                            }}
                        >
                            <Text style={{ color: 'rgba(195, 94, 157, 1)', fontFamily: fonts.medium, opacity: cancelReason ? 1 : 0.5 }}>Cancel Order</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

    );
    {
        showDatePicker && (
            <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleMedDateChange}
                minimumDate={new Date()}
            />
        )
    }
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        > <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <StatusBar barStyle="dark-content" />
                    {/* Header Section with safe area support for iOS */}
                    <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 10, paddingBottom: 15 }]}>
                        <Text style={styles.headerTitle}>Order Info</Text>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Image source={images.icons.close} style={styles.backIcon} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.container}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {loading ? (
                                <Text>Loading details...</Text>
                            ) : orderDetails && orderDetails.data ? (
                                <>
                                    {orderDetails.type === "lab" && (
                                        <View style={styles.servicepage}>
                                            {/* Service Information */}
                                            <Text style={styles.sectionTitle}>Service Information</Text>
                                            <View style={styles.databox}>
                                                <View style={styles.labelheaderdatabox}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Text style={styles.labelheader}>{orderDetails.data.testName}</Text>
                                                        <Text style={styles.labelinner}>
                                                            {(order.orderType === "Single Test" || order.orderType === "Package") ? "AT-HOME" : "AT Lab"}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.labelinner}>
                                                        {order.orderType === "Single Test" ? "Report within 10-12 hours" : "Report within 48-72 hours"}
                                                    </Text>
                                                </View>
                                                <View style={styles.datesection}>
                                                    <Text style={styles.label}>Sample pickup date & time</Text>
                                                    <Text style={styles.value}>{orderDetails.data.serviceDate?.split('T')[0] || "N/A"}, {orderDetails.data.timeSlot || "N/A"}</Text>
                                                </View>
                                                <View style={styles.paymentsection}>
                                                    <Text style={styles.paidlabel}>Paid Amount</Text>
                                                    <Text style={styles.paymentvalue}>₹{orderDetails.data.paymentDetails || "N/A"}</Text>
                                                </View>
                                                <View style={styles.servicesection}>
                                                    <Text style={styles.label}>Service Status:</Text>
                                                    <Text style={[styles.value, { backgroundColor: statusColor, color: statusTextColor, borderRadius: 30, marginTop: 3, marginBottom: 5, paddingHorizontal: 15, paddingVertical: 2, alignSelf: 'flex-start', fontSize: 11, fontFamily: fonts.regular }]}>
                                                        {(orderDetails.data.statusName === "Requested" || order.statusName === "Requested")
                                                            ? "In Progress"
                                                            : (orderDetails.data.statusName || order.statusName || "N/A")}
                                                    </Text>
                                                </View>
                                            </View>

                                            {order.orderType === "Xray" && (<>
                                                <Text style={styles.sectionTitle}>Diagstic Center Details</Text>
                                                <View style={styles.databox}>
                                                    <View style={styles.diagsticdetails}>
                                                        <Text style={styles.diagname}>{orderDetails.data.diagnosiscenter || "N/A"}</Text>

                                                    </View>
                                                    {/* <View style={styles.addressection}>
                                                <Text style={styles.value}>
                                                    {[
                                                        orderDetails.data.hNo ? orderDetails.data.hNo : null,
                                                        orderDetails.data.address ? orderDetails.data.address : null,
                                                        orderDetails.data.landMark ? orderDetails.data.landMark : null
                                                    ].filter(Boolean).join(', ') || 'N/A'}
                                                </Text>
                                            </View> */}
                                                </View>
                                            </>)}

                                            {/* Patient Details */}
                                            <Text style={styles.sectionTitle}>Address Info</Text>
                                            <View style={styles.databox}>
                                                <View style={{ padding: 16 }}>
                                                    <Text style={styles.patientname}>{orderDetails.data.patientName || "N/A"}</Text>
                                                    <Text style={styles.itemSubText}>
                                                        {orderDetails.data.isSelfService
                                                            ? [
                                                                orderDetails.data.age ? orderDetails.data.age + ' years' : null,
                                                                orderDetails.data.gender ? orderDetails.data.gender : null
                                                            ].filter(Boolean).join(', ') || 'N/A'
                                                            : [
                                                                orderDetails.data.relationAge ? orderDetails.data.relationAge + ' years' : null,
                                                                orderDetails.data.relationGender ? orderDetails.data.relationGender : null
                                                            ].filter(Boolean).join(', ') || 'N/A'
                                                        }
                                                    </Text>
                                                </View>
                                                <View style={styles.divider} />
                                                <View style={{ padding: 16 }}>
                                                    <Text style={styles.itemSubText}>
                                                        {[
                                                            orderDetails.data.hNo ? orderDetails.data.hNo : null,
                                                            orderDetails.data.address ? orderDetails.data.address : null,
                                                            orderDetails.data.landMark ? orderDetails.data.landMark : null
                                                        ].filter(Boolean).join(', ') || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Reports Section (Lab)*/}
                                            {(() => {
                                                // Debug logs to help diagnose why Reports section is not displaying
                                                console.log('DEBUG: statusName:', orderDetails.data.statusName || order.statusName);
                                                console.log('DEBUG: labReports:', labReports);
                                                if (orderDetails.data.statusName === 'Completed' && Array.isArray(labReports) && labReports.length > 0) {
                                                    return (
                                                        <View style={styles.reportspage}>
                                                            <Text style={styles.sectionTitle}>Reports</Text>
                                                            <View style={styles.databoxreports}>
                                                                {labReports.map((report: any, idx: number) => {
                                                                    const { category, iconSource } = getCategoryAndIcon(report.orderType);
                                                                    return (
                                                                        <View key={report.reportId || idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
                                                                            {/* {iconSource && <Image source={iconSource} style={{ width: 18, height: 18, marginRight: 6 }} />} */}
                                                                            <Text style={{ flex: 1, color: '#C15E9D', fontFamily: fonts.bold, fontSize: 14 }} numberOfLines={1} ellipsizeMode="middle">
                                                                                {report.reportname}
                                                                            </Text>
                                                                            {/* <Text>
                                                                              {report.reportinfo} || 'fdgnfdgbbn'
                                                                        </Text> */}
                                                                            <TouchableOpacity
                                                                                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#C15E9D', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 1, }}
                                                                                onPress={() => {
                                                                                    console.log('Preview pressed:', report.url);
                                                                                    setPdfLoading(true);
                                                                                    setSelectedPdfUrl(report.url);
                                                                                    // Encode the file name part of the URL
                                                                                    try {
                                                                                        const url = report.url;
                                                                                        const lastSlash = url.lastIndexOf('/');
                                                                                        const base = url.substring(0, lastSlash + 1);
                                                                                        const file = url.substring(lastSlash + 1);
                                                                                        const encodedUrl = base + encodeURIComponent(file);
                                                                                        setEncodedPdfUrl(encodedUrl);
                                                                                    } catch (e) {
                                                                                        setEncodedPdfUrl(report.url);
                                                                                    }
                                                                                    setPdfModalVisible(true);
                                                                                }}
                                                                            >
                                                                                <Text style={{ color: '#C15E9D', fontFamily: fonts.semiBold, fontSize: 11 }}>Preview</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    );
                                                                })}
                                                            </View></View>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </View>
                                    )}
                                    {orderDetails.type === "medicine" && (
                                        <View style={styles.servicepage}>
                                            <Text style={styles.sectionTitle}>Order Information</Text>
                                            <View style={styles.databox}>
                                                {Array.isArray(orderDetails.data.medicines) ? (
                                                    orderDetails.data.medicines.map((med: any, idx: any) => (
                                                        <React.Fragment key={med.cartId || idx}>
                                                            <View style={styles.itemRow}>
                                                                <View style={styles.itemInfo}>
                                                                    <Text style={styles.itemName}>{med.medicineName}</Text>
                                                                    <Text style={styles.itemSubText}>{med.description}</Text>
                                                                </View>
                                                                <Text style={styles.itemQty}>Qty: {med.quantity}</Text>
                                                            </View>
                                                            <View style={styles.divider} />
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <View style={styles.itemRow}>
                                                        <Text style={styles.itemSubText}>No medicines found.</Text>
                                                    </View>
                                                )}

                                                {/* Payment Section - Inside the card like the design */}
                                                <View style={styles.paidAmountRow}>
                                                    <Text style={styles.paidAmountLabel}>Paid Amount</Text>
                                                    <Text style={styles.paidAmountValue}>
                                                        ₹{orderDetails.data.paymentAmount || "N/A"}
                                                    </Text>
                                                </View>

                                                {/* Status Section */}
                                                <View style={styles.paidAmountRow}>
                                                    <Text style={styles.paidAmountLabel}>Status</Text>
                                                    <Text style={[styles.paidAmountValue, { color: statusTextColor, fontSize: 15 }]}>
                                                        {(orderDetails.data.statusName === "Requested" || order.statusName === "Requested")
                                                            ? "In Progress"
                                                            : (orderDetails.data.statusName || order.statusName || "N/A")}
                                                    </Text>
                                                </View>
                                            </View>
                                            {/* Patient Details */}
                                            <Text style={styles.sectionTitle}>Address Info</Text>
                                            <View style={styles.databox}>
                                                <View style={{ padding: 16 }}>
                                                    <Text style={styles.patientname}>{orderDetails.data.patientName || "N/A"}</Text>
                                                    <Text style={styles.itemSubText}>
                                                        {orderDetails.data.age ? orderDetails.data.age + ' years' : 'N/A'}, {orderDetails.data.gender || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.divider} />
                                                <View style={{ padding: 16 }}>
                                                    <Text style={styles.itemSubText}>
                                                        {[
                                                            orderDetails.data.hNo ? orderDetails.data.hNo : null,
                                                            orderDetails.data.address ? orderDetails.data.address : null,
                                                            orderDetails.data.landMark ? orderDetails.data.landMark : null
                                                        ].filter(Boolean).join(', ') || 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>

                                        </View>
                                    )}
                                    {orderDetails.type === "consultation" && (
                                        <VideoOrderDetails
                                            orderDetails={orderDetails}
                                            getReports={getReports}
                                            order={order}
                                            setPdfModalVisible={setPdfModalVisible}
                                            setSelectedPdfUrl={setSelectedPdfUrl}
                                            statusColor={statusColor}
                                            statusTextColor={statusTextColor}
                                        />

                                    )}
                                    {orderDetails.type === "ambulance" && (
                                        <View style={styles.servicepage}>
                                            {/* Service Information */}
                                            <Text style={styles.sectionTitle}>Service Information</Text>
                                            <View style={styles.databox}>
                                                <View style={styles.labelheaderdatabox}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Text style={styles.labelheader}>{orderDetails.data.serviceName}</Text>
                                                        {/* <Text style={styles.labelinner}>
                                                        AT Home
                                                    </Text> */}
                                                    </View>
                                                    {/* <Text style={styles.labelinner}>
                                                    Report within 10-12 hours
                                                </Text> */}
                                                </View>
                                                <View style={styles.datesection}>
                                                    <Text style={styles.label}>Booking Date & Time</Text>
                                                    <Text style={styles.value}>{orderDetails.data.serviceDate?.split('T')[0] || "N/A"}, {orderDetails.data.timeSlot || "N/A"}</Text>
                                                </View>
                                                <View style={styles.paymentsection}>
                                                    <Text style={styles.paidlabel}>Paid Amount</Text>
                                                    <Text style={styles.paymentvalue}>₹{orderDetails.data.paymentAmount || "N/A"}</Text>
                                                </View>
                                                <View style={styles.servicesection}>
                                                    <Text style={styles.label}>Service Status:</Text>
                                                    <Text style={[styles.value, { backgroundColor: statusColor, color: statusTextColor, borderRadius: 30, marginTop: 3, marginBottom: 5, paddingHorizontal: 15, paddingVertical: 2, alignSelf: 'flex-start', fontSize: 11, fontFamily: fonts.regular }]}>
                                                        {(orderDetails.data.statusName === "Requested" || order.statusName === "Requested")
                                                            ? "In Progress"
                                                            : (orderDetails.data.statusName || order.statusName || "N/A")}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Patient Details */}
                                            <Text style={styles.sectionTitle}>Address Info</Text>
                                            <View style={styles.databox}>
                                                <View style={styles.patiendetails}>
                                                    <Text style={styles.patientname}>{orderDetails.data.personName || "N/A"}</Text>

                                                    <Text style={styles.value}>
                                                        {orderDetails.data.isSelfService
                                                            ? [
                                                                orderDetails.data.age ? orderDetails.data.age + ' yrs' : null,
                                                                orderDetails.data.gender ? orderDetails.data.gender : null
                                                            ].filter(Boolean).join(', ') || 'N/A'
                                                            : [
                                                                orderDetails.data.relationAge ? orderDetails.data.relationAge + ' yrs' : null,
                                                                orderDetails.data.relationGender ? orderDetails.data.relationGender : null
                                                            ].filter(Boolean).join(', ') || 'N/A'
                                                        }
                                                    </Text>
                                                </View>
                                                <View style={styles.addressection}>
                                                    <Text style={styles.value}>
                                                        {[
                                                            orderDetails.data.hNo ? orderDetails.data.hNo : null,
                                                            orderDetails.data.address ? orderDetails.data.address : null,
                                                            orderDetails.data.landMark ? orderDetails.data.landMark : null
                                                        ].filter(Boolean).join(', ') || 'N/A'}
                                                    </Text>

                                                </View>
                                            </View>

                                            {/* Reports Section (Lab)*/}
                                            {(() => {
                                                // Debug logs to help diagnose why Reports section is not displaying
                                                console.log('DEBUG: statusName:', orderDetails.data.statusName || order.statusName);
                                                console.log('DEBUG: labReports:', labReports);
                                                if (orderDetails.data.statusName === 'Completed' && Array.isArray(labReports) && labReports.length > 0) {
                                                    return (
                                                        <View style={styles.reportspage}>
                                                            <Text style={styles.sectionTitle}>Reports</Text>
                                                            <View style={styles.databoxreports}>
                                                                {labReports.map((report: any, idx: number) => {
                                                                    const { category, iconSource } = getCategoryAndIcon(report.orderType);
                                                                    return (
                                                                        <View key={report.reportId || idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
                                                                            {/* {iconSource && <Image source={iconSource} style={{ width: 18, height: 18, marginRight: 6 }} />} */}
                                                                            <Text style={{ flex: 1, color: '#C15E9D', fontFamily: fonts.bold, fontSize: 14 }} numberOfLines={1} ellipsizeMode="middle">
                                                                                {report.reportname}
                                                                            </Text>
                                                                            {/* <Text>
                                                                              {report.reportinfo} || 'fdgnfdgbbn'
                                                                        </Text> */}
                                                                            <TouchableOpacity
                                                                                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#C15E9D', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 1, }}
                                                                                onPress={() => {
                                                                                    console.log('Preview pressed:', report.url);
                                                                                    setPdfLoading(true);
                                                                                    setSelectedPdfUrl(report.url);
                                                                                    // Encode the file name part of the URL
                                                                                    try {
                                                                                        const url = report.url;
                                                                                        const lastSlash = url.lastIndexOf('/');
                                                                                        const base = url.substring(0, lastSlash + 1);
                                                                                        const file = url.substring(lastSlash + 1);
                                                                                        const encodedUrl = base + encodeURIComponent(file);
                                                                                        setEncodedPdfUrl(encodedUrl);
                                                                                    } catch (e) {
                                                                                        setEncodedPdfUrl(report.url);
                                                                                    }
                                                                                    setPdfModalVisible(true);
                                                                                }}
                                                                            >
                                                                                <Text style={{ color: '#C15E9D', fontFamily: fonts.semiBold, fontSize: 11 }}>Preview</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    );
                                                                })}
                                                            </View></View>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    <View style={styles.servicepage}>
                                        <Text style={styles.sectionTitle}>No details available for this order.</Text>
                                    </View>
                                </>
                            )}

                        </ScrollView>


                        {/* Footer Buttons */}
                        <View style={styles.footerRow}>
                            {/* Lab & Medicine: Cancel Order only */}
                            {orderDetails?.type === 'medicine' && canCancel && (
                                <TouchableOpacity style={styles.cancelOrderBtn} onPress={handleCancelPress}>
                                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                                </TouchableOpacity>
                            )}
                            {orderDetails?.type === 'lab' && canCancel && (<>
                                <View style={styles.reschedulebox}>
                                    <TouchableOpacity style={styles.cancelOrderBtn1} onPress={handleCancelPress}>
                                        <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.rescheduleBtn1} onPress={() => setShowRescheduleModal(true)}>
                                        <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                                    </TouchableOpacity>
                                </View>
                            </>)}
                            {/* Consultation: Reschedule only */}
                            {orderDetails?.type === 'consultation' && canReschedule && (
                                <TouchableOpacity style={styles.rescheduleBtn} onPress={() => setShowRescheduleModal(true)}>
                                    <Text style={styles.rescheduleBtnText}>Reschedule Consultation</Text>
                                </TouchableOpacity>
                            )}

                            {/* {canCompleted && (
                            <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
                                <Text style={styles.cancelOrderBtnText}>Book Again</Text>
                            </TouchableOpacity>
                        )} */}

                            {/* Lab: Both if allowed */}
                            {/* {orderDetails?.type === 'lab' && canReschedule && canCancel && (
                            <>
                                <TouchableOpacity style={styles.rescheduleBtn} onPress={() => setShowRescheduleModal(true)}>
                                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
                                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                                </TouchableOpacity>
                            </>
                        )} */}
                        </View>

                    </View>
                    {renderRescheduleModal()}
                    {renderCancelModal()}

                    {/* PDF Preview Modal */}
                    <Modal
                        visible={pdfModalVisible}
                        animationType="slide"
                        transparent={false}
                        onRequestClose={() => setPdfModalVisible(false)}
                    >
                        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                                <Text style={{ fontSize: 16, fontFamily: fonts.semiBold, color: '#333' }}>PDF Preview</Text>
                                <TouchableOpacity onPress={() => setPdfModalVisible(false)} style={{ padding: 4 }}>
                                    <Image source={images.icons.close} style={{ width: 24, height: 24, tintColor: '#333' }} />
                                </TouchableOpacity>
                            </View>
                            {pdfLoading && (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#C15E9D', fontFamily: fonts.semiBold, fontSize: 14 }}>Loading report...</Text>
                                </View>
                            )}
                            {selectedPdfUrl && (
                                <WebView
                                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedPdfUrl)}` }}
                                    style={{ flex: 1 }}
                                    onLoadEnd={() => setPdfLoading(false)}
                                    onError={() => setPdfLoading(true)}
                                />
                            )}

                        </SafeAreaView>
                    </Modal>
                </View>
            </SafeAreaView>
            {/* Toast Notification */}
            <Toast
                visible={showToast}
                title={toastMessage.title}
                subtitle={toastMessage.subtitle}
                type={toastMessage.type}
                onHide={() => setShowToast(false)}
            />
        </Modal>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(245, 244, 249, 1)",
    },

    // backButton: {
    //     width: 32,
    //     height: 32,
    //     borderRadius: 16,
    //     backgroundColor: '#E5E5EA',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    // },
    // backIcon: {
    //     width: 14,
    //     height: 14,
    //     tintColor: '#000',
    // },
    backButton: {
        padding: 4,
    },

    backIcon: {
        width: 28,
        height: 28,
        tintColor: "black",
    },
    modalCloseBtn: {
        padding: 4,
        marginLeft: 8,
    },
    modalCloseIcon: {
        width: 24,
        height: 24,
        tintColor: '#000',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        paddingBottom: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    rescheduleBtn: {
        backgroundColor: 'rgba(247, 164, 30, 1)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        width: '70%',
    },
    rescheduleBtn1: {
        backgroundColor: 'rgba(247, 164, 30, 1)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        width: '48%',
    },
    rescheduleBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelOrderBtn: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#C35E9D',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        width: '70%',
        alignSelf: 'center',
    },
    reschedulebox: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    cancelOrderBtn1: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#C35E9D',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        width: '48%',
        alignSelf: 'center',
    },
    cancelOrderBtnText: {
        color: '#C35E9D',
        fontSize: 15,
        fontFamily: fonts.semiBold,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    bottomModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 320,
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    radioButtonLabel: {
        fontSize: 14,
        color: '#333',
        fontFamily: fonts.regular,
        marginLeft: 8,
    },
    modalSeparator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginBottom: 16,
    },
    modalLabelBold: {
        fontSize: 13,
        color: '#000',
        fontFamily: fonts.semiBold,
        marginBottom: 5,
        fontWeight: '600',
    },
    modalHeading: {
        color: '#000',
        fontSize: 16,
        fontFamily: fonts.semiBold,
        fontWeight: '600',
    },
    modalSubheading: {
        fontSize: 16,
        color: '#ff0000',
        marginBottom: 16,
        fontFamily: fonts.regular,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: "400",
        color: "#333",
        marginBottom: 3,
        fontFamily: fonts.semiBold,
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
    rescheduleButton: {
        backgroundColor: 'rgba(247, 164, 30, 1)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        marginTop: 16,
    },
    reshduletext: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: fonts.semiBold,
        paddingTop: 2,
    },
    timeSection: {
        marginTop: 12,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: "400",
        color: "#333",
        marginBottom: 3,
        fontFamily: fonts.semiBold,
    },
    timeSlotsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    /* SLOT */
    slotGroupTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        color: "#6B7280",
    },
    /* SYMPTOM CHIP */
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
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
    cancelButton: {
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 0.5,
        borderColor: 'rgba(195, 94, 157, 1)',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        marginTop: 16,
        marginHorizontal: 70,

    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: getResponsiveSpacing(20),
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 16,
        color: '#000',
        fontFamily: fonts.semiBold,
        fontWeight: '600',
    },
    servicepage: {
        flex: 1,
        padding: 20,
        paddingTop: 15,
        backgroundColor: "rgba(245, 244, 249, 1)"
    },
    reportspage: {
        flex: 1,
        backgroundColor: "rgba(245, 244, 249, 1)"
    },
    sectionTitle: {
        fontSize: 15,
        color: "#000",
        fontFamily: fonts.semiBold,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },
    databox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E1E8F1',
        marginBottom: 20,
        overflow: 'hidden',
    },
    itemRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        color: '#000',
        fontFamily: fonts.semiBold,
        marginBottom: 4,
    },
    itemSubText: {
        fontSize: 12,
        color: '#000',
        fontFamily: fonts.regular,
    },
    itemQty: {
        fontSize: 13,
        color: '#000',
        fontFamily: fonts.regular,
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E8F1',
    },
    paidAmountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E1E8F1',
    },
    paidAmountLabel: {
        fontSize: 15,
        color: '#000',
        fontFamily: fonts.bold,
    },
    paidAmountValue: {
        fontSize: 17,
        color: '#C35E9D',
        fontFamily: fonts.bold,
    },

    databoxreports: {
        borderWidth: 1,
        borderColor: "rgba(212,212,212,1)",
        borderRadius: 20,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 20,
        marginTop: 5,
    },
    databox1: {
        borderWidth: 1,
        borderColor: "rgba(212,212,212,1)",
        borderRadius: 20,
        backgroundColor: "#fff",
        marginBottom: 20,
        paddingHorizontal: 20,
        marginTop: 5,
    },
    databox2: {
        borderWidth: 1,
        borderColor: "rgba(212,212,212,1)",
        borderRadius: 20,
        backgroundColor: "#fff",
        marginBottom: 20,
        paddingHorizontal: 20,
        marginTop: 5,
    },
    patiendetails: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,212,212,1)",
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
    },

    diagsticdetails: {

        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    labelheaderdatabox: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,212,212,1)",
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
    },

    labelheaderdatabox2: {
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    labelheaderdatabox1: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,212,212,1)",
        paddingBottom: 6,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    labelheaderdatabox3: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,212,212,1)",
        paddingBottom: 6,
        paddingTop: 10,
    },
    datesection: {
        paddingHorizontal: 20,
        paddingBottom: 5,
         marginTop: getResponsiveSpacing(0),
    },
    addressection: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 5,
    },
    paymentsection: {
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(212,212,212,1)",
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 13
    },
    paymentsection1: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 13
    },
    servicesection: {
        paddingHorizontal: 20,
        borderTopWidth: 1,
        paddingBottom: 5,
        borderTopColor: "rgba(212,212,212,1)",

    },
    labelheader: {
        fontFamily: fonts.semiBold,
        fontSize: 13
    },
    labelinner: {
        fontSize: 11,
        color: "#694664",
        fontFamily: fonts.regular,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        flexGrow: 1,
    },
    label: {
        marginTop: 5,
        fontFamily: fonts.semiBold,
        fontSize: 13
    },
    paidlabel: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: '#000'
    },
    value: {
        color: '#333',
        fontFamily: fonts.regular,
        fontSize: 13
    },
    paymentvalue: {
        color: '#C35E9C',
        fontFamily: fonts.bold,
        fontSize: 15
    },
    patientname: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        fontFamily: fonts.semiBold,
    },
    diagname: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        fontFamily: fonts.semiBold,
    }
});
export default OrderDetails;
