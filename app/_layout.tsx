import { Stack } from "expo-router";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { UserProvider } from "./shared/context/UserContext";
import { CartProvider } from './shared/context/CartContext';
import AppFontLoader from "./shared/components/AppFontLoader";
import { KeyboardProvider } from "react-native-keyboard-controller";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6200ee",
    secondary: "#03dac6",
  },
};

export default function RootLayout() {
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
              />
            </KeyboardProvider>
        </PaperProvider>
        </CartProvider>
      </UserProvider>
    </AppFontLoader>
  );
}
