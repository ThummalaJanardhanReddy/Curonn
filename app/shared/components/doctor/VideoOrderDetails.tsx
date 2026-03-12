import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { fonts } from "@/app/shared/styles/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useVideoStore } from "@/src/store/VideoStore";
import { signalRVideoService } from "@/src/api/SignalRVideoService";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { colors } from "../../styles/commonStyles";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import { IPatientReport, S3Link } from "@/src/constants/constants";
import PrimaryButton from "../PrimaryButton";

interface Props {
  orderDetails: any;
  onJoinCall?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBookAgain?: () => void;
  order: any;
  getReports: any;
  setSelectedPdfUrl: any;
  setPdfModalVisible: any;
  statusColor: any;
  statusTextColor: any;
}

export default function VideoOrderDetails({
  orderDetails,
  onJoinCall,
  onReschedule,
  onCancel,
  onBookAgain,
}: Props) {
  const data = orderDetails?.data || {};
  const doctorAssigned = !!data.doctorName;
  const { status, roomUrl } = useVideoStore();
  const [report, setReport] = useState();

  const statusColors: { [key: string]: string } = {
    Requested: "#d0eaff",
    Completed: "#ccface",
    Cancelled: "#ffd8d5",
    Inprogress: "#f8d7a7",
    Ongoing: "#f7cdff",
    Pending: "#ffeeba",
    Rescheduled: "#bbecf3",
    "Admin Doctor": "#f7cdff",
  };
  const statusTextColors: { [key: string]: string } = {
    Requested: "#006cc5",
    Completed: "#4CAF50",
    Cancelled: "#F44336",
    Inprogress: "#FF9800",
    Ongoing: "#9C27B0",
    Pending: "#9e7600",
    Rescheduled: "#00BCD4",
    "Admin Doctor": "#9C27B0",
  };

  const formattedDate = useMemo(() => {
    if (!data.scheduleDate) return "N/A";
    return dayjs(data.scheduleDate).format("DD-MM-YYYY HH:mm:ss");
  }, [data.scheduleDate]);

  // Get status color and text color based on statusName
  const statusKey = data.statusName || "Requested";
  const badgeBgColor = statusColors[statusKey] || "#FFF4E5";
  const badgeTextColor = statusTextColors[statusKey] || "#D97706";

  const fetchReportInfo = useCallback(async () => {
    if (!data) return;
    try {
      const response:any = await axiosClient.get(
        ApiRoutes.PatientReports.getAllReports(data.patientId, 5),
      ); // 5 : prescription catogery id
      console.log("reports: ", response);

      if (response) {
        const record = response?.filter((m:any) => (m.typeId = data.appointmentId));
        setReport(record[0].filePath);
      }
    } catch (error) {}
  }, [data?.appointmentId]);

  useEffect(() => {
    if (!data?.patientId) return;
    const initialize = async () => {
      await signalRVideoService.connect(data.patientId);
    };
    initialize();
    fetchReportInfo();
  }, [data]);
  const joinDisabled = data.videoRoomUrl === ""; // || status !== "ready";
  // data.videoRoomUrl === "" || data.statusName !== "Accepted";
  const cancelDisabled = doctorAssigned;
  const InfoRow = ({ label, value }: { label: string; value?: string }) => {
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value && value !== "" ? value : "N/A"}
        </Text>
      </View>
    );
  };

  const handleJoinCall = () => {
    if (data?.videoRoomUrl) Linking.openURL(data.videoRoomUrl);
  };

  const handleViewPrescription = () => {
    if (report) Linking.openURL(report);
  };

  return (
    <View style={styles.container}>
      {/* SERVICE INFORMATION */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>

          <View style={styles.infoCard}>
            {/* Left Icon */}
            <View style={styles.serviceImageContainer}>
              <Ionicons name="videocam" size={22} color="#3B5BDB" />
            </View>
          <View style={styles.infoCard}>
            {/* Left Icon */}
            <View style={styles.serviceImageContainer}>
              <Ionicons name="videocam" size={22} color="#3B5BDB" />
            </View>

            {/* Center Content */}
            <View style={{ flex: 1 }}>
              {data.doctorId && data.doctorId !== 0 ? (
                <>
                  <Text style={styles.primaryText}>{data.doctorName}</Text>

                  {data.speciality && (
                    <Text style={styles.secondaryText}>{data.speciality}</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.primaryTextPending}>
                    Doctor Not Assigned Yet
                  </Text>
                  <Text style={styles.secondaryText}>
                    You will be notified once a doctor is assigned.
                  </Text>
                </>
              )}

              <Text style={styles.infoTitle}>
                {data.speciality || "General Consultation"}
              </Text>

              {/* Description */}
              {/* <Text style={styles.departmentDescription}>
                {data.symptoms
                  ? `Symptoms: ${data.symptoms}`
                  : "Consultation with certified specialist doctors."}
              </Text> */}

              {/* Consultation Type Badge */}
              <View style={styles.consultTypeBadge}>
                <Text style={styles.consultTypeText}>
                  {data.scheduleTypeName || "Video Consultation"}
                </Text>
              </View>

              <View style={{ paddingVertical: 10 }}>
                <Text style={[styles.label, { color: colors.black }]}>
                  Scheduled On:
                </Text>
                <Text style={styles.label}>{formattedDate}</Text>
              </View>

              {/* Booking ID */}
              <Text style={styles.bookingIdText}>
                Booking ID: {data.bookingId}
              </Text>
            </View>

            {/* Right Side Status Badge */}
            <View style={styles.statusBadgeContainer}>
              <Text style={styles.statusBadgeText}>{data.statusName}</Text>
            </View>
          </View>

          {/* ---------------- Patient Details ---------------- */}
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.card}>
            <Text style={styles.primaryText}>{data.patientName || "N/A"}</Text>
            <Text style={styles.secondaryText}>
              {[
                data.relationAge ? `${data.relationAge} yrs` : data.patientAge,
                data.relationGender ? data.relationGender : data.patientGender,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </Text>
            {data?.symptoms && (
              <Text style={styles.secondaryText}>{data.symptoms}</Text>
            )}
          </View>

          {/* ---------------- Prescription Section ---------------- */}
          {data.prescription && (
            <>
              <Text style={styles.sectionTitle}>Prescription</Text>
              <View style={styles.card}>
                <Text style={styles.value}>{data.prescription}</Text>
              </View>
            </>
          )}
          {report && (
            <>
              <PrimaryButton
                title="View Prescription"
                onPress={handleViewPrescription}
                style={{
                  paddingHorizontal: 40,
                  width: "auto",
                  height: 38,
                  backgroundColor: "transparent",
                  borderColor: colors.primary,
                  borderWidth: 1,
                }}
                textStyle={{ color: colors.primary }}
              />
            </>
          )}

          {/* ---------------- Join Call Button ---------------- */}
          {data?.scheduleTypeName == "Video Consultation" &&
            data?.statusName !== "Completed" && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  joinDisabled && styles.disabledButton,
                ]}
                disabled={joinDisabled}
                onPress={handleJoinCall}
              >
                <Text style={styles.primaryButtonText}>Join Video Call</Text>
              </TouchableOpacity>
            )}
        </View>
        {/* ---------------- Reschedule & Cancel ---------------- */}
        {/* <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.outlineButton} onPress={onReschedule}>
          <Text style={styles.outlineButtonText}>Reschedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.outlineButton,
            cancelDisabled && styles.disabledOutlineButton,
          ]}
          disabled={cancelDisabled}
          onPress={onCancel}
        >
          <Text
            style={[
              styles.outlineButtonText,
              cancelDisabled && { color: "#aaa" },
            ]}
          >
            Cancel Booking
          </Text>
        </TouchableOpacity>
      </View> */}

        {/* ---------------- Book Again ---------------- */}
        {/* <TouchableOpacity style={styles.secondaryButton} onPress={onBookAgain}>
        <Text style={styles.secondaryButtonText}>Book Again</Text>
      </TouchableOpacity> */}
     
    </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(245, 244, 249, 1)",
  },

  sectionTitle: {
    fontSize: 14,
    color: "#000",
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    marginBottom: 2,
    marginTop: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d1d2",
    marginBottom: 20,
    overflow: "hidden",
  },

  primaryText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: "#222",
  },

  secondaryText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#666",
    marginTop: 4,
  },

  label: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#888",
    marginBottom: 6,
  },

  value: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#333",
  },

  disabledInput: {
    backgroundColor: "#F1F2F4",
    padding: 12,
    borderRadius: 8,
  },

  primaryButton: {
    backgroundColor: "#C15E9D",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 5,
  },

  primaryButtonText: {
    color: "#fff",
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },

  disabledButton: {
    backgroundColor: "#D8AFC8",
  },

  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C15E9D",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },

  outlineButtonText: {
    color: "#C15E9D",
    fontFamily: fonts.medium,
  },

  disabledOutlineButton: {
    borderColor: "#ccc",
  },

  secondaryButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#222",
  },

  secondaryButtonText: {
    color: "#fff",
    fontFamily: fonts.semiBold,
  },
  statusContainer: {
    backgroundColor: "#FFF4E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#D97706", // Requested color
  },

  primaryTextPending: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    // color: "#B91C1C",
  },
  infoRow: {
    marginBottom: 14,
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    backgroundColor: "rgba(245, 244, 249, 1)",
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderColor: "#d1d1d2",
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },

  serviceImageContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "#222",
  },

  departmentDescription: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#666",
    marginTop: 4,
  },

  consultTypeBadge: {
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },

  consultTypeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#1B5E20",
  },

  bookingIdText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#999",
    marginTop: 6,
  },

  statusBadgeContainer: {
    backgroundColor: "#FFF4E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.regular,
  },
});
