import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  FlatList,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  StatusBar,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { Button, Card, Chip } from "react-native-paper";
import CommonHeader from "../../shared/components/CommonHeader";
import commonStyles, {
  colors,
  statusColors,
  statusTextColors,
} from "../../shared/styles/commonStyles";
import { Order, orderManager } from "../../shared/utils/orderManager";
import { getResponsiveSpacing } from "@/app/shared/utils/responsive";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import { useRouter } from "expo-router";
import BackButton from "../../shared/components/BackButton";
import { useUser } from "../../shared/context/UserContext";
import { fontStyles, fonts } from "../../shared/styles/fonts";
import { images } from "../../../assets";
import OrderDetails from "./OrderDetails";
import SeacrchIcon from "../../../assets/AppIcons/Curonn_icons/search.svg";
import { useUserStore } from "@/src/store/UserStore";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(advancedFormat);

export default function OrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentLocation] = useState("New York, NY");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userData } = useUser();
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { restoreUserData, user } = useUserStore();
  useEffect(() => {
    restoreUserData();
  }, []);
  const patientId = Number(userData?.e_id || user?.eId);
  const insets = useSafeAreaInsets();

  // Use exact status names returned by the API for filter keys and titles.
  // Client-side filtering means we only ever fetch the full order list once,
  // then slice it locally when the user switches tabs or searches.
  const filters = useMemo(
    () => [
      { key: "all", title: "All Orders", status: "all" },
      {
        key: "Requested",
        title: "Pending",
        status: ["Requested", "Pending", "Inprogress", "Ongoing", "Assigned"],
      },
      { key: "Completed", title: "Completed", status: "Completed" },
      { key: "Cancelled", title: "Cancelled", status: "Cancelled" },
    ],
    [],
  );

  const fetchAllOrders = useCallback(async (): Promise<Order[]> => {
    if (!patientId) return [];
    try {
      const response: any = await axiosClient.get(
        `${ApiRoutes.MyOrders.Allorders}?patientId=${patientId}&statusId=0`,
      );
      if (response.isSuccess && Array.isArray(response.data)) {
        return response.data;
      }
      console.log("No orders found or error:", response.message);
      return [];
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return [];
    }
  }, [patientId]);

  const refreshOrders = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    const ordersData = await fetchAllOrders();
    setAllOrders(ordersData);
    setLoading(false);
  }, [patientId, fetchAllOrders]);

  // Fetch the full order list once on mount / whenever the patient changes.
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Refresh the underlying order list on focus (e.g. after placing/cancelling
  // an order elsewhere) without touching selectedFilter/searchQuery, so the
  // currently selected tab keeps showing the right slice of data.
  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders]),
  );

  // Derive the visible list entirely client-side from allOrders — no extra
  // API calls when switching filter tabs or typing a search query.
  const filteredOrders = useMemo(() => {
    let result = allOrders;

    const query = searchQuery.trim().toLowerCase();
    if (query.length > 0) {
      result = result.filter((order: any) =>
        order.orderNo?.toLowerCase().includes(query),
      );
    } else if (selectedFilter !== "all") {
      const filterDef = filters.find((f) => f.key === selectedFilter);
      const statusList = filterDef
        ? Array.isArray(filterDef.status)
          ? filterDef.status
          : [filterDef.status]
        : [];
      result = result.filter((order: any) =>
        statusList.includes(order.statusName),
      );
    }

    return [...result].sort((a, b) => {
      const dateA = a.scheduleDate ? new Date(a.scheduleDate).getTime() : 0;
      const dateB = b.scheduleDate ? new Date(b.scheduleDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [allOrders, selectedFilter, searchQuery, filters]);

  // const formatDate = (isoDate: string, extraMinutes: number = 0, extraHours: number = 0) => {
  //   const date = new Date(isoDate);

  //   // Add extra hours and minutes
  //   date.setHours(date.getUTCHours() + extraHours);
  //   date.setMinutes(date.getUTCMinutes() + extraMinutes);

  //   const months = [
  //     "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  //     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  //   ];

  //   const getOrdinal = (n: number) => {
  //     const s = ["th", "st", "nd", "rd"];
  //     const v = n % 100;
  //     return n + (s[(v - 20) % 10] || s[v] || s[0]);
  //   };

  //   const month = months[date.getMonth()];
  //   const day = getOrdinal(date.getDate());
  //   const year = date.getFullYear();

  //   let hours = date.getUTCHours(); // Use UTC hours
  //   const minutes = date.getUTCMinutes().toString().padStart(2, "0"); // Use UTC minutes

  //   const ampm = hours >= 12 ? "pm" : "am";
  //   hours = hours % 12 || 12;

  //   return `${month} ${day}, ${year}; ${hours}:${minutes} ${ampm}`;
  // };

  // const formatDate = (isoDate: string) => {
  //   const date = new Date(isoDate);
  //   const months = [
  //     "Jan",
  //     "Feb",
  //     "Mar",
  //     "Apr",
  //     "May",
  //     "Jun",
  //     "Jul",
  //     "Aug",
  //     "Sep",
  //     "Oct",
  //     "Nov",
  //     "Dec",
  //   ];
  //   const getOrdinal = (n: number) => {
  //     const s = ["th", "st", "nd", "rd"];
  //     const v = n % 100;
  //     return n + (s[(v - 20) % 10] || s[v] || s[0]);
  //   };
  //   const month = months[date.getMonth()];
  //   const day = getOrdinal(date.getDate());
  //   const year = date.getFullYear();
  //   return `${month} ${day}, ${year}`;
  // };

  const formatDate = (isoDate: string) => {
    return dayjs(isoDate).format("MMM Do, YYYY");
  };

  const handleOrderPress = (order: any) => {
    // Pass orderType and masterId explicitly
    setSelectedOrder({
      ...order,
      orderType: order.orderType,
      masterId: order.masterId,
      statusName: order.statusName,
    });
    setOrderDetailsVisible(true);
  };

  const renderOrderCard = useCallback(({ item }: { item: any }) => {
    // Map orderType to category
    let category = "";
    let iconSource = null;
    // console.log("Rendering order card for: ", item);
    switch (item.orderType) {
      case "Single Test":
        category = "Lab Test";
        iconSource = images.labicon;
        break;
      case "Package":
        category = "Health Checks";
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
      case "Ambulance":
        category = "Ambulance";
        iconSource = images.ambulanceicon;
        break;
      case "Wellness Program":
        category = "Wellness Program";
        iconSource = images.wellnessicon;
        break;
      default:
        category = item.orderType;
        iconSource = null;
    }

    // Format createdOn date
    const createdOn = item.scheduleDate ? formatDate(item.scheduleDate) : "";
    const timeSlot = item.timeSlot ? `, ${item.timeSlot}` : "";
    const duration = item.duration ? `${item.duration}` : "";
   
    const statusColor = statusColors[item.statusName] || "#666";

    const statusTextColor =
      statusTextColors[item.statusName] || colors.primaryText;
    // Display 'Inprogress' instead of 'Requested'
    const displayStatusName =
      item.statusName === "Requested" ? "Pending" : item.statusName;
    return (
      <TouchableOpacity onPress={() => handleOrderPress(item)}>
        <View style={styles.orderCard}>
          <View style={styles.orderLeft}>
            {iconSource && (
              <Image
                source={iconSource}
                style={{ width: 55, resizeMode: "contain", borderRadius: 10 }}
              />
            )}
            <Text style={styles.orderno}>{item.orderNo}</Text>
          </View>
          <View style={styles.orderRight}>
            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>
            {duration ? (
              <View style={styles.categoryrow}>
                <Text style={styles.categorytitle1}>Duration: {duration}</Text>
              </View>
            ) : (
              <View style={styles.categoryrow}>
                <Text style={styles.categorytitle}>
                  {createdOn}
                  {timeSlot}{" "}
                </Text>
              </View>
            )}

            <View style={styles.categoryrow}>
              {/* StatusName with background color */}
              <View
                key={item.orderNo + "-status"}
                style={{
                  alignSelf: "flex-start",
                  alignItems: 'center',
                  backgroundColor: statusColor,
                  borderRadius: 30,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginTop: 0,
                }}
              >
                <Text
                  style={{
                    color: statusTextColor,
                    fontSize: 10,
                    fontFamily: fonts.regular,
                  }}
                >
                  {displayStatusName}
                </Text>
              </View>
              {item.orderType !== "Consultation" && (
                <View style={styles.paymentrow}>
                  {/* <Text style={styles.paymentheader}>Payment:</Text> */}
                  {/* <Text style={styles.paymentamount}><Text style={styles.span}>₹</Text>{item.paymentAmount ? `${item.paymentAmount}` : "N/A"}</Text> */}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderFilterChip = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === item.key && styles.selectedFilterChip,
        ]}
        onPress={() => setSelectedFilter(item.key)}
      >
        <Text
          style={[
            styles.filterChipText,
            selectedFilter === item.key && styles.selectedFilterChipText,
          ]}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    ),
    [selectedFilter],
  );

  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
    <View style={[styles.container]}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>

        <View
          style={{
            paddingHorizontal: 0,
            paddingVertical: 5,
            borderBottomWidth: 1,
            borderBottomColor: "#E0E0E0",
          }}
        >
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for Order Id"
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

          {/* <View>
      <Text style={{fontSize:20,fontWeight:'600',color:'#333',marginLeft:20,marginTop:10,marginBottom:10}}>{address}</Text>
    </View> */}

          {/* Filters */}
          {searchQuery.trim().length === 0 && (
            <View style={styles.filtersContainer}>
              <FlatList
                data={filters}
                renderItem={renderFilterChip}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filtersList]}
              />
            </View>
          )}
        </View>
        {/* Orders List */}
        <View
          style={[
            styles.ordersdataContainer,
            {
              backgroundColor: colors.bg_rest,
              marginHorizontal: 0,
              marginTop: 0,
            },
          ]}
        >
          {loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredOrders.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.primaryText }}>
                No orders found
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredOrders}
                renderItem={renderOrderCard}
                keyExtractor={(item, index) =>
                  item.orderNo
                    ? `${item.orderNo}-${item.scheduleDate}`
                    : `order-${index}`
                }
                contentContainerStyle={[styles.ordersList]}
                showsVerticalScrollIndicator={true}
                style={{ flex: 1, backgroundColor: colors.bg_rest }}
              />
            </View>
          )}
        </View>
      </View>
      <OrderDetails
        visible={orderDetailsVisible}
        order={selectedOrder}
        statusName={selectedOrder?.statusName || ""}
        onClose={() => setOrderDetailsVisible(false)}
        refreshOrders={refreshOrders}
      />
    </View>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    // Remove border to avoid shrinking height
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 16,
    color: colors.black,
    fontWeight: "700",
  },
  backButton: {
    padding: 0,
  },
  filtersContainer: {
    paddingVertical: 10,
  },
  ordersdataContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    minHeight: 0,
  },
  filtersList: {
    paddingBottom: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.lab.chips,
    color: "rgba(0, 0, 0, 1)",
    marginRight: 10,
    fontFamily: fonts.regular,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  orderRight: {
    flex: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#251729",
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  selectedFilterChipText: {
    color: "#fff",
    fontWeight: "700",
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  title: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: "600",
    fontFamily: fonts.bold,
  },
  category: {
    fontSize: 12,
    color: "#694664",
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  categorytitle: {
    fontSize: 12,
    color: "#666",
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  categorytitle1: {
    fontSize: 12,
    color: "#666",
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  paymentheader: {
    fontSize: 12,
    color: "#303030",
    fontWeight: "700",
  },
  paymentamount: {
    fontSize: 13,
    color: "#000000",
    marginBottom: 4,
    marginTop: 2,
    fontWeight: "700",
  },
  span: {
    fontSize: 12,
    color: "#694664",
  },

  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },

  categoryrow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentrow: {
    flexDirection: "row",
  },

  orderLeft: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  orderno: {
    fontSize: 11,
    fontWeight: "700",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  itemsContainer: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  itemImageText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#666",
  },
  scheduledInfo: {
    fontSize: 11,
    color: "#694664",
    fontWeight: "500",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  deliveryInfo: {
    flex: 1,
    marginRight: 16,
  },
  deliveryAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  searchContainer: {
    marginBottom: 5,
    paddingHorizontal: 20,
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
    marginTop: 0,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: "#999",
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
  estimatedDelivery: {
    fontSize: 12,
    color: "#694664",
    fontWeight: "500",
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: "#694664",
  },
  rateButton: {
    backgroundColor: "#694664",
  },
});
