import React from 'react';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

export default function AppFontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../../assets/fonts/Poppins-Bold.ttf'),
    // ...add all other font files as needed
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C35E9C" />
      </View>
    );
  }

  return <>{children}</>;
}
