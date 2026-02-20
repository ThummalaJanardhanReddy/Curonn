import axiosClient from "@/src/api/axiosClient";
import { ApiRoutes } from "@/src/api/employee/employee";
import useKeyboardVisible from "@/src/hooks/useKeyboardVisible";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { HelperText, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { images } from "../assets";
import BackButton from "./shared/components/BackButton";
import PrimaryButton from "./shared/components/PrimaryButton";
import { useUser } from "./shared/context/UserContext";
import commonStyles, { colors } from "./shared/styles/commonStyles";
import {fonts} from "./shared/styles/fonts";

// Validation constants
const VALIDATION_RULES = {
  EMPLOYEE_ID_MIN_LENGTH: 3,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// API Response interface
interface ValidationResponse {
  isSuccess?: boolean;
  message?: string;
  data?: any;
}

export default function VerifyDetailsScreen() {

  const { userData, setUserData } = useUser();
  const [employeeId, setEmployeeId] = useState(userData.employeeId || "");
  const [email, setEmail] = useState(userData.email || "");
  const [employeeIdError, setEmployeeIdError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [commonError, setCommonError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const keyboardVisible = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  const theme = useTheme();
  const customTheme = {
    ...theme,
    roundness: 8,
  };

  const bottomAnim = useRef(new Animated.Value(0)).current;

  // Ref for Employee ID input
  const employeeIdInputRef = useRef<any>(null);

  useEffect(() => {
    // Focus Employee ID input on mount
    setTimeout(() => {
      employeeIdInputRef.current?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(bottomAnim, {
        toValue: -e.endCoordinates.height + 40, // Move UP smoothly
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(bottomAnim, {
        toValue: 0, // Move DOWN smoothly
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateEmployeeId = (id: string) => {
    if (!id.trim()) {
      setEmployeeIdError("Employee ID is required");
      return false;
    }
    if (id.length < VALIDATION_RULES.EMPLOYEE_ID_MIN_LENGTH) {
      setEmployeeIdError(
        `Employee ID must be at least ${VALIDATION_RULES.EMPLOYEE_ID_MIN_LENGTH} characters`
      );
      return false;
    }
    setEmployeeIdError("");
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleContinue = async () => {
    const isEmployeeIdValid = validateEmployeeId(employeeId);
    const isEmailValid = validateEmail(email);

    if (!isEmployeeIdValid || !isEmailValid) return;

    setIsLoading(true);
    try {
      const validateUser = (await axiosClient.get(ApiRoutes.Employee.validate, {
        params: { employeeId: employeeId, emailId: email },
      })) as ValidationResponse;

      console.log("Validation response: ", validateUser);

      // Since axiosClient interceptor returns response.data, validateUser is already the data object
      if (validateUser?.isSuccess) {
        // Store user data in context before navigating
        setUserData({
          email: email,
          employeeId: employeeId,
          isVerified: false, // Will be true after OTP verification
        });
        router.push("/otp-verify");
      } else {
        setCommonError(
          validateUser?.message ||
            "Validation failed. Please check your details."
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
      setCommonError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueTest = async () => {
    const isEmployeeIdValid = validateEmployeeId(employeeId);
    const isEmailValid = validateEmail(email);

    if (!isEmployeeIdValid || !isEmailValid) return;

    setIsLoading(true);
    try {
      // const validateUser = await axiosClient.get(ApiRoutes.Employee.validate, {
      //   params: { employeeId: employeeId, emailId: email },
      // }) as ValidationResponse;

      // console.log('Validation response: ', validateUser);

      // // Since axiosClient interceptor returns response.data, validateUser is already the data object
      // if (validateUser?.isSuccess) {
      //   // Store user data in context before navigating
      //   setUserData({
      //     email: email,
      //     employeeId: employeeId,
      //     isVerified: false, // Will be true after OTP verification
      //   });
      //   router.push('/otp-verify');
      // } else {
      //   setCommonError(validateUser?.message || 'Validation failed. Please check your details.');
      // }
      router.push("/otp-verify");
    } catch (error) {
      console.error("Validation error:", error);
      setCommonError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid =
    employeeId.trim() &&
    email.trim() &&
    !employeeIdError &&
    !emailError &&
    !commonError;

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraScrollHeight={80}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <images.curonnLogo style={styles.image} width={234} height={60} />
              <Text style={styles.title}>Verify your Details</Text>
              <Text style={styles.subtitle}>We will verify your access</Text>
            </View>
    
            {/* FORM */}
            <View style={styles.formContainer}>
              {/* Employee ID */}
              <Text style={styles.label}>Employee ID</Text>
    
              <TextInput
                ref={employeeIdInputRef}
                placeholder="eg: 235262"
                placeholderTextColor="#9D9D9F"
                value={employeeId}
                onChangeText={(text) => {
                  setEmployeeId(text);
                  setEmployeeIdError("");
                  setCommonError("");
                }}
                onBlur={() => validateEmployeeId(employeeId)}
                mode="outlined"
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                theme={{ ...customTheme, roundness: 8, colors: { ...customTheme.colors, outline: '#E45C9C' }, }}
                error={!!employeeIdError}
                autoCapitalize="none"
                autoCorrect={false}
                outlineColor="#95959B"
                activeOutlineColor="#E45C9C"
                outlineStyle={{ borderWidth: 1 }}
              />
    
              {employeeIdError ? (
                <HelperText type="error" visible style={{ fontFamily: fonts.regular }}>
                  {employeeIdError}
                </HelperText>
              ) : null}
    
              {/* EMAIL */}
              <Text style={styles.label}>Working Email ID</Text>
    
              <TextInput
                placeholder="name@abc.com"
                placeholderTextColor="#9D9D9F"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                  setCommonError("");
                }}
                onBlur={() => validateEmail(email)}
                mode="outlined"
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                theme={{ ...customTheme, roundness: 8, colors: { ...customTheme.colors, outline: '#9D9D9F' }, }}
                error={!!emailError}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                outlineColor="#9D9D9F"
                activeOutlineColor="#E45C9C"
                outlineStyle={{ borderWidth: 1 }}
                returnKeyType="go"
                onSubmitEditing={handleContinue}
              />
    
              {emailError ? (
                <HelperText type="error" visible style={{ fontFamily: fonts.regular }}>
                  {emailError}
                </HelperText>
              ) : null}
    
              {commonError ? (
                <HelperText type="error" visible style={styles.commonError}>
                  {commonError}
                </HelperText>
              ) : null}
            </View>
    
            {/* ⭐ FORM FOOTER — Now Part of the Form Layout */}
            <View style={styles.bottomContainer}>
              {/* Terms */}
              <Text style={styles.termsText}>
                By signing up, you agree to Curonn{"\n"}
                <Text
                  style={styles.linkText}
                 
                >
                  Terms of services
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.linkText}
                 
                >
                  privacy policy
                </Text>
                .
              </Text>
    
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <BackButton
                  title="Back"
                  onPress={handleBack}
                  color="#000000"
                  style={styles.backButton}
                />
    
                <PrimaryButton
                  title={isLoading ? "Verifying..." : "Continue"}
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
                  style={styles.continueButton}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
    
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    flex: 1,
    // minHeight: 100,
    // paddingBottom: getResponsivePadding(40),
    backgroundColor: "#F5F4F9", // '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
    color: '#000000',
    marginBottom: 0,
    textAlign: 'left',
    marginTop: 5,
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    fontSize: 13,
    color: colors.black,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
  formContainer: {
    // paddingHorizontal: 0,
  },
  label: {
    fontSize: 14,
    color: colors.black,
    marginBottom: 2,
    marginTop: 16,
    fontFamily: fonts.semiBold,
  },
  textInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    // paddingVertical: 1,
    marginBottom: 5,
    borderRadius: 50,
    height: 50,
  },
  textInputContent: {
    borderRadius: 50,
    paddingHorizontal: 1,
    height: 50,
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  // termsText: {
  //   fontSize: 14,
  //   color: colors.textSecondary,
  //   lineHeight: 20,
  //   textAlign: "center",
  // },
  linkText: {
    fontSize: 14,
    color: "#1A82F7",
    textDecorationLine: "underline",
     fontFamily: fonts.regular,
    // fontWeight: '500',
  },
  // buttonContainer: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   // paddingHorizontal: 32,
  //   // paddingBottom: 20,
  //   paddingTop: 10,
  //   gap: 16,
  // },
  // backButton: {
  //   flex: 0.3,
  // },
  // continueButton: {
  //   flex: 0.7,
  // },
  commonError: {
    marginTop: 8,
    textAlign: "center",
  },
  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F4F9",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    // borderTopWidth: 1,
    // borderTopColor: "#E2E2E4",
  },
  formFooter: {
    marginTop: 40,
    paddingBottom: 40,
  },
  
  termsText: {
fontSize: 13,
    lineHeight: 22,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
     fontFamily: fonts.regular,
  },
  
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    gap: 16,
  },
  
  backButton: {
    flex: 0.3,
  },
  
  continueButton: {
    flex: 0.7,
  },
});
