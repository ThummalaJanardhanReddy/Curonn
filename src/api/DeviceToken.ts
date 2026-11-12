import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
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
    if (!Device.isDevice) {
      alert("Must use physical device");
      return;
    }

    // const { status } = await Notifications.requestPermissionsAsync();

    // if (status !== "granted") {
    //   alert("Permission not granted");
    //   return;
    // }

    // const tokenData = await Notifications.getDevicePushTokenAsync();
    // const fcmToken = tokenData.data;

    const fcmToken = await getFCMToken();

    console.log("FCM Token:", fcmToken);

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
  }
}

const getFCMToken = async () => {
  try {
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("Push notification permission not granted");
      return null;
    }

    const fcmToken = await messaging().getToken();

    return fcmToken;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
};
