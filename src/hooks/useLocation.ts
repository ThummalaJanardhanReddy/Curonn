import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';


export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to use this feature.');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);
      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      setError(errorMessage);
      return null;
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
            } ${addr.city || ""}, ${addr.region || ""}`.trim();
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
        // console.error("Error getting location:", error);
        if (error instanceof Error && error.message === "Location timeout") {
          // Alert.alert("Timeout", "Location request timed out. Please try again.");
        } else {
          Alert.alert(
            "Error",
            "Failed to get current location. Please check your GPS settings."
          );
        }
      } finally {
        setIsLoading(false);
        return address;
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
