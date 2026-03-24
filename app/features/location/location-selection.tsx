import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as Location from "expo-location";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: LocationData) => void;
}

export default function LocationSelection({
  visible,
  onClose,
  onLocationSelected,
}: Props) {
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      getLocation();
    }
  }, [visible]);

  const getLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  const handleConfirm = () => {
    if (!location) return;

    onLocationSelected({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: "Selected from web",
    });

    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Web Location Selection</Text>

        <Text style={styles.subtitle}>
          Map is not supported on web.
        </Text>

        {location && (
          <Text style={styles.coords}>
            Lat: {location.coords.latitude} {"\n"}
            Lng: {location.coords.longitude}
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirm}
        >
          <Text style={styles.buttonText}>Confirm Location</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 10,
    color: "gray",
  },
  coords: {
    marginTop: 20,
    fontSize: 14,
  },
  button: {
    marginTop: 30,
    backgroundColor: "#C35E9C",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
  },
  close: {
    marginTop: 20,
    color: "red",
  },
});