import * as Notifications from "expo-notifications";
import {
  getMessaging,
  getToken,
  requestPermission,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  getAPNSToken,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { Alert, Platform } from "react-native";
import axiosClient from "./axiosClient";
import { EmployeeApi } from "./employee/employee";

// export async function registerForPushNotifications(patientId: number) {
//   try {
//     if (!Device.isDevice) {
//       alert("Must use physical device");
//       return;
//     }

//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();

//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       alert("Permission not granted");
//       return;
//     }

//     const tokenData = await Notifications.getExpoPushTokenAsync();
//     const expoPushToken = tokenData.data;

//     console.log("Expo Push Token:", expoPushToken);

//     // Send to backend
//     await axiosClient.post(EmployeeApi.updateDeviceToken, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         patientId,
//         deviceToken: expoPushToken,
//       }),
//     });
//   } catch (error) {
//     console.log('token error: ', error);
//     Alert.alert('Error', error);
//   }
// }

export async function registerForPushNotifications(patientId: number) {
  try {
    // if (!Device.isDevice) {
    //   alert("Must use physical device");
    //   return;
    // }

    // const { status } = await Notifications.requestPermissionsAsync();

    // if (status !== "granted") {
    //   alert("Permission not granted");
    //   return;
    // }

    // const tokenData = await Notifications.getDevicePushTokenAsync();
    // const fcmToken = tokenData.data;

    const fcmToken = await getFCMToken();

    if (!fcmToken) {
      console.log("Unable to generate FCM token");
      // Alert.alert("Push Token", "Unable to generate push token (see console logs for the reason).");
      return;
    }

    console.log("FCM Token:", fcmToken);
    // Alert.alert("Push Token", fcmToken);

    const tokenUpdateResponse = await axiosClient.post(
      EmployeeApi.updateDeviceToken,
      {
        employeeId: patientId,
        deviceToken: fcmToken,
      },
    );
    console.log("token generated: ", tokenUpdateResponse);
  } catch (error) {
    console.log("token error: ", error);
    // Alert.alert("Push Token Error", String(error));
  }
}

const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log("Must use a physical device");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Request notification permission through Expo
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    // Get FCM token through React Native Firebase
    const messagingInstance = getMessaging();

    if (Platform.OS === "ios") {
      // iOS requires registering for remote messages (APNs) before
      // getToken() will resolve. Without this, getToken() can hang
      // or resolve with no value on iOS, while Android works fine.
      if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
        console.log("iOS: registering device for remote messages (APNs)...");
        await registerDeviceForRemoteMessages(messagingInstance);
      }

      const apnsToken = await getAPNSToken(messagingInstance);
      console.log("iOS APNs Token:", apnsToken);

      if (!apnsToken) {
        const message =
          "iOS: APNs token not available yet. Push token will not be generated. " +
          "Check that push notifications capability + a valid provisioning profile " +
          "(matching aps-environment) are set, and that this is a real device, not simulator.";
        console.log(message);
        // Alert.alert("APNs Token", message);
        return null;
      }

      // Alert.alert("APNs Token", apnsToken);
    }

    console.log("Requesting FCM token...");
    const fcmToken = await getToken(messagingInstance);

    if (fcmToken) {
      console.log("FCM Token received:", fcmToken);
    } else {
      console.log("FCM Token NOT received (getToken returned empty).");
    }

    return fcmToken;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
};
