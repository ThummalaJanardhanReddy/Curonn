import * as Notifications from "expo-notifications";
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

    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      alert("Permission not granted");
      return;
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenData.data;

    console.log("FCM Token:", fcmToken);

    await axiosClient.post(EmployeeApi.updateDeviceToken, {
      patientId,
      deviceToken: fcmToken,
    });
  } catch (error) {
    console.log("token error: ", error);
  }
}
