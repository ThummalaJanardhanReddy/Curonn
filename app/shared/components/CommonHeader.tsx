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
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import { fonts } from '../../shared/styles/fonts';
import { useCart } from '../context/CartContext';
import MenIcon from '../../../assets/AppIcons/Curonn_icons/menu/new/man.svg';
import WomenIcon from '../../../assets/AppIcons/Curonn_icons/menu/new/woman.svg';
import CartIcon from '../../../assets/AppIcons/Curonn_icons/carticon.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface CommonHeaderProps {
  title?: string;
  isHomePage?: boolean;
  currentLocation?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
  onLocationChange?: (location: string) => void;
  showCart?: boolean;
  showProfile?: boolean;
  showLocation?: boolean; // NEW: control location visibility
}

export default function CommonHeader({
  title,
  isHomePage = false,
  currentLocation = 'New York, NY',
  onProfilePress,
  onNotificationPress,
  onCartPress,
  onLocationChange,
  showCart = true,
  showProfile = true,
  showLocation = true, // NEW: default true
}: CommonHeaderProps) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [count, setCount] = useState(0);
  
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [profileForm, setProfileForm] = useState({
    gender: "",
    image: "",
  });
  const { getCurrentAddress, address } = useLocation();
  const { userData } = useUser();
  const { cartCount } = useCart();
  const patientId = userData?.e_id;

  React.useEffect(() => {
    if (!patientId) return;
    // console.log("[ProfileModal] userData:", userData);
    // console.log("[ProfileModal] Fetching profile for patientId:", patientId);
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get(ApiRoutes.Employee.getById(patientId));
        const data = response?.data ?? response;
        setProfileForm({
          gender: data.gender || "",
          image: data.image || "",
        });
      } catch (error) {
        console.error("[ProfileModal] Failed to fetch profile data:", error);
      }
    };
    fetchProfile();

     const fetchNotiCounts = async () => {
      try {
        const response = await axiosClient.get(ApiRoutes.Notification.GetCount(patientId, 'patient'));
        const data = response?.data ?? response;
        console.log("[CommonHeader] Notification count response:", response);
        setCount(data);
      } catch (error) {
        console.error("[ProfileModal] Failed to fetch profile data:", error);
      }
    };
    fetchNotiCounts();
  }, [patientId]);

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
      const [latLng, setLatLng] = useState<{ latitude: string; longitude: string } | null>(null);

      // Fetch lat/lng from AsyncStorage
      useEffect(() => {
        const getLatLng = async () => {
          const stored = await AsyncStorage.getItem('userLocationLatLng');
          if (stored) {
            const parsed = JSON.parse(stored);
            setLatLng(parsed);
          }
        };
        getLatLng();
      }, [selectedLocation]);

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
    // setCartVisible(true);
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
  let mandal = selectedLocation;
  let rest = '';
  if (selectedLocation && selectedLocation.includes(',')) {
    const parts = selectedLocation.split(',');
    mandal = parts[0].trim();
    rest = parts.slice(1).join(',').trim();
  }
  if (isHomePage) {
    // Split the address at the first comma

    // Home page style with background and different layout
    return (
      <>
        <View style={styles.homeHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              {profileForm?.image ? (
                <Image
                  source={{ uri: profileForm.image }}
                  style={styles.profileIcon}
                />
              ) : profileForm?.gender === 'Female' ? (
                <WomenIcon width={40} height={40} style={styles.profileIcon} />
              ) : (
                <MenIcon width={40} height={40} style={styles.profileIcon} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
              <View style={styles.locationhead}>
                <Text style={styles.homeLocationText}>{mandal} &nbsp;<images.icons.location style={styles.locationIcon} /></Text>
                {rest ? <Text style={styles.homeLocationSubtext}>{rest} </Text> : null}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <images.notification_bell_svg style={styles.notificationIcon} />
             {count > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{count}</Text>
              </View>
            )}
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
                    {/* Show lat/lng below address */}
                    {latLng && (
                      <Text style={{ color: 'white', fontSize: 12 }}>
                        Lat: {latLng.latitude} | Lng: {latLng.longitude}
                      </Text>
                    )}

  // Default style for other pages (like lab-tests)
  return (
    <>
      <View style={styles.defaultHeader}>
        <View style={styles.headerLeft}>
          {showProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              {profileForm?.image ? (
                <Image
                  source={{ uri: profileForm.image }}
                  style={styles.profileIcon}
                />
              ) : profileForm?.gender === 'Female' ? (
                <WomenIcon width={40} height={40} style={styles.profileIcon} />
              ) : (
                <MenIcon width={40} height={40} style={styles.profileIcon} />
              )}
            </TouchableOpacity>
          )}
          {showLocation ? (
            <TouchableOpacity style={styles.locationInfo} onPress={handleLocationPress}>
              <View style={styles.locationhead}>
                <Text style={styles.locationText}>{mandal} &nbsp;<images.icons.location style={[styles.locationIcon]} stroke={'#000000'} /></Text>
                {rest ? <Text style={styles.sublocationText}>{rest}</Text> : null}
              </View>
            </TouchableOpacity>


          ) : (
            title ? <Text style={[styles.locationText, { marginLeft: 8 }]}>{title}</Text> : null
          )}
        </View>
        {showCart && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={handleCartPress}
          >
            <CartIcon style={styles.cartIcon} width={15} height={15} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
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
    fontSize: getResponsiveFontSize(13),
    fontWeight: '600',
    color: 'white',
    marginBottom: getResponsiveSpacing(0),
    fontFamily: fonts.bold,
    lineHeight: 18,
  },

  homeLocationSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: 'white',
    fontFamily: fonts.regular
  },

  sublocationText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: fonts.regular,
    color: '#000',
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
    width: 40,
    height: 40,
    borderRadius: 30,
  },
  locationInfo: {
    flex: 1,
    lineHeight: 14,
  },
  locationhead: {
    lineHeight: 15,
    marginTop: getResponsiveSpacing(5),
  },
  locationIcon: {
    ...getResponsiveImageSize(26, 26),
    marginLeft: getResponsiveSpacing(10),
  },
  locationText: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: '600',
    color: '#000',
    marginBottom: getResponsiveSpacing(0),
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
  locationSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    opacity: 0.8,
  },
  cartButton: {
    padding: getResponsiveSpacing(3),
    backgroundColor: '#FED8EC',
    width: getResponsiveSpacing(30),
    height: getResponsiveSpacing(30),
    borderRadius: getResponsiveSpacing(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    ...getResponsiveImageSize(28, 28),
  },
  cartBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(-8),
    right: getResponsiveSpacing(-2),
    backgroundColor: '#FF4444',
    borderRadius: getResponsiveSpacing(10),
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(4),
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(9),
    fontFamily: fonts.bold,
  },
    notificationBadge: {
    position: 'absolute',
    borderRadius: getResponsiveSpacing(10),
    top: getResponsiveSpacing(2),
    right: getResponsiveSpacing(0),
    backgroundColor: '#C35E9C',
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(2),
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    fontFamily: fonts.bold,
  },
});