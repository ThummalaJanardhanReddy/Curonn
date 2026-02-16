import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Button } from "react-native-paper";
import ApiRoutes from "@/src/api/employee/employee";
import axiosClient from "@/src/api/axiosClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../../assets";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import Toast from "@/app/shared/components/Toast";
import { fontStyles, fonts, fontWeights } from "../../shared/styles/fonts";
import { router } from "expo-router";

interface SavedAddress {
  landMark: any;
  hNo: string;
  patientId: number;
  isDefault: boolean;
  addressId: number;
  addressNickname: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface AddressSelectionProps {
  visible: boolean;
  patientId: number; // 🔥 pass dynamically
  onSelect: (addressId: number) => void;
  onAddNew: () => void;
  onEdit: (addressId: number) => void;
  onClose: () => void;
}

export default function AddressSelection({
  visible,
  patientId,
  onSelect,
  onAddNew,
  onEdit,
  onClose,
}: AddressSelectionProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: "",
    subtitle: "",
    color: "#4BB543", // default to success green
  });
  useEffect(() => {
    // Set default addressId when addresses are fetched
    const defaultAddr = addresses.find(addr => addr.isDefault);
    setDefaultAddressId(defaultAddr ? defaultAddr.addressId : null);
  }, [addresses]);
  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const responcedata: any = await axiosClient.get(
        ApiRoutes.Address.getAddressByPatientId(patientId)
      );

      console.log("Fetched addresses:", responcedata);
      if (responcedata.isSuccess) {
        console.log("Address data:", responcedata.data);
        setAddresses(responcedata.data ?? []);
      }
    } catch (error) {
      console.error("Fetch address error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (addressId: number) => {
    onClose(); // Close the current modal
    router.push({
      pathname: "/features/location/location-selection",
      params: { addressId }
    });
  };

  const handleBack = () => {
    onClose();
  };
  // 🔥 Auto fetch when modal opens
  useEffect(() => {
    if (visible) {
      fetchAddresses();
    }
  }, [visible]);



  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>All Address</Text>
            <View style={styles.headerSpacer} />
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Image source={images.icons.close} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (<>
            <FlatList
              data={addresses}
              keyExtractor={item => item.addressId.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>

                  {/* Address details */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.nickname}>
                          {item.addressNickname?.toUpperCase()}
                        </Text>

                        {item.isDefault ? (
                          <Text style={{ color: "#4BB543", fontFamily: fonts.medium, fontWeight: "bold" }}>Default</Text>
                        ) : (
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                const payload = {
                                  addressId: item.addressId,
                                  patientId: item.patientId,
                                };
                                console.log("Set default address payload:", payload); // <-- Add this line
                               const response: any = await axiosClient.post(ApiRoutes.Address.setDfaultaddress, payload);
                                console.log("Set default response:", response);
                                if (response.isSuccess === true) {
                                  setDefaultAddressId(item.addressId);
                                  setAddresses(prev =>
                                    prev.map(addr =>
                                      addr.addressId === item.addressId
                                        ? { ...addr, isDefault: true }
                                        : { ...addr, isDefault: false }
                                    )
                                  );
                                  setToastMessage({
                                    title: "Success",
                                    subtitle: response.message,
                                    color: "#4BB543",
                                  });
                                  setShowToast(true);
                                }
                              } catch (error) {
                                setToastMessage({
                                  title: "Error",
                                  subtitle: "Failed to update default address",
                                  color: "#FF3333",
                                });
                                setShowToast(true);
                              }
                            }}
                          >
                            <Text style={{ color: "#C35E9C", fontWeight: "bold", fontFamily: fonts.medium, }}>Set as Default</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.address}>
                        H.No: {item.hNo}, {item.address}
                      </Text>
                      {item.landMark && item.landMark.trim() !== "" && (
                        <Text style={[styles.address, { color: "#888" }]}>
                          Landmark: {item.landMark}
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Select Address button */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                    <TouchableOpacity style={styles.editbutton}
                      onPress={() => onEdit(item.addressId)}>
                      <Text style={{ color: "#C35E9C", fontWeight: "bold" }}>Edit Address</Text>
                    </TouchableOpacity>


                    <PrimaryButton
                      title="Select this address"
                      onPress={() => onSelect(item.addressId)}
                      style={styles.buttonLabel}
                    />
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text>No saved address found</Text>

                </View>
              }
            />
            <View style={styles.footer}>
              <PrimaryButton
                title={` + Add New Address`}
                style={{ width: "100%" }}
                onPress={onAddNew}
              />


            </View>
          </>)}
        </View>
        {/* Toast message */}
        <Toast
          visible={showToast}
          title={toastMessage.title}
          subtitle={toastMessage.subtitle}
          color={toastMessage.color} // Pass the color to your Toast component
          onHide={() => setShowToast(false)}
          duration={3000}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f9" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    // marginTop: 16
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  nickname: {
    fontFamily: fonts.semiBold,
    marginBottom: 4,
    fontWeight: 'bold'
  },
  address: { fontFamily: fonts.medium, flexWrap: 'wrap', color: "#555" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: fonts.semiBold,
  },
  headerSpacer: {
    width: 40,
  },
  buttonLabel: {
    fontSize: 11,
    width: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 3,
    fontFamily: fonts.medium,
    height: 30,
  },
  editbutton: {
    borderWidth: 1,
    borderColor: "#C35E9C",
    paddingHorizontal: 12,
    borderRadius: 5,
    paddingVertical: 3,
    height: 30,
  }
});