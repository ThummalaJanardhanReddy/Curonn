import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { images } from '../../../assets';
import { Dimensions } from 'react-native';
import { useUserStore } from '@/src/store/UserStore';
 const { width, height } = Dimensions.get('window');
export default function AppSplashScreen() {

  const { restoreUserData, user } = useUserStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Restore user data
        await restoreUserData();
        // Wait a bit for the app to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Redirect based on user presence
        if (user) {
          router.replace('/home');
        } else {
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        router.replace('/welcome');
      }
    };
    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      {/* <StatusBar 
        barStyle="light-content" 
        backgroundColor="#694664" 
        translucent={false}
      /> */}
      <Image source={images.splashScreen} style={styles.logo} />
      {/* <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C35E9C',
    // justifyContent: 'center',
    // alignItems: 'center',
    // paddingTop: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // width: wp(100),
    // height: hp(100),
  },
  logo: {
     width: width,
   height: height,
  //   width: 200,
  // height: 200,
    resizeMode: 'contain',
  },
});
