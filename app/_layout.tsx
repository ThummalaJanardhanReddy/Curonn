import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { UserProvider } from "./shared/context/UserContext";
import { CartProvider } from "./shared/context/CartContext";
import AppFontLoader from "./shared/components/AppFontLoader";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LogBox, View, Text } from "react-native";
import { useUserStore } from "../src/store/UserStore";
import {
  configureNotificationHandler,
  initializeNotificationListeners,
} from "@/src/api/NotificationService";

LogBox.ignoreLogs([
  "Text strings must be rendered within a <Text> component",
]);

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6200ee",
    secondary: "#03dac6",
  },
};

export default function RootLayout() {
  const { restoreUserData, user, isLoggedIn } = useUserStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    configureNotificationHandler();
    const cleanup = initializeNotificationListeners();
    restoreUserData().then(() => setLoading(false));
    return cleanup;
  }, []);

  if (loading) {
    return (
      <AppFontLoader>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C35E9C' }}>
          <Text style={{ fontSize: 18, color: '#fff' }}>Loading...</Text>
        </View>
      </AppFontLoader>
    );
  }

  return (
    <AppFontLoader>
      <UserProvider>
        <CartProvider>
          <PaperProvider theme={theme}>
            <KeyboardProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                }}
              >
                {/* Update the screen to match an existing route */}
               <Stack.Screen
                  name="shared/components/SplashScreen" 
                  options={{
                    animation: "none",
                  }}
                />
              </Stack>
            </KeyboardProvider>
          </PaperProvider>
        </CartProvider>
      </UserProvider>
    </AppFontLoader>
  );
}