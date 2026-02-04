import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";

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
// import Svg, { Defs, Rect, Stop, RadialGradient } from 'react-native-svg';

interface TestCategory {
  id: string;
  name: string;
  selected: boolean;
}

interface SubTestType {
  id: string;
  name: string;
  image: any;
}

interface TestItem {
  id: string;
  name: string;
  price: string;
  reportTime: string;
  isAtHome: boolean;
}

export default function LabTestsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("lab-test");
  const [selectedSubTest, setSelectedSubTest] = useState<string | null>(
    "vitamin-iron"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("New York, NY"); // TODO: Implement location functionality
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedTest, setSelectedTest] = useState<{
    name: string;
    price: number;
    isAtHome: boolean;
  } | null>(null);


  useFocusEffect(
      useCallback(() => {
        if (Platform.OS === 'android') {
          const timeout = setTimeout(() => {
            // Use React Native StatusBar API to set background color on Android
            RNStatusBar.setBackgroundColor("#ffffffff", true);
          }, 400); // Adjust timeout as needed
          return () => clearTimeout(timeout);
        }
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

  // Sub test types based on selected category
  const getSubTestTypes = (): SubTestType[] => {
    switch (selectedCategory) {
      case "lab-test":
        return [
          {
            id: "vitamin-iron",
            name: "Vitamin & Iron",
            image: images.labOrders.vitamins_iron,
          },
          {
            id: "typhoid",
            name: "Typhoid",
            image: images.labOrders.vitamins_iron,
          },
          {
            id: "diabetes",
            name: "Diabetes",
            image: images.labOrders.vitamins_iron,
          },
          {
            id: "allergy",
            name: "Allergy",
            image: images.labOrders.vitamins_iron,
          },
          {
            id: "kidney",
            name: "Kidney",
            image: images.labOrders.vitamins_iron,
          },
        ];
      case "health-checks":
        return [
          { id: "full-body", name: "Full Body", image: images.icons.calendar },
          { id: "cardiac", name: "Cardiac", image: images.icons.calendar },
          { id: "liver", name: "Liver", image: images.icons.calendar },
          { id: "thyroid", name: "Thyroid", image: images.icons.calendar },
        ];
      case "scans":
        return [
          { id: "ct-scan", name: "CT Scan", image: images.icons.calendar },
          { id: "mri", name: "MRI", image: images.icons.calendar },
          {
            id: "ultrasound",
            name: "Ultrasound",
            image: images.icons.calendar,
          },
          { id: "x-ray", name: "X-Ray", image: images.icons.calendar },
        ];
      default:
        return [];
    }
  };

  const subTestTypes = getSubTestTypes();

  // Sample test items
  const testItems: TestItem[] = [
    {
      id: "1",
      name: "Vitamin B12 Test",
      price: "₹299",
      reportTime: "10-12 hours",
      isAtHome: true,
    },
    {
      id: "2",
      name: "Iron Deficiency Test",
      price: "₹399",
      reportTime: "10-12 hours",
      isAtHome: true,
    },
    {
      id: "3",
      name: "Complete Blood Count",
      price: "₹199",
      reportTime: "10-12 hours",
      isAtHome: true,
    },
    {
      id: "4",
      name: "Thyroid Function Test",
      price: "₹499",
      reportTime: "10-12 hours",
      isAtHome: true,
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-select first sub test type when category changes
    const newSubTestTypes = getSubTestTypes();
    if (newSubTestTypes.length > 0) {
      setSelectedSubTest(newSubTestTypes[0].id);
    } else {
      setSelectedSubTest(null);
    }
  };

  const handleSubTestSelect = (subTestId: string) => {
    setSelectedSubTest(subTestId);
  };

  const handleBookTest = (testId: string) => {
    // Find the test item to get its details
    const testItem = testItems.find((item) => item.id === testId);
    if (testItem) {
      setSelectedTest({
        name: testItem.name,
        price: parseInt(testItem.price.replace("₹", "")),
        isAtHome: testItem.isAtHome,
      });
      setBookingVisible(true);
    }
  };

  const handleViewMoreTests = () => {
    // Navigate to full test list
    console.log("View more tests");
  };

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

  const renderSubTestType = ({ item }: { item: SubTestType }) => (
    <TouchableOpacity
      style={styles.subTestContainer}
      onPress={() => handleSubTestSelect(item.id)}
    >
      <View
        style={[
          styles.subTestCircle,
          selectedSubTest === item.id && styles.subTestCircleSelected,
        ]}
      >
        {typeof item.image === "function" ? (
          <item.image style={styles.subTestImage} />
        ) : (
          <Image source={item.image} style={styles.subTestImage} />
        )}
      </View>
      <Text style={styles.subTestName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderTestItem = ({ item }: { item: TestItem }) => (
    <LinearGradient
      colors={["#FFFFFF", "#D5CDDA"]}
      locations={[0.0, 1.0]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.testCard}
    >
      <View style={styles.testInfo}>
        <Text style={styles.testName}>{item.name}</Text>
        <Text style={styles.testPrice}>Starting from {item.price}</Text>
        <Text style={styles.testReportTime}>
          Report within {item.reportTime}
        </Text>
      </View>
      <View style={styles.testAction}>
        <PrimaryButton
          title="Book Now"
          onPress={() => handleBookTest(item.id)}
          style={styles.bookButton}
        />
        <Text style={styles.atHomeText}>AT-Home</Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent={false}
        backgroundColor="#ffffffff"
      />
      {/* <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
              hidden={false}
            /> */}
      {/* Header */}
    
        <CommonHeader
          currentLocation={currentLocation}
          onProfilePress={() => console.log("Profile pressed")}
          onCartPress={() => console.log("Cart pressed")}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Image source={images.icons.search} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for lab tests"
                placeholderTextColor="#999"
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

          {/* Sub Test Types */}
          {selectedCategory && (
            <View style={styles.subTestTypesContainer}>
              <FlatList
                data={subTestTypes}
                renderItem={renderSubTestType}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subTestTypesList}
              />
            </View>
          )}

          {/* Test Items */}
          {selectedSubTest && (
            <View style={styles.testItemsContainer}>
              <FlatList
                data={testItems}
                renderItem={renderTestItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* View More Tests */}
          <TouchableOpacity
            style={styles.viewMoreContainer}
            onPress={handleViewMoreTests}
          >
            <Text style={styles.viewMoreText}>View More Tests {">>"}</Text>
          </TouchableOpacity>

          {/* Sample Collection Info */}
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

          <View style={styles.backgroundImageContainer}>
            {/* <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#D5CDDA" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grad)" />
          </Svg> */}
            {/* <Image
            source={images.panels.testsPage}
            style={styles.backgroundImage}
            resizeMode="stretch"
          /> */}
          </View>
        </ScrollView>

        {/* Booking Modal */}
        {selectedTest && (
          <BookingScreen
            visible={bookingVisible}
            onClose={() => {
              setBookingVisible(false);
              setSelectedTest(null);
            }}
            serviceName={selectedTest.name}
            servicePrice={selectedTest.price}
            isAtHome={selectedTest.isAtHome}
          />
        )}
 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    backgroundColor: colors.white, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    // ...commonStyles.container_layout,
    paddingTop: 10,
    // backgroundColor: colors.bg_primary,
  },
  searchContainer: {
    // marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    color: "#333",
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
    fontSize: 14,
    fontWeight: "500",
    color: "#694664",
  },
  categoryButtonTextSelected: {
    color: "#fff",
  },
  subTestTypesContainer: {
    marginBottom: 20,
  },
  subTestTypesList: {
    gap: 16,
  },
  subTestContainer: {
    alignItems: "center",
    width: 80,
  },
  subTestCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  subTestCircleSelected: {
    // backgroundColor: '#694664',
    borderWidth: 2,
    borderColor: "#694664",
  },
  subTestImage: {
    width: "100%",
    height: "100%",
    tintColor: "#694664",
  },
  subTestName: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
  },
  testItemsContainer: {
    marginBottom: 20,
  },
  testCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    // Add a linear gradient background from left (#FFFFFF) to right (#D5CDDA)
    // Note: This requires react-native-linear-gradient. If not available, fallback to a View with backgroundColor.
    overflow: "hidden", // To ensure borderRadius clips the gradient
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  testInfo: {
    flex: 1,
    marginRight: 16,
  },
  testName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B334E",
    marginBottom: 4,
  },
  testPrice: {
    fontSize: 11,
    color: "#4B334E",
    fontWeight: "500",
    marginBottom: 4,
  },
  testReportTime: {
    fontSize: 8,
    color: "#4B334E",
  },
  testAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  bookButton: {
    marginBottom: 4,
    width: 100,
    height: 35,
  },
  atHomeText: {
    fontSize: 10,
    color: "#4B334E",
    fontWeight: "500",
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
    marginBottom: 30,
    justifyContent: "flex-start",
    // alignItems: 'center',
  },
  sampleCollectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B334E",
    marginBottom: 16,
    textAlign: "justify",
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
});
