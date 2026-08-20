import { useLocation } from "@/src/hooks/useLocation";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LocationSelection from "../../features/location/location-selection";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../utils/responsive";
import CartModal from "./CartModal";
import ProfileModal from "./ProfileModal";
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import { fonts } from "../../shared/styles/fonts";
import { useCart } from "../context/CartContext";
import MenuHomeIcon from "../../../assets/AppIcons/Curonn_icons/menu/new/hamburger-homemenu.svg";
import CartIcon from "../../../assets/AppIcons/Curonn_icons/carticon.svg";
import LocationPinIcon from "../../../assets/AppIcons/Curonn_icons/location.svg"; // TODO: point at the actual location pin asset used by `images.icons.location`
import BellIcon from "../../../assets/AppIcons/Curonn_icons/bell_ic.svg"; // TODO: point at the actual bell asset used by `images.notification_bell_svg`
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "@/src/store/UserStore";
import { colors } from "../styles/commonStyles";

interface CommonHeaderProps {
  title?: string;
  isHomePage?: boolean;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
  onLocationChange?: (location: string) => void;
  showCart?: boolean;
  showProfile?: boolean;
  showLocation?: boolean;
  onRefreshNotificationCount?: (cb: () => void) => void;
}

const ACCENT = {
  pin: "#D94A2C",
  cartBg: "#FED8EC",
  badgeRed: "#FF4444",
};

/**
 * Splits "Area, City, State" into a bold primary line and a lighter
 * secondary line so long addresses don't visually compete with the icon row.
 */
