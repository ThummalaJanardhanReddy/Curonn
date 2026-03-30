import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import PrimaryButton from "./shared/components/PrimaryButton";
import { images } from "@/assets";
import commonStyles, { colors } from "./shared/styles/commonStyles";
import { getResponsiveSpacing } from "./shared/utils/responsive";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fontStyles, fonts } from "./shared/styles/fonts";
import BookingScreen from "./features/booking/booking";

interface RouteParams {
  wellnessMasterId: string;
}

type ServiceType = "wellness";
export default function WellnessDetailsScreen() {
  // Benefits data for Immunity Booster Program
  const benefitsData = [
    {
      image: images.strongimmunity,
      heading: 'Stronger Immunity',
      description: 'Helps your body fight infections, bacteria, and viruses naturally.',
    },
    {
      image: images.energylevel,
      heading: 'Increased Energy Levels',
      description: 'Balanced nutrition improves metabolism and keeps you active throughout the day.',
    },
    {
      image: images.betterdigestion,
      heading: 'Better Digestion',
      description: 'Fiber-rich foods support gut health, which is directly linked to immunity.',
    },
    {
      image: images.overallhealth,
      heading: 'Improved Overall Health',
      description: 'Supports heart, brain, and organ functions with essential nutrients.',
    },
    {
      image: images.strongimmunity,
      heading: 'Rich in Vitamins & Minerals',
      description: 'Provides Vitamin C, D, Zinc, Iron, and antioxidants.',
    },
    {
      image: images.strongimmunity,
      heading: 'Better Sleep Quality',
      description: 'Certain foods help regulate sleep cycles and recovery.',
    },
  ];

  const whychooseData = [
    {
      icon: '🛡️',
      heading: 'Supports Natural Immune Defense',
      description: 'Provides essential vitamins and nutrients to help fight infections.',
    },
    {
      icon: '🥗',
      heading: 'Based on Real Food, Not Just Supplements',
      description: 'Focuses on natural foods for better absorption and long-term health.',
    },
    {
      icon: '🔄',
      heading: 'Builds Immunity Gradually & Sustainably',
      description: 'Strengthens immunity gradually with consistent healthy eating.',
    },
    {
      icon: '🌿',
      heading: 'Rich in Antioxidants & Anti-Inflammatory Nutrients',
      description: 'Protects cells and reduces inflammation naturally.',
    },
    {
      icon: '⚡',
      heading: 'Improves Overall Energy & Wellness',
      description: 'Improves metabolism and keeps you active.',
    },
    {
      icon: '🧬',
      heading: 'Strengthens Gut Health (Core of Immunity)',
      description: 'Promotes healthy digestion and strong immune response.',
    },
  ];
  const route = useRoute();
  const router = useRouter();
  const [bookingVisible, setBookingVisible] = useState(false);
  const { wellnessMasterId } = route.params as RouteParams;
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("wellness");
  const [details, setDetails] = useState<any>(null);

  interface TestItem {
    selectedDiagCenter?: any;
    id: string;
    programName: string;
    price: string;
    programeId?: number;
    reportTime: string;
    testName?: string;
    isAtHome: boolean;
    isSuccess?: boolean;
  }

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(
        ApiRoutes.WellnessData.getdataById(wellnessMasterId)
      );

      setDetails(response.data);
    } catch (error) {
      console.log("Wellness details fetch error:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleBookTest = (id: string) => {
    // setSelectedTest(testItem);
    setBookingVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#694664" />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.loader}>
        <Text>No details found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#ffffffff" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#694664" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{details.programName || details.name}</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Program main image and name in benefitRow style */}
          <View style={styles.benefitRow1}>
            <View style={styles.imagefull}>
              <Image
                source={images.wellnessbooster}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

          </View>
          {/* Program Name */}
          <View style={styles.listofbenefits}>
            <Text style={styles.titledata}>What Benefits Do You Get?</Text>
            {benefitsData.map((item, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Image source={item.image} style={styles.benefitIconImg} resizeMode="contain" />
                </View>

                <View style={styles.benefitTextBox}>
                  <Text style={styles.benefitHeading}>{item.heading}</Text>
                  {item.description ? (
                    <Text style={styles.benefitDescription}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.listofbenefits}>
            <Text style={styles.titledata}>Why Choose Curonn Immunity Booster?</Text>
            {whychooseData.map((item, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Text style={styles.benefitIcon}>{item.icon}</Text>
                </View>
                <View style={styles.benefitTextBox}>
                  <Text style={styles.benefitHeading}>{item.heading}</Text>
                  {item.description ? (
                    <Text style={styles.benefitDescription}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* <Text style={styles.title}>{details.programName || details.name}</Text>
          {details.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.address}>{details.description}</Text>
            </View>
          )}
          {details.benefits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <Text style={styles.address}>{details.benefits}</Text>
            </View>
          )} */}
        </ScrollView>
        {/* Price */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.finalPrice}>₹ {details.price}</Text>
          </View>
          {/* Get Now */}
          <PrimaryButton
            title="Enroll Now"
            onPress={() => handleBookTest(details.wellnessMasterId)}
            style={styles.bookButton}
          />
        </View>
      </View>

      {details && (
        <BookingScreen
          visible={bookingVisible}
          onClose={() => {
            setBookingVisible(false);

          }}
          serviceName={details.programName}
          duration={details.duration}
          programeId={details.programId}
          isAtHome={details.isAtHome}
          type={selectedCategory as ServiceType}
          servicePrice={Number(details.price)}
          reportTime={details.createdOn}
          masterId={details.wellnessMasterId
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listofbenefits: {
    marginVertical: 16,
    backgroundColor: '#fff',
    padding: 16,
    paddingHorizontal: 20,
  },
  benefitRow1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  benefitIconImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  benefitIconBox: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3e6f2',
    borderRadius: 20,
    marginRight: 16,
  },
  benefitIcon: {
    fontSize: 30,
  },
  benefitTextBox: {
    flex: 1,
  },
  benefitHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#694664',
    marginBottom: 0,
  },
  benefitDescription: {
    fontFamily: fonts.medium,
    color: '#555',
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(15),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.2)",
  },
  headerTitle: {
    ...fontStyles.headercontent,
    color: "#202427",
  },
  content: {
    flex: 1,
    //paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: "#f5f4f9",
  },
  section: {
    marginTop: getResponsiveSpacing(10),
    marginBottom: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagefull: {
    width: "100%",
    height: 340,
    //marginTop: 20,
    borderRadius: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // borderWidth: 1,
    // borderColor: "rgba(0, 0, 0, 0.2)",
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: "#000",
    marginBottom: 10,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },

  titledata:
  {
    color: "#000",
    marginBottom: 10,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 28,
  },
  sectionTitle: {
    ...fontStyles.button,
    fontWeight: "600",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    paddingBottom: 5,
    fontFamily: fonts.semiBold,
  },
  address: {
    fontFamily: fonts.medium,
    color: "#555",
    marginBottom: 0,
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C35E9C",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookButton: {
    ...fontStyles.headercontent,
    marginBottom: 4,
    width: 130,
    height: 30,
  },
});
