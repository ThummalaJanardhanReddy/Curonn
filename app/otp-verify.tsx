import axiosClient from "@/src/api/axiosClient";
import { ApiRoutes } from "@/src/api/employee/employee";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import type { TextInput as TextInputType } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { images } from "../assets";
import BackButton from "./shared/components/BackButton";
import PrimaryButton from "./shared/components/PrimaryButton";
import { useUser } from "./shared/context/UserContext";
import commonStyles, { colors } from "./shared/styles/commonStyles";

// API Response interface
interface OTPResponse {
  e_id?: number;
  email?: string;
  isSuccess?: boolean;
  message?: string;
  mobile_details_updated?: boolean;
  data?: any;
}

// API Response interface
interface ValidationResponse {
  isSuccess?: boolean;
  message?: string;
  data?: any;
}

export default function OTPVerifyScreen() {
  const { userData, setUserData } = useUser();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30); // Start with 30 seconds
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const inputRefs = useRef<TextInputType[]>([]);
  const insets = useSafeAreaInsets();

  const theme = useTheme();
  const customTheme = {
    ...theme,
    roundness: 8,
  };

  // Helper function to show snackbar messages
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus to next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 4) {
      showSnackbar("Please enter the complete 4-digit OTP");
      return;
    }
    try {
      setIsLoading(true);

      // API expects OTP as string, not number
      const requestData = {
        otp: otpString,
        email: userData.email || "sneha@abc.com",
      };

      console.log("Sending OTP request:", requestData);
      console.log("API endpoint:", ApiRoutes.Employee.verifyOTP);

      const otpResponse = (await axiosClient.post(
        ApiRoutes.Employee.verifyOTP,
        requestData
      )) as OTPResponse;
      console.log("OTP response:", otpResponse);

      // If OTP verification is successful, update user data and navigate
      if (otpResponse?.isSuccess && otpResponse.e_id) {
        getEmployeeDetails(otpResponse.e_id);
        setUserData({ isVerified: true });
        router.push("/username");
      } else {
        showSnackbar(otpResponse?.message || "Invalid OTP. Please try again.");
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);

        // Show specific error message from server
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error (${error.response.status})`;
        showSnackbar(errorMessage);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else if (error.request) {
        console.error("Request error:", error.request);
        showSnackbar("Network error. Please check your connection.");
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        console.error("Error:", error.message);
        showSnackbar("An unexpected error occurred.");
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeDetails = async (id: string | number) => {
    try {
      const response = await axiosClient.get(ApiRoutes.Employee.getById(id));
      const employee = response?.data ?? response;
      console.log("employee: ", employee);
      setUserData({ ...(userData ?? {}), ...employee });
    } catch (err) {
      console.error("Failed to fetch employee details:", err);
      showSnackbar("Failed to fetch employee details.");
    }
  };

  const handleResendOTP = async () => {
    const validateUser = (await axiosClient.get(ApiRoutes.Employee.validate, {
      params: { employeeId: userData?.employeeId, emailId: userData?.email },
    })) as ValidationResponse;
    if(!validateUser.isSuccess) showSnackbar('Something went wrong...')
    setResendTimer(30);
    showSnackbar("A new OTP has been sent to your email");
  };

  const handleBack = () => {
    router.back();
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* <RegistrationLayout headerBackgroundColor="#f5f5f5"> */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <images.curonnLogo style={styles.image} width={170} height={44} />
            </View>
            <Text style={styles.title}>Verify your details</Text>
            <Text style={styles.subtitle}>We will verify your access</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.infoText}>
              You will receive an OTP on your email
            </Text>
            {userData.email ? (
              <Text style={styles.emailText}>{userData.email}</Text>
            ) : null}

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref: TextInputType | null) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  mode="outlined"
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                  selectTextOnFocus
                  theme={customTheme}
                  outlineColor="#2B2C43"
                  activeOutlineColor="#2B2C43"
                  textColor="#000000"
                />
              ))}
            </View>

            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text style={styles.resendText}>
                  {`Resend OTP in ${resendTimer}s`}
                </Text>
              ) : (
                <Text style={styles.resendButton} onPress={handleResendOTP}>
                  Resend OTP
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <Text style={styles.termsText}>
          <Text>By signing up, you agree to Curonn{"\n"}</Text>
          <Text style={styles.linkText} onPress={() => {}}>
            Terms of services
          </Text>
          <Text> and </Text>
          <Text style={styles.linkText} onPress={() => {}}>
            privacy policy
          </Text>
          <Text>.</Text>
        </Text>

        <View style={styles.buttonContainer}>
          <BackButton
            title="Back"
            onPress={handleBack}
            color="#000000"
            style={styles.backButton}
          />

          <PrimaryButton
            title={isLoading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            // onPress={() => router.push("/username")} // TODO: Remove this after testing
            disabled={!isOtpComplete || isLoading}
            style={styles.verifyButton}
          />
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          style={styles.snackbar}
          action={{
            label: "Dismiss",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>

      {/* </RegistrationLayout> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    backgroundColor: "#F5F4F9",
    flexGrow: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    // padding: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 70,
    marginBottom: 30,
  },
  image: {
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2C43",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.black,
    textAlign: "center",
  },
  formContainer: {
    // paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  emailText: {
    fontSize: 14,
    color: "#C35E9C",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 55,
    height: 50,
    fontSize: 28,
    fontWeight: "bold",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  resendContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  resendButton: {
    fontSize: 14,
    color: "#2196F3",
    // textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#2196F3",
    // textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // padding: 20,
    // paddingBottom: 40,
    // gap: 16,
  },
  backButton: {
    flex: 0.3,
  },
  verifyButton: {
    flex: 0.7,
  },
  snackbar: {
    backgroundColor: "#f44336", // Error color
  },
});
