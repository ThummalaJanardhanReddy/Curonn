import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
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
  // Wellness program data map
  const wellnessProgramsData = {
    "Immunity Booster Program": {
      mainimage:{image: images.wellnessbooster},
      benefits: [
        { image: images.strongimmunity, heading: 'Stronger Immunity', description: 'Helps your body fight infections, bacteria, and viruses naturally.' },
        { image: images.energylevel, heading: 'Increased Energy Levels', description: 'Balanced nutrition improves metabolism and keeps you active throughout the day.' },
        { image: images.betterdigestion, heading: 'Better Digestion', description: 'Fiber-rich foods support gut health, which is directly linked to immunity.' },
        { image: images.overallhealth, heading: 'Improved Overall Health', description: 'Supports heart, brain, and organ functions with essential nutrients.' },
        { image: images.vitaminsminerals, heading: 'Rich in Vitamins & Minerals', description: 'Provides Vitamin C, D, Zinc, Iron, and antioxidants.' },
        { image: images.qualitysleep, heading: 'Better Sleep Quality', description: 'Certain foods help regulate sleep cycles and recovery.' },
      ],
      whyChoose: [
        { icon: '🛡️', heading: 'Supports Natural Immune Defense', description: 'Provides essential vitamins and nutrients to help fight infections.' },
        { icon: '🥗', heading: 'Based on Real Food, Not Just Supplements', description: 'Focuses on natural foods for better absorption and long-term health.' },
        { icon: '🔄', heading: 'Builds Immunity Gradually & Sustainably', description: 'Strengthens immunity gradually with consistent healthy eating.' },
        { icon: '🌿', heading: 'Rich in Antioxidants & Anti-Inflammatory Nutrients', description: 'Protects cells and reduces inflammation naturally.' },
        { icon: '⚡', heading: 'Improves Overall Energy & Wellness', description: 'Improves metabolism and keeps you active.' },
        { icon: '🧬', heading: 'Strengthens Gut Health (Core of Immunity)', description: 'Promotes healthy digestion and strong immune response.' },
      ]
    },
    "Kidney Wellness Program": {
      mainimage:{image: images.kidneywellness},
      benefits: [
        { image: images.betterkidney, heading: 'Better Kidney Function', description: 'Helps kidneys efficiently filter waste and toxins from the body.' },
        { image: images.naturaldetox, heading: 'Natural Detox Support', description: 'Supports removal of harmful toxins and reduces load on kidneys.' },
        { image: images.fluidlevels, heading: 'Balanced Fluid Levels', description: 'Maintains proper hydration and fluid balance in the body.' },
        { image: images.electrolytebalance, heading: 'Electrolyte Balance', description: 'Helps regulate sodium, potassium, and other essential minerals.' },
        { image: images.energylevels, heading: 'Improved Energy Levels', description: 'Healthy kidney function reduces fatigue and boosts overall energy.' },
        { image: images.supportheart, heading: 'Supports Heart Health', description: 'Healthy kidneys contribute to better blood pressure and heart function.' },
      ],
      whyChoose: [
        { icon: '🛡️', heading: 'Supports Kidney Function', description: 'Provides essential nutrients that help kidneys filter waste and maintain fluid balance.' },
        { icon: '🥗', heading: 'Kidney-Friendly Nutrition', description: 'Focuses on balanced foods that reduce strain on kidneys and support healthy function.' },
        { icon: '🔄', heading: 'Long-Term Kidney Care', description: 'Encourages consistent habits to maintain kidney health and prevent complications.' },
        { icon: '🌿', heading: 'Reduces Toxin Build-Up', description: 'Helps the body eliminate toxins naturally and supports detoxification.' },
        { icon: '⚡', heading: 'Improves Energy Levels', description: 'Healthy kidneys contribute to better energy and overall body balance.' },
        { icon: '🧬', heading: 'Maintains Electrolyte Balance', description: 'Supports proper levels of sodium, potassium, and fluids in the body.' },
        { icon: '❤️', heading: 'Reduces Risk of Kidney Issues', description: 'Helps lower the risk of kidney-related problems and supports overall health.' },
      ]
    },
    // Add more programs as needed
  };

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
      // Debug: log the full details object after fetching
      console.log('Fetched details:', response.data);
    } catch (error) {
      console.log("Wellness details fetch error:", error);
    } finally {
      setLoading(false);
    }
  };


  const route = useRoute();
  const router = useRouter();
  const [bookingVisible, setBookingVisible] = useState(false);
  const { wellnessMasterId } = route.params as RouteParams;
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("wellness");
  const [details, setDetails] = useState<any>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);

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

    // Select program data based on details (fallback to Immunity Booster)
  type WellnessProgramKey = keyof typeof wellnessProgramsData;
  // Normalize program name to match keys exactly (case and whitespace sensitive)
  const getProgramKey = (name?: string): WellnessProgramKey => {
    if (!name || typeof name !== 'string') return "Immunity Booster Program";
    const trimmed = name.trim();
    if (trimmed in wellnessProgramsData) return trimmed as WellnessProgramKey;
    const found = Object.keys(wellnessProgramsData).find(
      k => k.trim().toLowerCase() === trimmed.toLowerCase()
    );
    return (found || "Immunity Booster Program") as WellnessProgramKey;
  };

  // Debug: log details.programName and details.name
  console.log("details.programName:", details?.programName, "details.name:", details?.name);
  const programKey: WellnessProgramKey = getProgramKey(details?.programName || details?.name);
  const selectedProgramData = wellnessProgramsData[programKey];
  console.log("Selected Program Key:", programKey);
  const benefitsData = selectedProgramData.benefits;
  const whychooseData = selectedProgramData.whyChoose;
  const mainimage = selectedProgramData.mainimage;
  

  const handleSubscribe = () => {
    setPlanModalVisible(false);
    handleBookTest(details.wellnessMasterId);
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
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{details.programName || details.name}</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Program main image and name in benefitRow style */}
          <View style={styles.benefitRow1}>
            <View style={styles.imagefull}>
              <Image
                source={mainimage?.image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.finalPrice}>₹ {details.price}</Text>
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
          {/* <View style={styles.priceContainer}>
            <Text style={styles.finalPrice}>₹ {details.price}</Text>
          </View> */}
          {/* Get Now */}
          {/* <PrimaryButton
            title="Enroll Now"
            onPress={() => handleBookTest(details.wellnessMasterId)}
            style={styles.bookButton}
          /> */}
          {/* <TouchableOpacity
            style={styles.viewdetailsbutton}
            onPress={() => handleBookTest(details.wellnessMasterId)}
          > <Text style={styles.viewdetailstext}>Request a call back</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => setPlanModalVisible(true)}
          > <Text style={styles.bookButtontext}>Enroll Now</Text>
          </TouchableOpacity>
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

      {/* Plan Modal */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlanModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.planModalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={{ paddingRight: 10 }}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{details.programName || details.name}</Text>
            </View>
            {/* <ScrollView style={styles.content} showsVerticalScrollIndicator={false}> */}
              {/* <Text style={styles.planModalSubtitle}>Select plan</Text>
            <Text style={styles.planModalOffer}>Introductory offers</Text> */}
              <ScrollView style={styles.content1} showsVerticalScrollIndicator={false}>
              {/* <View style={styles.planCard}>
                <Text style={styles.planCardPrice}>₹ {details.price}</Text>
              </View> */}
              <View style={styles.whatyouget}>
              <Text style={styles.planModalSectionTitle}>What you get</Text>
              <View style={styles.planModalFeatureList}>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Unlimited on-demand support by certified Dietitian</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Monthly online consults with Senior Dietitian</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Personalized dietary plans based on your dietary preferences</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Monitoring your adherence to dietary goals through meal plate images</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Consultations with our Psychotherapist to help you overcome the stress of weight management</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Weekly Wellness sessions with at home workout formats across Strength, functional training and yoga by fitness experts</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>Education about Stress management and improving quality of sleep</Text></View>
                <View style={styles.planModalFeatureRow}><Text style={styles.planModalTick}>✔</Text><Text style={styles.planModalFeatureText}>On demand consults with Dermatologists and Gynecologist</Text></View>
              </View>
              </View>
             </ScrollView>
              {/* <TouchableOpacity style={styles.planModalCloseBtn} onPress={() => setPlanModalVisible(false)}>
              <Text style={styles.planModalCloseText}>Cancel</Text>
            </TouchableOpacity> */}
            {/* </ScrollView> */}
             <View style={styles.footer1}>
              <View style={styles.priceContainer1}>
                                  <Text style={styles.finalPrice1}> ₹{details.price}</Text>
                              </View>
                 <TouchableOpacity style={styles.planModalSubscribeBtn} onPress={handleSubscribe}>
                <Text style={styles.planModalSubscribeText}>Subscribe</Text>
              </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 24,
    paddingTop:30,
    width: '100%',
    height: '100%',
   // elevation: 8,
  },
  planModalTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  planModalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginBottom: 2,
    color: '#222',
    textAlign: 'center',
  },
  planModalOffer: {
    fontSize: 13,
    color: '#C35E9C',
    marginBottom: 12,
    textAlign: 'center',
  },
  planCard: {
    //backgroundColor: 'linear-gradient(135deg, #C35E9C 0%, #F76B1C 100%)',
    backgroundColor: '#C35E9C',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginLeft: '10%',
    marginBottom: 18,
    width: '80%',
  },
  planCardDuration: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planCardOldPrice: {
    fontSize: 14,
    color: '#fff',
    textDecorationLine: 'line-through',
    marginBottom: 2,
    opacity: 0.7,
  },
  planCardPrice: {
    fontSize: 22,
    color: '#fff',
    fontFamily: fonts.semiBold,
    marginBottom: 2,
  },
  whatyouget: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    marginTop: 15,
     marginBottom: 5,
     width: '94%',
  },
  planModalSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
    color: '#222',
    alignSelf: 'flex-start',
  },
  planModalFeatureList: {
    marginBottom: 18,
    alignSelf: 'flex-start',
    marginRight: 30,
  },
  planModalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
    flex: 1,
  },
  planModalTick: {
    fontSize: 16,
    color: '#C35E9C',
    marginRight: 10,
    marginTop: 1,
    fontWeight: 'bold',
    width: 18,
    textAlign: 'center',
  },
  planModalFeatureText: {
    fontSize: 13,
    color: '#444',
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  planModalSubscribeBtn: {
    backgroundColor: '#C35E9C',
    borderRadius: 23,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  planModalSubscribeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  planModalCloseBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C35E9C',
  },
  planModalCloseText: {
    color: '#C35E9C',
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  listofbenefits: {
    marginVertical: 16,
    backgroundColor: '#fff',
    padding: 16,
    paddingHorizontal: 20,
  },
  benefitRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
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
    content1: {
    flex: 1,
    //paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: "#fff",
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
    marginBottom: 15,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
     finalPrice1: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    //justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: getResponsiveSpacing(20),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

    footer1: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: getResponsiveSpacing(20),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(195, 94, 156, 1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    width: '100%',
  },
  priceContainer1: {
    flexDirection: "row",
    alignItems: "center",
  },
  // bookButton: {
  //   ...fontStyles.headercontent,
  //   marginBottom: 4,
  //   width: 130,
  //   height: 30,
  // },
  viewdetailsbutton: {
    borderColor: "#BDBABA",
    borderWidth: 1,
    backgroundColor: '#fff',
    width: 145,
    height: 37,
    justifyContent: 'center',
    borderRadius: 10,
    alignItems: 'center',
  },
  viewdetailstext: {
    color: "#000000",
    fontSize: 12,
    fontFamily: fonts.semiBold,
    paddingTop: 2,
  },
  bookButton: {
    width: 150,
    height: 37,
    backgroundColor: '#C35E9C',
    borderRadius: getResponsiveSpacing(23),
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.semiBold,
  },
  bookButtontext: {
    color: "#fff",
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
});
