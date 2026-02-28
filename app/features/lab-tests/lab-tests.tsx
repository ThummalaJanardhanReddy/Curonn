import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Modal, TouchableWithoutFeedback } from "react-native";
import { AntDesign } from '@expo/vector-icons';
 
import { Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useState, useEffect } from "react";
import { router } from "expo-router";
import { getResponsiveFontSize, getResponsiveSpacing } from '../../shared/utils/responsive';
import { fonts } from '@/app/shared/styles/fonts';
import { useFocusEffect } from "@react-navigation/native";
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
import CommonHeader from "../../shared/components/CommonHeader";
import PrimaryButton from "../../shared/components/PrimaryButton";
import BookingScreen from "../booking/booking";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import SeacrchIcon from '../../../assets/AppIcons/Curonn_icons/search.svg';
import LabdefaultIcon from '../../../assets/AppIcons/Curonn_icons/lab_detault_ic.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";

interface TestCategory {
  id: string;
  name: string;
  selected: boolean;
}

interface SubTestType {
  groupName: string;
  id: string;
  name: string;
  image: any;
}

interface TestItem {
  selectedDiagCenter?: any;
  id: string;
  name: string;
  price: string;
  curonnPrice?: string;
  testCount?: number;
  reportTime: string;
  testName?: string;
  isAtHome: boolean;
  isSuccess?: boolean;
  testsList?: string;
  sourceType?: string;
  labTestMasterId?: number;
  labPackageMasterId?: number;
  xrayMasterId?: number;
  selectedDate?: Date;
  selectedTimeSlot?: string;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  responseCode?: string;
  data: T;
  error?: any;
}

interface LabTestItem {
  labTestMasterId: number;
  testId: string;
  testName: string;
  price: number;
  curonnPrice?: number;
  groupName: string;
  groupImage: string;
}

