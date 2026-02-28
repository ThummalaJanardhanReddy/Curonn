import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../assets";
import PrimaryButton from "./shared/components/PrimaryButton";
import commonStyles, { colors } from "./shared/styles/commonStyles";
import { fonts } from './shared/styles/fonts';
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
  hp,
  useResponsiveDimensions,
  wp,
} from "./shared/utils/responsive";

export default function WelcomeScreen() {
  const { insets } = useResponsiveDimensions();

  const handleContinue = () => {
    try {
      //console.log("Navigating to terms screen...");
      // router.push("/terms");
      router.push('/(main)/home')
    } catch (error) {
      console.error("Error navigating to terms:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#ffffff" animated />
      <SafeAreaView style={[styles.container, { backgroundColor: "#ffffff" }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            {/* Welcome Image */}
            <Image source={images.welcome} style={styles.welcomeImage} />

            {/* Welcome To Text */}
            <Text style={styles.welcomeText}>WELCOME TO</Text>

            {/* Logo */}
            <images.curonnLogo style={styles.logo} />

            {/* Support Message */}
            <Text style={styles.supportText}>
              Our Support team will always be there to help you in delivering
              quality care.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton title="Continue" onPress={handleContinue} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: colors.statusbar_black,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    ...commonStyles.container_layout,
    // paddingHorizontal: getResponsiveSpacing(15),
    // paddingBottom: getResponsiveSpacing(40),
    // paddingTop:10,
    // minHeight: hp(100) - getResponsiveSpacing(100), // Account for safe area and padding
    backgroundColor: "#FFFFFF",
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  welcomeImage: {
    width: wp(100),
    height: hp(55),
    resizeMode: "contain",
    marginBottom: getResponsiveSpacing(30),
  },
  welcomeText: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 400,
    color: colors.black,
    textAlign: "center",
    marginBottom: getResponsiveSpacing(15),
    fontFamily: fonts.regular,
  },
  logo: {
    // width: wp(80),
    // height: hp(15),
    resizeMode: "contain",
    marginBottom: getResponsiveSpacing(15),
  },
  supportText: {
    fontSize: getResponsiveFontSize(14),
    textAlign: "center",
    lineHeight: getResponsiveFontSize(22),
    paddingHorizontal: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(20),
    fontFamily: fonts.regular,
    color: '#141F2A',
  },
  buttonContainer: {
    alignItems: "center",
    // paddingBottom: getResponsiveSpacing(20),
  },
});
