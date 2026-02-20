import { images } from '@/assets';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Text } from 'react-native-paper';
import BackButton from './shared/components/BackButton';
import PrimaryButton from './shared/components/PrimaryButton';
import RegistrationLayout from './shared/components/ui/registration-layout';
import { useUser } from './shared/context/UserContext';
import commonStyles, { colors } from './shared/styles/commonStyles';
import { fonts } from './shared/styles/fonts';
import { saveUserData, setRegistrationCompleted } from './shared/utils/storage';

export default function UsernameScreen() {
  const { userData, setUserData } = useUser();
  // Simulate API response for username
  const apiUsername = userData?.fullName || 'John Doe'; // This would come from API

  // Get mobile_details_updated from router params
  const params = useLocalSearchParams();
  const mobileDetailsUpdated = params.mobile_details_updated === 'true';

  const handleContinue = async() => {
    if (mobileDetailsUpdated) {
      await setRegistrationCompleted(true);
      console.log("Mobile details updated, redirecting to home...");
      router.push('/home');
    } else {
      router.push('/personalization');
    }
   // router.push('/personalization');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    // <View style={styles.container}>
    <RegistrationLayout headerBackgroundColor='#F5F4F9'>
      {/* <StatusBar hidden={false}  translucent={true} backgroundColor='#1A82F7'/> */}
      <View style={styles.backButtonContainer}>
        <BackButton
          title="Back"
          onPress={handleBack}
          style={styles.backButton}
        />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Hi {apiUsername}.</Text>
          <Text style={styles.subtitle}>
            Answer a few questions{'\n'}to start personalising your{'\n'}Journey.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </View>
      
      {/* Background Image */}
      <View style={styles.backgroundImageContainer}>
        <Image source={images.panels.personalization_bottom} style={styles.backgroundImage} />
        {/* <images.panels.personalization_bottom
          style={styles.backgroundImage}
        /> */}
      </View>
      </RegistrationLayout> 
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    // flex: 1,
    backgroundColor: '#F5F4F9', // colors.bg_primary,
  },
  backButtonContainer: {
    // paddingTop: 10,
    // paddingHorizontal: 32,
    // paddingBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    // paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    fontFamily: fonts.regular,
  },
  title: {
    fontSize: 17,
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: fonts.regular,
    fontStyle: 'normal',
    fontWeight: '400',
    color: colors.black,
    textAlign: 'center',
    lineHeight: 32,
  },
  buttonContainer: {
    // paddingHorizontal: 32,
    paddingBottom: 10,
    paddingTop: 10,
    zIndex: 1,
    // alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 45,
    // zIndex: 1,
  },
  backgroundImageContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    height: 130,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
