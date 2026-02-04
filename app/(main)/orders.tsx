import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, Chip } from "react-native-paper";
import CommonHeader from "../shared/components/CommonHeader";
import commonStyles, { colors } from "../shared/styles/commonStyles";
import { Order, orderManager } from "../shared/utils/orderManager";

export default function OrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentLocation] = useState("New York, NY");
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from order manager
  useEffect(() => {
    const allOrders = orderManager.getAllOrders();
    setOrders(allOrders);
  }, []);

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
    
  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const allOrders = orderManager.getAllOrders();
      setOrders(allOrders);
    }, [])
  );

  // Add some sample orders if none exist (for demo purposes)
  useEffect(() => {
    const allOrders = orderManager.getAllOrders();
    if (allOrders.length === 0) {
      // Add sample orders for demonstration
      const sampleOrders: Order[] = [
        {
          id: "sample_1",
          orderNumber: "ORD-2024-001",
          date: "2024-01-15",
          status: "completed",
          total: 45.99,
          items: [
            {
              id: "item_1",
              name: "Paracetamol 500mg",
              type: "medicine",
              price: 5.99,
              quantity: 2,
            },
            {
              id: "item_2",
              name: "Vitamin D3 1000IU",
              type: "medicine",
              price: 12.99,
              quantity: 1,
            },
          ],
          patientDetails: { type: "self" },
          isAtHome: false,
          estimatedDelivery: "Delivered on Jan 16, 2024",
        },
        {
          id: "sample_2",
          orderNumber: "ORD-2024-002",
          date: "2024-01-18",
          status: "scheduled",
          total: 28.5,
          items: [
            {
              id: "item_3",
              name: "Omeprazole 20mg",
              type: "medicine",
              price: 18.5,
              quantity: 1,
            },
          ],
          patientDetails: { type: "self" },
          isAtHome: false,
          estimatedDelivery: "Expected delivery: Jan 20, 2024",
        },
      ];

      sampleOrders.forEach((order) => {
        orderManager.createOrder({
          serviceName: order.items[0].name,
          servicePrice: order.total,
          isAtHome: order.isAtHome,
          patientDetails: order.patientDetails,
        });
      });

      setOrders(orderManager.getAllOrders());
    }
  }, []);

  const filters = useMemo(
    () => [
      { key: "all", title: "All Orders" },
      { key: "processing", title: "Processing" },
      { key: "confirmed", title: "Confirmed" },
      { key: "scheduled", title: "Scheduled" },
      { key: "completed", title: "Completed" },
      { key: "cancelled", title: "Cancelled" },
    ],
    []
  );

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === selectedFilter);
  }, [orders, selectedFilter]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "scheduled":
        return "#2196F3";
      case "confirmed":
        return "#9C27B0";
      case "processing":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      default:
        return "#666";
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "scheduled":
        return "Scheduled";
      case "confirmed":
        return "Confirmed";
      case "processing":
        return "Processing";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }, []);

  const renderOrderCard = useCallback(
    ({ item }: { item: Order }) => (
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderDate}>Ordered on {item.date}</Text>
            </View>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) },
              ]}
              textStyle={styles.statusChipText}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>

          <View style={styles.itemsContainer}>
            {item.items.map((orderItem, index: number) => (
              <View key={`${item.id}_${orderItem.id}`} style={styles.orderItem}>
                <View style={styles.itemImagePlaceholder}>
                  <Text style={styles.itemImageText}>
                    {orderItem.type === "lab_test"
                      ? "🧪"
                      : orderItem.type === "medicine"
                      ? "💊"
                      : "👨‍⚕️"}
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{orderItem.name}</Text>
                  <Text style={styles.itemQuantity}>
                    Qty: {orderItem.quantity}
                  </Text>
                  {item.scheduledDate && item.scheduledTime && (
                    <Text style={styles.scheduledInfo}>
                      Scheduled: {item.scheduledDate} at {item.scheduledTime}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>₹{orderItem.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.deliveryInfo}>
              {item.serviceAddress && (
                <Text style={styles.deliveryAddress}>
                  {item.serviceAddress.nickname}:{" "}
                  {item.serviceAddress.houseNumber},{" "}
                  {item.serviceAddress.address}
                </Text>
              )}
              <Text style={styles.estimatedDelivery}>
                {item.estimatedDelivery || "Processing your order..."}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{item.total}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => console.log("Reorder")}
              style={styles.actionButton}
            >
              Reorder
            </Button>
            <Button
              mode="outlined"
              onPress={() => console.log("Track Order")}
              style={styles.actionButton}
            >
              Track Order
            </Button>
            {item.status === "completed" && (
              <Button
                mode="contained"
                onPress={() => console.log("Rate Order")}
                style={[styles.actionButton, styles.rateButton]}
              >
                Rate
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    ),
    [getStatusColor, getStatusText]
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
    <>
      <RNStatusBar barStyle="dark-content" backgroundColor="#a32525ff" />
      <View style={styles.container}>
        {/* Header */}
        <CommonHeader
        currentLocation={currentLocation}
        onProfilePress={() => console.log('Profile pressed')}
        onCartPress={() => console.log('Cart pressed')}
      />
        {/* <View>
        <Text style={{fontSize:20,fontWeight:'600',color:'#333',marginLeft:20,marginTop:10,marginBottom:10}}>{address}</Text>
      </View> */}

        {/* Filters */}
        <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

        {/* Orders List */}
        <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    backgroundColor: colors.white,
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  filtersList: {
    // paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  selectedFilterChip: {
    backgroundColor: "#694664",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedFilterChipText: {
    color: "#fff",
  },
  ordersList: {
    // padding: 20,
  },
  orderCard: {
    marginBottom: 16,
    elevation: 2,
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
