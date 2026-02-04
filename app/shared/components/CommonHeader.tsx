import { useLocation } from '@/src/hooks/useLocation';
import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { images } from '../../../assets';
import LocationSelection from '../../features/location/location-selection';
import { getResponsiveFontSize, getResponsiveImageSize, getResponsiveSpacing } from '../utils/responsive';
import CartModal from './CartModal';
import ProfileModal from './ProfileModal';

interface CommonHeaderProps {
  title?: string;
  isHomePage?: boolean;
  currentLocation?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
  onLocationChange?: (location: string) => void;
}

export default function CommonHeader({
  title,
  isHomePage = false,
  currentLocation = 'New York, NY',
  onProfilePress,
  onNotificationPress,
  onCartPress,
  onLocationChange,
}: CommonHeaderProps) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const {getCurrentAddress, address} = useLocation();

  useEffect(() => {
    // Fetch current address on mount
    const fetchAddress = async () => {
      const address = await getCurrentAddress();
      if (address) {
        setSelectedLocation(address);
        if (onLocationChange) {
          onLocationChange(address);
        }
    };
    }
    fetchAddress();
  }, []);

  useEffect(() => {
    setSelectedLocation(address);
  }, [address]);
  
  const handleProfilePress = () => {
    console.log('Profile button pressed');
    setProfileVisible(true);
    if (onProfilePress) {
      onProfilePress();
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      console.log('Notification pressed');
    }
  };

  const handleCartPress = () => {
    console.log('Cart button pressed');
    setCartVisible(true);
    if (onCartPress) {
      onCartPress();
    }
  };

  const handleLocationPress = () => {
    console.log('Location pressed');
    setLocationVisible(true);
  };

  const handleLocationSelected = (locationData: any) => {
    console.log('Location selected:', locationData);
    const locationString = `${locationData.address}, ${locationData.houseNumber}`;
    setSelectedLocation(locationString);
    if (onLocationChange) {
      onLocationChange(locationString);
    }
  };

  const handleLocationClose = () => {
    setLocationVisible(false);
  };

  if (isHomePage) {
    // Home page style with background and different layout
    return (
      <>
        <View style={styles.homeHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              {/* <Image source={images.profile} style={styles.profileIcon} /> */}
              <images.profile style={styles.profileIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
              <Text style={styles.homeLocationText}>{selectedLocation}   <images.icons.location style={styles.locationIcon} /></Text>
              {/* <Text style={styles.homeLocationSubtext}>Current Location</Text> */}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            {/* <Image source={images.notification} style={styles.notificationIcon} /> */}
            <images.notification_bell_svg style={styles.notificationIcon} />
          </TouchableOpacity> 
        </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
      
      {/* Cart Modal */}
      <CartModal
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
      />
      
      {/* Location Selection Modal */}
      <LocationSelection
        visible={locationVisible}
        onClose={handleLocationClose}
        onLocationSelected={handleLocationSelected}
      />
    </>
  );
}

  // Default style for other pages (like lab-tests)
  return (
    <>
      <View style={styles.defaultHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            {/* <Image source={images.profile} style={styles.profileIcon} /> */}
            <images.profile style={styles.profileIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
            <Text style={styles.locationText}>{selectedLocation} <images.icons.location style={[styles.locationIcon, ]} stroke={'#000000'} /></Text>
            {/* <Text style={styles.locationSubtext}>Current Location</Text> */}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleCartPress}
        >
          <Image source={images.icons.cart} style={styles.cartIcon} />
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
      
      {/* Cart Modal */}
      <CartModal
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
      />
      
      {/* Location Selection Modal */}
      <LocationSelection
        visible={locationVisible}
        onClose={handleLocationClose}
        onLocationSelected={handleLocationSelected}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Home page styles
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingLeft: getResponsiveSpacing(16),
    // paddingRight: getResponsiveSpacing(16),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: 'transparent',
    // borderBottomWidth: 1,
    // borderBottomColor: '#39193d4d',
    zIndex: 1,
  },
  homeLocationText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: 'white',
    marginBottom: getResponsiveSpacing(2),
  },
  homeLocationSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: 'white',
    opacity: 0.8,
  },
  notificationButton: {
    padding: getResponsiveSpacing(8),
  },
  notificationIcon: {
    ...getResponsiveImageSize(28, 28),
    tintColor: 'white',
  },

  // Default page styles (lab-tests style)
  defaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  profileButton: {
    marginRight: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(4),
  },
  profileIcon: {
    ...getResponsiveImageSize(36, 32),
  },
  locationInfo: {
    flex: 1,
  },
  locationIcon: {
    ...getResponsiveImageSize(26, 26),
    marginLeft: getResponsiveSpacing(10),
  },
  locationText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: getResponsiveSpacing(2),
  },
  locationSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    opacity: 0.8,
  },
  cartButton: {
    padding: getResponsiveSpacing(8),
  },
  cartIcon: {
    ...getResponsiveImageSize(28, 28),
  },
});
