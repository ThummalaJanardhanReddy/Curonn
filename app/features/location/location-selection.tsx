import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Chip } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "../../../assets";
const { height: screenHeight } = Dimensions.get("window");
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import { useUser } from "../../shared/context/UserContext"; // adjust path as needed
import { useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Toast from "@/app/shared/components/Toast";
import { KeyboardAvoidingView, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { fontStyles, fonts } from "../../shared/styles/fonts";
import { colors } from "@/app/shared/styles/commonStyles";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  houseNumber: string;
  landmark: string;
  nickname: "home" | "office" | "other";
}

interface LocationSelectionProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: LocationData) => void;
  addressId?: number | null;
  isSimpleLocationSelect?: boolean; // Optional prop to indicate simple location selection
}

const GOOGLE_PLACES_API_KEY = "AIzaSyBrbqkkwpKdU0qIOkmJm6JnULSDr729oic";

export default function LocationSelection({
  visible,
  onClose,
  onLocationSelected,
  addressId,
  isSimpleLocationSelect = false, // Default to false if not provided
}: LocationSelectionProps) {
  const insets = useSafeAreaInsets();
  const { userData } = useUser();

  const isEditMode = !!addressId;
  const headerTitle = isEditMode ? "Update Address" : "Add New Address";
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [mapLoading, setMapLoading] = useState(true);
  const [errors, setErrors] = useState("");
  const [selectedNickname, setSelectedNickname] = useState<
    "home" | "office" | "other"
  >("home");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // submitting the address
  const [overlayVisible, setOverlayVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const mapRef = useRef<MapView>(null);
  const [fetchedIsDefault, setFetchedIsDefault] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: "",
    subtitle: "",
    type: "",
  });
  const { setUserData } = useUser();

  useEffect(() => {
    const restoreUserData = async () => {
      try {
        const userData = await SecureStore.getItemAsync("userData");
        if (userData) {
          setUserData(JSON.parse(userData));
        }
      } catch (error) {
        if (__DEV__)
          console.warn(
            "[LocationSelection] Failed to restore userData:",
            error,
          );
      }
    };
    restoreUserData();
  }, []);

  const patientId = Number(userData?.e_id || userData?.eId) || undefined;
  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const hideOverlay = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setOverlayVisible(false);
    });
  }, [slideAnim]);

  useEffect(() => {
    if (!visible) return;

    if (isEditMode && addressId) {
      // console.log("Fetching address details for editing, addressId:", addressId);
      axiosClient
        .get(ApiRoutes.Address.getAddressById(addressId))
        .then((response) => {
          if (response.isSuccess && response.data) {
            setAddress(response.data.address || "");
            setHouseNumber(response.data.hNo || "");
            setLandmark(response.data.landMark || "");
            setSelectedNickname(response.data.addressNickname || "home");
            setFetchedIsDefault(response.data.isDefault || false); // <-- Add this
          }
        })
        .catch((err) => {
          if (__DEV__)
            console.warn("[LocationSelection] Failed to load address:", err);
          setToastMessage({
            title: "Error",
            subtitle: "Couldn't load this address. Please try again.",
            type: "error",
          });
          setShowToast(true);
        });
    } else if (visible) {
      setAddress("");
      setHouseNumber("");
      setLandmark("");
      setSelectedNickname("home");
      setFetchedIsDefault(false);
      setMarkerPosition(null);
      setErrors("");
      setMapLoading(true);
    }
  }, [visible, isEditMode, addressId]);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature.",
        );
        return;
      }

      // Use timeInterval/distanceInterval instead of a manual race
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        // Fallback to last known location if fresh fix takes too long
        mayShowUserSettingsDialog: true,
      });

      setCurrentLocation(location);

      try {
        const addressResult = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResult.length > 0) {
          const addr = addressResult[0];
          // Extract fields
          const cityVillage = addr.city || "";
          const mandal = addr.subregion || "";
          const district = addr.district || "";
          const country = addr.country || "";
          const state = addr.region || "";
          const pincode = addr.postalCode || "";
          const fullAddress = [
            cityVillage,
            district,
            mandal,
            state,
            country,
            pincode,
          ]
            .filter(Boolean)
            .join(", ");
          setAddress(fullAddress || "Address not found");
        } else {
          setAddress(
            `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`,
          );
        }
      } catch (geocodingError) {
        console.warn("Geocoding failed:", geocodingError);
        setAddress(
          `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`,
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your location. Please ensure GPS is enabled and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
      showOverlay();
    } else {
      hideOverlay();
    }
  }, [visible, showOverlay, hideOverlay]);

  const handleConfirmLocation = async () => {
    if (isSaving) return; // guard against double-tap firing two saves

    if (!address.trim()) {
      Alert.alert("Error", "Please enter your address");
      return;
    }
    if (!houseNumber.trim()) {
      setErrors("Please enter your house/flat number");
      return;
    }

    if (!currentLocation && !markerPosition) {
      Alert.alert(
        "Location required",
        "We couldn't determine your location. Please use the locate-me button or search for an address before confirming.",
      );
      return;
    }
    if (!patientId) {
      Alert.alert(
        "Something went wrong",
        "We couldn't identify your account. Please close and reopen the app, then try again.",
      );
      return;
    }

    const locationData: LocationData = {
      latitude:
        markerPosition?.latitude ?? currentLocation?.coords.latitude ?? 0,
      longitude:
        markerPosition?.longitude ?? currentLocation?.coords.longitude ?? 0,
      address: address,
      houseNumber: houseNumber,
      landmark: landmark,
      nickname: selectedNickname,
    };

    const payload: any = {
      patientId: patientId,
      address: locationData.address,
      hNo: locationData.houseNumber,
      landMark: locationData.landmark,
      addressNickname: locationData.nickname,
      isDefault: isEditMode ? fetchedIsDefault : false, // fetchedIsDefault from API response
      userId: patientId,
    };

    if (isEditMode && addressId) {
      payload.addressId = addressId;
    }
    setIsSaving(true);

    try {
      const responsedata: any = await axiosClient.post(
        ApiRoutes.Address.saveAddress,
        payload,
      );
      console.log("saved addresses:", responsedata);

      if (responsedata && responsedata.responseCode === "200") {
        setToastMessage({
          title: "Success",
          subtitle: responsedata.message,
          type: "success",
        });
        setShowToast(true);
        // Optionally close modal or call onLocationSelected
        onLocationSelected(locationData);
        // await AsyncStorage.removeItem("userLocationLatLng");
        await AsyncStorage.setItem(
          "userLocationLatLng",
          JSON.stringify({
            latitude: locationData?.latitude,
            longitude: locationData?.longitude,
          }),
        );
        console.log("Address: ", locationData);
        console.log(
          "saved address: ",
          await AsyncStorage.getItem("userLocationLatLng"),
        );
        onClose();
      }
    } catch (error) {
      if (__DEV__)
        console.error("[LocationSelection] Failed to save address:", error);
      setToastMessage({
        title: "Error",
        subtitle:
          "Couldn't save this address. Please check your connection and try again.",
        type: "error",
      });
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image source={images.icons.close} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {/* Map Placeholder */}
          <GooglePlacesAutocomplete
            placeholder="Search location"
            fetchDetails={true}
            debounce={300}
            enablePoweredByContainer={false}
            onPress={(data, details = null) => {
              if (!details || !details.geometry || !details.geometry.location) {
                Alert.alert(
                  "Error",
                  "Could not get location details. Please try again.",
                );
                return;
              }
              const loc = details?.geometry.location;

              if (!loc) return;

              const coords = {
                latitude: loc.lat,
                longitude: loc.lng,
              };

              setMarkerPosition(coords);
              setAddress(data.description);

              mapRef.current?.animateToRegion({
                ...coords,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              });
            }}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: "en",
              //location: `${currentLocation?.coords.latitude},${currentLocation?.coords.longitude}`,
              components: "country:in",
            }}
            styles={{
              container: {
                position: "absolute",
                top: 80,
                width: "85%",
                alignSelf: "center",
                zIndex: 10,
                borderRadius: 8,
                shadowColor: "#dcdcdc",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
              textInput: {
                height: 48,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#d1d1d2",
                backgroundColor: "#fff",
                paddingLeft: 40, // space for search icon
                fontSize: 14,
                color: colors.primaryText,
                fontFamily: fonts.regular,
                paddingRight: 40, // space for clear icon
              },
              listView: {
                borderRadius: 8,
                marginTop: 4,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#d1d1d2",
                elevation: 2,
              },
            }}
            renderLeftButton={() => (
              <View
                style={{
                  position: "absolute",
                  left: 12,
                  top: 17,
                  zIndex: 1,
                }}
              >
                <Image
                  source={images.icons.search} // Make sure you have a search icon in your assets
                  style={{ width: 15, height: 15, tintColor: "#000" }}
                />
              </View>
            )}
          />
          <View style={styles.mapContainer}>
            <TouchableOpacity
              onPress={async () => {
                await getCurrentLocation();
                if (!currentLocation) return;

                const coords = {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                };

                setMarkerPosition(coords);

                mapRef.current?.animateToRegion({
                  ...coords,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }}
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                backgroundColor: "#6200ee",
                padding: 14,
                borderRadius: 40,
              }}
              accessibilityRole="button"
              accessibilityLabel="Use my current location"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {/* <Text style={{ color: "#fff" }}>📍</Text> */}

              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <images.icons.locationfill width={20} height={20} fill="#fff" />
              )}
            </TouchableOpacity>
            {/* Only show map loading indicator if map is loading AND not typing in address fields */}
            {mapLoading && !overlayVisible && (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={{ marginTop: 10 }}>Loading map...</Text>
              </View>
            )}
            {currentLocation ? (
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                onMapReady={() => setMapLoading(false)}
              >
                {(markerPosition || currentLocation) && (
                  <Marker
                    coordinate={{
                      latitude:
                        markerPosition?.latitude ||
                        currentLocation.coords.latitude,
                      longitude:
                        markerPosition?.longitude ||
                        currentLocation.coords.longitude,
                    }}
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.loadingContainer}>
                <Text>No location available</Text>
              </View>
            )}
          </View>

          {/* Bottom Overlay */}
          {overlayVisible && (
            <Animated.View
              style={[
                styles.overlay,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAwareScrollView
                  enableOnAndroid
                  extraScrollHeight={120}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 0 }}
                >
                  <View style={styles.overlayContent}>
                    {/* Current Location Info */}
                    <View style={styles.locationInfo}>
                      <View style={styles.locationHeader}>
                        <images.icons.locationfill
                          width={20}
                          height={20}
                          fill="#6200ee"
                          style={styles.locationIcon}
                        />

                        <Text style={styles.locationTitle}>
                          Current Address
                        </Text>
                      </View>
                      <Text style={styles.locationAddress}>
                        {address || "Getting address..."}
                      </Text>
                    </View>

                    {/* Address Fields */}
                    <View style={styles.addressFields}>
                      <TextInput
                        style={styles.inputhouse}
                        placeholder="House/Flat Number"
                        placeholderTextColor={colors.primaryText}
                        value={houseNumber}
                        onChangeText={(text) => {
                          setHouseNumber(text);
                          if (errors && text.trim()) setErrors(""); // Clear error on input
                        }}
                      />
                      {errors ? (
                        <Text style={styles.errortext}>{errors}</Text>
                      ) : null}
                      <TextInput
                        style={styles.input}
                        placeholder="Landmark (Optional)"
                        placeholderTextColor={colors.primaryText}
                        value={landmark}
                        onChangeText={setLandmark}
                      />
                      {!address && (
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your address manually"
                          placeholderTextColor={colors.primaryText}
                          value={address}
                          onChangeText={setAddress}
                        />
                      )}
                    </View>

                    {/* Nickname Chips */}
                    <View style={styles.nicknameSection}>
                      <Text style={styles.nicknameLabel}>
                        Choose nickname for this address
                      </Text>
                      <View style={styles.chipsContainer}>
                        {(["home", "office", "other"] as const).map(
                          (nickname) => (
                            <Chip
                              key={nickname}
                              selected={selectedNickname === nickname}
                              onPress={() => setSelectedNickname(nickname)}
                              style={[
                                styles.chip,
                                selectedNickname === nickname &&
                                  styles.chipSelected,
                              ]}
                              selectedColor={colors.primary}
                              textStyle={[
                                styles.chipText,
                                selectedNickname === nickname &&
                                  styles.chipTextSelected,
                              ]}
                            >
                              {nickname.charAt(0).toUpperCase() +
                                nickname.slice(1)}
                            </Chip>
                          ),
                        )}
                      </View>
                    </View>

                    <View style={{ width: "100%", alignItems: "center" }}>
                      <PrimaryButton
                        onPress={handleConfirmLocation}
                        title={
                          isSaving
                            ? "Saving..."
                            : isEditMode
                              ? "Update Address"
                              : "Confirm Address"
                        }
                        disabled={isSaving}
                      />
                    </View>
                  </View>
                </KeyboardAwareScrollView>
              </SafeAreaView>
            </Animated.View>
          )}
        </View>

        {/* Toast message */}
        <Toast
          visible={showToast}
          title={toastMessage.title}
          subtitle={toastMessage.subtitle}
          onHide={() => setShowToast(false)}
          duration={3000}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#333",
  },
  headerTitle: {
    fontSize: 16,
    color: colors.black,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  mapIcon: {
    width: 80,
    height: 80,
    tintColor: "#6200ee",
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  mapSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    //height: screenHeight * 0.7,
  },
  overlayContent: {
    padding: 20,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#6200ee",
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryText,
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  locationAddress: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  addressFields: {
    marginBottom: 20,
  },
  inputhouse: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 5,
    backgroundColor: "#fff",
    fontFamily: fonts.regular,
    color: colors.primaryText,
    
  },
  errortext: {
    ...fontStyles.errortext,
    color: "red",
    marginBottom: 8,
    fontFamily: fonts.regular,
    marginTop: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontFamily: fonts.regular,
    color: colors.primaryText
  },
  nicknameSection: {
    marginBottom: 20,
  },
  nicknameLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipSelected: {
    backgroundColor: "#fff",
    borderColor: colors.primary,
  },
  chipText: {
    color: "#666",
    fontFamily: fonts.medium,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  confirmButton: {
    borderRadius: 50,
    fontFamily: fonts.regular,
    height: 40,
  },
  confirmButtonContent: {
    paddingVertical: 5,
    fontFamily: fonts.regular,
  },
  mapLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    zIndex: 20,
  },
});
