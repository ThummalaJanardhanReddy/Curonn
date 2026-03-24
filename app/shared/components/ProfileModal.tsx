import * as Linking from "expo-linking";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar as RNStatusBar,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import HealthFeedScreen from "../../features/health-feed/health-feed";
import LocationSelection from "../../features/location/location-selection";
import DrugAllergiesScreen from "../../features/profile/drug-allergies";
import EnvironmentalAllergiesScreen from "../../features/profile/environmental-allergies";
import FamilyHistoryScreen from "../../features/profile/family-history";
import FoodAllergiesModal from "../../features/profile/food-allergies";
import MedicalHistoryScreen from "../../features/profile/medical-history";
import MenstrualHistoryScreen from "../../features/profile/menstrual-history";
import PastProceduresScreen from "../../features/profile/past-procedures";
import SocialHabitsScreen from "../../features/profile/social-habits";
import { getResponsivePadding } from "../../shared/utils/responsive";
import commonStyles, { colors } from "../styles/commonStyles";
import FamilyMembersModal from "./FamilyMembersModal";
// ...existing code...
import PrimaryButton from "./PrimaryButton";
import ProfileScreenModal from "./ProfileScreenModal";
import { fontStyles, fonts } from "../../shared/styles/fonts";

const { width: screenWidth } = Dimensions.get("window");
import { useUser } from "../../shared/context/UserContext";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import Toast from "./Toast";
import DateTimePicker from "@react-native-community/datetimepicker";
import MenIcon from '../../../assets/AppIcons/Curonn_icons/menu/new/man.svg';
import WomenIcon from '../../../assets/AppIcons/Curonn_icons/menu/new/woman.svg';
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from "@/src/store/UserStore";
const { height: screenHeight } = Dimensions.get("window");
interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ProfileItem {
  id: number;
  title: string;
  subtext: string;
  image: any;
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    EmployeeCode: "",
    emailAddress: "",
    mobileNo: "",
    age: "",
    gender: "",
    dob: "",
    image: "",
    eId: "",
    roleId: "",
    companyName: "",
    department: "",
    address: "",
    branch: "",
    noFamilyMembers: ""
  });
  const [profileStatus, setProfileStatus] = useState({
    medicalHistory: false,
    familyHistory: false,
    pastProcedures: false,
    socialHabits: false,
    foodAllergies: false,
    drugAllergies: false,
    environmentalAllergies: false,
    menstrualHistory: false,
  });
  // Track original values for edit detection
  const [originalProfile, setOriginalProfile] = useState({
    fullName: "",
    age: "",
    gender: ""
  });
  const { userData } = useUser();


    const { restoreUserData, user } = useUserStore();
  useEffect(() => {
    restoreUserData();
  }, []);
 const patientId = Number(userData?.e_id || user?.eId);
  React.useEffect(() => {
    if (!visible || !patientId) return;
    // console.log("[ProfileModal] userData:", userData);
    // console.log("[ProfileModal] Fetching profile for patientId:", patientId);
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get(ApiRoutes.Employee.getById(patientId));
        // console.log("[ProfileModal] Profile data response:", response);
        const data = response?.data ?? response;
        setProfileForm({
          fullName: data.fullName || "",
          EmployeeCode: data.employeeCode,
          emailAddress: data.emailAddress || "",
          mobileNo: data.mobileNo || "",
          age: data.age ? String(data.age) : "",
          gender: data.gender || "",
          dob: data.dob || "",
          eId: data.eId || "",
          roleId: data.roleId || "",
          companyName: data.companyName || "",
          department: data.department || "",
          address: data.address || "",
          branch: data.branch || "",
          image: data.image || "",
          noFamilyMembers: data.noFamilyMembers || 0,
        });
        setOriginalProfile({
          fullName: data.fullName || "",
          age: data.age ? String(data.age) : "",
          gender: data.gender || ""
        });
      } catch (error) {
        console.error("[ProfileModal] Failed to fetch profile data:", error);
        // fallback to dummy data
        // setProfileForm({
        //   fullName: "John Doe",
        //   employeeId: patientId,
        //   email: "john.doe@example.com",
        //   phone: "+1 234 567 8900",
        //   age: "28",
        //   gender: "Male",
        //   image: null,
        // });
      }
    };
    fetchProfile();
  }, [visible, patientId]);
  useEffect(() => {
    if (visible) {
      setStatusBarStyle('dark');
      setStatusBarBackgroundColor('#7E6781');
    }
  }, [visible]);

  //   useEffect(() => {
  //   if (Platform.OS !== "android") return;

  //   if (visible) {
  //     setStatusBarBackgroundColor(colors.bg_secondary, true);
  //     setStatusBarStyle("light", true);
  //   } else {
  //     setStatusBarBackgroundColor("#ffffff", true);
  //     setStatusBarStyle("dark", true);
  //   }
  // }, [visible]);
  const editProfileSlideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [familyMembersModalVisible, setFamilyMembersModalVisible] =
    useState(false);
  const [locationSelectionVisible, setLocationSelectionVisible] =
    useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [foodAllergiesModalVisible, setFoodAllergiesModalVisible] =
    useState(false);
  const [medicalHistoryModalVisible, setMedicalHistoryModalVisible] =
    useState(false);
  const [familyHistoryModalVisible, setFamilyHistoryModalVisible] =
    useState(false);
  const [pastProceduresModalVisible, setPastProceduresModalVisible] =
    useState(false);
  const [socialHabitsModalVisible, setSocialHabitsModalVisible] =
    useState(false);
  const [drugAllergiesModalVisible, setDrugAllergiesModalVisible] =
    useState(false);
  const [
    environmentalAllergiesModalVisible,
    setEnvironmentalAllergiesModalVisible,
  ] = useState(false);
  const [menstrualHistoryModalVisible, setMenstrualHistoryModalVisible] =
    useState(false);
  const [myOrdersModalVisible, setMyOrdersModalVisible] = useState(false);
  const [healthFeedModalVisible, setHealthFeedModalVisible] = useState(false);
  const [ambulanceModalVisible, setAmbulanceModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [rateAppModalVisible, setRateAppModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          // Use React Native StatusBar API to set background color on Android
          RNStatusBar.setBackgroundColor("#7E6781", true);
        }, 400); // Adjust timeout as needed
        return () => clearTimeout(timeout);
      }
    }, [])
  );



  // Profile data
  const baseProfileItems: ProfileItem[] = [
    {
      id: 1,
      title: "Medical History",
      subtext: "Your past medical conditions",
      image: images.profileModal.medicalHistory_png,
    },
    {
      id: 2,
      title: "Family History",
      subtext: "Your family health conditions1",
      image: images.profileModal.familyHistory_png_new,
    },
    {
      id: 3,
      title: "Surgical History",
      subtext: "Your past surgeries",
      image: images.profileModal.pastProcedures_png,
    },
    {
      id: 4,
      title: "Social Habits",
      subtext: "Drinking, smoking, diet etc",
      image: images.profileModal.socialHabits_png,
    },
    {
      id: 5,
      title: "Food Allergies",
      subtext: "Your food allergies",
      image: images.profileModal.foodAllergies_png,
    },
    {
      id: 6,
      title: "Drug Allergies",
      subtext: "Your drug allergies",
      image: images.profileModal.drugAllergies_png,
    },
    {
      id: 7,
      title: "Environmental Allergies",
      subtext: "Your environmental allergies",
      image: images.profileModal.environmentalAllergies_png,
    },
  ];

  // Add Menstrual History only for female users
  const profileItems: ProfileItem[] =
    profileForm.gender?.toLowerCase() === "male"
      ? [
        ...baseProfileItems,
        {
          id: 8,
          title: "Menstrual History",
          subtext: "Your menstrual history",
          image: images.profileModal.menstrualHistory_png,
        },
      ]
      : baseProfileItems;

  const showEditProfileModal = () => {
    setShowToast(false);
    setToastMessage({ title: '', subtitle: '', type: 'success' });
    setEditProfileVisible(true);
    Animated.timing(editProfileSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideEditProfileModal = () => {
    Animated.timing(editProfileSlideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setEditProfileVisible(false);
    });
  };

  const handleProfileUpdate = async () => {
    // Validate required fields
    if (!profileForm.fullName || !profileForm.age || !profileForm.gender) {
      setToastMessage({
        title: "Missing Required Fields",
        subtitle: "Please fill in Full Name, Age, and Gender before updating your profile.",
        type: "error"
      });
      setShowToast(true);
      return;
    }
    try {
      // Use already fetched profileForm data and all fields from getById
      const { image, dob, ...formData } = profileForm;
      const payload = {
        eId: formData.eId,
        roleId: formData.roleId,
        companyName: formData.companyName,
        department: formData.department,
        address: formData.address,
        branch: formData.branch,
        fullName: formData.fullName,
        EmployeeCode: formData.EmployeeCode,
        emailAddress: formData.emailAddress,
        mobileNo: formData.mobileNo,
        gender: formData.gender,
        age: formData.age ? Number(formData.age) : undefined,
      };
      console.log("Profile update payload:", payload);
      const response = await axiosClient.post(ApiRoutes.Employee.update, payload);
      console.log("Profile update response:", response);
      setToastMessage({
        title: "Profile Update Successfully",
        subtitle: response?.data?.message || "",
        type: "success"
      });
      setShowToast(true);
      // Wait for 1 second before hiding the modal so the toast is visible
      setTimeout(() => {
        hideEditProfileModal();
      }, 1000);
    } catch (error) {
      let errorMsg = 'Something went wrong';
      setToastMessage({
        title: "Profile Update Failed",
        subtitle: errorMsg,
        type: "error"
      });
      setShowToast(true);
    }
  };


useEffect(() => {
  if (!visible || !patientId) return;
  fetchProfileStatus();
}, [visible, patientId]);

  const fetchProfileStatus = async () => {
    try {
      const [
        medical,
        family,
        past,
        social,
        food,
        drug,
        environment,
        menstrual
      ] = await Promise.all([
        axiosClient.post(ApiRoutes.MedicalHistory.getAll, { patientId }),
        axiosClient.post(ApiRoutes.FamilyHistory.getAll, { patientId }),
        axiosClient.post(ApiRoutes.SurgicalHistory.getAll, { patientId }),
        axiosClient.post(ApiRoutes.SocialHistory.getAll, { patientId }),
        axiosClient.post(ApiRoutes.FoodAllergies.getAll, { patientId }),
        axiosClient.post(ApiRoutes.DrugAllergies.getAll, { patientId }),
        axiosClient.post(ApiRoutes.EnvAllergies.getAll, { patientId }),
        axiosClient.post(ApiRoutes.MenstrualHistory.getAll, {
          patientId,
          pageNo: 1,
          pageSize: 10
        }),
      ]);

      setProfileStatus({
        medicalHistory: medical?.items?.length > 0,
        familyHistory: family?.items?.length > 0,
        pastProcedures: past?.items?.length > 0,
        socialHabits: social?.items?.length > 0,
        foodAllergies: food?.items?.length > 0,
        drugAllergies: drug?.items?.length > 0,
        environmentalAllergies: environment?.items?.length > 0,
        menstrualHistory: menstrual?.items?.length > 0,
      });

    } catch (error) {
      console.log("Profile status fetch error:", error);
    }
  };

  const showLogoutConfirmation = () => {
    setLogoutConfirmVisible(true);
  };

  const hideLogoutConfirmation = async () => {
    setLogoutConfirmVisible(false);
    if (Platform.OS === "web") return null;
    try {
      await AsyncStorage.clear();
      if (typeof SecureStore !== 'undefined' && SecureStore.deleteItemAsync) {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData'); // Clear userData
        await SecureStore.deleteItemAsync('isLoggedIn');
        await SecureStore.deleteItemAsync('mobile_details_updated');
      }
    } catch (e) {
      console.error('Error clearing user data:', e);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    router.push("/verify-details");
  };

  const handleLogout = async () => {
    // Handle logout logic here
    console.log("User logged out");
    await hideLogoutConfirmation();
    onClose(); // Close the profile modal after logout
  };

  // Settings handlers
  const handleMyOrders = () => {
    router.push("/orders");
  };

  const handleHealthFeed = () => {
    setHealthFeedModalVisible(true);
  };

  const handleAmbulance = () => {
    // setAmbulanceModalVisible(true);
    router.push("/features/ambulance/ambulanceservices");
  };

  const handleAbout = () => {
    setAboutModalVisible(true);
  };

  const handleRateApp = async () => {
    try {
      // App store URLs for rating
      const appStoreUrl = "https://apps.apple.com/app/id123456789"; // Replace with actual App Store ID
      const playStoreUrl =
        "https://play.google.com/store/apps/details?id=com.curonn.app"; // Replace with actual package name

      let storeUrl = "";

      if (Platform.OS === "ios") {
        storeUrl = appStoreUrl;
      } else if (Platform.OS === "android") {
        storeUrl = playStoreUrl;
      } else {
        // For web or other platforms, show a modal with instructions
        setRateAppModalVisible(true);
        return;
      }

      // Check if the app store app is available
      const canOpen = await Linking.canOpenURL(storeUrl);

      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback: show modal with instructions
        setRateAppModalVisible(true);
      }
    } catch (error) {
      console.error("Error opening app store:", error);
      // Fallback: show modal with instructions
      setRateAppModalVisible(true);
    }
  };

  const handleTermsAndConditions = () => {
    setTermsModalVisible(true);
  };

  const handlePrivacyPolicy = () => {
    setPrivacyModalVisible(true);
  };

  const showFamilyMembersModal = () => {
    setFamilyMembersModalVisible(true);
  };

  const hideFamilyMembersModal = () => {
    setFamilyMembersModalVisible(false);
  };

  const showLocationSelection = () => {
    setLocationSelectionVisible(true);
  };

  const hideLocationSelection = () => {
    setLocationSelectionVisible(false);
  };

  const handleLocationSelected = (location: any) => {
    setCurrentLocation(location);
    hideLocationSelection();
  };

  const getButtonLabel = (id: number) => {
    switch (id) {
      case 1:
        return profileStatus.medicalHistory ? "Update" : "Add";
      case 2:
        return profileStatus.familyHistory ? "Update" : "Add";
      case 3:
        return profileStatus.pastProcedures ? "Update" : "Add";
      case 4:
        return profileStatus.socialHabits ? "Update" : "Add";
      case 5:
        return profileStatus.foodAllergies ? "Update" : "Add";
      case 6:
        return profileStatus.drugAllergies ? "Update" : "Add";
      case 7:
        return profileStatus.environmentalAllergies ? "Update" : "Add";
      case 8:
        return profileStatus.menstrualHistory ? "Update" : "Add";
      default:
        return "Add";
    }
  };
  const renderProfileItem = ({ item }: { item: ProfileItem }) => (
    <TouchableOpacity
      style={styles.profileItemCard}
      onPress={() => {
        if (item.id === 5) {
          // Food Allergies
          setFoodAllergiesModalVisible(true);
        } else if (item.id === 1) {
          // Medical History
          setMedicalHistoryModalVisible(true);
        } else if (item.id === 2) {
          // Family History
          setFamilyHistoryModalVisible(true);
        } else if (item.id === 3) {
          // Past Procedures
          setPastProceduresModalVisible(true);
        } else if (item.id === 4) {
          // Social Habits
          setSocialHabitsModalVisible(true);
        } else if (item.id === 6) {
          // Drug Allergies
          setDrugAllergiesModalVisible(true);
        } else if (item.id === 7) {
          // Environmental Allergies
          setEnvironmentalAllergiesModalVisible(true);
        } else if (item.id === 8) {
          // Menstrual History
          setMenstrualHistoryModalVisible(true);
        }
      }}
    >
      {/* <View style={styles.profileItemImage}>
        <item.image width={40} height={40} />
      </View> */}
      <Image
        source={item.image}
        style={styles.profileItemImage}
        width={40}
        height={40}
      />
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemTitle}>{item.title}</Text>
        <Text style={styles.profileItemSubtext}>{item.subtext}</Text>
      </View>
      {/* <TouchableOpacity style={styles.addButton}>
        <IconButton icon="plus" size={20} iconColor="#6200ee" />
      </TouchableOpacity> */}
      <TouchableOpacity style={styles.addupdateButton}
        onPress={() => {
          if (item.id === 1) {
            // Medical History
            setMedicalHistoryModalVisible(true);
          } else if (item.id === 2) {
            // Family History
            setFamilyHistoryModalVisible(true);
          } else if (item.id === 3) {
            // Past Procedures
            setPastProceduresModalVisible(true);
          } else if (item.id === 4) {
            // Social Habits
            setSocialHabitsModalVisible(true);
          } else if (item.id === 5) {
            // Food Allergies
            setFoodAllergiesModalVisible(true);
          } else if (item.id === 6) {
            // Drug Allergies
            setDrugAllergiesModalVisible(true);
          } else if (item.id === 7) {
            // Environmental Allergies
            setEnvironmentalAllergiesModalVisible(true);
          } else if (item.id === 8) {
            // Menstrual History
            setMenstrualHistoryModalVisible(true);
          } else {
            console.log("Pressed");
          }
        }}
      >
        <Text style={styles.addupdatetext}>{getButtonLabel(item.id)}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent1} showsVerticalScrollIndicator={false}>
      {/* Profile Items */}
      <View style={styles.profileItemsContainer}>
        {profileItems.map((item) => (
          <View key={item.id} style={styles.profileItemWrapper}>
            {renderProfileItem({ item })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      if (errors === "Please select service start date") setErrors("");
    }
  };


  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Settings Items */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={showFamilyMembersModal}
        >
          {/* <IconButton icon="account-group" size={24} iconColor="#6200ee" /> */}
          <images.icons.settings.addFamily width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Add my family</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleMyOrders}>
          <images.icons.settings.myOrders width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>My orders</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleHealthFeed}>
          <images.icons.settings.healthFeed width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Health feed</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAmbulance}>
          <images.icons.settings.ambulance width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Ambulance</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        {/* <View style={styles.divider} /> */}

        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <images.icons.settings.about width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>About curonn</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleRateApp}>
          <images.icons.settings.rateApp width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Rate app</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleTermsAndConditions}
        >
          <images.icons.settings.tAndC width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>T&C</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handlePrivacyPolicy}
        >
          <images.icons.settings.privacyPolicy width={24} height={24} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Privacy policy</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>

        {/* <View style={styles.divider} /> */}

        <TouchableOpacity
          style={styles.settingItem}
          onPress={showLogoutConfirmation}
        >
          <images.icons.settings.logout width={24} height={24} />
          <View style={styles.logoutTextContainer}>
            <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
          </View>
          <images.icons.settings.arrowRight width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Version Number at Bottom */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg_secondary }}>
        <View style={styles.container}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeaderContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>User Profile</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                {/* Tab Buttons */}
                <View style={styles.tabButtons}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 0 && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab(0)}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 0 && styles.activeTabButtonText,
                      ]}
                    >
                      Profile
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 1 && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab(1)}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 1 && styles.activeTabButtonText,
                      ]}
                    >
                      Settings
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* User Card */}
                <View style={styles.userCard}>
                  <View style={styles.userInfo}>
                    {profileForm?.image ? (
                      <Image
                        source={{ uri: profileForm.image }}
                        style={styles.userImage}
                      />
                    ) : profileForm?.gender === 'Female' ? (
                      <WomenIcon width={45} height={45} style={styles.userImage} />
                    ) : (
                      <MenIcon width={45} height={45} style={styles.userImage} />
                    )}

                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{profileForm.fullName}</Text>
                      <Text style={styles.userInfo}>{profileForm.age ? `${profileForm.age} yrs` : "N/A"}  {profileForm.gender ? `| ${profileForm.gender}` : "N/A"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={showEditProfileModal}>
                    <images.icons.edit
                      style={styles.editButton}
                      width={24}
                      height={24}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tab Content */}
              {activeTab === 0 ? renderProfileTab() : renderSettingsTab()}
            </View>
          </View>


          {/* Edit Profile Modal */}
          <Modal
            visible={editProfileVisible}
            animationType="none"
            transparent={true}
            onRequestClose={hideEditProfileModal}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                onPress={hideEditProfileModal}
              />
              <SafeAreaView style={styles.editProfileModalContent}>
                <Animated.View
                  style={[
                    {
                      transform: [{ translateX: editProfileSlideAnim }],
                    },
                  ]}
                >
                  <View style={styles.editProfileModalHeader}>
                    <Text style={styles.editProfileModalTitle}>
                      Personal Profile
                    </Text>
                    <TouchableOpacity
                      onPress={hideEditProfileModal}
                      style={styles.closeButton}
                    >
                      <Image source={images.icons.close} style={styles.closeIcon} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.editProfileForm}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <SafeAreaView style={{ flex: 1 }}>
                      {/* Full Name Field */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <TextInput
                          style={styles.input}
                          underlineColorAndroid="transparent"
                          selectionColor="transparent"
                          placeholder="Enter"
                          value={profileForm.fullName}
                          onChangeText={(text) =>
                            setProfileForm({ ...profileForm, fullName: text })
                          }
                        />
                      </View>

                      {/* Employee ID Field */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Employee ID</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: '#f1f1f1' }]}
                          underlineColorAndroid="transparent"
                          selectionColor="transparent"
                          placeholder="Enter your employee ID"
                          value={profileForm.EmployeeCode}
                          editable={false}
                        />
                      </View>

                      {/* Email ID Field */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Email ID</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: '#f1f1f1' }]}
                          underlineColorAndroid="transparent"
                          selectionColor="transparent"
                          placeholder="Enter your email address"
                          value={profileForm.emailAddress}
                          editable={false}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      {/* Phone Number Field */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: '#f1f1f1' }]}
                          underlineColorAndroid="transparent"
                          selectionColor="transparent"
                          placeholder="Enter your phone number"
                          value={profileForm.mobileNo}
                          editable={false}
                          keyboardType="phone-pad"
                        />
                      </View>

                      {/* Age Field or Calendar Picker */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Age</Text>
                        <TextInput
                          style={styles.input}
                          underlineColorAndroid="transparent"
                          selectionColor="transparent"
                          placeholder="Enter"
                          value={profileForm.age}
                          onChangeText={(text) => {
                            const numeric = text.replace(/[^0-9]/g, "").slice(0, 2);
                            setProfileForm({ ...profileForm, age: numeric });
                          }}
                          keyboardType="numeric"
                          maxLength={2}
                          editable={true}
                        />
                      </View>

                      {/* Gender Field */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Gender</Text>
                        <View style={styles.radioContainer}>
                          <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() =>
                              setProfileForm({ ...profileForm, gender: "Male" })
                            }
                          >
                            <View style={styles.radioButton}>
                              {(profileForm.gender === "Male" || profileForm.gender === "male") && (
                                <View style={styles.radioButtonSelected} />
                              )}
                            </View>
                            <Text style={styles.radioLabel}>Male</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() =>
                              setProfileForm({ ...profileForm, gender: "Female" })
                            }
                          >
                            <View style={styles.radioButton}>
                              {profileForm.gender === "Female" && (
                                <View style={styles.radioButtonSelected} />
                              )}
                            </View>
                            <Text style={styles.radioLabel}>Female</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() =>
                              setProfileForm({ ...profileForm, gender: "Other" })
                            }
                          >
                            <View style={styles.radioButton}>
                              {profileForm.gender === "Other" && (
                                <View style={styles.radioButtonSelected} />
                              )}
                            </View>
                            <Text style={styles.radioLabel}>Other</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </SafeAreaView>
                  </ScrollView>
                  <View style={styles.updateButtonContainer}>
                    <PrimaryButton
                      title="Update"
                      onPress={handleProfileUpdate}
                      style={styles.updateButton}
                      disabled={
                        profileForm.fullName === originalProfile.fullName &&
                        profileForm.age === originalProfile.age &&
                        profileForm.gender === originalProfile.gender
                      }
                    />
                  </View>
                </Animated.View>
              </SafeAreaView>
              <Toast
                visible={showToast}
                title={toastMessage.title}
                subtitle={toastMessage.subtitle}
                type={toastMessage.type}
                onHide={() => setShowToast(false)}
                duration={3000}
              />
            </View>
          </Modal>

          {/* Logout Confirmation Modal */}
          <Modal
            visible={logoutConfirmVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={hideLogoutConfirmation}
          >
            <View style={styles.logoutModalOverlay}>
              <TouchableOpacity
                style={styles.logoutModalBackdrop}
                onPress={hideLogoutConfirmation}
                activeOpacity={1}
              />
              <View style={styles.logoutConfirmModalContent}>
                <View style={styles.logoutIconContainer}>
                  <images.icons.settings.logout width={48} height={48} />
                </View>
                <Text style={styles.logoutConfirmTitle}>Logout</Text>
                <Text style={styles.logoutConfirmMessage}>
                  Are you sure you want to logout?{"\n"}You&apos;ll need to sign in
                  again to access your account.
                </Text>
                <View style={styles.logoutConfirmButtons}>
                  <TouchableOpacity
                    style={styles.logoutCancelButton}
                    onPress={hideLogoutConfirmation}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logoutCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.logoutConfirmButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logoutConfirmButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Family Members Modal */}
          <FamilyMembersModal
            visible={familyMembersModalVisible}
            onClose={hideFamilyMembersModal}
            maxFamilyMembers={Number(profileForm.noFamilyMembers) || 0}
          />

          {/* Location Selection Modal */}
          <LocationSelection
            visible={locationSelectionVisible}
            onClose={hideLocationSelection}
            onLocationSelected={handleLocationSelected}
          />

          {/* Food Allergies Modal */}
          <FoodAllergiesModal
            visible={foodAllergiesModalVisible}
            onClose={() => setFoodAllergiesModalVisible(false)}
            onDataStatusChange={(hasData) =>
              setProfileStatus(prev => ({
                ...prev,
                foodAllergies: hasData
              }))
            }
          />

          {/* Medical History Modal */}
          <ProfileScreenModal
            visible={medicalHistoryModalVisible}
            onClose={() => setMedicalHistoryModalVisible(false)}
          >
            <MedicalHistoryScreen
              onClose={() => setMedicalHistoryModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  medicalHistory: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* Family History Modal */}
          <ProfileScreenModal
            visible={familyHistoryModalVisible}
            onClose={() => setFamilyHistoryModalVisible(false)}
          >
            <FamilyHistoryScreen
              onClose={() => setFamilyHistoryModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  familyHistory: hasData
                }))
              } />
          </ProfileScreenModal>

          {/* Past Procedures Modal */}
          <ProfileScreenModal
            visible={pastProceduresModalVisible}
            onClose={() => setPastProceduresModalVisible(false)}
          >
            <PastProceduresScreen
              onClose={() => setPastProceduresModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  pastProcedures: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* Social Habits Modal */}
          <ProfileScreenModal
            visible={socialHabitsModalVisible}
            onClose={() => setSocialHabitsModalVisible(false)}
          >
            <SocialHabitsScreen
              onClose={() => setSocialHabitsModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  socialHabits: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* Drug Allergies Modal */}
          <ProfileScreenModal
            visible={drugAllergiesModalVisible}
            onClose={() => setDrugAllergiesModalVisible(false)}
          >
            <DrugAllergiesScreen
              onClose={() => setSocialHabitsModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  drugAllergies: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* Environmental Allergies Modal */}
          <ProfileScreenModal
            visible={environmentalAllergiesModalVisible}
            onClose={() => setEnvironmentalAllergiesModalVisible(false)}
          >
            <EnvironmentalAllergiesScreen
              onClose={() => setEnvironmentalAllergiesModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  environmentalAllergies: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* Menstrual History Modal */}
          <ProfileScreenModal
            visible={menstrualHistoryModalVisible}
            onClose={() => setMenstrualHistoryModalVisible(false)}
          >
            <MenstrualHistoryScreen
              onClose={() => setMenstrualHistoryModalVisible(false)}
              onDataStatusChange={(hasData) =>
                setProfileStatus(prev => ({
                  ...prev,
                  menstrualHistory: hasData
                }))
              }
            />
          </ProfileScreenModal>

          {/* My Orders Modal */}
          <Modal
            visible={myOrdersModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setMyOrdersModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.settingsModalContent}>
                <View style={styles.settingsModalHeader}>
                  <Text style={styles.settingsModalTitle}>My Orders</Text>
                  <TouchableOpacity
                    onPress={() => setMyOrdersModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsModalBody}>
                  <Text style={styles.comingSoonText}>Coming Soon!</Text>
                  <Text style={styles.comingSoonSubtext}>
                    Your order history will be displayed here.
                  </Text>
                </View>
              </View>
            </View>
          </Modal>

          {/* Health Feed Modal */}
          <ProfileScreenModal
            visible={healthFeedModalVisible}
            onClose={() => setHealthFeedModalVisible(false)}
          >
            <HealthFeedScreen />
          </ProfileScreenModal>

          {/* Ambulance Modal */}
          <Modal
            visible={ambulanceModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAmbulanceModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.settingsModalContent}>
                <View style={styles.settingsModalHeader}>
                  <Text style={styles.settingsModalTitle}>Emergency Ambulance</Text>
                  <TouchableOpacity
                    onPress={() => setAmbulanceModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsModalBody}>
                  <Text style={styles.comingSoonText}>Emergency Service</Text>
                  <Text style={styles.comingSoonSubtext}>
                    Ambulance booking and emergency services will be available here.
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          </Modal>

          {/* About Modal */}
          <Modal
            visible={aboutModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAboutModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.settingsModalContent}>
                <View style={styles.settingsModalHeader}>
                  <Text style={styles.settingsModalTitle}>About Curonn</Text>
                  <TouchableOpacity
                    onPress={() => setAboutModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsModalBody}>
                  <Text style={styles.aboutText}>
                    Curonn is a comprehensive healthcare platform designed to
                    provide you with easy access to medical services, health
                    tracking, and wellness management.
                  </Text>
                  <Text style={styles.versionInfo}>Version 1.0.0</Text>
                </View>
              </SafeAreaView>
            </View>
          </Modal>

          {/* Rate App Modal */}
          <Modal
            visible={rateAppModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setRateAppModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.settingsModalContent}>
                <View style={styles.settingsModalHeader}>
                  <Text style={styles.settingsModalTitle}>Rate Our App</Text>
                  <TouchableOpacity
                    onPress={() => setRateAppModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsModalBody}>
                  <Text style={styles.comingSoonText}>⭐ Rate Curonn</Text>
                  <Text style={styles.comingSoonSubtext}>
                    We&apos;d love your feedback! Please rate our app on the{" "}
                    {Platform.OS === "ios" ? "App Store" : "Play Store"} to help us
                    improve.
                  </Text>

                  <TouchableOpacity
                    style={styles.rateAppButton}
                    onPress={async () => {
                      try {
                        const appStoreUrl = "https://apps.apple.com/app/id123456789";
                        const playStoreUrl = "https://play.google.com/store/apps/details?id=com.curonn.app";
                        const storeUrl = Platform.OS === "ios" ? appStoreUrl : playStoreUrl;

                        await Linking.openURL(storeUrl);
                        setRateAppModalVisible(false);
                      } catch (error) {
                        console.error("Error opening store:", error);
                        Alert.alert(
                          "Error",
                          "Unable to open the app store. Please try again later."
                        );
                      }
                    }}
                  >
                    <Text style={styles.rateAppButtonText}>
                      Open {Platform.OS === "ios" ? "App Store" : "Play Store"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rateAppCancelButton}
                    onPress={() => setRateAppModalVisible(false)}
                  >
                    <Text style={styles.rateAppCancelButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Terms & Conditions Modal */}
          <Modal
            visible={termsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setTermsModalVisible(false)}
          >
            <View style={styles.fullModalOverlay}>
              <SafeAreaView style={styles.fullModalContent}>
                <View style={styles.fullModalHeader}>
                  <Text style={styles.fullModalTitle}>Terms & Conditions</Text>
                  <TouchableOpacity
                    onPress={() => setTermsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.fullModalBody}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.termsSectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.termsText}>
                    By accessing and using the Curronn application, you accept and
                    agree to be bound by the terms and provision of this agreement.
                  </Text>
                  <Text style={styles.termsSectionTitle}>2. Use License</Text>
                  <Text style={styles.termsText}>
                    Permission is granted to temporarily download one copy of the
                    application for personal, non-commercial transitory viewing
                    only. This is the grant of a license, not a transfer of title.
                  </Text>
                  <Text style={styles.termsSectionTitle}>3. Disclaimer</Text>
                  <Text style={styles.termsText}>
                    The materials on Curronn&apos;s application are provided on an
                    &apos;as is&apos; basis. Curronn makes no warranties, expressed
                    or implied, and hereby disclaims and negates all other
                    warranties including without limitation, implied warranties or
                    conditions of merchantability, fitness for a particular purpose,
                    or non-infringement of intellectual property or other violation
                    of rights.
                  </Text>
                  <Text style={styles.termsSectionTitle}>4. Limitations</Text>
                  <Text style={styles.termsText}>
                    In no event shall Curronn or its suppliers be liable for any
                    damages (including, without limitation, damages for loss of data
                    or profit, or due to business interruption) arising out of the
                    use or inability to use the materials on Curronn&apos;s
                    application.
                  </Text>
                  <Text style={styles.termsSectionTitle}>5. Accuracy of Materials</Text>
                  <Text style={styles.termsText}>
                    The materials appearing on Curronn&apos;s application could
                    include technical, typographical, or photographic errors.
                    Curronn does not warrant that any of the materials on its
                    application are accurate, complete or current.
                  </Text>
                  <Text style={styles.termsSectionTitle}>6. Links</Text>
                  <Text style={styles.termsText}>
                    Curronn has not reviewed all of the sites linked to its
                    application and is not responsible for the contents of any such
                    linked site. The inclusion of any link does not imply
                    endorsement by Curronn of the site.
                  </Text>
                  <Text style={styles.termsSectionTitle}>7. Modifications</Text>
                  <Text style={styles.termsText}>
                    Curronn may revise these terms of service for its application at
                    any time without notice. By using this application you are
                    agreeing to be bound by the then current version of these Terms
                    of Service.
                  </Text>
                  <Text style={styles.termsSectionTitle}>8. Governing Law</Text>
                  <Text style={styles.termsText}>
                    These terms and conditions are governed by and construed in
                    accordance with the laws and you irrevocably submit to the
                    exclusive jurisdiction of the courts in that state or location.
                  </Text>
                </ScrollView>
              </SafeAreaView>
            </View>
          </Modal>

          {/* Privacy Policy Modal */}
          <Modal
            visible={privacyModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setPrivacyModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.settingsModalContent}>
                <View style={styles.settingsModalHeader}>
                  <Text style={styles.settingsModalTitle}>Privacy Policy</Text>
                  <TouchableOpacity
                    onPress={() => setPrivacyModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Image source={images.icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsModalBody}>
                  <Text style={styles.comingSoonText}>Privacy Policy</Text>
                  <Text style={styles.comingSoonSubtext}>
                    Our privacy policy will be displayed here.
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#f5f4f9",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#F5F4F9",
    // marginTop: 30,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  modalHeaderContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    // alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(10),
    paddingBottom: getResponsivePadding(12),
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    backgroundColor: colors.bg_secondary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // padding: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    // paddingTop: 60,
    // backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 18,
    color: "white",
    fontFamily: fonts.medium
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 28,
    height: 28,
    tintColor: "black",
  },
  tabButtons: {
    flexDirection: "row",
    gap: 20,
    // paddingHorizontal: 32,
    paddingVertical: 8,
    marginTop: 5,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
  },
  tabButton: {
    // flex: 1,
    // paddingVertical: 12,
    justifyContent: "center",
    verticalAlign: "middle",
    alignItems: "center",
    borderRadius: 23,
    height: 34,
    // width: 90,
    paddingHorizontal: 24,
    // marginHorizontal: 8,
    backgroundColor: "#9A638C",
  },
  activeTabButton: {
    backgroundColor: "#C35E9C",
  },
  tabButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: fonts.semiBold
  },
  activeTabButtonText: {
    color: "#fff",
  },
  tabContent: {
    flex: 1,
    // backgroundColor: 'blue',
    paddingTop: 10,
    backgroundColor: "#fff",
  },
    tabContent1: {
    flex: 1,
    // backgroundColor: 'blue',
    paddingTop: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  userCard: {
    backgroundColor: "#B0A3B1",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // elevation: 4,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // marginBottom: 24,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    fontFamily: fonts.regular
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    color: "#000000",
    marginBottom: 4,
    fontFamily: fonts.semiBold,
    lineHeight: 22
  },
  editButton: {
    // padding: 12,
    // backgroundColor: '#f0f0f0',
    // borderWidth: .3,
    padding: 0,
    borderRadius: 20,
    // minWidth: 48,
    // minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  profileItemsContainer: {
    gap: 1,
    marginBottom: 15,
  },
  profileItemWrapper: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: 10,
  },
  profileItemCard: {
    backgroundColor: "#fff",
    borderColor: "#DBDBDB",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    lineHeight: 22,
    alignItems: "center",
    //elevation: 2,
    height: 68,
    marginBottom: 0,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
  },
  profileItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 16,
    resizeMode: 'contain',
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 0,
    fontFamily: fonts.semiBold
  },
  profileItemSubtext: {
    fontSize: 12,
    color: "#000000",
    fontFamily: fonts.regular
  },
  addButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  addupdateButton: {
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C35E9C",
    paddingVertical: 3,
  },
  addupdatetext: {
    fontFamily: fonts.regular,
    color: "#C35E9C",
    fontSize: 13,
    paddingTop: 2,
  },
  settingsContainer: {
    // padding: 20,
    // paddingHorizontal: getResponsivePadding(20),
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  settingsSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: getResponsivePadding(25),
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 16,
    fontFamily: fonts.medium
  },
  settingTextContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    // marginVertical: 16,
  },
  logoutText: {
    color: "#ff4444",
  },
  versionContainer: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },
  modalBackdrop: {
    flex: 1,
  },
  editProfileModalContent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  editProfileModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    // borderBottomWidth: 1,
    // borderBottomColor: "#e0e0e0",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,

  },
  editProfileModalTitle: {
    fontSize: 18,
    // lineHeight: 44,
    color: "#202427",
    fontFamily: fonts.semiBold
  },
  editProfileForm: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#f5f4f9",

  },
  scrollContent: {
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#A72675",
    marginBottom: 3,
    fontFamily: fonts.semiBold
  },
  input: {
    borderWidth: 1,
    borderColor: "#9D9D9F",
    borderRadius: 8,
    padding: 12,
    paddingBottom: 8,
    paddingTop: 9,
    fontSize: 14,
    backgroundColor: "#fff",
    fontFamily: fonts.regular,
    color: "#000",
  },
  updateButtonContainer: {
    paddingHorizontal: 20,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#A72675",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A72675",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  updateButton: {
    marginTop: 16,
    marginBottom: 32,
    width: "100%",
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoutConfirmModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "85%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  logoutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoutConfirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
  logoutConfirmMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: fonts.regular,
  },
  logoutConfirmButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  logoutCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    fontFamily: fonts.medium,
  },
  logoutConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    fontFamily: fonts.medium,
  },
  logoutTextContainer: {
    flex: 1,
  },
  settingsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    overflow: "visible",
    zIndex: 1000,
  },
  settingsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  settingsModalBody: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  aboutText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  versionInfo: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullModalContent: {
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  fullModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    // paddingTop: 50,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  fullModalBody: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 16,
  },
  termsLastUpdated: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    fontStyle: "italic",
  },
  rateAppButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  rateAppButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  rateAppCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  rateAppCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
