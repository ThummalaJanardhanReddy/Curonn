
import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import React, { useCallback, useState, useEffect } from "react";
import { router } from "expo-router";
import { getResponsiveFontSize, getResponsiveSpacing } from '../../shared/utils/responsive';
import { fonts, fontStyles } from '@/app/shared/styles/fonts';
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { images } from "../../../assets";
import PrimaryButton from "../../shared/components/PrimaryButton";
import BookingScreen from "../booking/booking";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import SeacrchIcon from '../../../assets/AppIcons/Curonn_icons/search.svg';
import LabdefaultIcon from '../../../assets/AppIcons/Curonn_icons/lab_detault_ic.svg';
// import Svg, { Defs, Rect, Stop, RadialGradient } from 'react-native-svg';

type ServiceType = "ambulance";


interface TestItem {
  id: string;
  name: string;
  price: string;
  ambulanceMasterId?: number;
  serviceId?: string;
  reportTime?: string;
  // Only include fields that exist in ambulance API response
}

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  responseCode?: string;
  data: T;
  error?: any;
}


interface HealthCheckItemApi {
  labPackageMasterId: number;
  testName: string;
  price: number;
  testsList: string;
}

interface AmbulaceResponse {
  items: HealthCheckItemApi[];
  totalCount: number;
}




