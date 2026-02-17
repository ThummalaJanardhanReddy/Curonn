import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";


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
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { Button, Card, Chip } from "react-native-paper";
import CommonHeader from "../../shared/components/CommonHeader";
import commonStyles, { colors } from "../../shared/styles/commonStyles";
import { Order, orderManager } from "../../shared/utils/orderManager";
import { getResponsiveSpacing } from "@/app/shared/utils/responsive";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import { useUser } from "../../shared/context/UserContext";
import { fontStyles, fonts } from "../../shared/styles/fonts";
import { images } from "../../../assets";
import OrderDetails from "./OrderDetails";

export default function OrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [statusIdMap, setStatusIdMap] = useState<{ [key: string]: number }>({});
  const [currentLocation] = useState("New York, NY");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useUser();
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  // Load orders from order manager
  // Helper to map order status names to masterDataId for categoryId=7
  const [searchQuery, setSearchQuery] = useState("");
  // Debug: Log userData as soon as it changes
  useEffect(() => {
    console.log('[OrdersScreen] userData changed:', userData);
  }, [userData]);

  const getOrderStatusIdMap = async (): Promise<{ [key: string]: number }> => {
    try {
      const response: any = await axiosClient.get(ApiRoutes.Master.getmasterdata(7));
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response.isSuccess && Array.isArray(response.data)) {
        data = response.data;
      }
      const map: { [key: string]: number } = {};
      data.forEach((item: any) => {
        if (item.isActive && item.name && item.masterDataId) {
          map[item.name] = item.masterDataId;
        }
      });
      return map;
    } catch (error) {
      console.error("Failed to fetch order status master data", error);
      return {};
    }
  }
  // Fetch statusId map and orders on mount
  useEffect(() => {
    async function fetchStatusMapAndOrders() {
      setLoading(true);
      const map = await getOrderStatusIdMap();
      setStatusIdMap(map);
      // Fetch all orders initially
      const patientId = userData?.e_id || 0;
      if (patientId) {
        const ordersData = await fetchAllOrders(patientId, 0);
        setOrders(ordersData);
      }
      setLoading(false);
    }
    fetchStatusMapAndOrders();
  }, [userData?.e_id]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          // Use React Native StatusBar API to set background color on Android
          RNStatusBar.setBackgroundColor("#00e93aff", true);
        }, 400); // Adjust timeout as needed
        return () => clearTimeout(timeout);
      }
    }, [])
  );


  // Refresh orders from API when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const patientId = userData?.e_id || 0;
      if (patientId) {
        setLoading(true);
        fetchAllOrders(patientId, 0).then((ordersData) => {
          setOrders(ordersData);
          setLoading(false);
        });
      }
    }, [userData?.e_id])
  );

  // Add some sample orders if none exist (for demo purposes)
  // Remove sample order logic (not needed for real API)

  // Use exact status names from master data for filter keys and titles
  const filters = useMemo(
    () => [
      { key: "all", title: "All Orders" },
      { key: "Requested", title: "Requested" },
      { key: "Inprogress", title: "Inprogress" },
      { key: "Rescheduled", title: "Rescheduled" },
      { key: "Completed", title: "Completed" },
      { key: "Cancelled", title: "Cancelled" },
      { key: "Ongoing", title: "Ongoing" },
      { key: "Pending", title: "Pending" },
    ],
    []
  );


  // Fetch orders when filter changes or search is performed
  useEffect(() => {
    const patientId = userData?.e_id || 0;
    let statusId = 0;
    console.log('[OrdersScreen] useEffect patientId (on filter/search):', patientId, userData);
    setLoading(true);
    // If searching by order number
    if (searchQuery.trim().length > 0) {
      fetchAllOrders(patientId, 0, searchQuery.trim()).then((ordersData) => {
        setOrders(ordersData);
        setLoading(false);
      });
      return;
    }
    // Use exact key for statusId lookup
    if (selectedFilter !== "all" && statusIdMap[selectedFilter]) {
      statusId = statusIdMap[selectedFilter];
    }
    fetchAllOrders(patientId, statusId).then((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
    });
  }, [selectedFilter, statusIdMap, userData?.e_id, searchQuery]);

  const filteredOrders = orders;




  const fetchAllOrders = async (patientId: number, statusId: number = 0, searchorderno?: string) => {
    try {
      let query = `?patientId=${patientId}&statusId=${statusId}`;
      if (searchorderno && searchorderno.length > 0) {
        query += `&searchorderno=${encodeURIComponent(searchorderno)}`;
      }
      const response: any = await axiosClient.get(ApiRoutes.MyOrders.Allorders + query);
      if (response.isSuccess && Array.isArray(response.data)) {
        console.log("Orders of :", response.data);
        return response.data;
      } else {
        console.log("No orders found or error:", response.message);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return [];
    }
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

  const renderOrderCard = useCallback(
    ({ item }: { item: any }) => {
      // Map orderType to category
      let category = "";
      switch (item.orderType) {
        case "Single Test":
          category = "Lab Test";
          break;
        case "Package":
          category = "Health Checks";
          break;
        case "Scan":
          category = "Scan";
          break;
        case "Medicine":
          category = "Medicine";
          break;
        case "Consultation":
          category = "Consultation";
          break;
        default:
          category = item.orderType;
      }

      // Format createdOn date
      const createdOn = item.createdOn ? new Date(item.createdOn).toLocaleDateString() : "";
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
      const statusColor = statusColors[item.statusName] || "#666";


      const statusTextColors: { [key: string]: string } = {
        Requested: "#006cc5",
        Completed: "#4CAF50",
        Cancelled: "#F44336",
        Inprogress: "#FF9800",
        Ongoing: "#9C27B0",
        Pending: "#9e7600",
        Rescheduled: "#00BCD4",
      };
      const statusTextColor = statusTextColors[item.statusName] || "#000";
      return (
        <TouchableOpacity onPress={() => handleOrderPress(item)}>
          <View style={styles.orderCard}>
            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.categoryrow}>
              <Text style={styles.category}>{category}</Text>
              {/* CreatedOn Date */}
              <Text style={styles.categorytitle}>Created: {createdOn}</Text>
            </View>
            {item.orderType !== "Consultation" && (
              <View style={styles.paymentrow}>
                <Text style={styles.paymentheader}>Payment:</Text>
                <Text style={styles.paymentamount}><Text style={styles.span}>₹</Text>{item.paymentAmount ? `${item.paymentAmount}` : "N/A"}</Text>
              </View>
            )}
           

            {/* StatusName with background color */}
            <View key={item.orderNo + "-status"} style={{ alignSelf: "flex-start", backgroundColor: statusColor, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 4, marginTop: 4 }}>
              <Text style={{ color: statusTextColor, fontWeight: "bold", fontSize: 11 }}>{item.statusName}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

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
    [selectedFilter]
  );

  return (
    <><View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent={false}
        backgroundColor="#ffffffff" />

      {/* Header */}
      <View style={styles.defaultHeader}>
        <CommonHeader
          title="My Orders"
          showCart={false}
          showLocation={false}
          onProfilePress={() => console.log('Profile pressed')} />
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Image source={images.icons.search} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for Order Id"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery} />
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
            contentContainerStyle={styles.filtersList} />
        </View>
      )}

      {/* Orders List */}
      <View style={styles.ordersdataContainer}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#694664" />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: '#888' }}>No orders found</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={filteredOrders}
              renderItem={renderOrderCard}
              keyExtractor={(item) => item.orderNo}
              contentContainerStyle={styles.ordersList}
              showsVerticalScrollIndicator={true}
              style={{ flex: 1 }} />

          </View>
        )}
      </View>

    </View>
    <OrderDetails
        visible={orderDetailsVisible}
        order={selectedOrder}
        statusName={selectedOrder?.statusName || ''}
        onClose={() => setOrderDetailsVisible(false)}
        refreshOrders={async () => {
          if (userData?.e_id) {
            const ordersData = await fetchAllOrders(userData.e_id, 0);
            setOrders(ordersData);
          }
        } } /></>
    
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.containercontent_layout,
    backgroundColor: colors.white, // colors.bg_secondary,
    // backgroundColor: colors.bg_primary,
    paddingBottom: 0,
  },

  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(20),
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  ordersdataContainer: {
    flex: 1,
    marginHorizontal: getResponsiveSpacing(20),
    marginTop: 10,
    minHeight: 0,
  },
  filtersList: {
    // paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(105, 70, 100, 0.4)",
    color: "rgba(0, 0, 0, 1)",
    marginRight: 10,
  },
  selectedFilterChip: {
    backgroundColor: "#694664",
  },
  filterChipText: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "500",
  },
  selectedFilterChipText: {
    color: "#fff",
  },
  ordersList: {
    // padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  category: {
    fontSize: 12,
    color: "#694664",
    fontFamily: fonts.regular,
    marginBottom: 4
  },
  categorytitle: {
    fontSize: 12,
    color: "#666",
    fontFamily: fonts.regular,
    marginBottom: 4
  },
  paymentheader: {
    fontSize: 12,
    color: "#303030",
     fontFamily: fonts.semiBold,
  },
   paymentamount: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    marginTop:2
  },
  span:{
    fontSize: 12,
    color: "#694664",
    
  },
   
  orderCard: {
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    shadowColor: "#dcdcdc",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  categoryrow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
    paymentrow: {
    flexDirection: "row",
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
    paddingHorizontal: getResponsiveSpacing(20),
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 16,
    height: 16,
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