function splitLocation(location: string) {
  if (!location.includes(",")) {
    return { primary: location, secondary: "" };
  }
  const [first, ...remainder] = location.split(",");
  return { primary: first.trim(), secondary: remainder.join(",").trim() };
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.notificationBadge}>
      <Text style={styles.notificationBadgeText}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.cartBadge}>
      <Text style={styles.cartBadgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export default function CommonHeader({
  title,
  isHomePage = false,
  onProfilePress,
  onNotificationPress,
  onCartPress,
  onLocationChange,
  showCart = true,
  showProfile = true,
  showLocation = true,
  onRefreshNotificationCount,
}: CommonHeaderProps) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const { getCurrentAddress } = useLocation();
  const { userData } = useUser();
  const { cartCount } = useCart();
  const { restoreUserData, user } = useUserStore();

  const patientId = Number(userData?.e_id || user?.eId) || undefined;

  const fetchNotificationCount = useCallback(async () => {
    if (!patientId) return;
    try {
      const response = await axiosClient.get(
        ApiRoutes.Notification.GetCount(patientId, "patient"),
      );
      setNotificationCount(response?.data ?? response ?? 0);
    } catch (error) {
      console.error(
        "[CommonHeader] Failed to fetch notification count:",
        error,
      );
    }
  }, [patientId]);

  useEffect(() => {
    restoreUserData();
  }, [restoreUserData]);

  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  useEffect(() => {
    onRefreshNotificationCount?.(fetchNotificationCount);
  }, [onRefreshNotificationCount, fetchNotificationCount]);

  useEffect(() => {
    let cancelled = false;

    const fetchAddress = async () => {
      setLocationLoading(true);
      try {
        const storedAddress = await AsyncStorage.getItem("userAddress");
        if (storedAddress) {
          if (!cancelled) {
            setSelectedLocation(storedAddress);
            onLocationChange?.(storedAddress);
          }
          return;
        }

        const addr = await getCurrentAddress();
        if (!cancelled) {
          if (addr) {
            setSelectedLocation(addr);
            onLocationChange?.(addr);
          } else {
            // Don't force the location picker open unprompted — just invite
            // the user to tap and choose one themselves.
            setSelectedLocation(null);
          }
        }
      } catch (error) {
        console.log("[CommonHeader] Location load error:", error);
        if (!cancelled) setSelectedLocation(null);
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    };

    fetchAddress();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSelected = async (locationData: { address: string }) => {
    setSelectedLocation(locationData.address);
    await AsyncStorage.setItem("userAddress", locationData.address);
    onLocationChange?.(locationData.address);
    setLocationVisible(false);
  };

  const { primary, secondary } = splitLocation(
    selectedLocation ?? "Select your location",
  );

  const renderLocation = (
    primaryStyle: object,
    secondaryStyle: object,
    pinColor?: string,
  ) => (
    <TouchableOpacity
      style={styles.locationInfo}
      onPress={() => setLocationVisible(true)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Change delivery location"
    >
      <View style={styles.locationhead}>
        {locationLoading ? (
          <View style={styles.locationLoadingRow}>
            <ActivityIndicator size="small" color={colors.primaryText} />
            <Text style={[primaryStyle, styles.locationLoadingText]}>
              Locating you...
            </Text>
          </View>
        ) : (
          <>
            <Text style={primaryStyle} numberOfLines={1} ellipsizeMode="tail">
              {primary}{" "}
              <LocationPinIcon
                width={16}
                height={16}
                style={styles.locationIcon}
                fill={pinColor ?? ACCENT.pin}
              />
            </Text>
            {secondary ? (
              <Text
                style={secondaryStyle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {secondary}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={isHomePage ? styles.homeHeader : styles.defaultHeader}>
        <View style={styles.headerLeft}>
          {(showProfile || isHomePage) && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                setProfileVisible(true);
                onProfilePress?.();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <MenuHomeIcon
                width={25}
                height={25}
                style={styles.profileIcon}
                fill={colors.primaryText}
              />
            </TouchableOpacity>
          )}

          {showLocation
            ? renderLocation(
                isHomePage ? styles.homeLocationText : styles.locationText,
                isHomePage
                  ? styles.homeLocationSubtext
                  : styles.sublocationText,
              )
            : title && (
                <Text style={[styles.locationText, styles.titleFallback]}>
                  {title}
                </Text>
              )}
        </View>

        {isHomePage ? (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => (onNotificationPress ? onNotificationPress() : null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${
              notificationCount > 0 ? `, ${notificationCount} unread` : ""
            }`}
          >
            <BellIcon
              style={styles.notificationIcon}
              fill={colors.primaryText}
            />
            <NotificationBadge count={notificationCount} />
          </TouchableOpacity>
        ) : (
          showCart && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => {
                onCartPress?.();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Cart${
                cartCount > 0 ? `, ${cartCount} items` : ""
              }`}
            >
              <CartIcon style={styles.cartIcon} width={15} height={15} />
              <CartBadge count={cartCount} />
            </TouchableOpacity>
          )
        )}
      </View>

      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
      <CartModal visible={cartVisible} onClose={() => setCartVisible(false)} />
      <LocationSelection
        visible={locationVisible}
        onClose={() => setLocationVisible(false)}
        onLocationSelected={handleLocationSelected}
        isSimpleLocationSelect
      />
    </>
  );
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingBottom: getResponsiveSpacing(5),
    paddingVertical: getResponsiveSpacing(10),
    backgroundColor: colors.bg_primary,
    zIndex: 1,
  },
  defaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: getResponsiveSpacing(10),
    backgroundColor: colors.white,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  profileButton: {
    marginRight: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(4),
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 30,
  },
  locationInfo: {
    flex: 1,
    minWidth: 0,
  },
  locationhead: {
    justifyContent: "center",
  },
  locationLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveSpacing(6),
  },
  locationLoadingText: {
    opacity: 0.7,
  },
  locationIcon: {
    ...getResponsiveImageSize(16, 16),
    marginLeft: getResponsiveSpacing(4),
  },
  homeLocationText: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: "600",
    color: colors.primaryText,
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
  homeLocationSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: colors.primaryText,
    fontFamily: fonts.regular,
  },
  locationText: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: "600",
    color: "#000",
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
  sublocationText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: fonts.regular,
    color: "#666",
  },
  titleFallback: {
    marginLeft: getResponsiveSpacing(8),
  },
  notificationButton: {
    padding: getResponsiveSpacing(8),
    paddingBottom: 0,
  },
  notificationIcon: {
    ...getResponsiveImageSize(28, 28),
  },
  notificationBadge: {
    position: "absolute",
    borderRadius: getResponsiveSpacing(10),
    top: getResponsiveSpacing(2),
    right: 0,
    backgroundColor: colors.primary,
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(2),
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(10),
    fontFamily: fonts.bold,
  },
  cartButton: {
    padding: getResponsiveSpacing(3),
    backgroundColor: ACCENT.cartBg,
    width: getResponsiveSpacing(30),
    height: getResponsiveSpacing(30),
    borderRadius: getResponsiveSpacing(15),
    justifyContent: "center",
    alignItems: "center",
  },
  cartIcon: {
    ...getResponsiveImageSize(28, 28),
  },
  cartBadge: {
    position: "absolute",
    top: getResponsiveSpacing(-8),
    right: getResponsiveSpacing(-2),
    backgroundColor: ACCENT.badgeRed,
    borderRadius: getResponsiveSpacing(10),
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(4),
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: getResponsiveFontSize(9),
    fontFamily: fonts.bold,
  },
});
