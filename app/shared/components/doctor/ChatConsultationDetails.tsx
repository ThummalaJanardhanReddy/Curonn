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
}

export default function ChatConsultationDetails({
  orderDetails,
}: Props) {
  const data = orderDetails?.data || {};
  return (
    <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#fff', flex: 1 }}>
      <Text style={{ color: '#ff0000', fontSize: 16, marginBottom: 8,fontFamily: fonts.semiBold }}>
        {data.title || 'Notification'}
      </Text>
      <Text style={{ color: '#888', fontSize: 15, textAlign: 'center',fontFamily: fonts.regular }}>
        {data.message || 'No message available.'}
      </Text>
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
