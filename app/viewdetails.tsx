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
  Platform,
  Modal,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";

import PrimaryButton from "./shared/components/PrimaryButton";
import BookingScreen from "./features/booking/booking";

import { images } from "@/assets";
import { colors } from "./shared/styles/commonStyles";
import { getResponsiveSpacing } from "./shared/utils/responsive";
import { fontStyles, fonts } from "./shared/styles/fonts";
import CommonHeader from "./shared/components/CommonHeader";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
interface RouteParams {
  id: string;
  type: "lab-test" | "health-checks" | "scans" | "ambulance" | "diagncenter";
}

export default function ViewDetailsScreen() {
    // Helper for diagnostic center modal (scans)
    const getDisplayedData = () => {
      if (type === "scans" && details) {
        return [details];
      }
      return [];
    };
  const route = useRoute();
  const router = useRouter();
  const { id, type } = route.params as RouteParams;

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState("New York, NY");
  const [bookingVisible, setBookingVisible] = useState(false);

  const [diagsticVisible, setdiagsticVisible] = useState(false);
  const [selectedDiagCenter, setSelectedDiagCenter] = useState<any>(null);
  const [diagCenters, setDiagCenters] = useState<any[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [errors, setErrors] = useState("");
    // Lab-test time slots
  const labTimeSlots = [
    "07:00 AM - 08:00 AM",
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
  ];

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      let response: any;

      switch (type) {
        case "lab-test":
          response = await axiosClient.get(ApiRoutes.LabTests.getById(id));
          setDetails(response.data);
          break;

        case "health-checks":
          response = await axiosClient.get(ApiRoutes.LabPackages.getById(id));
          break;

        case "scans":
          response = await axiosClient.get(ApiRoutes.Xray.getById(id));
           console.log("Diagnostic center details response:", response.data);
           setDetails(response.data);
          fetchDiagCenters();
          break;

        case "ambulance":
          response = await axiosClient.get(
            ApiRoutes.Ambulance.getdataById(id)
          );
          break;

        case "diagncenter":
          response = await axiosClient.get(
            ApiRoutes.DiagCenter.GetById(id)
          );
          console.log("Diagnostic center details response:", response.data);
          setDetails(response.data);
          break;
      }

      if (response?.isSuccess) {
        setDetails(response.data);
      }
    } catch (error) {
      console.log("Details fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

    const formatDateLab = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
    const handleMedDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === "ios");
      if (selectedDate) {
        setSelectedDate(selectedDate);
        if (errors === "Please select service start date" || errors === "Please select delivery date") setErrors("");
      }
    };

  const fetchDiagCenters = async () => {
    try {
      setDiagLoading(true);
       const latLngStr = await AsyncStorage.getItem('userLocationLatLng');
      let latitude = 0;
      let longitude = 0;
      if (latLngStr) {
        const { latitude: lat, longitude: lng } = JSON.parse(latLngStr);
        latitude = Number(lat);
        longitude = Number(lng);
      }
      const payload = {
        latitude,
        longitude,
        radiusKm: 10,
      };

      const response: any = await axiosClient.post(
        ApiRoutes.DiagCenter.Diagsticcenter,
        payload
      );

      setDiagCenters(Array.isArray(response) ? response : []);
    } catch (error) {
      setDiagCenters([]);
    } finally {
      setDiagLoading(false);
    }
  };

  const getTestCount = (testsList?: string) => {
    if (!testsList) return 0;

    return testsList
      .split(",")
      .map((test) => test.trim())
      .filter(Boolean).length;
  };

  const bookingData =
    details && {
      serviceName:
        details.testName ||
        details.packageName ||
        details.centerName ||
        details.programName ||
        details.name,

      servicePrice: Number(
        details.curonnprice
      ),

      reportTime: details.reportTime || details.duration || "",
      isAtHome: details.isAtHome ?? false,

      masterId:
        details.labTestMasterId ||
        details.labPackageMasterId ||
        details.xrayMasterId ||
        details.id,

      type,
    };
const handleBookscanTest = (testId: string, centerId: string) => {
  if (!details) {
    setErrors("No scan selected. Please select a scan before booking.");
    return;
  }
  if (!selectedDate) {
    setErrors("Please select service start date");
    return;
  }
  if (!selectedTimeSlot) {
    setErrors("Please select time slot");
    return;
  }
  const testItem = getDisplayedData().find(
    (item) => item.id === testId
  );
  const center = diagCenters.find((c: any) => c.id === centerId);
  console.log("Selected test for booking:", testItem);
  if (testItem && center) {
    setSelectedDiagCenter(center); // Set selected diagnostic center for BookingScreen
    setDetails({
      ...testItem,
      selectedDate,
      selectedTimeSlot,
      selectedDiagCenter: center,
    });
    setBookingVisible(true);
  }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#694664" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {details.centerName ||
              details.packageName ||
              details.testName}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <Image
            source={images.healthpackage}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            {details.centerName ||
              details.packageName ||
              details.testName}
          </Text>

          {/* Diagnostic Center */}
          {type === "diagncenter" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>

              <Text style={styles.address}>
                {details.address}, {details.locality}
              </Text>

              <Text style={styles.address}>
                {details.city}, {details.state}
              </Text>

              <Text style={styles.phonenum}>{details.phoneNo}</Text>
            </View>
          )}

          {/* Health Package Tests */}
          {type === "health-checks" && details.testsList && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {getTestCount(details.testsList)} Tests Included
              </Text>

              {details.testsList
                .split(",")
                .map((test: string, index: number) => (
                  <Text key={index} style={styles.testsList}>
                    • {test.trim()}
                  </Text>
                ))}
            </View>
          )}

          {/* Scan Organs */}
          {type === "scans" && details.vitalOrgans && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Vital Organs Covered: {details.vitalOrgans}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
            <>
              <View style={styles.priceContainer}>
                {details.price && (
                  <Text style={styles.originalPrice}>
                    ₹ {details.price}
                  </Text>
                )}
                {(type === "scans" ? details.curonnprice : details.curonnPrice) && (
                  <Text style={styles.finalPrice}>
                    ₹ {type === "scans" ? details.curonnprice : details.curonnPrice}
                  </Text>
                )}
              </View>

              <PrimaryButton
                title="Book Now"
                onPress={() => {
                  if (type === "scans") {
                    setdiagsticVisible(true);
                    fetchDiagCenters();
                  } else {
                    setBookingVisible(true);
                  }
                }}
                style={styles.bookButton}
              />
            </>
        </View>

        {bookingVisible && bookingData && (
          <BookingScreen
            visible={bookingVisible}
            onClose={() => setBookingVisible(false)}
            onSuccess={() => setBookingVisible(false)}
            {...bookingData}
            selectedDiagCenter={selectedDiagCenter}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
          />
        )}
      </View>
       {/* Diagnostic Center Modal */}
        <Modal
          visible={diagsticVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setdiagsticVisible(false);
            setSelectedDate(null);
            setSelectedTimeSlot("");
            setErrors("");
          }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>

            <View style={[styles.defaultHeader, { flexDirection: 'row', position: 'relative', alignItems: 'center', justifyContent: 'space-between' }]}>
              <CommonHeader
                currentLocation={currentLocation}
                onProfilePress={() => console.log("Profile pressed")}
                showCart={false}
              />
              <TouchableOpacity onPress={() => {
                setdiagsticVisible(false);
                setSelectedDate(null);
                setSelectedTimeSlot("");
                setErrors("");
              }} style={styles.closeButton}>
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>



            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 0 }} showsVerticalScrollIndicator={true}>
              <View style={styles.content}>
                {/* Sample Pickup Date & Time */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Date & Time
                  </Text>
                  <View style={styles.dateTimeCard}>
                    <View style={styles.dateSection}>
                      <Text style={styles.fieldLabel}>Service Start Date</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            !selectedDate && styles.placeholderText,
                          ]}
                        >
                          {selectedDate
                            ? formatDateLab(selectedDate)
                            : "dd/mm/yyyy"}
                        </Text>
                        <Image
                          source={images.icons.calendar}
                          style={styles.calendarIcon}
                        />
                      </TouchableOpacity>
                      {(!selectedDate && errors === "Please select service start date") && (
                        <Text
                          style={{ color: "#ff0000", fontSize: 13, marginTop: 4, fontFamily: fonts.regular }}
                        >
                          {errors}
                        </Text>
                      )}

                    </View>

                    <View style={styles.timeSection}>
                      <Text style={styles.fieldLabel}>Select Time Slot</Text>
                      <View style={styles.timeSlotsContainer}>
                        {labTimeSlots.map((slot, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlot,
                              selectedTimeSlot === slot && styles.selectedTimeSlot,
                            ]}
                            onPress={() => {
                              setSelectedTimeSlot(slot);
                              if (errors === "Please select time slot")
                                setErrors("");
                            }}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedTimeSlot === slot &&
                                styles.selectedTimeSlotText,
                              ]}
                            >
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {errors === "Please select time slot" && (
                        <Text
                          style={{ color: "#ff0000", fontSize: 13, marginTop: 4 }}
                        >
                          {errors}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.modalHeader}>

                </View>
                {diagLoading ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <ActivityIndicator size="large" color="#694664" />
                  </View>
                ) : (
                  <View style={styles.modalScrollableContent}>
                    {diagCenters.length === 0 ? (
                      <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>No diagnostic centers found.</Text>
                    ) : (
                      <>

                        {diagCenters.map((center: any) => (<>
                          <LinearGradient
                            key={center.id}
                            colors={['#fff', '#D5CDDA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.testCard}
                          >

                            <View style={styles.cardContainer}>
                              <View style={styles.testCard1}>
                                <View style={styles.testInfo}>
                                  <Text style={styles.testName}>{center.centerName}</Text>



                                  <Text style={styles.testReportTime}>
                                    {center.address}
                                  </Text>


                                </View>

                                <View style={styles.healthprice}>
                                  <Text style={styles.priceRow}>
                                    {details?.price && (
                                      <Text style={styles.originalPrice}>
                                        ₹{details?.price}
                                      </Text>
                                    )}
                                    {' '}
                                    {(type === "scans" ? details?.curonnprice : details?.curonnPrice) && (
                                      <Text style={styles.finalPrice1}>
                                        ₹{type === "scans" ? details?.curonnprice : details?.curonnPrice}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.testActioncard}>
                               
                                <PrimaryButton
                                  title="Book Now"
                                  onPress={() => {
                                    if (!details) {
                                      setErrors("No scan selected. Please select a scan before booking.");
                                      return;
                                    }
                                    handleBookscanTest(details.id, center.id);
                                  }}
                                  style={styles.bookButton}
                                />
                                {!details && errors === "No scan selected. Please select a scan before booking." && (
                                  <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{errors}</Text>
                                )}

                              </View>
                            </View>

                          </LinearGradient>
                        </>))}


                        {/* <PrimaryButton
                      title="Next"
                      style={styles.nextButton}
                      disabled={selectedDiagCenterId === null}
                      onPress={() => {
                        const selectedCenter = diagCenters.find((c: any) => c.id === selectedDiagCenterId);
                        if (selectedCenter && selectedTest) {
                          // Update selectedTest with new diagnostic center
                          setSelectedTest({ ...selectedTest, selectedDiagCenter: selectedCenter });
                          setdiagsticVisible(false);
                          setBookingVisible(true);
                        }
                      }}
                    /> */}
                      </>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

          </SafeAreaView>
        </Modal>
         {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleMedDateChange}
            minimumDate={new Date()}
          />
        )}
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    
    
  },
  modalScrollableContent: {
    flexGrow: 1,
    
  },
  cardContainer: {
    width: '100%',
  },
  testReportTime: {
    fontSize: 10,
    color: "#4B334E",
    fontFamily: fonts.regular,
  },
  testAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  healthprice: {
    alignItems: "center",
    justifyContent: "center",
  },
  priceRow: {
    fontSize: 11,
    color: "#4B334E",
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: fonts.regular,
    
  },
  finalPrice1: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.bold,
  },
  testActioncard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: '#c3c0c0',
    paddingTop: 12,
    marginTop: 12,
  },
  viewdetailsbutton: {
    borderColor: "#BDBABA",
    borderWidth: 1,
    backgroundColor: '#fff',
    width: 130,
    height: 35,
    justifyContent: 'center',
    borderRadius: 20,
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 40,
    marginTop: 5
  },
  searchIcon: {
    marginRight: 8,
    tintColor: "#808080",
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    color: "#000",
    paddingTop: 4,
    fontFamily: fonts.regular,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    width: 16,
    height: 16,
    tintColor: "#999",
  },
  categoriesContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  categoriesList: {
    gap: 12,
  },
  testCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    // Add a linear gradient background from left (#FFFFFF) to right (#D5CDDA)
    // Note: This requires react-native-linear-gradient. If not available, fallback to a View with backgroundColor.
    overflow: "hidden", // To ensure borderRadius clips the gradient
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  testCard1: {
    flexDirection: "row",
  },
  testInfo: {
    flex: 1,
    marginRight: 16,
  },
  testName: {
    fontSize: 16,
    color: "#000",
    marginBottom: 3,
    fontFamily: fonts.bold,

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  headerTitle: {
    ...fontStyles.headercontent,
    marginLeft: 10,
  },

  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: "#f5f4f9",
  },

  image: {
    width: "100%",
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },

  title: {
    ...fontStyles.heading3,
    color: "#c55e9c",
    marginBottom: 10,
  },

  section: { marginTop: 10, marginBottom: 15 },

  sectionTitle: {
    ...fontStyles.button,
    fontFamily: fonts.semiBold,
    marginBottom: 10,
  },
dateTimeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  dateSection: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#333",
    marginBottom: 3,
    fontFamily: fonts.medium
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 13,
    color: "#333",
    fontFamily: fonts.regular
  },
  placeholderText: {
    color: "#999",
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },
  timeSection: {
    marginTop: 6,
  },
    modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#333",
    fontFamily: fonts.regular
  },
  selectedTimeSlot: {
    backgroundColor: "#C15E9C",
    borderColor: "#C15E9C",
  },
  timeSlotText: {
    fontSize: 11,
    color: "#333",
    fontFamily: fonts.regular
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  address: {
    fontFamily: fonts.medium,
    color: "#555",
  },

  phonenum: {
    fontFamily: fonts.medium,
    color: "#555",
  },

  testsList: {
    ...fontStyles.bodySmall,
    lineHeight: 26,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  originalPrice: {
    textDecorationLine: "line-through",
    marginRight: 8,
    color: "#aaa",
  },

  finalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C35E9C",
  },

  bookButton: {
    width: 130,
    height: 40,
  },
});