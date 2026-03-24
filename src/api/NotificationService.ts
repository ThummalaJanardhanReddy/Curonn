import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import axiosClient from "@/src/api/axiosClient";
import { EmployeeApi } from "@/src/api/employee/employee";

export enum NotificationType {
  LabOrderBooked = "LabOrderBooked",
  MedicineOrderPlaced = "MedicineOrderPlaced",
  AmbulanceBooked = "AmbulanceBooked",
  DoctorAppointmentBooked = "DoctorAppointmentBooked",
  VideoCallScheduled = "VideoCallScheduled",
  VideoCallStarted = "VideoCallStarted",
  TestNotification = "TestNotification",
}
/**
 * Configure how notifications behave when app is foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Register for push notifications (FCM)
 */
// export async function registerForPushNotifications(
//   patientId: number
// ): Promise<string | null> {
//   try {
//     if (!Device.isDevice) {
//       console.log("Push notifications require physical device");
//       return null;
//     }

//     // Request permission
//     const { status } = await Notifications.requestPermissionsAsync();

//     if (status !== "granted") {
//       console.log("Notification permission not granted");
//       return null;
//     }

//     // Get FCM device token (Direct FCM)
//     const tokenData = await Notifications.getDevicePushTokenAsync();
//     const fcmToken = tokenData.data;

//     console.log("FCM Token:", fcmToken);

//     // Send token to backend
//     await axiosClient.post(EmployeeApi.updateDeviceToken, {
//       patientId,
//       deviceToken: fcmToken,
//       platform: Platform.OS,
//     });

//     return fcmToken;
//   } catch (error) {
//     console.log("Push registration error:", error);
//     return null;
//   }
// }

/**
 * Initialize all notification listeners
 * Call this once in root layout (App.tsx or _layout.tsx)
 */
// export function initializeNotificationListeners() {
//   // 1️⃣ Foreground notification received
//   const foregroundSubscription = Notifications.addNotificationReceivedListener(
//     (notification) => {
//       console.log("Foreground notification:", notification);
//     },
//   );


export function initializeNotificationListeners() {
  if (Platform.OS === "web") return () => {};

  // 1️⃣ Foreground notification
  const foregroundSubscription =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Foreground notification:", notification);
    });

  // 2️⃣ Background / tap
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);

      handleNotificationNavigation(
        response.notification.request.content.data
      );
    });

  // 3️⃣ Killed state
  checkInitialNotification();

  // ✅ RETURN MUST BE INSIDE FUNCTION
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

 
//   const responseSubscription =
//     Notifications.addNotificationResponseReceivedListener((response) => {
//       console.log("Notification tapped:", response);

//       handleNotificationNavigation(response.notification.request.content.data);
//     });

//   // 3️⃣ App opened from KILLED state
//   checkInitialNotification();

//   return () => {
//     foregroundSubscription.remove();
//     responseSubscription.remove();
//   };
// }

/**
 * Handle navigation based on notification data
 */
function handleNotificationNavigation(data: any) {
  if (!data) return;

  console.log("Notification Data:", data);

  switch (data?.type) {
    case NotificationType.VideoCallScheduled:
      if (data?.consultationId) {
        // router.push(`/video-call/${data.consultationId}`);
        console.log("video call scheduled! nav to video order");
      }
      break;

    case NotificationType.VideoCallStarted:
      if (data?.chatId) {
        // router.push(`/chat/${data.chatId}`);
        console.log("video call started! nav to video order");
      }
      break;
    case NotificationType.DoctorAppointmentBooked:
      if (data?.referenceId) {
        // router.push(`/chat/${data.chatId}`);
        console.log("doctor appoint booked! nav to video order");
      }
      break;

    default:
      console.log("Unknown notification type");
  }
}

/**
 * Handle app opened from killed state
 */
// async function checkInitialNotification() {
//   const response = Notifications.getLastNotificationResponse();

//   if (response) {
//     console.log("App opened from killed state via notification");

//     handleNotificationNavigation(response.notification.request.content.data);
//   }
// }

async function checkInitialNotification() {
  if (Platform.OS === "web") return; // 🚀 FIX: avoid web crash

  try {
    const response = await Notifications.getLastNotificationResponseAsync();

    if (response) {
      console.log("App opened from killed state via notification");

      handleNotificationNavigation(
        response.notification.request.content.data
      );
    }
  } catch (error) {
    console.log("Error fetching last notification:", error);
  }
}
