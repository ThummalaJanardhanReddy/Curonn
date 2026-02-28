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
import { fontStyles } from "./shared/styles/fonts";


interface RouteParams {
  id: string;
  type: "lab-test" | "health-checks" | "scans" | "ambulance";
}

export default function ViewDetailsScreen() {
  const route = useRoute();
  const router = useRouter();
  const { id, type } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      let response: any;
      if (type === "lab-test") {
       const response = await axiosClient.get(
          ApiRoutes.LabTests.getById(id)
        );
        setDetails(response.data);
      
      }
      else{
      if (type === "health-checks") {
        response = await axiosClient.get(
          ApiRoutes.LabPackages.getById(id)
        );
      } else {
        if (type === "scans") {
        response = await axiosClient.get(
          ApiRoutes.Xray.getById(id)
        );
      } else if (type === "ambulance") {
        response = await axiosClient.get(
          ApiRoutes.Ambulance.getdataById(id)
        );
      }
      }

      if (response?.isSuccess) {
        console.log("Details fetched:", response.data);
        setDetails(response.data);
      }
    }
    } catch (error) {
      console.log("Details fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTestCount = (testsList?: string): number => {
    if (!testsList) return 0;

    return testsList
      .split(",")
      .map(test => test.trim())
      .filter(Boolean).length;
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
        <StatusBar
          barStyle="dark-content"
          translucent={false}
          backgroundColor="#ffffffff"
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingRight: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#694664" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === "ambulance" ? details.packageName : details.testName}
          </Text>

        </View>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Placeholder */}
          <Image
            source={images.healthpackage}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Test Name */}
          <Text style={styles.title}>
            {type === "ambulance" ? details.packageName : details.testName}</Text>

          {/* Tests List (only for health checks) */}
          {type === "health-checks" && details.testsList && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{getTestCount(details.testsList)} Tests Included:</Text>
              {details.testsList
                ?.split(",")
                .map((test: string, index: number) => (
                  <Text key={index} style={styles.testsList}>
                    • {test.trim()}
                  </Text>
                ))}
            </View>
          )}

          {/* Vital Organs (only for scans) */}
          {type === "scans" && details.vitalOrgans && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Vital Organs Covered: {details.vitalOrgans}
              </Text>
            </View>
          )}
        </ScrollView>
        {/* Price */}
        <View style={styles.footer}>
          {type === "ambulance" ? (
            <View style={styles.priceContainer}>
              <Text style={styles.finalPrice}>₹ {details.price}</Text>
            </View>
          ) : (
            type !== "scans" && (
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>₹ {details.price}</Text>
                <Text style={styles.finalPrice}>₹{details.curonnprice}{details.curonnPrice}</Text>
              </View>
            )
          )}
          


          {/* Book Now */}
          <PrimaryButton
            title="Book Now"
            onPress={() => console.log("Book Now Pressed")}
            style={styles.bookButton}
          />
        </View>

      </View>

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
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
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
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    paddingBottom: 5,

  },
  testsList: {
    ...fontStyles.bodySmall,
    fontSize: 14,
    color: "#555",
    lineHeight: 28,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C35E9C",
    marginTop: 10,
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

originalPrice: {
  fontSize: 14,
  color: "#B0B0B0",
  textDecorationLine: "line-through",
  marginRight: 8,
},

finalPrice: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#C35E9C",
},
  bookButton: {
    ...fontStyles.headercontent,
    marginBottom: 4,
    width: 130,
    height: 40,
  },
});