interface LabTestsResponse {
  items: LabTestItem[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
}

interface HealthCheckItemApi {
  labPackageMasterId: number;
  testName: string;
  price: number;
  testsList: string;
}

interface HealthChecksResponse {
  items: HealthCheckItemApi[];
  totalCount: number;
}

interface ScanItemApi {
  xrayMasterId: number;
  testName: string;
  price: number;
  selectedDiagCenterId?: number;
}

interface ScansResponse {
  items: ScanItemApi[];
  totalCount: number;
}

type ServiceType = "lab-test" | "health-checks" | "scans";

export default function LabTestsScreen() {
  const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("lab-test");
  const [selectedSubTest, setSelectedSubTest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("New York, NY");
  const [bookingVisible, setBookingVisible] = useState(false);
  const [diagsticVisible, setdiagsticVisible] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [diagCenters, setDiagCenters] = useState<any[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
   const [selectedDiagCenterId, setSelectedDiagCenterId] = useState<number | null>(null);
  // Lab Test Groups
  const [subTestTypes, setSubTestTypes] = useState<SubTestType[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Lab Test Items
  const [testItems, setTestItems] = useState<TestItem[]>([]);
  const [testPageNo, setTestPageNo] = useState(1);
  const [loadingTests, setLoadingTests] = useState(false);
  const [hasMoreTests, setHasMoreTests] = useState(true);

  // Health Checks
  const [healthCheckItems, setHealthCheckItems] = useState<TestItem[]>([]);
  const [healthCheckPageNo, setHealthCheckPageNo] = useState(1);
  const [loadingHealthChecks, setLoadingHealthChecks] = useState(false);
  const [hasMoreHealthChecks, setHasMoreHealthChecks] = useState(true);

  // Scans
  const [scanItems, setScanItems] = useState<TestItem[]>([]);
  const [scanPageNo, setScanPageNo] = useState(1);
  const [loadingScans, setLoadingScans] = useState(false);
  const [hasMoreScans, setHasMoreScans] = useState(true);
  const [imageError, setImageError] = React.useState(false);

  const [searchResults, setSearchResults] = useState<TestItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const [errors, setErrors] = useState("");
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          // Use React Native StatusBar API to set background color on Android
          RNStatusBar.setBackgroundColor("#ffffff", true);
        }, 400); // Adjust timeout as needed
        return () => clearTimeout(timeout);
      }
      // Always reset diagsticVisible when leaving LabTestsScreen
      
    }, [])
  );

  // Test categories
  const testCategories: TestCategory[] = [
    {
      id: "lab-test",
      name: "Lab Test",
      selected: selectedCategory === "lab-test",
    },
    {
      id: "health-checks",
      name: "Health Checks",
      selected: selectedCategory === "health-checks",
    },
    { id: "scans", name: "Scans", selected: selectedCategory === "scans" },
  ];

  // Lab-test time slots
  const labTimeSlots = [
    "07:00 AM - 08:00 AM",
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
  ];

  const fetchGlobalSearch = async (search: string) => {
    try {
      setIsSearching(true);

      const response: any = await axiosClient.get<ApiResponse<any[]>>(
        ApiRoutes.LabTests.globalSearch,
        { params: { search } }
      );
      console.log("Global Search Response:", response);
      if (!response?.isSuccess) {
        console.warn("Search API failed:", response?.message);
        return;
      }

      const results = response.data ?? [];
      console.log("Search Results:", results);

      const mappedResults: TestItem[] = results.map((item: any) => {
        const base = {
          id: String(item.masterId),
          name: item.testName,
          price: String(item.price),
          curonnPrice: item.curonnPrice ?? undefined,
          testsList: item.testList,
          testCount: item.testList
            ? item.testList.split(",").filter(Boolean).length
            : undefined,
          reportTime:
            item.sourceType === "Single Test"
              ? "10 to 12 hours"
              : "48 to 72 hours",
          isAtHome: item.sourceType === "Single Test",
          sourceType: item.sourceType,
        };
        if (item.sourceType === "Single Test") {
          return { ...base, labTestMasterId: item.masterId };
        } else if (item.sourceType === "Package") {
          return { ...base, labPackageMasterId: item.masterId };
        } else if (item.sourceType === "Xray") {
          return { ...base, xrayMasterId: item.masterId };
        } else {
          return base;
        }
      });

      setSearchResults(mappedResults);
      if (mappedResults.length > 0) {
        const firstType = mappedResults[0].sourceType;

        if (firstType === "Package") {
          setSelectedCategory("health-checks");
        } else if (firstType === "Xray") {
          setSelectedCategory("scans");
        } else {
          setSelectedCategory("lab-test");
        }
      }

    } catch (error) {
      console.error("Global search error:", error);
    } finally {
      setIsSearching(false);
    }
  };


  useEffect(() => {
     
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetchGlobalSearch(searchQuery);
      }

      if (searchQuery.trim().length === 0) {
        // Reset to original data
        setSelectedCategory("lab-test");
        setTestPageNo(1);
        setHealthCheckPageNo(1);
        setScanPageNo(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const getDisplayedData = () => {
    if (searchQuery.trim().length > 0) {
      return searchResults.filter((item) => {
        if (selectedCategory === "lab-test")
          return item.sourceType === "Single Test";

        if (selectedCategory === "health-checks")
          return item.sourceType === "Package";

        if (selectedCategory === "scans")
          return item.sourceType === "Xray";

        return false;
      });
    }
    // Normal flow
    return selectedCategory === "lab-test"
      ? testItems
      : selectedCategory === "health-checks"
        ? healthCheckItems
        : scanItems;
  };
  // Fetch Lab Test Groups
  useEffect(() => {
    if (selectedCategory !== "lab-test") return;
    const loadLabTestGroups = async () => {
      setLoadingGroups(true);
      try {
        // axiosClient already returns the API payload
        const response: any = await axiosClient.get(ApiRoutes.LabTests.getGroups);

        console.log("FULL RESPONSE:", response);
        console.log("isSuccess:", response?.isSuccess);
        console.log("data:", response?.data);

        if (response?.isSuccess === true && Array.isArray(response.data)) {
          setSubTestTypes(response.data);
          setSelectedSubTest(response.data[0]?.groupName ?? null);
        }
      } catch (error) {
        console.error("Error fetching lab test groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadLabTestGroups();
  }, [selectedCategory]);



  const fetchLabTestsByGroup = async (
    groupName: string,
    pageNo = 1,
    pageSize = 10,
    createdBy = 1
  ): Promise<{ tests: TestItem[]; hasMore: boolean }> => {
    try {
      const response: any = await axiosClient.get<ApiResponse<LabTestsResponse>>(
        ApiRoutes.LabTests.getAll,
        {
          params: {
            PageNo: pageNo,
            PageSize: pageSize,
            CreatedBy: createdBy,
            GroupName: groupName,
          },
        }
      );

      if (!response.isSuccess) {
        console.warn("API returned failure:", response.message);
        return { tests: [], hasMore: false };
      }

      const items = response.data.items ?? [];

      const tests: TestItem[] = items.map((item: any) => ({
        //id: String((pageNo - 1) * pageSize + idx + 1),
        id: String(item.labTestMasterId),
        labTestMasterId: item.labTestMasterId,
        name: item.testName,
        price: item.price,               // original price
        curonnPrice: item.curonnPrice,   // discounted price
        reportTime: "10 to 12 hours",
        isAtHome: true,
      }));

      return {
        tests,
        hasMore: items.length === pageSize,
      };
    } catch (error) {
      console.error("fetchLabTestsByGroup failed:", error);
      return { tests: [], hasMore: false };
    }
  };




  // Lazy load more lab tests
  useEffect(() => {
    if (selectedCategory !== "lab-test" || !selectedSubTest) return;

    const loadLabTests = async () => {
      setLoadingTests(true);
      setTestPageNo(1);

      const { tests, hasMore } = await fetchLabTestsByGroup(
        selectedSubTest,
        1,
        10,
        1
      );

      setTestItems(tests);
      setHasMoreTests(hasMore);
      setLoadingTests(false);
    };

    loadLabTests();
  }, [selectedCategory, selectedSubTest]);





  // Fetch Health Checks

  const fetchHealthChecks = async (
    pageNo = 1,
    pageSize = 10
  ): Promise<{ items: TestItem[]; hasMore: boolean }> => {
    try {
      const response: any = await axiosClient.get<ApiResponse<HealthChecksResponse>>(
        ApiRoutes.LabPackages.getAll,
        {
          params: {
            PageNo: pageNo,
            PageSize: pageSize,
          },
        }
      );

      // axiosClient already unwraps response.data
      if (!response.isSuccess) {
        console.warn("Health checks API failed:", response.message);
        return { items: [], hasMore: false };
      }
      const getTestCount = (testsList?: string): number => {
        if (!testsList) return 0;

        return testsList
          .split(',')
          .map(test => test.trim())
          .filter(Boolean).length;
      };


      const items = response.data.items ?? [];

      const mappedItems: TestItem[] = items.map((item: any) => ({
        id: String(item.labPackageMasterId),
        labPackageMasterId: item.labPackageMasterId,
        name: item.testName,
        price: String(item.price),
        curonnPrice: item.curonnPrice,   // discounted price
        testsList: item.testsList,
        testCount: getTestCount(item.testsList),
        reportTime: "48 to 72 hours",
      }));

      return {
        items: mappedItems,
        hasMore: items.length === pageSize,
      };
    } catch (error) {
      console.error("fetchHealthChecks error:", error);
      return { items: [], hasMore: false };
    }
  };

  useEffect(() => {
    if (selectedCategory !== "health-checks") return;

    const loadHealthChecks = async () => {
      setLoadingHealthChecks(true);

      const { items, hasMore } = await fetchHealthChecks(
        healthCheckPageNo,
        10
      );

      setHealthCheckItems(prev =>
        healthCheckPageNo === 1 ? items : [...prev, ...items]
      );

      setHasMoreHealthChecks(hasMore);
      setLoadingHealthChecks(false);
    };

    loadHealthChecks();
  }, [selectedCategory, healthCheckPageNo]);



  const handleLoadMoreTests = async () => {
    if (loadingTests || !hasMoreTests || !selectedSubTest) return;

    const nextPage = testPageNo + 1;
    setLoadingTests(true);
    const { tests, hasMore } = await fetchLabTestsByGroup(
      selectedSubTest,
      nextPage,
      10,
      1
    );

    setTestItems(prev => [...prev, ...tests]);
    setHasMoreTests(hasMore);
    setTestPageNo(nextPage);
    setLoadingTests(false);
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
  // Fetch Scans
  const fetchScans = async (
    pageNo = 1,
    pageSize = 10
  ): Promise<{ items: TestItem[]; hasMore: boolean }> => {
    try {
      const response: any = await axiosClient.get<ApiResponse<ScansResponse>>(
        ApiRoutes.Xray.getAll,
        {
          params: {
            PageNo: pageNo,
            PageSize: pageSize,
            CreatedBy: 1,
          },
        }
      );

      if (!response.isSuccess) {
        console.warn("Scans API failed:", response.message);
        return { items: [], hasMore: false };
      }

      const items = response.data.items ?? [];

      const mappedItems: TestItem[] = items.map((item: any) => ({
        id: String(item.xrayMasterId),
        xrayMasterId: item.xrayMasterId,
        name: item.testName,
        price: String(item.price),
        curonnPrice: item.curonnprice,   // discounted price
        reportTime: "48 to 72 hours",
        isAtHome: false,
      }));

      return {
        items: mappedItems,
        hasMore: items.length === pageSize,
      };
    } catch (error) {
      console.error("fetchScans error:", error);
      return { items: [], hasMore: false };
    }
  };

  useEffect(() => {
    if (selectedCategory !== "scans") return;
    const loadScans = async () => {
      setLoadingScans(true);
      const { items, hasMore } = await fetchScans(
        scanPageNo,
        10
      );

      setScanItems(prev =>
        scanPageNo === 1 ? items : [...prev, ...items]
      );

      setHasMoreScans(hasMore);
      setLoadingScans(false);
    };

    loadScans();
  }, [selectedCategory, scanPageNo]);

  // Handlers
  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === selectedCategory) return;
    setSelectedCategory(categoryId);
    setSelectedSubTest(null);

    setTestItems([]);
    setHealthCheckItems([]);
    setScanItems([]);

    setTestPageNo(1);
    setHealthCheckPageNo(1);
    setScanPageNo(1);
  };

  const handleSubTestSelect = (groupName: string) => {
    setSelectedSubTest(groupName); // groupName is used for API request
    setTestPageNo(1);
    setTestItems([]);
  };

  

  const handleBookTest = (id: string) => {
    const testItem = getDisplayedData().find(
      (item) => item.id === id
    );
    console.log("Selected test for booking:", testItem);
    if (testItem) {
      setSelectedTest(testItem);
      setBookingVisible(true);
    }
  };

   const handleBookscanTest = (testId: string, centerId: string) => {
    if (!selectedTest) {
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
      setSelectedTest({
        ...testItem,
        selectedDate,
        selectedTimeSlot,
        selectedDiagCenter: center,
      });
      setBookingVisible(true);
    }
  };

  const handleBookScan = (id: string) => {
    const testItem = getDisplayedData().find((item) => item.id === id);
    console.log("Selected test for booking:", testItem);
    if (testItem) {
      setSelectedTest(testItem);
      setdiagsticVisible(true);
      // Fetch diagnostic centers after opening modal
      fetchDiagCenters();
    }
  };

  const fetchDiagCenters = async () => {
    setDiagLoading(true);
    try {
      const latLngStr = await AsyncStorage.getItem('userLocationLatLng');
      let latitude = 0;
      let longitude = 0;
      if (latLngStr) {
        const { latitude: lat, longitude: lng } = JSON.parse(latLngStr);
        latitude = Number(lat);
        longitude = Number(lng);
      }
      // Call DiagCenter API
      const payload = {
         latitude,
        longitude,
        radiusKm: 10,
      }
      const response: any = await axiosClient.post(
        ApiRoutes.DiagCenter.Diagsticcenter,
        payload
      );
      console.log('DiagCenter Responce:', response);
      // Handle both top-level and nested array in response
      // The API returns the array directly as the response body
      if (Array.isArray(response)) {
        setDiagCenters(response);
        console.log('DiagCenter API response (array at root):', response);
      } else {
        setDiagCenters([]);
        console.log('DiagCenter API response: not an array', response);
      }
      console.log('DiagCenter API response:', response);
    } catch (error) {
      console.error('Error fetching diagnostic centers:', error);
      setDiagCenters([]);
    } finally {
      setDiagLoading(false);
    }
  };

  // const handleViewMoreTests = () => {
  //   // Navigate to full test list
  //   console.log("View more tests");
  // };

  const renderTestCategory = ({ item }: { item: TestCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        item.selected && styles.categoryButtonSelected,
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          item.selected && styles.categoryButtonTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubTestType = ({ item }: { item: any }) => {

    return (
      <TouchableOpacity
        style={styles.subTestContainer}
        onPress={() => handleSubTestSelect(item.groupName)}
      >
        <View
          style={[
            styles.subTestCircle,
            selectedSubTest === item.groupName && styles.subTestCircleSelected,
          ]}
        >
          {/* {imageError ? (
            <LabdefaultIcon width={45} height={45} />
          ) : (
            <Image
              source={{ uri: item.groupImage }}
              style={[styles.subTestImage, { width: 45, height: 45 }]}
              onError={() => setImageError(true)}
            />
          )} */}
          <Image
            source={
              imageError
                ? images.labdefault
                : { uri: item.groupImage }
            }
            style={[styles.subTestImage, { width: 45, height: 45 }]}
            onError={() => setImageError(true)}
          />
        </View>
        <Text
          style={[
            styles.subTestName,
            selectedSubTest === item.groupName && styles.subTestNameSelected,
          ]}
        >
          {item.groupName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTestItem = ({ item }: { item: TestItem }) => (
    <LinearGradient
      colors={['#fff', '#D5CDDA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.testCard}
    >
      {selectedCategory === "lab-test" && (<>
        <View style={styles.cardContainer}>
          <View style={styles.testCard1}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{item.name}</Text>

              <Text style={styles.priceRow}>
                Starting from  <Text style={styles.originalPrice}>
                  ₹{item.price}
                </Text>
                {' '}
                <Text style={styles.finalPrice}>
                  ₹{item.curonnPrice}
                </Text>
              </Text>

              {item.reportTime && (
                <Text style={styles.testReportTime}>
                  Report within {item.reportTime}
                </Text>
              )}

              {item.testsList && (
                <Text style={styles.testReportTime}>
                  Tests: {item.testsList}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.testActioncard}>
            <Button
              mode="outlined"
              style={{ width: 130, height: 40, borderColor: '#BDBABA', backgroundColor: '#fff' }}
              contentStyle={{
                height: 40,
                paddingVertical: 0,
                justifyContent: 'center',
              }}
              textColor="#000000"
              onPress={() =>
                router.push({
                  pathname: "/viewdetails",
                  params: {
                    id: item.id,
                    type: selectedCategory,
                  },
                })
              }
            >
              View Details
            </Button>
            <PrimaryButton
              title="Book Now"
              onPress={() => handleBookTest(item.id)}
              style={styles.bookButton}
            />

          </View> </View>
        {/* <View style={styles.testAction}>
          <PrimaryButton
            title="Book Now"
            onPress={() => handleBookTest(item.id)}
            style={styles.bookButton}
          />
          {item.isAtHome && <Text style={styles.atHomeText}>AT-Home</Text>}

        </View> */}
      </>)}


      {(selectedCategory === 'health-checks' || selectedCategory === 'scans') && (
        <>
          <View style={styles.cardContainer}>
            <View style={styles.testCard1}>
              <View style={styles.testInfo}>
                <Text style={styles.testName}>{item.name}</Text>
                {item.testCount && (
                  <Text style={styles.finalPrice}>
                    {item.testCount} Tests  Included
                  </Text>
                )}

                {item.reportTime && (
                  <Text style={styles.testReportTime}>
                    Report within {item.reportTime}
                  </Text>
                )}


              </View>
             
              <View style={styles.healthprice}>
                <Text style={styles.priceRow}>
                  <Text style={styles.originalPrice}>
                    ₹{item.price}
                  </Text>
                  {' '}
                  <Text style={styles.finalPrice1}>
                    ₹{item.curonnPrice}
                  </Text>
                </Text>
              </View>
              
            </View>

            <View style={styles.testActioncard}>
              <Button
                mode="outlined"
                style={{ width: 130, height: 40, borderColor: '#BDBABA', backgroundColor: '#fff' }}
                contentStyle={{
                  height: 40,
                  paddingVertical: 0,
                  justifyContent: 'center',
                }}
                textColor="#000000"
                onPress={() =>
                  router.push({
                    pathname: "/viewdetails",
                    params: {
                      id: item.id,
                      type: selectedCategory,
                    },
                  })
                }
              >
                View Details
              </Button>
            { selectedCategory !== 'scans' ?(  <PrimaryButton
                title="Book Now"
                onPress={() => handleBookTest(item.id)}
                style={styles.bookButton}
              />
            ):
            (<PrimaryButton
                title="Book Now"
                onPress={() => handleBookScan(item.id)}
                style={styles.bookButton}
              />)
            }
            </View>
          </View>
        </>)
      }

    </LinearGradient >
  );

  return (
    <>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          translucent={false}
          backgroundColor="#ffffffff"
        />
        {/* Header */}
        <View style={styles.defaultHeader}>
          <CommonHeader
            currentLocation={currentLocation}
            onProfilePress={() => console.log("Profile pressed")}
            showCart={false}
          />
        </View>
        {/* </View>

      <View style={styles.containercontent}> */}


        {/* Search Bar */}

        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 1)",
            "rgba(247, 84, 10, 0.2)",
          ]}
          start={{ x: 0.3, y: 0.6 }}
          end={{ x: 0.1, y: 0.1 }}
          style={{
            paddingHorizontal: 20, // ✅ works
            paddingVertical: 5,
          }}
        >
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              {/* <Image source={images.icons.search} style={styles.searchIcon} /> */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search for lab tests"
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

          {/* Test Categories */}
          {searchQuery.trim().length === 0 && (
            <View style={styles.categoriesContainer}>
              <FlatList
                data={testCategories}
                renderItem={renderTestCategory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>
          )}

          {/* Sub Test Types for Lab Test */}
          {selectedCategory === "lab-test" &&
            searchQuery.trim().length === 0 && (
              <View style={styles.subTestTypesContainer}>
                <FlatList
                  data={subTestTypes}
                  renderItem={renderSubTestType}
                  keyExtractor={(item) => item.groupName}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subTestTypesList}
                />
              </View>
            )}

        </LinearGradient>
        <View style={styles.containercontent}>
          <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 5 }}>
            <View style={styles.testItemsContainer}>
              <FlatList
                data={getDisplayedData()}
                renderItem={renderTestItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                onEndReached={() => {
                  if (searchQuery.trim().length > 0) return;
                  if (onEndReachedCalledDuringMomentum) return;

                  if (selectedCategory === "lab-test") {
                    if (hasMoreTests && !loadingTests) {
                      handleLoadMoreTests();
                    }
                  }

                  if (selectedCategory === "health-checks") {
                    if (hasMoreHealthChecks && !loadingHealthChecks) {
                      setHealthCheckPageNo(prev => prev + 1);
                    }
                  }

                  if (selectedCategory === "scans") {
                    if (hasMoreScans && !loadingScans) {
                      setScanPageNo(prev => prev + 1);
                    }
                  }

                  setOnEndReachedCalledDuringMomentum(true);
                }}
                onMomentumScrollBegin={() => {
                  setOnEndReachedCalledDuringMomentum(false);
                }}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={() => {
                  const isLoading =
                    (selectedCategory === "lab-test" && loadingTests) ||
                    (selectedCategory === "health-checks" && loadingHealthChecks) ||
                    (selectedCategory === "scans" && loadingScans);

                  if (isLoading) return null;
                  return (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No data available
                      </Text>
                    </View>
                  );
                }}
                ListFooterComponent={() => {
                  const isLoading =
                    (selectedCategory === "lab-test" && loadingTests) ||
                    (selectedCategory === "health-checks" && loadingHealthChecks) ||
                    (selectedCategory === "scans" && loadingScans);

                  if (!isLoading) return null;

                  return (
                    <View style={{ paddingVertical: 20 }}>
                      <ActivityIndicator size="large" color="#694664" />
                    </View>
                  );
                }}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={false}
              />
            </View>
            <View style={styles.sampleCollectionContainer}>
              <Text style={styles.sampleCollectionTitle}>
                How does sample collection work?
              </Text>
              <View style={styles.sampleCollectionImages}>
                <View style={styles.sampleImageContainer}>
                  <Image
                    source={images.sampleCollectionStep1}
                    style={styles.sampleImage}
                  />
                </View>
                <View style={styles.sampleImageContainer}>
                  <Image
                    source={images.sampleCollectionStep2}
                    style={styles.sampleImage}
                  />
                </View>
                <View style={styles.sampleImageContainer}>
                  <Image
                    source={images.sampleCollectionStep3}
                    style={styles.sampleImage}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.backgroundImageContainer}>
            {/* ...existing code... */}
          </View>
        </View>
        {/* </LinearGradient> */}

        {/* Booking Modal */}
        {selectedTest && (
          <BookingScreen
            visible={bookingVisible}
            onClose={() => {
              setBookingVisible(false);
              setdiagsticVisible(true);
            }}
            onSuccess={() => {
              setdiagsticVisible(false);
              setSelectedDate(null);
              setSelectedTimeSlot("");
            }}
            serviceName={selectedTest.name}
            servicePrice={Number(selectedTest.curonnPrice)}
            reportTime={selectedTest.reportTime}
            isAtHome={selectedTest.isAtHome}
            masterId={
              selectedTest.labTestMasterId ||
              selectedTest.labPackageMasterId ||
              selectedTest.xrayMasterId
            }
            type={selectedCategory as ServiceType}
            selectedDiagCenter={selectedTest.selectedDiagCenter}
            selectedDate={selectedTest.selectedDate}
            selectedTimeSlot={selectedTest.selectedTimeSlot}
          />
        )}

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
           <SafeAreaView style={{ flex: 1, backgroundColor:  colors.white }}>
                    
        <View style={[styles.defaultHeader, { flexDirection: 'row',position:'relative', alignItems: 'center', justifyContent: 'space-between' }]}> 
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
                    <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={true}>
                      {diagCenters.map((center: any) => (
                        <LinearGradient
                          key={center.id}
                          colors={['#fff', '#D5CDDA']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.testCard}
                        >
                         
                            {/* <View style={styles.radioOuter}>
                              {selectedDiagCenterId === center.id && <View style={styles.radioInner} />}
                            </View> */}
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
                  <Text style={styles.originalPrice}>
                    ₹{selectedTest?.price}
                  </Text>
                  {' '}
                  <Text style={styles.finalPrice1}>
                    ₹{selectedTest?.curonnPrice}
                  </Text>
                  {/* <Text style={styles.finalPrice1}>
                     ₹{selectedTest?.curonnPrice || center.price}
                  </Text> */}
                </Text>
              </View>
              </View>
              
           <View style={styles.testActioncard}>
            <Button
              mode="outlined"
              style={{ width: 130, height: 40, borderColor: '#BDBABA', backgroundColor: '#fff' }}
              contentStyle={{
                height: 40,
                paddingVertical: 0,
                justifyContent: 'center',
              }}
              textColor="#000000"
              onPress={() =>
                router.push({
                  pathname: "/viewdetails",
                  params: {
                    id: center.id,
                    type: 'diagncenter',
                  },
                })
              }
            >
              View Details
            </Button>
              <PrimaryButton
                title="Book Now"
                onPress={() => {
                  if (!selectedTest) {
                    setErrors("No scan selected. Please select a scan before booking.");
                    return;
                  }
                  handleBookscanTest(selectedTest.id, center.id);
                }}
                style={styles.bookButton}
                //disabled={!selectedTest}
              />
              {!selectedTest && errors === "No scan selected. Please select a scan before booking." && (
                <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{errors}</Text>
              )}

          </View>
                            </View>
                         
                        </LinearGradient>
                      ))}
                      
                    </ScrollView>
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
      </View>
    </>);
}

const styles = StyleSheet.create({
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
    content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: colors.bg_primary,
  },
  bottomSheet: {
    // position: 'absolute',
    // left: 0,
    // right: 0,
    // bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    minHeight: 200,
  },
    section: {
    marginTop: getResponsiveSpacing(10),
  },
    sectionTitle: {
    fontSize: 13,
    color: "#000000",
    marginBottom: getResponsiveSpacing(2),
    fontFamily: fonts.semiBold
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
  modalScrollableContent: {
    flexGrow: 1,
    maxHeight: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: fonts.semiBold,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#694664',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#694664',
  },
  centerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#251729',
    fontFamily: fonts.semiBold,
  },
  centerAddress: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  centerDistance: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  nextButton: {
    marginTop: 20,
    width: '100%',
  },
  container: {
    ...commonStyles.containercontent_layout,
    backgroundColor: colors.white, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingBottom: 0,
  },

  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(20),
  },
  containercontent: {
    ...commonStyles.containercontent_layout,
    backgroundColor: colors.white, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingHorizontal: 20, // ✅ works
    paddingTop: 0,
    paddingVertical: 7,
  },
  
  searchContainer: {
    marginBottom: 20,
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
  subTestTypesContainer: {
    marginBottom: 10,
  },
  subTestTypesList: {
    gap: 3,
  },
  subTestContainer: {
    alignItems: "center",
    width: 80,
  },
  subTestCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  subTestCircleSelected: {
    // backgroundColor: '#694664',
    borderWidth: 1,
    borderColor: "#694664",
  },
  subTestImage: {
    width: '100%',
    height: '100%'
  },
  subTestName: {
    fontSize: 10,
    textAlign: "center",
    color: "#251729",
    fontWeight: "500",
    fontFamily: fonts.regular,

  },
  subTestNameSelected: {
    fontFamily: fonts.semiBold,
  },
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
  },
  testName: {
    fontSize: 16,
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
    height: 40,
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
    fontSize: 12,
    color: '#C35E9C',
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
