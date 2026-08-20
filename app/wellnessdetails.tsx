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
import dayjs from "dayjs";
import { useUserStore } from "@/src/store/UserStore";

interface RouteParams {
  wellnessMasterId: string;
  enrolled: boolean | string;
  startDate: string;
  endDate: string;
}

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

interface ICareteam {
  nutritionistName: string;
  nutritionistSpeciality: string;
  physiotherapistName: string;
  physiotherapistSpeciality: string;
  primaryPhysicianName: string;
  primaryPhysicianSpeciality: string;
}

const PhysioTypes = [
  {
    key: "bmr",
    title: "BMR",
    unit: "kcal",
  },
  {
    key: "maintenanceCalories",
    title: "Calories for monitoring present weight",
    unit: "kcal",
  },
  {
    key: "weightLossCalories",
    title: "15% wt loss Calories Required",
    unit: "kcal",
  },
  {
    key: "activityLevelId",
    title: "Activity Level",
    unit: "",
  },
  {
    key: "presentActivityId",
    title: "Present Physical Activity",
    unit: "",
  },
  {
    key: "dailyStepsGoal",
    title: "Daily Steps Goal",
    unit: "",
  },
  {
    key: "stepsDuration",
    title: "Steps Duration",
    unit: "Mins",
  },
  {
    key: "expectedCaloriesBurn",
    title: "Expected Calories Burn (Steps)",
    unit: "cal",
  },
  {
    key: "physiotherapyFollowupId",
    title: "Physiotherapy Follow-up Timings",
    unit: "",
  },
  {
    key: "followupDays",
    title: "Physiotherapy Follow ups",
    unit: "",
  },
  {
    key: "preferredLanguages",
    title: "Patient Preferred Language",
    unit: "",
  },
  {
    key: "caloriesConsumption",
    title: "Calories Consumption",
    unit: "kcal",
  },
  {
    key: "totalTarget",
    title: "Total Target",
    unit: "kcal",
  },
];

const VitalsTypes = [
  {
    key: "bloodSugarTimings",
    title: "Blood Sugar",
    unit: "",
  },
  {
    key: "bloodPressureFrequency",
    title: "Blood Pressure",
    unit: "",
  },
  {
    key: "temperatureFrequency",
    title: "Temperature",
    unit: "",
  },
  {
    key: "bloodOxygenFrequency",
    title: "Blood Oxygen",
    unit: "",
  },
  {
    key: "heartRateFrequency",
    title: "Heart Rate",
    unit: "",
  },
  {
    key: "respiratoryRateFrequency",
    title: "Respiratory Rate",
    unit: "",
  },
  {
    key: "weightFrequency",
    title: "Weight",
    unit: "",
  },
];
const DietNutritionTypes = [
  {
    key: "dietRecommendationId",
    title: "Diet Plan Recommendation",
    unit: "",
  },
  {
    key: "macros",
    title: "Daily Macros",
    unit: "",
  },
  {
    key: "micros",
    title: "Daily Micros",
    unit: "",
  },
  {
    key: "dietPlanStatusId",
    title: "Diet Plan Status",
    unit: "",
  },
  {
    key: "bmr",
    title: "BMR",
    unit: "",
  },
  {
    key: "nutritionFollowupId",
    title: "Nutrition Follow-up Timings",
    unit: "",
  },
  {
    key: "followupDays",
    title: "Nutrition Follow-ups",
    unit: "",
  },
  {
    key: "preferredLanguages",
    title: "Patient Preferred Language",
    unit: "",
  },
];

