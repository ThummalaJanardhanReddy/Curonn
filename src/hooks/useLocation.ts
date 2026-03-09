import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {

        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature."
        );
        return null;
      }

      // Use timeInterval/distanceInterval instead of a manual race
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        // Fallback to last known location if fresh fix takes too long
        mayShowUserSettingsDialog: true,
      });

      setCurrentLocation(location);
      
      // Save lat/lng to AsyncStorage for use in other pages
      try {
        await AsyncStorage.setItem('userLocationLatLng', JSON.stringify({ latitude: location.coords.latitude, longitude: location.coords.longitude }));
        console.log('Saved lat/lng to AsyncStorage:', { latitude: location.coords.latitude, longitude: location.coords.longitude });
      } catch (storageError) {
        console.error('Failed to save lat/lng to AsyncStorage:', storageError);
      }

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
            `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`
          );
        }
      } catch (geocodingError) {
        console.warn("Geocoding failed:", geocodingError);
        setAddress(
          `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your location. Please ensure GPS is enabled and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        return fullAddress;
      }
      return '';
    } catch (err) {
      console.error('Error getting address:', err);
      return '';
    }
  };

  const getCurrentAddress = async () => {
    try {
      setIsLoading(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this feature."
        );
         return null;
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
      
      // Save lat/lng to AsyncStorage for use in other pages
      try {
        await AsyncStorage.setItem('userLocationLatLng', JSON.stringify({ latitude: location.coords.latitude, longitude: location.coords.longitude }));
        console.log('Saved lat/lng to AsyncStorage:', { latitude: location.coords.latitude, longitude: location.coords.longitude });
      } catch (storageError) {
        console.error('Failed to save lat/lng to AsyncStorage:', storageError);
      }

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
          // Village (city) for first row, district, mandal, state for second row
          const mandal = addr.subregion || '';

          const village = addr.city || '';
          const district = addr.district || '';
          const state = addr.region || '';
          // Compose as: 'village\ndistrict, mandal, state'
          const formattedAddress = `${[district, village, state].filter(Boolean).join(', ')}`;
          setAddress(formattedAddress);
          await AsyncStorage.setItem("userAddress", formattedAddress);
          return formattedAddress;
        } else {
          // Fallback to coordinates if geocoding fails
          const fallback = `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`;
          setAddress(fallback);
          await AsyncStorage.setItem("userAddress", fallback);
          return fallback;
        }
      } catch (geocodingError) {
        const fallback = `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`;
        setAddress(fallback);
        await AsyncStorage.setItem("userAddress", fallback);
        return fallback;
      }
    } catch (error) {
      console.log("Location error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLocation,
    isLoading,
    error,
    getCurrentLocation,
    getAddressFromCoordinates,
    getCurrentAddress,
    address,
  };
};
