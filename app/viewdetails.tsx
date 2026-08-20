import React, { useCallback, useEffect, useState } from "react";
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

import { useRoute, useFocusEffect } from "@react-navigation/native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { useCart } from "./shared/context/CartContext";
interface RouteParams {
  id: string;
  type:
    | "lab-test"
    | "health-checks"
    | "scans"
    | "ambulance"
    | "diagncenter"
    | "medicine";
  price?: string;
  curonnPrice?: string;
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
  const {
    id,
    type,
    price: routePrice,
    curonnPrice: routeCuronnPrice,
  } = route.params as RouteParams;
  const {
    refreshCart,
    cartCount,
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
  } = useCart();
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

  // Use useFocusEffect to always fetch details when the page is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchDetails();
    }, [id, type]),
  );

  const fetchDetails = async () => {
    try {
      setLoading(true);

      let response: any;

      switch (type) {
        case "lab-test":
          response = await axiosClient.get(ApiRoutes.LabTests.getById(id));
          setDetails(response.data);
          //console.log("Lab test details response:", response.data);
          break;

        case "health-checks":
          response = await axiosClient.get(ApiRoutes.LabPackages.getById(id));
          console.log("health check details response:", response.data);
          break;

        case "scans":
          response = await axiosClient.get(ApiRoutes.Xray.getById(id));
          console.log("Diagnostic center details response:", response.data);
          setDetails(response.data);
          fetchDiagCenters();
          break;

        case "ambulance":
          response = await axiosClient.get(ApiRoutes.Ambulance.getdataById(id));
          console.log("Ambulance details response:", response.data);
          break;

        case "diagncenter":
          response = await axiosClient.get(ApiRoutes.DiagCenter.GetById(id));
          //;console.log("Diagnostic center details response:", response.data);
          setDetails(response.data);
          break;

        case "medicine":
          response = await axiosClient.get(
            ApiRoutes.MedicalOrders.getdataById(id),
          );
          console.log("Medcine details response:", response.data);
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
      if (
        errors === "Please select service start date" ||
        errors === "Please select delivery date"
      )
        setErrors("");
    }
  };

  const fetchDiagCenters = async () => {
    try {
      setDiagLoading(true);
      const latLngStr = await AsyncStorage.getItem("userLocationLatLng");
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
        payload,
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

  const bookingData = details && {
    serviceName:
      details.testName ||
      details.packageName ||
      details.centerName ||
      details.programName ||
      details.name,

    servicePrice:
      Number(details.curonnprice || details.curonnPrice) ||
      Number(details.price) ||
      Number(routeCuronnPrice) ||
      Number(routePrice) ||
      0,

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
    const testItem = getDisplayedData().find((item) => item.id === testId);
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

  // Use correct argument and always use details for medicine
  const handleIncrement = useCallback(
    async (medicineDetails: any) => {
      const medicineId = medicineDetails.medicineMasterId;
      const medicineName = medicineDetails.medicineName;
      setLoading((prev: any) => ({ ...prev, [medicineId]: true }));
      try {
        // Prepare medicine object with required id, name, subtitle, and description fields
        const medicine = {
          //...medicineDetails,
          id: medicineId.toString(),
          name: medicineName,
          subtitle: medicineDetails.streepBoxQty ?? "",
          curonnPrice:
            medicineDetails.curonnPrice ?? medicineDetails.curonnprice ?? 0,
        };
        // Find if item is already in cart
        const itemInCart = cartItems?.find(
          (i: any) => i.id === medicineId.toString(),
        );
        if (itemInCart) {
          if (itemInCart.cartId) {
            await updateQuantity(
              itemInCart.cartId,
              itemInCart.quantity + 1,
              medicineId,
            );
          } else {
            await addItem(medicine, 1);
          }
          await refreshCart();
          router.push("/cart" as unknown as any);
        } else {
          await addItem(medicine, 1);
          await refreshCart();
          router.push("/cart" as unknown as any);
        }
      } catch (e) {
        // Optionally handle error
        console.log("Add to cart error:", e);
      } finally {
        setLoading((prev: any) => ({ ...prev, [medicineId]: false }));
      }
    },
    [cartItems, setLoading, addItem, updateQuantity, refreshCart],
  );

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
        {/* <StatusBar barStyle="dark-content" /> */}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {details.centerName || details.packageName || details.testName}
          </Text>
        </View>

        <ScrollView style={styles.contentlabtest}>
          <View style={styles.viewimage}>
            <View style={styles.Iocnbox}>
              {type === "lab-test" ? (
                <View style={styles.newbanner}>
                  <Image
                    source={images.labtextviewdetails}
                    style={styles.bannerimage}
                    resizeMode="cover"
                  />
                </View>
              ) : type === "health-checks" ? (
                <View style={styles.newbanner}>
                  <Image
                    source={images.labpackge}
                    style={styles.bannerimage}
                    resizeMode="cover"
                  />
                </View>
              ) : type === "scans" || type === "diagncenter" ? (
                <View style={styles.newbanner}>
                  <Image
                    source={images.xray}
                    style={styles.bannerimage}
                    resizeMode="cover"
                  />
                </View>
              ) : type !== "ambulance" ? (
                <Image
                  source={{
                    uri: details.imageUrl
                      ? `https://drive.google.com/uc?export=view&id=${
                          details.imageUrl.split("/d/")[1]?.split("/")[0]
                        }`
                      : undefined,
                  }}
                  style={styles.bannerimage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.newbanner}>
                  <Image
                    source={images.ambulanceviewdetails}
                    style={styles.bannerimage1}
                    resizeMode="cover"
                  />
                </View>
              )}

              <Text style={styles.title}>
                {details.centerName ||
                  details.packageName ||
                  details.testName ||
                  details.medicineName}
              </Text>

              {type === "medicine" && (
                <View style={styles.section2}>
                  <Text style={styles.testsList2}>{details.streepBoxQty}</Text>
                </View>
              )}

              {(type === "ambulance" || type === "medicine") && (
                <View style={styles.section2}>
                  <Text style={styles.sectionTitle1}>Manufacturer</Text>

                  <Text style={styles.testsList1}>
                    {details.manufacturerDetails}
                  </Text>
                </View>
              )}

              {type !== "ambulance" && type !== "medicine" && (
                <View style={styles.reports}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 2,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#A259C6"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.reportTime}>
                      {/* {details.reportTime || details.duration} */}
                      reports with in{" "}
                      <Text style={styles.reportsdetails}>
                        {type === "lab-test"
                          ? "10 to 12 hours"
                          : "48 to 72 hours"}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          {/* --- New Sections Start --- */}
          {/* Health Package Tests */}

          {/* {type === "health-checks" && details.testsList && (
            <View style={styles.section1}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {getTestCount(details.testsList)}+ Tests Included
                </Text>
                <View style={styles.testcontent}> 
                  <Text style={styles.testsinclude}>
                    The content is uniquely informative and provides an educationa; purpose. Kindly use the content only in consultation with an appropriate certified or registered healthcare provider.
                  </Text>
                </View>

                {details.testsList
                  .split(",")
                  .map((test: string, index: number) => (
                    <Text key={index} style={styles.testsList}>
                      • {test.trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )} */}

          {(type === "ambulance" || type === "medicine") && (
            <>
              <View style={styles.section1}>
                <Text style={styles.sectionTitle}>Product Introduction</Text>

                <Text style={styles.testsList}>{details.description}</Text>
              </View>
            </>
          )}

          {/* What is in this test? */}
          {type !== "ambulance" && type !== "medicine" && (
            <>
              <View style={styles.section1}>
                <Text style={styles.sectionTitle}>What is in this test?</Text>
                {Array.isArray(details.whatTest) &&
                details.whatTest.length > 0 ? (
                  details.whatTest.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.testsList}>
                      • {item}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.testsList}>
                    No information available.
                  </Text>
                )}
              </View>

              <View style={styles.section1}>
                <Text style={styles.sectionTitle}>Why is this test done?</Text>
                {Array.isArray(details.whyTest) &&
                details.whyTest.length > 0 ? (
                  details.whyTest.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.testsList}>
                      {idx + 1}. {item}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.testsList}>
                    No information available.
                  </Text>
                )}
              </View>

              <View style={styles.section1}>
                <Text style={styles.sectionTitle}>Prerequisite</Text>
                {Array.isArray(details.prerequisites) &&
                details.prerequisites.length > 0 ? (
                  details.prerequisites.map((item: string, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginTop: idx === 0 ? 5 : 0,
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.primary}
                        style={{ marginRight: 8, marginTop: 3 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.testsList}>{item}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.testsList}>
                    No prerequisites specified.
                  </Text>
                )}
              </View>
            </>
          )}
          {/* Scan Organs */}
          {type === "scans" && details.vitalOrgans && (
            <View style={[styles.section1]}>
              <Text style={styles.sectionTitle}> Vital Organs Covered:</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="body-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.testsList}>{details.vitalOrgans}</Text>
              </View>
            </View>
          )}

          {/* Diagnostic Center */}
          {type === "diagncenter" && (
            <View style={styles.section1}>
              <Text style={styles.sectionTitle}>Diagnostic Center Address</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.address}>
                    {details.address}, {details.locality}
                  </Text>
                  <Text style={styles.address}>
                    {details.city}, {details.state}
                  </Text>
                  <Text style={styles.phonenum}>{details.phoneNo}</Text>
                </View>
              </View>
            </View>
          )}
          {type !== "ambulance" && type !== "medicine" && (
            <>
              {/* Samples Collected */}
              <View style={[styles.section1, { marginBottom: 15 }]}>
                <Text style={styles.sectionTitle}>Samples Collected</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="flask-outline"
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.testsList}>
                    {details.samplecollected}
                  </Text>
                </View>
              </View>
            </>
          )}
          {/* --- New Sections End --- */}

          {/* <Image
            source={images.healthpackage}
            style={styles.image}
            resizeMode="contain"
          /> */}
        </ScrollView>

        {/* Footer */}
        {type !== "medicine" ? (
          <View style={styles.footer}>
            <>
              {type === "diagncenter" && (routePrice || routeCuronnPrice) ? (
                <View style={styles.priceContainer}>
                  {routePrice ? (
                    <Text style={styles.originalPrice}>₹{routePrice}</Text>
                  ) : null}
                  {routeCuronnPrice ? (
                    <Text style={styles.finalPrice}> ₹{routeCuronnPrice}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.priceContainer}>
                  {type !== "ambulance" ? (
                    <>
                      {details.price && (
                        <Text style={styles.originalPrice}>
                          ₹ {details.price}
                        </Text>
                      )}
                      {(type === "scans"
                        ? details.curonnprice
                        : details.curonnPrice) && (
                        <Text style={styles.finalPrice}>
                          ₹{" "}
                          {type === "scans"
                            ? details.curonnprice
                            : details.curonnPrice}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      {details.price && (
                        <Text style={styles.finalPrice}>₹ {details.price}</Text>
                      )}
                    </>
                  )}
                </View>
              )}

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
                textStyle={styles.bookButtonText}
              />
            </>
          </View>
        ) : (
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              {details.streepBoxPrice && (
                <Text style={styles.originalPrice}>
                  ₹{details.streepBoxPrice}
                </Text>
              )}
              {details.curonnPrice && (
                <Text style={styles.finalPrice}>₹{details.curonnPrice}</Text>
              )}
            </View>
            <PrimaryButton
              title="Add to Cart"
              onPress={() => handleIncrement(details)}
              style={styles.bookButton}
            />
          </View>
        )}

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
          <View
            style={[
              styles.defaultHeader,
              {
                flexDirection: "row",
                position: "relative",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <CommonHeader
              currentLocation={currentLocation}
              onProfilePress={() => console.log("Profile pressed")}
              showCart={false}
            />
            <TouchableOpacity
              onPress={() => {
                setdiagsticVisible(false);
                setSelectedDate(null);
                setSelectedTimeSlot("");
                setErrors("");
              }}
              style={styles.closeButton}
            >
              <Image source={images.icons.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.content}>
              {/* Sample Pickup Date & Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Select your preferred date & time
                </Text>
                <View style={styles.dateTimeCard}>
                  <View style={styles.dateSection}>
                    <Text style={styles.fieldLabel}>Service Date</Text>
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
                    {!selectedDate &&
                      errors === "Please select service start date" && (
                        <Text
                          style={{
                            color: "#ff0000",
                            fontSize: 13,
                            marginTop: 4,
                            fontFamily: fonts.regular,
                          }}
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
                            selectedTimeSlot === slot &&
                              styles.selectedTimeSlot,
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
              <View style={styles.modalHeader}></View>
              {diagLoading ? (
                <View style={{ alignItems: "center", padding: 20 }}>
                  <ActivityIndicator size="large" color="#694664" />
                </View>
              ) : (
                <View style={styles.modalScrollableContent}>
                  <Text style={{fontSize: 14, color: colors.primaryText, fontWeight:700}}>Select your preferred diagnostic center</Text>
                  {diagCenters.length === 0 ? (
                    <Text
                      style={{
                        textAlign: "center",
                        color: colors.primaryText,
                        marginVertical: 20,
                      }}
                    >
                      No diagnostic centers found.
                    </Text>
                  ) : (
                    <>
                      {diagCenters.map((center: any) => (
                        <>
                          <LinearGradient
                            key={center.id}
                            colors={["#fff", "#FFF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.testCard}
                          >
                            <View style={styles.cardContainer}>
                              <View style={styles.testCard1}>
                                <View style={styles.testInfo}>
                                  <Text style={styles.testName}>
                                    {center.centerName}
                                  </Text>

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
                                    {(type === "scans"
                                      ? details?.curonnprice
                                      : details?.curonnPrice) && (
                                      <Text style={styles.finalPrice1}>
                                        ₹
                                        {type === "scans"
                                          ? details?.curonnprice
                                          : details?.curonnPrice}
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
                                      setErrors(
                                        "No scan selected. Please select a scan before booking.",
                                      );
                                      return;
                                    }
                                    handleBookscanTest(details.id, center.id);
                                  }}
                                  style={styles.bookButton}
                                  textStyle={styles.bookButtonText}
                                />
                                {!details &&
                                  errors ===
                                    "No scan selected. Please select a scan before booking." && (
                                    <Text
                                      style={{
                                        color: "#ff0000",
                                        fontSize: 13,
                                        marginTop: 4,
                                      }}
                                    >
                                      {errors}
                                    </Text>
                                  )}
                              </View>
                            </View>
                          </LinearGradient>
                        </>
                      ))}

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
    borderBottomColor: "#E0E0E0",
  },
  modalScrollableContent: {
    flexGrow: 1,
  },
  cardContainer: {
    width: "100%",
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
    color: "#000",
    fontFamily: fonts.bold,
  },
  testActioncard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#c3c0c0",
    paddingTop: 12,
    marginTop: 12,
  },
  viewdetailsbutton: {
    borderColor: "#BDBABA",
    borderWidth: 1,
    backgroundColor: "#fff",
    width: 130,
    height: 35,
    justifyContent: "center",
    borderRadius: 20,
    alignItems: "center",
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
    marginTop: 5,
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
    borderColor: "#DBDBDB",
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  closeButton: {
    padding: 8,
    position: "absolute",
    right: 20,
    top: 5,
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
    minHeight: 56,
    gap: 10,
  },

  headerTitle: {
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 18,
    // marginLeft: 10,
    color: colors.primaryText,
  },

  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: colors.bg_rest,
  },

  contentlabtest: {
    flex: 1,
    //paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: colors.bg_rest,
  },

  Iocnbox: {
    width: "100%",
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  bannerimage: {
    width: "100%",
    backgroundSize: "cover",
    height: 180,
    borderRadius: 20,
  },

  bannerimage1: {
    width: "100%",
    backgroundSize: "cover",
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dcdcdc",
  },
  newbanner: {
    marginTop: 15,
    marginHorizontal: 20,
    backgroundColor: "#fff",
  },

  viewimage: {
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },

  title: {
    //...fontStyles.heading3,
    color: "#000",
    marginBottom: 4,
    alignItems: "flex-start",
    fontWeight: "700",
    paddingHorizontal: 20,
    fontSize: 18,
    marginTop: 13,
  },
  reports: {
    backgroundColor: "rgba(195, 94, 156, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 4,
  },
  reportTime: {
    fontSize: 13,
    color: "#000",
    fontFamily: fonts.medium,
  },

  reportsdetails: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  section: { marginTop: 10, marginBottom: 0 },

  section1: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 15,
  },
  section2: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 26,
    color: "#000",
  },
  sectionTitle1: {
    fontWeight: "700",
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 26,
    color: colors.primary,
  },
  testcontent: {
    marginBottom: 12,
    marginTop: 5,
    backgroundColor: "rgba(195, 94, 156, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginHorizontal: 0,
    borderRadius: 20,
  },
  testsinclude: {
    fontSize: 13,
    color: "#000",
    fontFamily: fonts.regular,
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
    gap: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.primaryText,
    marginBottom: 3,
    fontFamily: fonts.medium,
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
    fontFamily: fonts.regular,
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
    gap: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontFamily: fonts.regular,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  testsList1: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: "#C15E9C",
  },

  testsList2: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#303030",
  },
  timeSlotText: {
    fontSize: 11,
    color: "#333",
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#333",
    lineHeight: 20,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  originalPrice: {
    textDecorationLine: "line-through",
    marginRight: 8,
    color: "#887f8b",
  },

  finalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },

  bookButton: {
    width: 130,
    height: 40,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
