import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { images } from "../../../assets";
import { Dimensions } from "react-native";
import { useUserStore } from "@/src/store/UserStore";
import { colors } from "../styles/commonStyles";
const { width, height } = Dimensions.get("window");
export default function AppSplashScreen() {
  const { restoreUserData } = useUserStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Restore user data
        await restoreUserData();
        // Wait a bit for the app to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Redirect based on user presence — read the store fresh here rather
        // than a destructured `user`, which would still be the pre-restore
        // (usually null) value captured when this component first rendered.
        const { user } = useUserStore.getState();
        if (user) {
          router.replace("/home");
        } else {
          router.replace("/welcome");
        }
      } catch (error) {
        console.error("Error during app initialization:", error);
        router.replace("/welcome");
      }
    };
    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={images.splashScreen} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // width: wp(100),
    // height: hp(100),
  },
  logo: {
    // width: width,
    // height: height,
      width: 350,
    height: 350,
    resizeMode: "contain",
  },
});
