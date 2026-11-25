import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../assets";
import OrderDetails from "./features/myorders/OrderDetails";
import axiosClient from "../src/api/axiosClient";
import ApiRoutes from "../src/api/employee/employee";
import { useUser } from "./shared/context/UserContext";
import { useUserStore } from "@/src/store/UserStore";
import { colors } from "./shared/styles/commonStyles";
import { fonts } from "./shared/styles/fonts";
import { getResponsiveSpacing } from "./shared/utils/responsive";

export default function NotificationsScreen() {
  const { userData } = useUser();
  const { restoreUserData, user } = useUserStore();
  useEffect(() => {
    restoreUserData();
  }, []);
  const patientId = Number(userData?.e_id || user?.eId);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] =
    useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  const fetchNotifications = useCallback(async () => {
    if (!patientId) return;
    try {
      const response: any = await axiosClient.get(
        ApiRoutes.Notification.GetList(patientId, "patient"),
      );
      setNotifications(response);
    } catch (error) {
      console.log("Error fetching notifications:", error);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      setNotifications((prev: any) =>
        Array.isArray(prev)
          ? prev.map((n) =>
              n.notificationId === notificationId ? { ...n, isRead: true } : n,
            )
          : prev,
      );
      await axiosClient.post(ApiRoutes.Notification.readmark(notificationId), {
        notificationId,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      setNotifications((prev: any) =>
        Array.isArray(prev)
          ? prev.map((n) =>
              n.notificationId === notificationId ? { ...n, isRead: false } : n,
            )
          : prev,
      );
    }
  };

  const renderNotification = useCallback(({ item }: { item: any }) => {
    const bgColor = item.isRead ? colors.bg_rest : "#FFF6F4";
    return (
      <TouchableOpacity
        style={[styles.notificationItem, { backgroundColor: bgColor }]}
        activeOpacity={0.7}
        onPress={() => {
          if (!item.isRead) markNotificationAsRead(item.notificationId);
          setSelectedOrderDetails({
            ...item,
            masterId: item.referenceId,
            orderType:
              item.source === "Lab"
                ? "Single Test"
                : item.source === "Scan"
                  ? "Xray"
                  : item.source === "Wellness"
                    ? "Wellness Program"
                    : item.source === "ChatRequest"
                      ? "ChatRequest"
                      : item.source === "Consulation"
                        ? "Consultation"
                        : item.source,
            statusName: item.statusName || "",
          });
          setOrderDetailsModalVisible(true);
        }}
      >
        <View style={styles.notificationItemIconContainer}>
          <Image
            source={images.notification}
            style={styles.notificationItemIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg_rest }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.body}>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.notificationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          accessibilityRole="list"
          accessibilityLabel="Notification list"
        />
      </View>

      <OrderDetails
        visible={orderDetailsModalVisible}
        order={selectedOrderDetails}
        statusName={selectedOrderDetails?.statusName || ""}
        onClose={() => setOrderDetailsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 16,
    color: "#202427",
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  list: {
    paddingVertical: 0,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#70707080",
    alignItems: "flex-start",
  },
  notificationItemIconContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  notificationItemIcon: {
    width: 24,
    height: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    color: "#000000",
    flex: 1,
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 4,
  },
});
