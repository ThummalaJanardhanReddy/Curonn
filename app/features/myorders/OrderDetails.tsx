
import React, { useEffect, useState } from "react";
import { useNavigation } from '@react-navigation/native';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import { fontStyles, fonts } from "../../shared/styles/fonts";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import { Button } from "react-native-paper";
import Toast from "../../shared/components/Toast";
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
    // For patient profile
    const [patientProfile, setPatientProfile] = useState<any>(null);
    const [patientId, setPatientId] = useState<number | null>(null);
    // Status color maps based on serviceName
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
        if (!order) return;
        setLoading(true);
        if (["Package", "Single Test", "Xray"].includes(order.orderType)) {
            fetchLabOrderById(order.masterId).then((data) => {
                setOrderDetails({ type: "lab", data: data.data || data || {} });
                setLoading(false);
            });
        } else if (order.orderType === "Medicine") {
            fetchMedicineOrderById(order.masterId).then((data) => {
                setOrderDetails({ type: "medicine", data: data.data || data || {} });
                // Get patientId from first medicine item (all have same patientId)
                let medArr = Array.isArray(data) ? data : [];
                console.log("Fetched patientId from medicine order:", medArr);
                if (medArr.length > 0 && medArr[0].patientId) {
                    const pid = medArr[0].patientId;
                    setPatientId(pid);
                    console.log("Fetched patientId from medicine order:", pid);
                    // Fetch patient profile only after patientId is available
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
        } else {
            setOrderDetails(null);
            setLoading(false);
        }
    }, [order]);

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


    if (!order) return null;
    // Helper: statusName check for button display
    const canReschedule = ["Requested", "Inprogress"].includes(order.statusName);
    const canCancel = ["Requested", "Inprogress"].includes(order.statusName);
    const canCompleted = ["Completed"].includes(order.statusName);

    // Removed patientId effect; now handled after fetchMedicineOrderById resolves
    // Helper: Render Reschedule Modal
    const renderRescheduleModal = () => (
        <Modal visible={showRescheduleModal} transparent animationType="slide" onRequestClose={() => setShowRescheduleModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.bottomModal}>
                    <View style={styles.modalHeaderRow}>
                        <Text style={styles.modalHeading}>Reason for rescheduling</Text>
                        <TouchableOpacity onPress={() => setShowRescheduleModal(false)} style={styles.modalCloseBtn}>
                            <Image source={images.icons.close} style={styles.modalCloseIcon} />
                        </TouchableOpacity>
                    </View>
                    <RadioButton.Group onValueChange={setRescheduleReason} value={rescheduleReason}>
                        <RadioButton.Item label="Professional not assigned" value="Professional not assigned" />
                        <RadioButton.Item label="Service required at a different time" value="Service required at a different time" />
                    </RadioButton.Group>
                    <Text style={styles.modalLabel}>Change Reschedule Date</Text>
                    <TouchableOpacity style={styles.dateInput} onPress={() => {/* TODO: Show date picker */ }}>
                        <Text>{newRescheduleDate || 'Select new date'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rescheduleButton} onPress={async () => {
                        // API call for consultation reschedule
                        if (orderDetails?.type === 'consultation') {
                            try {
                                await axiosClient.post(ApiRoutes.ConsultationsData.reshduledata, {
                                    appointmentId: orderDetails.data.appointmentId,
                                    newDate: newRescheduleDate,
                                    modifiedBy: orderDetails.data.patientId
                                });
                                setShowRescheduleModal(false);
                                setToastMessage({
                                    title: 'Reschedule Success',
                                    subtitle: 'Booking rescheduled successfully!',
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
                                    title: 'Reschedule Failed',
                                    subtitle: 'Failed to reschedule.',
                                    type: 'error',
                                });
                                setShowToast(true);
                            }
                        }
                    }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reschedule Booking</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Helper: Render Cancel Modal
    const renderCancelModal = () => (
        <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomModal}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalHeading}>Order Cancel</Text>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)} style={styles.modalCloseBtn}>
                                <Image source={images.icons.close} style={styles.modalCloseIcon} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubheading}>Are you sure you want to cancel your order?</Text>
                        <RadioButton.Group onValueChange={setCancelReason} value={cancelReason}>
                            <RadioButton.Item
                                label="Sample Collection agent not assigned"
                                value="Sample Collection agent not assigned"
                                labelStyle={{ fontFamily: fonts.regular, fontSize: 13, textAlign: 'left', paddingLeft: 0, marginLeft: 0 }}
                                style={{ paddingVertical: 0, marginVertical: 0, marginLeft: -8 }}
                                position="leading"
                                color="#C35E9D"
                            />
                            <RadioButton.Item
                                label="Service required at a different time"
                                value="Service required at a different time"
                                labelStyle={{ fontFamily: fonts.regular, fontSize: 13, textAlign: 'left', paddingLeft: 0, marginLeft: 0 }}
                                style={{ paddingVertical: 0, marginVertical: 0, marginLeft: -8 }}
                                position="leading"
                                color="#C35E9D"
                            />
                            <RadioButton.Item
                                label="High Price"
                                value="High Price"
                                labelStyle={{ fontFamily: fonts.regular, fontSize: 13, textAlign: 'left', paddingLeft: 0, marginLeft: 0 }}
                                style={{ paddingVertical: 0, marginVertical: 0, marginLeft: -8 }}
                                position="leading"
                                color="#C35E9D"
                            />
                            <RadioButton.Item
                                label="Other reasons"
                                value="Other reasons"
                                labelStyle={{ fontFamily: fonts.regular, fontSize: 13, textAlign: 'left', paddingLeft: 0, marginLeft: 0 }}
                                style={{ paddingVertical: 0, marginVertical: 0, marginLeft: -8 }}
                                position="leading"
                                color="#C35E9D"
                            />
                        </RadioButton.Group>
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Order Info</Text>
                        <View style={styles.headerSpacer} />
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Image source={images.icons.close} style={styles.backIcon} />
                        </TouchableOpacity>
                    </View>
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
                                                        {order.orderType === "Single Test" ? "AT Home" : "AT Lab"}
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
                                        {/* Patient Details */}
                                        <Text style={styles.sectionTitle}>Address Info</Text>
                                        <View style={styles.databox}>
                                            <View style={styles.patiendetails}>
                                                <Text style={styles.patientname}>{orderDetails.data.patientName || "N/A"}</Text>
                                                <Text style={styles.value}>
                                                    {orderDetails.data.isSelfService
                                                        ? `${orderDetails.data.age ? orderDetails.data.age + ' yrs' : 'N/A'}, ${orderDetails.data.gender || 'N/A'}`
                                                        : `${orderDetails.data.relationAge ? orderDetails.data.relationAge + ' yrs' : 'N/A'}, ${orderDetails.data.relationGender || 'N/A'}`}
                                                </Text>
                                            </View>
                                            <View style={styles.addressection}>
                                                <Text style={styles.value}>{orderDetails.data.hNo || "N/A"}, {orderDetails.data.address || "N/A"}, {orderDetails.data.landMark || "N/A"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                {orderDetails.type === "medicine" && (
                                    <View style={styles.servicepage}>
                                        <Text style={styles.sectionTitle}>Order Information</Text>
                                        {/* Medicine List Section */}
                                        <View style={styles.databox}>
                                            <View style={styles.labelheaderdatabox3}>
                                                {Array.isArray(orderDetails.data.medicines) ? (
                                                    orderDetails.data.medicines.map((med: any, idx: any) => (
                                                        <View key={med.cartId || idx} style={{ marginBottom: 0, borderBottomWidth: idx !== orderDetails.data.length - 1 ? 1 : 0, borderColor: '#eee', paddingVertical: 8, paddingHorizontal: 20 }}>
                                                            <Text style={{ fontFamily: fonts.semiBold, fontSize: 12, color: '#333' }}>{med.medicineName}</Text>
                                                            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#555' }}>
                                                                Qty: {med.quantity},  {med.description}
                                                            </Text>
                                                        </View>
                                                    ))
                                                ) : (
                                                    <Text style={styles.value}>No medicines found.</Text>
                                                )}
                                            </View>
                                            {/* Payment Section */}
                                            <View style={styles.paymentsection1}>
                                                <Text style={styles.paidlabel}>Paid Amount</Text>
                                                <Text style={styles.paymentvalue}>
                                                    ₹{orderDetails.data.paymentAmount || "N/A"}
                                                    {/* ₹{
                                                        Array.isArray(orderDetails.data.medicines) && orderDetails.data.medicines.length > 0
                                                            ? orderDetails.data.medicines.reduce((sum: any, med: any) => sum + (med.totalPrice || 0), 0).toFixed(2)
                                                            : (orderDetails.data.paymentDetails || "N/A")
                                                    } */}
                                                </Text>
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
                                        <Text style={styles.sectionTitle}>Address Info1</Text>
                                        <View style={styles.databox}>
                                            <View style={styles.patiendetails}>
                                                <Text style={styles.patientname}>{orderDetails.data.patientName || "N/A"}</Text>
                                                <Text style={styles.value}>
                                                    {orderDetails.data.age ? orderDetails.data.age + ' yrs' : 'N/A'}, {orderDetails.data.gender || 'N/A'}`
                                                </Text>
                                            </View>
                                            <View style={styles.addressection}>
                                                <Text style={styles.value}>{orderDetails.data.hNo || "N/A"}, {orderDetails.data.address || "N/A"}, {orderDetails.data.landMark || "N/A"}</Text>
                                            </View>
                                        </View>

                                    </View>
                                )}
                                {orderDetails.type === "consultation" && (
                                    <View style={styles.servicepage}>
                                        <Text style={styles.sectionTitle}>Doctor Details</Text>
                                        <View style={styles.databox}>
                                            <View style={styles.labelheaderdatabox2}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={styles.labelheader}>{orderDetails.data.doctorName}</Text>

                                                </View>
                                                <Text style={styles.labelinner}>
                                                    {orderDetails.data.speciality}
                                                </Text>
                                            </View>
                                        </View>



                                        <Text style={styles.sectionTitle}>Appointment Details</Text>

                                        <View style={styles.databox1}>
                                            <Text style={styles.label}>Appointment ID:</Text>
                                            <Text style={styles.value}>{orderDetails.data.appointmentId || "N/A"}</Text>
                                            <Text style={styles.label}>Consultation Date:</Text>
                                            <Text style={styles.value}>
                                                {orderDetails.data.scheduleDate
                                                    ? (() => {
                                                        const d = new Date(orderDetails.data.scheduleDate);
                                                        const day = String(d.getDate()).padStart(2, '0');
                                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                                        const year = d.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })()
                                                    : "N/A"}
                                            </Text>
                                            <Text style={styles.label}>Consultation Type:</Text>
                                            <Text style={styles.value}>{orderDetails.data.scheduleTypeName || "N/A"}</Text>
                                            <Text style={styles.label}>Status:</Text>
                                            <Text style={[styles.value, { backgroundColor: statusColor, color: statusTextColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }]}>
                                                {orderDetails.data.statusName || "N/A"}
                                            </Text>
                                            <Text style={styles.label}>Description:</Text>
                                            <Text style={styles.value}>{orderDetails.data.description || "N/A"}</Text>
                                        </View>
                                        <Text style={styles.sectionTitle}>Address Info</Text>
                                        <View style={styles.databox}>
                                            <View style={styles.labelheaderdatabox2}>
                                                <Text style={styles.patientname}>{orderDetails.data.patientName || "N/A"}</Text>
                                                <Text style={styles.value}>Gender: {orderDetails.data.patientGender || "N/A"}, Age: {orderDetails.data.patientAge || "N/A"}

                                                </Text>
                                            </View>

                                        </View>
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
                            <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
                                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                            </TouchableOpacity>
                        )}
                        {orderDetails?.type === 'lab' && canCancel && (
                            <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
                                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                            </TouchableOpacity>
                        )}
                        {/* Consultation: Reschedule only */}
                        {orderDetails?.type === 'consultation' && canReschedule && (
                            <TouchableOpacity style={styles.rescheduleBtn} onPress={() => setShowRescheduleModal(true)}>
                                <Text style={styles.rescheduleBtnText}>Reschedule</Text>
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
        backgroundColor: "#fff",
    },

    modalCloseBtn: {
        padding: 4,
        marginLeft: 8,
    },
    modalCloseIcon: {
        width: 22,
        height: 22,
        tintColor: '#333',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        paddingBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    rescheduleBtn: {
        flex: 1,
        backgroundColor: 'rgba(247, 164, 30, 1)',
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
    },
    rescheduleBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelOrderBtn: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(195, 94, 157, 1)',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: '60%',
        marginLeft: '20%',
    },
    cancelOrderBtnText: {
        color: 'rgba(195, 94, 157, 1)',
        fontSize: 14,
        fontFamily: fonts.regular,
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
    modalHeading: {
        marginBottom: 12,
        color: '#333',
        fontSize: 16,
        fontFamily: fonts.semiBold,

    },
    modalSubheading: {
        fontSize: 14,
        color: '#ff0000',
        marginBottom: 8,
        width: '70%',
        fontFamily: fonts.regular,
    },
    modalLabel: {
        fontSize: 14,
        color: '#333',
        marginTop: 16,
        marginBottom: 4,
        fontFamily: fonts.regular,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    },
    rescheduleButton: {
        backgroundColor: 'rgba(247, 164, 30, 1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        marginTop: 16,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(195, 94, 157, 1)',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        marginTop: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    servicepage: {
        flex: 1,
        padding: 20,
        paddingTop: 15,
        backgroundColor: "rgba(245, 244, 249, 1)"
    },
    sectionTitle:
    {
        fontSize: 13,
        color: "#000000",
        marginBottom: 2,
        fontFamily: fonts.semiBold
    },
    databox: {
        borderWidth: 1,
        borderColor: "rgba(212,212,212,1)",
        borderRadius: 20,
        backgroundColor: "#fff",
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
    patiendetails: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,212,212,1)",
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
    backButton: {
        padding: 8,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: "#333",
    },
    headerTitle: {
        fontSize: 16,
        color: "#333",
        fontFamily: fonts.semiBold,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        flex: 1,
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
    }
});
export default OrderDetails;
