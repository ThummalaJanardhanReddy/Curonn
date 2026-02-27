import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  setLocation: (lat: number, lng: number) => void;
}

const LocationContext = createContext<LocationData>({
  latitude: null,
  longitude: null,
  setLocation: () => {},
});

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <LocationContext.Provider value={{ latitude, longitude, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
