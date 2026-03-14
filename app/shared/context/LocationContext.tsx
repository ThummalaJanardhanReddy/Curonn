import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  setLocation: (lat: number, lng: number) => void;
  address: string;
  setAddress: (address: string) => void;
}

const LocationContext = createContext<LocationData>({
  latitude: null,
  longitude: null,
  setLocation: () => {},
  address: 'Select your address',
  setAddress: () => {},
});

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddressState] = useState('Select your address');

  React.useEffect(() => {
    const fetchAddress = async () => {
      const storedAddress = await AsyncStorage.getItem('userAddress');
      if (storedAddress) setAddressState(storedAddress);
    };
    fetchAddress();
  }, []);

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const setAddress = async (newAddress: string) => {
    setAddressState(newAddress);
    await AsyncStorage.setItem('userAddress', newAddress);
  };

  return (
    <LocationContext.Provider value={{ latitude, longitude, setLocation, address, setAddress }}>
      {children}
    </LocationContext.Provider>
  );
};
