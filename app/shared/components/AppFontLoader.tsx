import React from 'react';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../styles/commonStyles';

export default function AppFontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    // 'Poppins-Regular': require('../../../assets/fonts/Poppins-Regular.ttf'),
    // 'Poppins-Medium': require('../../../assets/fonts/Poppins-Medium.ttf'),
    // 'Poppins-SemiBold': require('../../../assets/fonts/Poppins-SemiBold.ttf'),
    // 'Poppins-Bold': require('../../../assets/fonts/Poppins-Bold.ttf'),
    // ...add all other font files as needed
    'Lato-Black': require('../../../assets/fonts/Lato/Lato-Black.ttf'),
    'Lato-Bold': require('../../../assets/fonts/Lato/Lato-Bold.ttf'),
    'Lato-Regular': require('../../../assets/fonts/Lato/Lato-Regular.ttf'),
    'Lato-Light': require('../../../assets/fonts/Lato/Lato-Light.ttf'),
    'Lato-Thin': require('../../../assets/fonts/Lato/Lato-Thin.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color= {colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
