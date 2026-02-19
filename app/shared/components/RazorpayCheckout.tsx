import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

// Dummy RazorpayCheckout for demo. Replace with real Razorpay integration as needed.
export default function RazorpayCheckout({
  orderId,
  amount,
  onSuccess,
  onFailure,
  onClose,
}: {
  orderId: string;
  amount: number;
  onSuccess: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => void;
  onFailure: () => void;
  onClose: () => void;
}) {
  // Simulate payment UI
  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 12, width: 320, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Razorpay Payment</Text>
          <Text style={{ marginBottom: 8 }}>Order ID: {orderId}</Text>
          <Text style={{ marginBottom: 16 }}>Amount: ₹{amount}</Text>
          <TouchableOpacity
            style={{ backgroundColor: "#4caf50", padding: 12, borderRadius: 6, marginBottom: 8, width: "100%" }}
            onPress={() => {
              // Simulate payment success
              onSuccess({
                razorpayOrderId: orderId,
                razorpayPaymentId: "dummy_payment_id",
                razorpaySignature: "dummy_signature",
              });
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Simulate Success</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: "#f44336", padding: 12, borderRadius: 6, marginBottom: 8, width: "100%" }}
            onPress={onFailure}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Simulate Failure</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={{ color: "#2196f3" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
