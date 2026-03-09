import { router, Tabs, usePathname } from "expo-router";
import * as Font from "expo-font";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "../../assets";
import RegistrationGuard from "../shared/components/RegistrationGuard";
import HomeIcon from "../../assets/AppIcons/Curonn_icons/menu/new/home.svg";
import HomeIconSelected from "../../assets/AppIcons/Curonn_icons/menu/new/home_select.svg";
import LabIcon from "../../assets/AppIcons/Curonn_icons/menu/new/lab.svg";
import LabIconSelected from "../../assets/AppIcons/Curonn_icons/menu/new/lab_select.svg";
import DoctorIcon from "../../assets/AppIcons/Curonn_icons/menu/new/doctor.svg";
import DoctorIconSelected from "../../assets/AppIcons/Curonn_icons/menu/new/doctor_select.svg";
import MedicineIcon from "../../assets/AppIcons/Curonn_icons/menu/new/medicine.svg";
import MedicineIconSelected from "../../assets/AppIcons/Curonn_icons/menu/new/medicine_select.svg";
import OrderIcon from "../../assets/AppIcons/Curonn_icons/menu/new/orders.svg";
import OrderIconSelected from "../../assets/AppIcons/Curonn_icons/menu/new/orders_slect.svg";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../shared/utils/responsive";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState(0);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Tab configuration (must be before any early return)
  const tabs = useMemo(
    () => [
      {
        key: "home",
        title: "Home",
        image: HomeIcon,
        selectedImage: HomeIconSelected,
        route: "/main/home",
        width: 24,
        height: 24,
      },
      {
        key: "lab-tests",
        title: "Lab Tests",
        image: LabIcon,
        selectedImage: LabIconSelected,
        route: "/lab-tests",
        width: 24,
        height: 24,
      },
      {
        key: "my-doctor",
        title: "My Doctor",
        image: DoctorIcon,
        selectedImage: DoctorIconSelected,
        route: "/my-doctor",
        width: 24,
        height: 24,
      },
      {
        key: "medicines",
        title: "Medicines",
        image: MedicineIcon,
        selectedImage: MedicineIconSelected,
        route: "/medicines",
        width: 24,
        height: 24,
      },
      {
        key: "orders",
        title: "Orders",
        image: OrderIcon,
        selectedImage: OrderIconSelected,
        route: "/orders",
        width: 24,
        height: 24,
      },
    ],
    [],
  );

  useEffect(() => {
    Font.loadAsync({
      "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
      "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
      "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
      "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
      // ...add all other font files
    }).then(() => setFontsLoaded(true));
  }, []);

  // Update active tab based on current route
  useEffect(() => {
    const currentTabIndex = tabs.findIndex((tab) => tab.route === pathname);
    if (currentTabIndex !== -1) {
      setActiveTab(currentTabIndex);
    }
  }, [pathname, tabs]);

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveTab(index);
      const tab = tabs[index];
      // Navigate to the tab's route
      router.push(tab.route as any);
    },
    [tabs],
  );

  if (!fontsLoaded) {
    return null; // or a splash/loading screen
  }

  return (
    <RegistrationGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#ED67B8",
          tabBarInactiveTintColor: "#FFFFFF70",
          // 🔥 Forced centering at the ICON CONTAINER level
          tabBarIconStyle: {
            justifyContent: "center",
            alignItems: "center",
            marginTop: 0,
            // borderWidth: 1,
            // borderColor: "red",
          },

          // 🔥 Align label close to icon
          tabBarLabelStyle: {
            marginTop: 0,
          },

          // 🔥 Outer tab item container
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },

          // 🔥 Entire tab bar styling with dynamic bottom inset
          tabBarStyle: {
            backgroundColor: "#5F4660",
            borderTopWidth: 0,
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 7
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.key}
            name={tab.key}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, size, focused }) => {
                // Use selectedImage for all tabs when focused
                const IconComponent =
                  focused && tab.selectedImage ? tab.selectedImage : tab.image;
                return typeof IconComponent === "function" ? (
                  <IconComponent
                    width={tab.width || size}
                    height={tab.height || size}
                  />
                ) : (
                  <Image
                    source={IconComponent}
                    style={{ width: size, height: size, tintColor: color }}
                    resizeMode="contain"
                  />
                );
              },
            }}
          />
        ))}
      </Tabs>
    </RegistrationGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomTabContainer: {
    flexDirection: "row",
    backgroundColor: "#5F4660",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveSpacing(16),
    marginHorizontal: getResponsiveSpacing(4),
  },
  tabIcon: {
    ...getResponsiveImageSize(22, 22),
  },
  tabText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: "500",
    marginTop: getResponsiveSpacing(4),
    textAlign: "center",
  },
});
