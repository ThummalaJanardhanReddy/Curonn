import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "../shared/context/UserContext";
import { Dimensions } from "react-native";
// Carousel slider for orders

import {
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OrderDetails from "../features/myorders/OrderDetails";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../assets";
import CommonHeader from "../shared/components/CommonHeader";
import commonStyles, { colors } from "../shared/styles/commonStyles";
import axiosClient from '../../src/api/axiosClient';
import ApiRoutes from '../../src/api/employee/employee';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../shared/utils/responsive";
import { fontStyles, fonts } from "../shared/styles/fonts";
 const SCREEN_WIDTH = Dimensions.get("window").width;

// FAQ data
const faqs = [
  {
    id: 1,

    question: "How do I book an appointment?",
    answer:
      // All hooks must be at the top, before any logic or returns
      'You can book an appointment through our app by selecting the "Consult a Doctor" service and choosing your preferred time slot.',
  },
  {
    id: 2,
    question: "Is my medical information secure?",
    answer:
      "Yes, we use industry-standard encryption and follow HIPAA guidelines to ensure your medical information is completely secure.",
  },
  {
    id: 3,
    question: "How long does medicine delivery take?",
    answer:
      "Medicine delivery typically takes 2-4 hours in urban areas and 24-48 hours in rural areas.",
  },
  {
    id: 4,
    question: "Can I cancel my appointment?",
    answer:
      "Yes, you can cancel your appointment up to 2 hours before the scheduled time without any cancellation fees.",
  },
];

export default function HomeScreen() {
  
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

 
// Fetch all orders for the user
const fetchAllOrders = async (patientId: number, statusId: number = 0) => {
  try {
    let query = `?patientId=${patientId}&statusId=${statusId}`;
    const response: any = await axiosClient.get(ApiRoutes.MyOrders.Allorders + query);
    if (response.isSuccess && Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};
  const { userData } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  // Memoized sorted orders: always sort by createdOn descending before slicing
  const latestOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime())
      .slice(0, 3);
  }, [orders]);

  const remainingOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime())
      .slice(3);
  }, [orders]);
  const [showOrderSlider, setShowOrderSlider] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
    const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false);
  // Always fetch latest orders on mount and when page is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchOrders = async () => {
        if (userData?.e_id) {
          const data = await fetchAllOrders(userData.e_id, 0);
          if (isActive) {
            // Always sort by createdOn descending
            const sorted = (Array.isArray(data) ? data.slice() : []).sort((a, b) => {
              const dateA = new Date(a.createdOn).getTime();
              const dateB = new Date(b.createdOn).getTime();
              return dateB - dateA;
            });
            setOrders(sorted);
            setShowOrderSlider(sorted.length > 0);
          }
        }
      };
      fetchOrders();
      return () => {
        isActive = false;
      };
    }, [userData?.e_id])
  );
  // Order slider card
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const handleCloseOrderCard = (index: number) => {
    const newOrders = orders.filter((_, i) => i !== index);
    setOrders(newOrders);
    if (activeOrderIndex >= newOrders.length) {
      setActiveOrderIndex(Math.max(0, newOrders.length - 1));
    }
    if (newOrders.length === 0) setShowOrderSlider(false);
  };

  // Format date as 'Feb 20th, 2026, 12:14 PM'
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const month = months[date.getMonth()];
    const day = getOrdinal(date.getDate());
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  };

  const renderOrderCard = ({ item, index }: { item: any; index: number }) => {
    const createdOn = item.createdOn ? formatDate(item.createdOn) : "";
    // Status display
    const status = item.statusName === 'Requested' ? 'In Progress' : (item.statusName || 'N/A');
    // Status color mapping
    const statusColors: { [key: string]: string } = {
      Requested: "#d0eaff",
      Completed: "#ccface",
      Cancelled: "#ffd8d5",
      Inprogress: "#f8d7a7",
      Ongoing: "#f7cdff",
      Pending: "#ffeeba",
      Rescheduled: "#bbecf3",
    };
    const statusTextColors: { [key: string]: string } = {
      Requested: "#006cc5",
      Completed: "#4CAF50",
      Cancelled: "#F44336",
      Inprogress: "#FF9800",
      Ongoing: "#9C27B0",
      Pending: "#9e7600",
      Rescheduled: "#00BCD4",
    };
    // Normalize status key for color mapping
    const statusKey = item.statusName === 'Requested' ? 'Requested' : (item.statusName || '');
    const statusBgColor = statusColors[statusKey] || "#666";
    const statusTxtColor = statusTextColors[statusKey] || "#fff";

    // Category and icon mapping
    let category = '';
    let iconSource = null;
    switch (item.orderType) {
      case "Single Test":
        category = "Lab Test";
        iconSource = images.labicon;
        break;
      case "Package":
        category = "Health Check Up";
        iconSource = images.labicon;
        break;
      case "Xray":
        category = "Xray";
        iconSource = images.labicon;
        break;
      case "Medicine":
        category = "Medicine";
        iconSource = images.medicalicon;
        break;
      case "Consultation":
        category = "Consultation";
        iconSource = images.consultationicon;
        break;
      default:
        category = item.orderType || '';
        iconSource = null;
    }

    return (
      <View style={{
        width: SCREEN_WIDTH * 0.95,
        marginHorizontal: 10,
        borderRadius: 18,
        paddingLeft: 15,
        paddingBottom: 0,
        paddingTop: 10,
        marginBottom: 0,
        position: 'relative',
        backgroundColor: 'transparent',
      }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
          onPress={() => handleCloseOrderCard(index)}
        >
          <Image source={images.icons.close} style={{ width: 22, height: 22, tintColor: '#694664' }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setSelectedOrderDetails(item);
          setOrderDetailsModalVisible(true);
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center',marginBottom: 3 }}>
            {/* {iconSource && (
              <Image source={iconSource} style={{ width: 18, height: 18, marginRight: 6 }} />
            )} */}
            <Text
              style={{ fontSize: 11, color: '#888', fontFamily: fonts.medium, marginRight: 6,lineHeight:15 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {category}
            </Text></View>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ fontSize: 14,lineHeight:19, color: '#C15E9D', fontFamily: fonts.bold }}>{item.title}</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 3, fontFamily: fonts.medium }}>{createdOn}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0, justifyContent: 'space-between' }}>
            {/* Status on the left */}
            <View style={{
              backgroundColor: statusBgColor,
              borderRadius: 15,
              paddingHorizontal: 8,
              paddingVertical: 0,
              marginLeft: 4,
              flexShrink: 0,
            }}>
              <Text style={{ fontSize: 10, color: statusTxtColor, fontFamily: fonts.regular }}>{status}</Text>
            </View>
            {/* Carousel Dots centered */}
            {index < 3 && (
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                {[...Array(Math.min(latestOrders.length, 3)).keys()].map(idx => (
                  <View
                    key={idx}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 2,
                      backgroundColor: idx === activeOrderIndex ? '#C15E9D' : '#ccc',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
    // State for OrderDetails modal

        
  };

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await axiosClient.get(ApiRoutes.ArticlesData.Allarticles);
        // API returns array of articles with titleName, thumbnailImag, descriptionName, etc.
        if (Array.isArray(res)) {
          setArticles(res);
        }
      } catch (e) {
        console.error('Failed to fetch articles', e);
      }
    }
    fetchArticles();
  }, []);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const bottomSlideAnim = useRef(new Animated.Value(400)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
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


  // Handle status bar when notification modal opens/closes
  useEffect(() => {
    console.log("Home Page data Started")
    // if (notificationVisible) {
    //   StatusBar.setBarStyle('dark-content', true);
    //   StatusBar.setBackgroundColor('#fff', true);
    // } else {
    //   StatusBar.setBarStyle('light-content', true);
    //   StatusBar.setBackgroundColor('transparent', true);
    // }
  }, [notificationVisible]);

  // Dummy services data (would come from API)
  const services = useMemo(
    () => [
      {
        id: 1,
        title: `Consult a \nDoctor`,
        image: images.home.doctor_card,
        route: "/my-doctor",
      },
      {
        id: 2,
        title: "Order \nMedicines",
        image: images.home.medicine_card,
        route: "/medicines",
      },
    ],
    []
  );

  // Dummy FAQs data
  const faqs = useMemo(
    () => [
      {
        id: 1,
        question: "How do I book an appointment?",
        answer:
          "You can book an appointment through our app by selecting the doctor and time slot.",
      },
      {
        id: 2,
        question: "What are your consultation fees?",
        answer:
          "Consultation fees vary by doctor. You can see the fees when booking.",
      },
      {
        id: 3,
        question: "Do you provide home visits?",
        answer:
          "Yes, we provide home visits for certain services. Check availability in your area.",
      },
    ],
    []
  );

  // Dummy notifications
  const notifications = useMemo(
    () => [
      {
        id: 1,
        title: "Appointment Reminder",
        message: "Your doctor appointment is scheduled for tomorrow at 2:00 PM",
        time: "2 hours ago",
        type: "appointment",
      },
      {
        id: 2,
        title: "Medicine Delivery",
        message: "Your medicine order has been delivered successfully",
        time: "1 day ago",
        type: "delivery",
      },
      {
        id: 3,
        title: "Health Tips",
        message: "New health tips available for your wellness journey",
        time: "2 days ago",
        type: "tips",
      },
      {
        id: 4,
        title: "Lab Results Ready",
        message: "Your recent lab test results are now available",
        time: "3 days ago",
        type: "results",
      },
    ],
    []
  );

  const showNotificationModal = useCallback(() => {
    setNotificationVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const hideNotificationModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotificationVisible(false);
    });
  }, [slideAnim]);

  const showBottomModal = useCallback(
    (type: "faq" | "feedback") => {
      if (type === "faq") setFaqVisible(true);
      else setFeedbackVisible(true);

      Animated.timing(bottomSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [bottomSlideAnim]
  );

  const hideBottomModal = useCallback(() => {
    Animated.timing(bottomSlideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFaqVisible(false);
      setFeedbackVisible(false);
    });
  }, [bottomSlideAnim]);

  const handleFeedbackSubmit = useCallback(() => {
    // Handle feedback submission
    console.log("Feedback submitted:", feedbackForm);
    hideBottomModal();
    setFeedbackForm({ name: "", email: "", message: "" });
  }, [feedbackForm, hideBottomModal]);

  const renderServiceCard = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.serviceCard}
        activeOpacity={1}
        onPress={() => router.push(item.route)}
      >
        <Text style={styles.serviceCardTitle}>{item.title}</Text>
        <View style={styles.serviceCardBottom}>
          <Image
            source={item.image}
            style={styles.serviceImage}
            accessibilityLabel={`${item.title} icon`}
          />
          {/* {typeof item.image === "string" ? (
            <Image
              source={item.image }
              style={styles.serviceImage}
              accessibilityLabel={`${item.title} icon`}
            />
          ) : (
            <item.image width={60} height={60} style={styles.serviceImage} />
          )} */}

          <View style={styles.arrowContainer}>
            {/* <IconButton
              icon="arrow-right"
              size={20}
              iconColor="#6200ee"
              style={styles.rotatedArrow}
              accessibilityLabel="Navigate to service"
            /> */}
            <images.home.arrow_card
              width={getResponsiveSpacing(40)}
              height={getResponsiveSpacing(40)}
            />
          </View>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const renderArticleCard = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.articleCard}
        activeOpacity={1}
        accessibilityLabel={`${item.titleName} article`}
        accessibilityRole="button"
        accessibilityHint={`Tap to read ${item.titleName}`}
        onPress={() => setSelectedArticle(item)}
      >
        <Image
          source={item.thumbnailImag ? { uri: item.thumbnailImag } : images.healthArticle}
          style={styles.articleImage}
          accessibilityLabel={`${item.titleName}`}
        />
        <View style={styles.articleContent}>
          <Text style={styles.articleTitle}>{item.titleName}</Text>
          <Text style={styles.articleExcerpt} numberOfLines={2}>{item.descriptionName}</Text>
          {/* <Text style={styles.articleReadTime}>{item.readTime || ''}</Text> */}
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const renderFAQ = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      </View>
    ),
    []
  );

  const renderNotification = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.notificationItem}>
        <View style={styles.notificationItemIconContainer}>
          <Image
            source={images.notification}
            style={styles.notificationItemIcon}
            resizeMode="contain"
          />
          {/* <images.notificationIcon
            width={32}
            height={32}
            // fill="#694664"
          /> */}
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
       <StatusBar
        style="light"
        animated
      />
      {/* <SafeAreaView style={styles.container}> */}

      {/* Background Image */}
      <Image
        source={images.panels.landingPage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Header */}
      <CommonHeader
        isHomePage={true}
        currentLocation="Getting location..."
        onNotificationPress={showNotificationModal}
        onLocationChange={(location) => {
          console.log("Location changed to:", location);
          // You can add logic here to update the location state
        }}
      />
     
     

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
       
        {/* Yoga Image Section */}
        <View style={styles.yogaImageSection}>
          {/* <Image source={images.transformLife} resizeMode="contain" /> */}
          <View style={{ alignItems: "center", paddingHorizontal: 30 }}>
            <Text
              style={styles.transhead}
            >
              Transform
            </Text>
            <Text
              style={styles.transinner}
            >
              Your Life
            </Text>
            <Text
              style={styles.curonhealth}
            >
              with Curonn.health
            </Text>
          </View>

          <Image
            source={images.yogaLady}
            style={styles.yogaImage}
            resizeMode="contain"
          />
          {/* <images.yogaLady style={styles.yogaImage}/> */}
          {/* <images.happyLife style={styles.yogaImage}/> */}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Our Services</Text> */}
          <View style={styles.servicesGrid}>
            {services.map((service: any) => (
              <View key={service.id} style={styles.serviceCardWrapper}>
                {renderServiceCard({ item: service })}
              </View>
            ))}
          </View>
        </View>

        {/* Lab Test Booking Section */}
        <View style={styles.section}>
          <View style={styles.featureCard}>
            <Image
              source={images.panels.labTest}
              style={styles.featureBackground}
              resizeMode="cover"
            />
            <images.home.book_labtest
              style={{ position: "absolute", right: 20, bottom: 0 }}
            // width={'60%'}
            // height={'60%'}
            />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle]}>Book your lab test</Text>
              <Text style={styles.featureSubtitle}>at your doorstep</Text>
              <Button
                mode="contained"
                style={[
                  styles.featureButton,
                  {
                    backgroundColor: "#5479F7",
                    height: 36,
                    justifyContent: "center",
                  },
                ]}
                labelStyle={{
                  color: "#fff",
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  lineHeight: 18, // Ensures text is vertically centered
                }}
                contentStyle={{
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => router.push("/lab-tests")}
              >
                Book Now
              </Button>
            </View>
          </View>
        </View>

        {/* Wellness Program Section */}
        <View style={styles.section}>
          <View style={styles.featureCard}>
            <Image
              source={images.panels.wellness}
              style={styles.featureBackground}
              resizeMode="cover"
            />
            <images.home.book_wellness
              style={{ position: "absolute", right: 20, bottom: 0 }}
            // width={'20%'}
            // height={'80%'}
            />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: "#fff" }]}>
                Wellness Program
              </Text>
              <Text style={[styles.featureSubtitle, { color: "#fff" }]}>
                at your doorstep
              </Text>
              <Button
                mode="contained"
                style={[
                  styles.featureButton,
                  {
                    backgroundColor: "#EFBC73",
                    height: 36,
                    justifyContent: "center",
                  },
                ]}
                labelStyle={{
                  color: "#000",
                  fontSize: 14,
                  fontFamily: fonts.medium,
                  lineHeight: 18, // Ensures text is vertically centered
                }}
                contentStyle={{
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              // onPress={() => router.push("/")}
              >
                Get Now
              </Button>
            </View>
          </View>
        </View>

        {/* Ambulance Booking Section */}
        <View style={styles.section}>
          <View style={styles.ambulanceCard}>
            <Image
              source={images.panels.ambulance}
              style={styles.ambulanceBackground}
              resizeMode="cover"
            />
            <View style={styles.ambulanceContent}>
              {/* <Image
                source={images.ambulance}
                style={styles.ambulanceImage}
                resizeMode="contain"
              /> */}
              <images.home.book_ambulance
              // style={{position: 'absolute', right: 20, bottom: 0}}
              // width={'20%'}
              // height={'80%'}
              />
              <View>
                <Text style={styles.ambulanceTitle}>Book Ambulance</Text>
                <Text style={styles.ambulanceSubtitle}>
                  get a call from the providers
                </Text>
                <Button
                  mode="contained"
                  style={[
                    styles.ambulanceButton,
                    { height: 36, justifyContent: "center" },
                  ]}
                  labelStyle={{
                    color: "#fff",
                    fontSize: 14,
                    fontFamily: fonts.medium,
                    lineHeight: 18, // Ensures text is vertically centered
                  }}
                  contentStyle={{
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                // onPress={() => router.push("/")}
                >
                  Book Now
                </Button>
              </View>
            </View>
          </View>
        </View>

        {/* Health Articles Section */}
        <View style={styles.section}>
          <View style={styles.divider}>
            <Text
              style={[
                styles.dividerText,
                { color: colors.white, fontWeight: "600" },
              ]}
            >
              Health Articles
            </Text>
          </View>
          <FlatList
            data={articles}
            renderItem={renderArticleCard}
            keyExtractor={(item) => item.id?.toString?.() || item._id || Math.random().toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.articlesContainer}
          />

        </View>

        {/* FAQ & Feedback Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: "#ffffff", fontWeight: "600" },
            ]}
          >
            You can also
          </Text>
          <View style={styles.actionButtons}>
            {/* <Button
              mode="outlined"
              style={[styles.actionButton, { backgroundColor: "white" }]}
              labelStyle={{
                color: "black",
                justifyContent: "flex-start",
                fontSize: 14,
                fontWeight: "700",
              }}
              onPress={() => showBottomModal("faq")}
            >
              FAQs
            </Button> */}
            <Button
              mode="outlined"
              style={[styles.actionButton, { backgroundColor: "white" }]}
              labelStyle={{
                color: "black",
                justifyContent: "flex-start",
                fontSize: 14,
                fontFamily: fonts.semiBold,
              }}
              onPress={() => showBottomModal("feedback")}
            >
              Send us Feedback
            </Button>
          </View>
        </View>

        {/* Final Quote Section */}
        <View style={styles.quoteSection}>
          <Image source={images.panels.happyLife} />
        </View>
      </ScrollView>

 {/* Order Slider Fixed at Bottom */}
      {showOrderSlider && orders.length > 0 && (
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingVertical: 5,
          paddingTop:0,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 100,
          backgroundColor: '#fff',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
        }}>
          <FlatList
                  data={latestOrders}
                  renderItem={({ item, index }) => renderOrderCard({ item, index })}
                  keyExtractor={(item, idx) => (item.orderNo ? item.orderNo : idx) + '-' + idx}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ alignItems: 'flex-end', paddingBottom: 10 }}
                   style={{ flexGrow: 0 }}
                  onMomentumScrollEnd={e => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH * 0.85 + SCREEN_WIDTH * 0.075 * 2));
                    setActiveOrderIndex(idx);
                  }}
                  initialScrollIndex={
                    latestOrders.length > 0 && activeOrderIndex < latestOrders.length
                      ? activeOrderIndex
                      : 0
                  }
                  getItemLayout={(_, index) => ({ length: SCREEN_WIDTH * 0.85 + SCREEN_WIDTH * 0.075 * 2, offset: (SCREEN_WIDTH * 0.85 + SCREEN_WIDTH * 0.075 * 2) * index, index })}
                />
        </View>
      )}
      
      {/* Full Article View Modal */}
      <Modal
        visible={!!selectedArticle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedArticle(null)}
      >

        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 0, justifyContent: 'flex-start' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={styles.articletitle} numberOfLines={2} ellipsizeMode="tail">
                {selectedArticle?.titleName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedArticle(null)} style={{ marginLeft: 16, padding: 4 }}>
                <Image source={images.icons.close} style={{ width: 24, height: 24, tintColor: '#333' }} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {selectedArticle && (
                <>
                  <Image
                    source={selectedArticle.thumbnailImag ? { uri: selectedArticle.thumbnailImag } : images.healthArticle}
                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 8 }}
                    resizeMode="cover"
                  />
                  {/* <Text style={{ color: '#888', marginBottom: 8 }}>{selectedArticle.readTime || ''}</Text> */}
                  <View style={styles.articalcontentdata}>
                  <Text style={styles.descriptiondata}>{selectedArticle.descriptionName}</Text>
                  </View>
                  {/* If you have more fields, render them here */}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
      {/* FAQ Modal - Slides from bottom to top */}
      <Modal
        visible={faqVisible}
        animationType="none"
        transparent={true}
        onRequestClose={hideBottomModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={hideBottomModal}
          />
          <Animated.View
            style={[
              styles.bottomModalContent,
              {
                transform: [{ translateY: bottomSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Frequently Asked Questions
              </Text>
              <TouchableOpacity
                onPress={hideBottomModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={faqs}
              renderItem={renderFAQ}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.faqList}
              accessibilityRole="list"
              accessibilityLabel="FAQ list"
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Feedback Modal - Slides from bottom to top */}
      <Modal
        visible={feedbackVisible}
        animationType="none"
        transparent={true}
        onRequestClose={hideBottomModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={hideBottomModal}
          />
          <Animated.View
            style={[
              styles.bottomModalContent,
              {
                transform: [{ translateY: bottomSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity
                onPress={hideBottomModal}
                style={styles.closeButton}
              >
                <Image source={images.icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.feedbackForm}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={feedbackForm.name}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Your Email"
                value={feedbackForm.email}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, email: text })
                }
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Your Message"
                value={feedbackForm.message}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, message: text })
                }
                multiline
                numberOfLines={4}
              />
              <Button
                mode="contained"
                onPress={handleFeedbackSubmit}
                style={styles.submitButton}
              >
                Send Feedback
              </Button>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={notificationVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={hideNotificationModal}
      >
        <SafeAreaView style={styles.notificationModalOverlay}>
          <TouchableOpacity
            style={styles.notificationModalBackdrop}
            onPress={hideNotificationModal}
          />
          <Animated.View
            style={[
              styles.notificationModalContent,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={hideNotificationModal}
                style={styles.notificationCloseButton}
              >
                <Image
                  source={images.icons.close}
                  style={styles.notificationCloseIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationModalBody}>
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationList}
                accessibilityRole="list"
                accessibilityLabel="Notification list"
              />
            </View>
          </Animated.View>
        </SafeAreaView>
      </Modal>
      {/* </SafeAreaView> */}

          <OrderDetails
        visible={orderDetailsModalVisible}
        order={selectedOrderDetails}
        statusName={selectedOrderDetails?.statusName || ''}
        onClose={() => setOrderDetailsModalVisible(false)}
        refreshOrders={async () => {
          if (userData?.e_id) {
            const ordersData = await fetchAllOrders(userData.e_id, 0);
            setOrders(ordersData);
          }
        } } />
    
  

     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    // flex: 1,
    // paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "#7E6781",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  articletitle: {
    fontSize: 20,
    color: "#000",
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  articalcontentdata: {
    paddingBottom: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  descriptiondata: {
    fontSize: 14,
    color: "#333",
    fontFamily: fonts.regular,
  },
  scrollView: {
    flex: 1,
    // zIndex: 1,
  },
  yogaImageSection: {
    alignItems: "center",
    paddingVertical: 20,
    // backgroundColor: '#f5f5f5',
    
  },
  transhead: {
    fontSize: 50,
    fontWeight: 600,
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: 50,
  },
  transinner: {
    fontSize: 50, fontWeight: 600, color: colors.white,
    fontFamily: fonts.bold,
    lineHeight:70
    
  },
  curonhealth: {
    fontSize: 16, fontWeight: 400, color: colors.white,
    fontFamily: fonts.regular,
  },
  yogaImage: {
    width: "100%",
  },
  section: {
    width: "100%",
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    // backgroundColor: 'red',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16),
    color: "#333",
    marginBottom: getResponsiveSpacing(10),
    fontFamily: fonts.semiBold,
    marginTop: getResponsiveSpacing(10),
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    
  },
  serviceCardWrapper: {
    // width: '48%',
    // marginBottom: 8,
    gap: getResponsiveSpacing(15),
  },
  serviceCard: {
    height: getResponsiveSpacing(160),
    width: getResponsiveSpacing(170),
    backgroundColor: "#fff",
    borderRadius: getResponsiveSpacing(24),
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    paddingTop: getResponsiveSpacing(12),
    borderWidth: 1,
    borderColor: "#eee",
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
    justifyContent: "space-between",
  },
  serviceCardTitle: {
    fontSize: getResponsiveFontSize(16),
    color: "#4B334E",
    flex: 1,
    fontFamily: fonts.bold,
    lineHeight: getResponsiveFontSize(20),
  },
  serviceCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  serviceImage: {
    ...getResponsiveImageSize(60, 60),
    borderRadius: getResponsiveSpacing(8),
    resizeMode: "contain",
  },
  arrowContainer: {
    width: getResponsiveSpacing(40),
    height: getResponsiveSpacing(40),
    borderRadius: getResponsiveSpacing(20),
    // backgroundColor: colors.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  rotatedArrow: {
    transform: [{ rotate: "325deg" }],
  },
  featureCard: {
    borderRadius: 23,
    overflow: "hidden",
    position: "relative",
    height: 172,
  },
  featureBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
  },
  featureContent: {
    position: "relative",
    zIndex: 1,
    padding: 20,
    // paddingTop: 0,
    justifyContent: "flex-start",
    height: "100%",
  },
  featureTitle: {
    fontSize: 20,
    color: "#4B334E",
    lineHeight: 24,
    marginBottom: 4,
    fontFamily: fonts.bold,
  },
  featureSubtitle: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 12,
     fontFamily: fonts.regular,
  },
  featureButton: {
    alignSelf: "flex-start",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ambulanceCard: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    height: 140,
    // height: 172,
    backgroundColor: "#F6EFFF",
  },
  ambulanceBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
  },
  ambulanceContent: {
    position: "relative",
    zIndex: 1,
    padding: 20,
    paddingLeft: 30,
    justifyContent: "flex-start",
    gap: 30,
    height: "100%",
    flexDirection: "row",
  },
  ambulanceImage: {
    width: 60,
    height: 60,
    // borderRadius: 8,
    resizeMode: "contain",
  },
  ambulanceTitle: {
     fontSize: 20,
    color: "#000000",
    lineHeight: 24,
    marginBottom: 4,
    fontFamily: fonts.bold,
  },
  ambulanceSubtitle: {
    fontSize: 12,
    color: "black",
    marginBottom: 12,
    fontFamily: fonts.regular
  },
  ambulanceButton: {
    alignSelf: "flex-start",
    backgroundColor: "#694664",
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dividerText: {
    fontSize: 16,
    color: "white",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    fontFamily: fonts.semiBold,
  },
  quoteSection: {
    alignItems: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 60,
    // backgroundColor: '#f5f5f5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  bottomModalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#333",
  },
  faqList: {
    padding: 20,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  feedbackForm: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  messageInput: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 8,
  },
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notificationModalBackdrop: {
    flex: 1,
  },
  notificationModalContent: {
    // position: "absolute",
    // top: 0,
    // right: 0,
    width: SCREEN_WIDTH,
    height: "100%",
    backgroundColor: "#ffffffff",
  },
  notificationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  notificationCloseButton: {
    padding: 4,
  },
  notificationCloseIcon: {
    width: 24,
    height: 24,
    tintColor: "#000",
  },
  notificationModalBody: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  emptyNotificationText: {
    fontSize: 16,
    color: "#666",
  },
  notificationList: {
    paddingVertical: 10,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#70707080",
    alignItems: "flex-start",
  },
  notificationItemIconContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  notificationItemIcon: {
    width: 24,
    height: 24,
    // tintColor: "#ee2f2177",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  articlesContainer: {
    paddingRight: 10,
  },
  articleCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 16,
    // marginHorizontal: 10,
    marginRight: 15,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  articleContent: {
    padding: 16,
    paddingTop: 12
  },
  articleTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 5,
    fontFamily: fonts.semiBold,
    lineHeight: 22,
  },
  articleExcerpt: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  articleReadTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionButtons: {
    // flexDirection: 'row',
    // justifyContent: 'space-around',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    // marginHorizontal: 8,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "flex-start",
  },
});
