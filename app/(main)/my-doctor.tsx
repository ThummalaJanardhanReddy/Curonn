import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { images } from "../../assets";
import CommonHeader from "../shared/components/CommonHeader";
import commonStyles, { colors } from "../shared/styles/commonStyles";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
  wp,
} from "../shared/utils/responsive";
import AnimatedTabs from "../shared/components/ui/AnimatedTabs";
import { useDoctorConsultationStore } from "@/src/store/doctor-consultation";
import { useUser } from "../shared/context/UserContext";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "../shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import SeacrchIcon from "../../assets/AppIcons/Curonn_icons/search.svg";
import {
  IConsultationType,
  ICreateAppointmentRequest,
} from "@/src/constants/constants";
import dayjs from "dayjs";
import { useChatStore } from "@/src/store/ChatStore";
import { fonts } from "@/app/shared/styles/fonts";

export interface IDepartments {
  charges: number;
  createdBy: number;
  createdOn: string;
  deletedBy: string;
  deletedOn: string;
  isActive: boolean;
  modifiedBy: string;
  modifiedOn: string;
  serviceId: string;
  specialityMasterId: number;
  specialityName: string;
  totalCount: number;
  image: string;
  description: string;
}
const consultationTypes: IConsultationType[] = [
  { label: "Chat", value: 1340, key: "chat" },
  { label: "Video Call", value: 1339, key: "Video" },
  { label: "Phone", value: 1341, key: "Phone" },
];
const chatId = 1340;
export default function MyDoctorScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("New York, NY");
  // const [consultationTypeIndex, setConsultationTypeIndex] = useState(0);
  const [consultationTypeId, setConsultationTypeId] = useState(
    consultationTypes[0].value,
  );
  const [departments, setDepartments] = useState<IDepartments[]>();
  // const user = useUser();
  const { user } = useUserStore();
  const setDepartment = useDoctorConsultationStore(
    (state) => state.setDepartment,
  );
  const setConsultation = useDoctorConsultationStore(
    (state) => state.setConsultationType,
  );

  const fetchDepartments = async () => {
    try {
      const deptResponse = await axiosClient.get(
        ApiRoutes.Departments.getAllDepartments,
      );

      const items = deptResponse?.data?.items;

      if (!items) {
        console.warn("Departments fetch failed");
        return;
      }

      setDepartments(items);
      console.log("departments: ", items);
    } catch (error) {
      console.log("Departments error:", error);
    }
  };

  useEffect(() => {
    if (consultationTypeId === chatId) {
      fetchDepartments();
    }
  }, [consultationTypeId]);
  //MBBS Category
  const mbbsList = useMemo(
    () => [
      {
        id: "mbbs-physician",
        name: "Physician",
        description: "General Medicine (MBBS)",
        image: {
          uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop",
        },
      },
    ],
    [],
  );

  const filteredSpecialists = useMemo(() => {
    if (!searchQuery) return departments ?? [];

    return (
      departments?.filter((department) =>
        department.specialityName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ) ?? []
    );
  }, [departments, searchQuery]);

  const handleSpecialistSelect = (
    specialistId: number,
    specialistName: string,
    specialityImage: string
  ) => {
    setDepartment(specialistId, specialistName, specialityImage);

    router.push({
      pathname: "/features/symptoms/symptoms",
    });
  };

  const renderSpecialistCard = useCallback(
    ({ item }: { item: IDepartments }) => (
      <TouchableOpacity
        style={styles.specialistCard}
        onPress={() =>
          handleSpecialistSelect(item.specialityMasterId, item.specialityName, item.image)
        }
        activeOpacity={0.8}
      >
        <View style={styles.specialistImageContainer}>
          <Image
            defaultSource={{
              uri: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop`,
            }}
            source={{
              uri: item.image,
            }}
            style={styles.specialistImage}
          />
        </View>
        <View style={styles.specialistTextContainer}>
          <Text style={styles.specialistName}>{item.specialityName}</Text>
          {/* <Text style={styles.specialistDescription}>{item.description}</Text> */}
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const handleChatStart = async () => {
    if (!user) return;
    try {
      const res = await axiosClient.post(ApiRoutes.Chat.start(user.eId));
      console.log("chat appointment created: ", res);
      useChatStore.getState().setRequestId(res?.chatRequestId);
      router.push("/features/chat/Chat");
    } catch (error) {
      Alert.alert(
        "Chat Consultation Failed",
        "Chat appointment failed: " + error,
      );
    }
  };
  const handleConsultationTypeChange = (data: IConsultationType) => {
    setConsultationTypeId(data.value);
    setConsultation(data.key, data.value);
  };

  return (
      <View style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {/* Header */}
        {/* <StatusBar barStyle="dark-content" translucent={false} backgroundColor='#ffffffff'/> */}
        <View style={styles.defaultHeader}>
        <CommonHeader
          currentLocation={currentLocation}
          onProfilePress={() => console.log("Profile pressed")}
          onCartPress={() => console.log("Cart pressed")}
          showCart={false}
        />
        </View>
          <View style={styles.boxcolor}>
             <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              {/* Search Bar */}
              {/* <Image source={images.icons.search} style={styles.searchIcon} /> */}
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search department"
                placeholderTextColor="#000"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Image source={images.icons.close} style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
     
          </View>
          
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >       <View style={{ paddingVertical: 10,paddingHorizontal: 20}}>
              <AnimatedTabs
                tabs={consultationTypes}
                activeValue={consultationTypeId}
                onChange={handleConsultationTypeChange}
              />
            </View>
          
         

          {consultationTypeId === chatId ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 15,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "400",fontFamily:fonts.regular, color: colors.text }}>
                {" "}
                Our doctors are available now
              </Text>
              <PrimaryButton
                title="Start Chat"
                onPress={handleChatStart}
                style={{ paddingHorizontal: 40, width: "auto", height:38, backgroundColor: 'transparent', borderColor: colors.primary, borderWidth:1 }}
                textStyle={{color: colors.primary}}
              />
              {/* <TouchableOpacity
              style={styles.chatStartButton}
              onPress={handleChatStart}
            >
              <Text style={styles.chatStartButtonText}>Start Now</Text>
            </TouchableOpacity> */}
            </View>
          ) : (
            <>
              {/* Choose Your Specialist Title */}
              <View style={styles.pageContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Choose your specialist</Text>
              </View>

              {/* Specialists Grid */}
              <View style={styles.specialistsContainer}>
                <View style={styles.specialistsGrid}>
                  {filteredSpecialists?.map((specialist) => (
                    <View
                      key={specialist.specialityMasterId}
                      style={styles.specialistCardWrapper}
                    >
                      {renderSpecialistCard({ item: specialist })}
                    </View>
                  ))}
                </View>
              </View>
              </View>
            </>
          )}
        </ScrollView>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
   //...commonStyles.container_layout,
   flex: 1,
    backgroundColor: colors.white,
     paddingTop: Platform.OS === 'android' ? getResponsiveSpacing(20) : 27,
    // backgroundColor: colors.white,
    
  },
    defaultHeader: {
      paddingHorizontal: getResponsiveSpacing(20),
       marginTop: Platform.OS === 'android' ? getResponsiveSpacing(0) : 0,
    },
  content: {
    flex: 1,
  },
    boxcolor: {
    backgroundColor: colors.bg_primary,
    flex: 1
  },
  searchContainer: {
     marginBottom: getResponsiveSpacing(10),
    paddingHorizontal: getResponsiveSpacing(20),
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: "#fff",
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(4),
    height: 40,
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: "#808080",
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(12),
    paddingVertical: getResponsiveSpacing(4),
    color: "#000",
    fontFamily: fonts.regular,
  },
  clearButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  clearIcon: {
    ...getResponsiveImageSize(16, 16),
    tintColor: "#999",
  },
  pageContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    marginTop: getResponsiveSpacing(10),
  },
  titleContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(14),
  },
  titleText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily:fonts.medium,
    fontWeight: "600",
    color: colors.text,
    textAlign: "left",
  },
  specialistsContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  specialistsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveSpacing(8),
  },
  specialistCardWrapper: {
    width: wp(28),
    marginBottom: getResponsiveSpacing(8),
  },
  specialistCard: {
    width: "100%",
    height: wp(32),
    borderRadius: getResponsiveSpacing(12),
    overflow: "hidden",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  specialistImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  specialistImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  specialistTextContainer: {
    position: "absolute",
    bottom: 7,
    left: 0,
    right: 0,
   // backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: getResponsiveSpacing(6),
    zIndex: 1,
  },
  specialistName: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily:fonts.semiBold,
    fontWeight: "600",
    color: "#fff",
    marginBottom: getResponsiveSpacing(1),
    textAlign: "left",
    paddingLeft:7,
  },
  specialistDescription: {
     fontFamily:fonts.regular,
    fontSize: getResponsiveFontSize(8),
    color: "#fff",
    textAlign: "center",
    lineHeight: getResponsiveFontSize(10),
  },

  chatStartButton: {
    backgroundColor: "#1976D2", // or colors.primary
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  chatStartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
