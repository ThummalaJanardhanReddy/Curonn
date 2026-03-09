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
          {/* Image Placeholder */}
          <Image
            source={images.wellnesspackage}
            style={styles.image}
            resizeMode="contain"
          />
          {/* Program Name */}
          <Text style={styles.title}>{details.programName || details.name}</Text>
          {/* Description */}
          {details.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.address}>{details.description}</Text>
            </View>
          )}
          {/* Benefits */}
          {details.benefits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <Text style={styles.address}>{details.benefits}</Text>
            </View>
          )}
        </ScrollView>
        {/* Price */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.finalPrice}>₹ {details.price}</Text>
          </View>
          {/* Get Now */}
          <PrimaryButton
            title="Book Now"
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
                  masterId={ details.wellnessMasterId
                  }
                />
              )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: getResponsiveSpacing(20),
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
  image: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  title: {
    ...fontStyles.heading3,
    fontWeight: 'bold',
    color: "#c55e9c",
    marginBottom: 10,
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
    height: 40,
  },
});