export default function AmbulanceScreen() {

  const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [ambulanceItems, setAmbulanceItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);


  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          RNStatusBar.setBackgroundColor("#ffffff", true);
        }, 400);
        return () => clearTimeout(timeout);
      }
    }, [])
  );



  // Fetch ambulance services with optional search
  const fetchAllAmbulanceServices = async (pageNo = 1, pageSize = 10, search = ""): Promise<{ items: TestItem[]; hasMore: boolean }> => {
    try {
      setLoading(true);
      const response: any = await axiosClient.get<ApiResponse<AmbulaceResponse>>(
        ApiRoutes.Ambulance.getAll,
        {
          params: {
            PageNo: pageNo,
            PageSize: pageSize,
            search: search.trim() ? search : undefined,
          },
        }
      );
      console.log("Ambulance API response:", response);
      if (!response.isSuccess) {
        console.warn("Ambulance API failed:", response.message);
        return { items: [], hasMore: false };
      }
      const items = response.data.items ?? [];
      console.log("Fetched ambulance items:", items);
      const mappedItems: TestItem[] = items.map((item: any) => ({
        id: String(item.ambulanceMasterId),
        ambulanceMasterId: item.ambulanceMasterId,
        name: item.packageName,
        price: String(item.price),
        serviceId: item.serviceId,
      }));
      console
      return {
        items: mappedItems,
        hasMore: items.length === pageSize,
      };
    } catch (error) {
      console.error("fetch ambulance error:", error);
      return { items: [], hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  // Initial and paginated fetch
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAllAmbulanceServices(1, 10, searchQuery).then(({ items, hasMore }) => {
      if (active) {
        setAmbulanceItems(items);
        setHasMore(hasMore);
        setPageNo(1);
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line
  }, [searchQuery]);

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    const nextPage = pageNo + 1;
    setLoading(true);
    const { items, hasMore: more } = await fetchAllAmbulanceServices(nextPage, 10, searchQuery);
    setAmbulanceItems(prev => [...prev, ...items]);
    setHasMore(more);
    setPageNo(nextPage);
    setLoading(false);
  };


  const handleBookTest = (id: string) => {
    // Directly find the item from ambulanceItems (no getDisplayedData)
    const ambulanceItem = ambulanceItems.find(item => item.id === id);
    console.log("Selected ambulance item for booking:", ambulanceItem);
    if (ambulanceItem) {
      setSelectedTest(ambulanceItem);
      setBookingVisible(true);
    }
  };

  // Render function for FlatList
  const renderAmbulanceItem = ({ item }: { item: TestItem }) => (
    <LinearGradient
      colors={['#fff', '#D5CDDA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.testCard}
    >
      <View style={styles.cardContainer}>
        <View style={styles.testCard1}>
          <View style={styles.testInfo}>
            <View style={{ width: '70%' }}>
              <Text
                style={styles.testName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
            </View>
            <View style={{ width: '30%', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={styles.priceRow}>
                <Text style={styles.finalPrice}>₹{item.price}</Text>
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.testActioncard}>
          <TouchableOpacity
            style={styles.viewdetailsbutton}
            onPress={() =>
              router.push({
                pathname: "/viewdetails",
                params: {
                  id: item.id,
                  type: 'ambulance',
                },
              })
            }
          > <Text style={styles.viewdetailstext}>View Details</Text>
          </TouchableOpacity>


          <PrimaryButton
            title="Book Now"
            onPress={() => handleBookTest(item.id)}
            style={styles.bookButton}
          />
        </View>
      </View>
    </LinearGradient>
  );


  return (<>
    <StatusBar
      barStyle="dark-content"
      translucent={false}
      backgroundColor="#ffffff"
    />
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.defaultHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#694664" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ambulance Service</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.boxcolor}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
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


          <View style={styles.containercontent}>
            <FlatList
              data={ambulanceItems}
              renderItem={renderAmbulanceItem}
              keyExtractor={(item, index) => `${item.id}_${index}`}
             contentContainerStyle={{ paddingBottom: 50 }}
              onEndReached={() => {
                if (!onEndReachedCalledDuringMomentum) {
                  handleLoadMore();
                  setOnEndReachedCalledDuringMomentum(true);
                }
              }}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* Booking Modal */}
        {selectedTest && (
          <BookingScreen
            visible={bookingVisible}
            onClose={() => {
              setBookingVisible(false);
              setSelectedTest(null);
            }}
            serviceName={selectedTest.name}
            servicePrice={Number(selectedTest.price)}
            masterId={selectedTest.ambulanceMasterId}
            type={"ambulance" as ServiceType} isAtHome={true}
            reportTime={"10-12 hours"} />
        )}
      </View>
    </SafeAreaView>
  </>);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingBottom: 0,
    flex: 1,
  },
  viewdetailsbutton: {
    borderColor: "#BDBABA",
    borderWidth: 1,
    backgroundColor: '#fff',
    width: 130,
    height: 30,
    justifyContent: 'center',
    borderRadius: 20,
    alignItems: 'center',
  },
  viewdetailstext: {
    color: "#000000",
    fontSize: 11,
    fontFamily: fonts.semiBold,
    paddingTop: 2,
  },
  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: getResponsiveSpacing(15),
    backgroundColor: "#ffffff",
    // borderBottomWidth: 1,
    // borderBottomColor: '#E0E0E0',
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
  // defaultHeader: {
  //   paddingHorizontal: getResponsiveSpacing(20),
  // },
  containercontent: {
    backgroundColor: colors.bg_primary, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingHorizontal: 20, // ✅ works
    paddingTop: 0,
    paddingVertical: 7,
    //flex: 1,
  },
  content: {
    flex: 1,
    // ...commonStyles.container_layout,
    paddingTop: 10,
    // backgroundColor: colors.bg_primary,
  },
  boxcolor: {
    backgroundColor: colors.bg_primary,
    flex: 1
  },
  searchContainer: {
    marginBottom: 10,
    paddingHorizontal: 20,
    marginTop: 0,
    backgroundColor: colors.bg_primary,
  },
  cardContainer: {
    width: '100%',
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
  },
  categoriesList: {
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(105, 70, 100, 0.33)",
    // borderWidth: 1,
    // borderColor: '#694664',
  },
  categoryButtonSelected: {
    backgroundColor: "#694664",
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#251729",
    fontFamily: fonts.regular,
    lineHeight: 20,

  },
  categoryButtonTextSelected: {
    color: "#fff",
    fontFamily: fonts.semiBold,

  },
  // Removed subTest* styles as they are not needed for ambulance services
  screen: {
    flex: 1, // full screen height
  },
  testItemsContainer: {
    marginBottom: 20,
    // flex: 1,

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
    flexDirection: "row",
  },
  testName: {
    fontSize: 15,
    color: "#000",
    marginBottom: 3,
    fontFamily: fonts.bold,

  },
  // testPrice: {
  //   fontSize: 11,
  //   color: "#4B334E",
  //   fontWeight: "500",
  //   marginBottom: 4,
  // },
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
  testActioncard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: '#c3c0c0',
    paddingTop: 12,
    marginTop: 12,
  },
  bookButton: {
    marginBottom: 4,
    width: 130,
    height: 30,
  },
  atHomeText: {
    fontSize: 10,
    color: "#4B334E",
    fontWeight: "500",
    fontFamily: fonts.regular,
  },
  viewMoreContainer: {
    alignItems: "flex-start",
    marginBottom: 30,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#C35E9C",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  sampleCollectionContainer: {
    marginBottom: 0,
    justifyContent: "flex-start",
    // alignItems: 'center',
  },
  sampleCollectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B334E",
    marginBottom: 16,
    textAlign: "justify",
    fontFamily: fonts.semiBold,
  },
  sampleCollectionImages: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sampleImageContainer: {
    alignItems: "flex-start",
  },
  sampleImage: {
    width: 92,
    height: 87,
    // tintColor: '#694664',
  },
  backgroundImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 125,
    zIndex: -1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  priceRow: {
    fontSize: 11,
    color: "#4B334E",
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  originalPrice: {
    fontSize: 12,
    color: '#887f8b',          // light gray
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    fontFamily: fonts.regular,
  },
  finalPrice: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.bold,
  },
  finalPrice1: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.bold,
  },
  actionButton: {
    borderColor: "#BDBABA",
    borderWidth: 1,
    color: "#694664",
    width: 130,
    marginBottom: 0,
    paddingBottom: 0,
  },
  actionButtonContent: {
    justifyContent: 'center',
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },
});