type ServiceType = "wellness";
export default function WellnessDetailsScreen() {
  // Wellness program data map
  const wellnessProgramsData = {
    "Immunity Booster Program": {
      mainimage: { image: images.wellnessbooster },
      benefits: [
        {
          image: images.strongimmunity,
          heading: "Stronger Immunity",
          description:
            "Helps your body fight infections, bacteria, and viruses naturally.",
        },
        {
          image: images.energylevel,
          heading: "Increased Energy Levels",
          description:
            "Balanced nutrition improves metabolism and keeps you active throughout the day.",
        },
        {
          image: images.betterdigestion,
          heading: "Better Digestion",
          description:
            "Fiber-rich foods support gut health, which is directly linked to immunity.",
        },
        {
          image: images.overallhealth,
          heading: "Improved Overall Health",
          description:
            "Supports heart, brain, and organ functions with essential nutrients.",
        },
        {
          image: images.vitaminsminerals,
          heading: "Rich in Vitamins & Minerals",
          description: "Provides Vitamin C, D, Zinc, Iron, and antioxidants.",
        },
        {
          image: images.qualitysleep,
          heading: "Better Sleep Quality",
          description: "Certain foods help regulate sleep cycles and recovery.",
        },
      ],
      whyChoose: [
        {
          icon: "🛡️",
          heading: "Supports Natural Immune Defense",
          description:
            "Provides essential vitamins and nutrients to help fight infections.",
        },
        {
          icon: "🥗",
          heading: "Based on Real Food, Not Just Supplements",
          description:
            "Focuses on natural foods for better absorption and long-term health.",
        },
        {
          icon: "🔄",
          heading: "Builds Immunity Gradually & Sustainably",
          description:
            "Strengthens immunity gradually with consistent healthy eating.",
        },
        {
          icon: "🌿",
          heading: "Rich in Antioxidants & Anti-Inflammatory Nutrients",
          description: "Protects cells and reduces inflammation naturally.",
        },
        {
          icon: "⚡",
          heading: "Improves Overall Energy & Wellness",
          description: "Improves metabolism and keeps you active.",
        },
        {
          icon: "🧬",
          heading: "Strengthens Gut Health (Core of Immunity)",
          description: "Promotes healthy digestion and strong immune response.",
        },
      ],
    },
    "Kidney Wellness Program": {
      mainimage: { image: images.kidneywellness },
      benefits: [
        {
          image: images.betterkidney,
          heading: "Better Kidney Function",
          description:
            "Helps kidneys efficiently filter waste and toxins from the body.",
        },
        {
          image: images.naturaldetox,
          heading: "Natural Detox Support",
          description:
            "Supports removal of harmful toxins and reduces load on kidneys.",
        },
        {
          image: images.fluidlevels,
          heading: "Balanced Fluid Levels",
          description:
            "Maintains proper hydration and fluid balance in the body.",
        },
        {
          image: images.electrolytebalance,
          heading: "Electrolyte Balance",
          description:
            "Helps regulate sodium, potassium, and other essential minerals.",
        },
        {
          image: images.energylevels,
          heading: "Improved Energy Levels",
          description:
            "Healthy kidney function reduces fatigue and boosts overall energy.",
        },
        {
          image: images.supportheart,
          heading: "Supports Heart Health",
          description:
            "Healthy kidneys contribute to better blood pressure and heart function.",
        },
      ],
      whyChoose: [
        {
          icon: "🛡️",
          heading: "Supports Kidney Function",
          description:
            "Provides essential nutrients that help kidneys filter waste and maintain fluid balance.",
        },
        {
          icon: "🥗",
          heading: "Kidney-Friendly Nutrition",
          description:
            "Focuses on balanced foods that reduce strain on kidneys and support healthy function.",
        },
        {
          icon: "🔄",
          heading: "Long-Term Kidney Care",
          description:
            "Encourages consistent habits to maintain kidney health and prevent complications.",
        },
        {
          icon: "🌿",
          heading: "Reduces Toxin Build-Up",
          description:
            "Helps the body eliminate toxins naturally and supports detoxification.",
        },
        {
          icon: "⚡",
          heading: "Improves Energy Levels",
          description:
            "Healthy kidneys contribute to better energy and overall body balance.",
        },
        {
          icon: "🧬",
          heading: "Maintains Electrolyte Balance",
          description:
            "Supports proper levels of sodium, potassium, and fluids in the body.",
        },
        {
          icon: "❤️",
          heading: "Reduces Risk of Kidney Issues",
          description:
            "Helps lower the risk of kidney-related problems and supports overall health.",
        },
      ],
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
        ApiRoutes.WellnessData.getdataById(wellnessMasterId),
      );

      setDetails(response.data);
      // Debug: log the full details object after fetching
      console.log("Fetched details:", response.data);
    } catch (error) {
      console.log("Wellness details fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const route = useRoute();
  const router = useRouter();
  const [bookingVisible, setBookingVisible] = useState(false);
  const { wellnessMasterId, enrolled, startDate, endDate } =
    route.params as RouteParams;
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("wellness");
  const [details, setDetails] = useState<any>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [careteam, setCareteam] = useState<any>([]);
  const [activity, setActivity] = useState();
  const [vitals, setVitals] = useState();
  const [diet, setDiet] = useState();
  const { user } = useUserStore();

  // Select program data based on details (fallback to Immunity Booster)
  type WellnessProgramKey = keyof typeof wellnessProgramsData;
  // Normalize program name to match keys exactly (case and whitespace sensitive)
  const getProgramKey = (name?: string): WellnessProgramKey => {
    if (!name || typeof name !== "string") return "Immunity Booster Program";
    const trimmed = name.trim();
    if (trimmed in wellnessProgramsData) return trimmed as WellnessProgramKey;
    const found = Object.keys(wellnessProgramsData).find(
      (k) => k.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    return (found || "Immunity Booster Program") as WellnessProgramKey;
  };

  // Debug: log details.programName and details.name
  console.log(
    "details.programName:",
    details?.programName,
    "details.name:",
    details?.name,
  );
  const programKey: WellnessProgramKey = getProgramKey(
    details?.programName || details?.name,
  );
  const selectedProgramData = wellnessProgramsData[programKey];
  console.log("Selected Program Key:", programKey);
  const benefitsData = selectedProgramData.benefits;
  const whychooseData = selectedProgramData.whyChoose;
  const mainimage = selectedProgramData.mainimage;
  const isEnrolled = enrolled === "true";

  const fetchCareteam = async () => {
    try {
      if (!user?.eId) return;
      const res = await axiosClient.get<ICareteam>(
        ApiRoutes.WellnessData.getCareTeam(user?.eId),
      );
      console.log("careteam : ", res.data);
      const data = res.data;
      const formattedData = [
        { label: data.nutritionistSpeciality, value: data.nutritionistName },
        {
          label: data.physiotherapistSpeciality,
          value: data.physiotherapistName,
        },
        {
          label: data.primaryPhysicianSpeciality,
          value: data.primaryPhysicianName,
        },
      ];
      setCareteam(formattedData);
    } catch (error) {
      console.log("careteam fetch error: ", error);
    }
  };

  const normalizeMonitoringResponse = (data: any) => {
    if (!data) return null;

    if (!Array.isArray(data)) {
      return data;
    }

    if (
      Array.isArray(data[0]) &&
      data[0][1] &&
      typeof data[0][1] === "object"
    ) {
      return data[0][1];
    }

    if (data[0] && typeof data[0] === "object") {
      return data[0];
    }

    return null;
  };

  const fetchVitals = async () => {
    try {
      if (!user?.eId) return;
      const res = await axiosClient.get(
        ApiRoutes.WellnessData.getPatientVitalsMonitoring(user?.eId),
      );
      setVitals(normalizeMonitoringResponse(res));
      console.log("vitals data: ", res);
    } catch (error) {
      console.error("fetch vitals error: ", error);
    }
  };

  const fetchActivity = async () => {
    try {
      if (!user?.eId) return;
      const res = await axiosClient.get(
        ApiRoutes.WellnessData.getPatientActivity(user?.eId),
      );
      setActivity(normalizeMonitoringResponse(res));
      console.log("activity data: ", res);
    } catch (error) {
      console.error("fetch activity error: ", error);
    }
  };

  const fetchDiet = async () => {
    try {
      if (!user?.eId) return;
      const res = await axiosClient.get(
        ApiRoutes.WellnessData.getPatientDiet(user?.eId),
      );
      setDiet(normalizeMonitoringResponse(res));
      console.log("Diet data: ", res);
    } catch (error) {
      console.error("fetch diet error: ", error);
    }
  };

  useEffect(() => {
    fetchCareteam();
    fetchVitals();
    fetchActivity();
    fetchDiet();
  }, [user?.eId]);

  const handleSubscribe = () => {
    setPlanModalVisible(false);
    handleBookTest(details.wellnessMasterId);
  };
  const handleBookTest = (id: string) => {
    // setSelectedTest(testItem);
    setBookingVisible(true);
  };

  const formatDateTime = (date?: string | null) => {
    if (!date || !dayjs(date).isValid()) {
      return "";
    }

    return dayjs(date).format("DD MMM YYYY, hh:mm A");
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

  const CareteamInfoSection = ({
    title,
    icon,
    data,
  }: {
    title?: string;
    icon?: string;
    data?: { label: string; value: string }[];
  }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.sectionDivider} />

      {data?.map((item, index) => (
        <View key={index} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text style={styles.infoValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/Id\b/g, "")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  };

  const renderSection = (
    types: {
      key: string;
      title: string;
      unit: string;
    }[],
    data: Record<string, any>,
    exclude: string[] = [],
  ) => {
    const fields = types
      .filter(({ key }) => !exclude.includes(key))
      .map(({ key, title, unit }) => ({
        key,
        title,
        unit,
        value: data?.[key],
      }))
      .filter(
        ({ value }) => value !== null && value !== undefined && value !== "",
      );

    return fields;
  };

  const InfoSection = ({
    title,
    icon,
    data,
    exclude = [],
  }: {
    title?: string;
    icon?: string;
    data: Record<string, any>;
    exclude?: string[];
  }) => {
    const fields = Object.entries(data).filter(
      ([key, value]) =>
        !exclude.includes(key) &&
        value !== null &&
        value !== undefined &&
        value !== "",
    );

    if (!fields.length) return null;

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        <View style={styles.sectionDivider} />

        {fields.map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{formatLabel(key)}</Text>

            <Text style={styles.infoValue}>{formatValue(value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const PhysioSection = ({
    title,
    icon,
    data,
    dataTypes,
    exclude = [],
  }: {
    title?: string;
    icon?: React.ReactNode;
    data: Record<string, any>;
    dataTypes: any[];
    exclude?: string[];
  }) => {
    const fields = renderSection(dataTypes, data);
    if (!fields.length) return null;

    return (
      <View style={styles.section}>
        {icon}
        {title && <Text style={styles.sectionTitle}>{title}</Text>}

        <View style={styles.sectionDivider} />

        {fields.map(({ key, title, unit, value }) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{title}</Text>

            <Text style={styles.infoValue}>
              {formatValue(value)}
              {unit ? ` ${unit}` : ""}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingRight: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {details.programName || details.name}
          </Text>
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
              {!isEnrolled ? (
                <Text style={styles.finalPrice}>₹ {details.price}</Text>
              ) : (
                <View style={styles.programPeriod}>
                  <Text style={styles.periodLabel}>Program Period</Text>

                  <View style={styles.dateRow}>
                    <Text style={styles.dateText}>
                      {formatDateTime(startDate)}
                    </Text>

                    <Text style={styles.dateArrow}>→</Text>

                    <Text style={styles.dateText}>
                      {formatDateTime(endDate)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          {/* Program Name */}
          {isEnrolled ? (
            <>
              <View style={styles.listofbenefits}>
                {careteam && (
                  <CareteamInfoSection title="Care Team" data={careteam} />
                )}
                {activity && (
                 
                  <PhysioSection
                    title="Physio Health Screening"
                    data={activity}
                    dataTypes={PhysioTypes}
                  />
                )}
                {vitals && <PhysioSection title="Vitals" data={vitals} dataTypes={VitalsTypes}/>}

                {diet && <PhysioSection title="Diet & Nutrition" data={diet} dataTypes={DietNutritionTypes}/>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.listofbenefits}>
                <Text style={styles.titledata}>What Benefits Do You Get?</Text>
                {benefitsData.map((item, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <View style={styles.benefitIconBox}>
                      <Image
                        source={item.image}
                        style={styles.benefitIconImg}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.benefitTextBox}>
                      <Text style={styles.benefitHeading}>{item.heading}</Text>
                      {item.description ? (
                        <Text style={styles.benefitDescription}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.listofbenefits}>
                <Text style={styles.titledata}>
                  Why Choose Curonn Immunity Booster?
                </Text>
                {whychooseData.map((item, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <View style={styles.benefitIconBox}>
                      <Text style={styles.benefitIcon}>{item.icon}</Text>
                    </View>
                    <View style={styles.benefitTextBox}>
                      <Text style={styles.benefitHeading}>{item.heading}</Text>
                      {item.description ? (
                        <Text style={styles.benefitDescription}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
        {/* Price */}
        {!isEnrolled && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => setPlanModalVisible(true)}
            >
              <Text style={styles.bookButtontext}>Enroll Now</Text>
            </TouchableOpacity>
          </View>
        )}
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
          masterId={details.wellnessMasterId}
        />
      )}

      {/* Plan Modal */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planModalContent}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setPlanModalVisible(false)}
                style={{ paddingRight: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {details.programName || details.name}
              </Text>
            </View>
            {/* <ScrollView style={styles.content} showsVerticalScrollIndicator={false}> */}
            {/* <Text style={styles.planModalSubtitle}>Select plan</Text>
            <Text style={styles.planModalOffer}>Introductory offers</Text> */}
            <ScrollView
              style={styles.content1}
              showsVerticalScrollIndicator={false}
            >
              {/* <View style={styles.planCard}>
                <Text style={styles.planCardPrice}>₹ {details.price}</Text>
              </View> */}
              <View style={styles.whatyouget}>
                <Text style={styles.planModalSectionTitle}>What you get</Text>
                <View style={styles.planModalFeatureList}>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Unlimited on-demand support by certified Dietitian
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Monthly online consults with Senior Dietitian
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Personalized dietary plans based on your dietary
                      preferences
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Monitoring your adherence to dietary goals through meal
                      plate images
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Consultations with our Psychotherapist to help you
                      overcome the stress of weight management
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Weekly Wellness sessions with at home workout formats
                      across Strength, functional training and yoga by fitness
                      experts
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      Education about Stress management and improving quality of
                      sleep
                    </Text>
                  </View>
                  <View style={styles.planModalFeatureRow}>
                    <Text style={styles.planModalTick}>✔</Text>
                    <Text style={styles.planModalFeatureText}>
                      On demand consults with Dermatologists and Gynecologist
                    </Text>
                  </View>
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
              <TouchableOpacity
                style={styles.planModalSubscribeBtn}
                onPress={handleSubscribe}
              >
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  planModalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 24,
    paddingTop: 30,
    width: "100%",
    height: "100%",
    // elevation: 8,
  },
  planModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
    textAlign: "center",
  },
  planModalSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    color: "#222",
    textAlign: "center",
  },
  planModalOffer: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  planCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginLeft: "10%",
    marginBottom: 18,
    width: "80%",
  },
  planCardDuration: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  planCardOldPrice: {
    fontSize: 14,
    color: "#fff",
    textDecorationLine: "line-through",
    marginBottom: 2,
    opacity: 0.7,
  },
  planCardPrice: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 2,
  },
  whatyouget: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    width: "94%",
  },
  planModalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
    alignSelf: "flex-start",
  },
  planModalFeatureList: {
    marginBottom: 18,
    alignSelf: "flex-start",
    marginRight: 30,
  },
  planModalFeatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
    flex: 1,
  },
  planModalTick: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 10,
    marginTop: 1,
    fontWeight: "bold",
    width: 18,
    textAlign: "center",
  },
  planModalFeatureText: {
    fontSize: 13,
    color: "#444",
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  planModalSubscribeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 23,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  planModalSubscribeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  planModalCloseBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  planModalCloseText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  listofbenefits: {
    marginVertical: 16,
    backgroundColor: "#fff",
    padding: 16,
    paddingHorizontal: 20,
  },
  benefitRow1: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3e6f2",
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
    fontWeight: "700",
    fontSize: 14,
    color: "#694664",
    marginBottom: 0,
  },
  benefitDescription: {
    fontFamily: fonts.medium,
    color: "#555",
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
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 28,
  },

  titledata: {
    color: "#000",
    marginBottom: 15,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 28,
  },
  sectionTitle: {
    ...fontStyles.button,
    fontWeight: "600",
    // marginBottom: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: "rgba(0, 0, 0, 0.1)",
    // paddingBottom: 5,
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
    position: "absolute",
    bottom: 0,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    width: "100%",
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
    backgroundColor: "#fff",
    width: 145,
    height: 37,
    justifyContent: "center",
    borderRadius: 10,
    alignItems: "center",
  },
  viewdetailstext: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
    paddingTop: 2,
  },
  bookButton: {
    width: 150,
    height: 37,
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(23),
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },
  bookButtontext: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  programPeriod: {
    paddingVertical: 8,
  },

  periodLabel: {
    fontSize: 12,
    color: colors.white,
    marginBottom: 5,
    fontFamily: fonts.medium,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },

  dateArrow: {
    marginHorizontal: 8,
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  sectionTitle1: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
  },

  infoValue: {
    flex: 1.2,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: "right",
  },
});
