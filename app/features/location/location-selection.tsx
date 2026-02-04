import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Chip } from "react-native-paper";
import { images } from "../../../assets";

const { height: screenHeight } = Dimensions.get("window");

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
}

export default function LocationSelection({
  visible,
  onClose,
  onLocationSelected,
}: LocationSelectionProps) {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [selectedNickname, setSelectedNickname] = useState<
    "home" | "office" | "other"
  >("home");
  const [isLoading, setIsLoading] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

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

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature."
        );
        return;
      }

      // Get current location with timeout
      const location = (await Promise.race([
        new Promise<Location.LocationObject>((resolve, reject) => {
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
            .then(resolve)
            .catch(reject);

          setTimeout(() => reject(new Error("Location timeout")), 15000);
        }),
      ])) as Location.LocationObject;

      setCurrentLocation(location);

      // Try to get address from coordinates with timeout
      try {
        const addressResult = (await Promise.race([
          Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Geocoding timeout")), 8000)
          ),
        ])) as Location.LocationGeocodedAddress[];

        if (addressResult.length > 0) {
          const addr = addressResult[0];
          const fullAddress = `${addr.street || ""} ${
            addr.streetNumber || ""
          }, ${addr.city || ""}, ${addr.region || ""}`.trim();
          setAddress(fullAddress);
        } else {
          // Fallback to coordinates if geocoding fails
          setAddress(
            `Lat: ${location.coords.latitude.toFixed(
              4
            )}, Lng: ${location.coords.longitude.toFixed(4)}`
          );
        }
      } catch (geocodingError) {
        console.warn("Geocoding failed, using coordinates:", geocodingError);
        // Fallback to coordinates if geocoding fails
        setAddress(
          `Lat: ${location.coords.latitude.toFixed(
            4
          )}, Lng: ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      if (error instanceof Error && error.message === "Location timeout") {
        Alert.alert("Timeout", "Location request timed out. Please try again.");
      } else {
        Alert.alert(
          "Error",
          "Failed to get current location. Please check your GPS settings."
        );
      }
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

  const handleConfirmLocation = () => {
    if (!address.trim()) {
      Alert.alert("Error", "Please enter your address");
      return;
    }

    const locationData: LocationData = {
      latitude: currentLocation?.coords.latitude || 0,
      longitude: currentLocation?.coords.longitude || 0,
      address: address,
      houseNumber: houseNumber,
      landmark: landmark,
      nickname: selectedNickname,
    };

    onLocationSelected(locationData);
    onClose();
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
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Image source={images.icons.close} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapContainer}>
                <images.icons.location
                  width={48}
                  height={48}
                  style={styles.mapIcon}
                />
              </View>
              <Text style={styles.mapTitle}>Location Detected</Text>
              <Text style={styles.mapSubtitle}>
                {currentLocation
                  ? `Lat: ${currentLocation.coords.latitude.toFixed(
                      6
                    )}, Lng: ${currentLocation.coords.longitude.toFixed(6)}`
                  : "No location detected"}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.refreshButtonText}>Refresh Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Overlay */}
        {overlayVisible && (
          <Animated.View
            style={[
              styles.overlay,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.overlayContent}>
              {/* Current Location Info */}
              <View style={styles.locationInfo}>
                <View style={styles.locationHeader}>
                  <images.icons.location
                    width={20}
                    height={20}
                    style={styles.locationIcon}
                  />
                  <Text style={styles.locationTitle}>Current Location</Text>
                </View>
                <Text style={styles.locationAddress}>
                  {address || "Getting address..."}
                </Text>
              </View>

              {/* Address Fields */}
              <View style={styles.addressFields}>
                <TextInput
                  style={styles.input}
                  placeholder="House/Flat Number"
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Landmark (Optional)"
                  value={landmark}
                  onChangeText={setLandmark}
                />
                {!address && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your address manually"
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
                  {(["home", "office", "other"] as const).map((nickname) => (
                    <Chip
                      key={nickname}
                      selected={selectedNickname === nickname}
                      onPress={() => setSelectedNickname(nickname)}
                      style={[
                        styles.chip,
                        selectedNickname === nickname && styles.chipSelected,
                      ]}
                      textStyle={[
                        styles.chipText,
                        selectedNickname === nickname &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {nickname.charAt(0).toUpperCase() + nickname.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Confirm Button */}
              <Button
                mode="contained"
                onPress={handleConfirmLocation}
                style={styles.confirmButton}
                contentStyle={styles.confirmButtonContent}
              >
                Confirm Location
              </Button>
            </View>
          </Animated.View>
        )}
      </View>
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
    fontWeight: "bold",
    color: "#333",
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  addressFields: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  nicknameSection: {
    marginBottom: 20,
  },
  nicknameLabel: {
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
  },
  chipText: {
    color: "#666",
  },
  chipTextSelected: {
    color: "#fff",
  },
  confirmButton: {
    borderRadius: 8,
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
});
