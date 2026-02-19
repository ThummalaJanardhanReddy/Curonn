



import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import commonStyles, { colors } from "@/app/shared/styles/commonStyles";
import { useRouter } from 'expo-router';
import {
  getResponsiveSpacing,
  getResponsiveFontSize,
  getResponsiveImageSize,
} from "@/app/shared/utils/responsive";

// Static pay-later booking UI matching the provided screenshot.
// This component intentionally does not perform navigation or API calls.
export default function BookingPayLaterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Info</Text>
        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Text style={styles.closeX}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prescription card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Prescription</Text>
          <View style={styles.prescriptionRow}>
            <View style={styles.prescriptionPreview} />
            <View style={styles.prescriptionPreview} />
            <View style={styles.prescriptionPreview} />
          </View>
          <TouchableOpacity style={styles.editPill} activeOpacity={0.8}>
            <Text style={styles.editPillText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Details */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Patient Details</Text>
          <View style={styles.radioRow}>
            <View style={[styles.radioOption, styles.radioSelected]}>
              <View style={styles.radioLeft}>
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.radioText}>Self Service</Text>
              </View>
            </View>

            <View style={styles.radioOption}>
              <View style={styles.radioLeft}>
                <View style={styles.radioOuterEmpty} />
                <Text style={styles.radioText}>For Family</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Service Address */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Service Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>Anil Kumar</Text>
            <Text style={styles.addressText} numberOfLines={3}>
              H.No 234, second floor, Miyapur, Kukatpally, Hyderabad,
              Telangana - 500085
            </Text>
            <TouchableOpacity style={styles.editAddressPill} activeOpacity={0.8}>
              <Text style={styles.editAddressText}>Edit Address</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cancellation policy */}
        <View style={styles.cardNoPad}>
          <Text style={styles.cardLabel}>Cancellation policy</Text>
          <Text style={styles.policyText}>
            Free cancellation is done more than 2 hrs before the service or if a
            professional isn't assigned. A fee will be charged otherwise
          </Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.learnMore}>Learn more</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer so bottom button doesn't overlap */}
        <View style={{ height: getResponsiveSpacing(120) }} />
      </ScrollView>

      {/* Bottom fixed action */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.bottomButton} activeOpacity={0.85}>
          <Text style={styles.bottomButtonText}>Will call you and confirm the order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary ?? '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(14),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '700',
    color: '#222',
  },
  closeButton: {
    position: 'absolute',
    right: getResponsiveSpacing(16),
    top: getResponsiveSpacing(10),
    width: getResponsiveSpacing(36),
    height: getResponsiveSpacing(36),
    borderRadius: getResponsiveSpacing(18),
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: getResponsiveFontSize(20),
    color: '#444',
  },
  content: {
    padding: getResponsiveSpacing(18),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(14),
    marginBottom: getResponsiveSpacing(12),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardNoPad: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(14),
    marginBottom: getResponsiveSpacing(12),
  },
  cardLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing(10),
    color: '#333',
  },
  prescriptionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  prescriptionPreview: {
    width: getResponsiveImageSize(72, 72).width,
    height: getResponsiveImageSize(72, 72).height,
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#f0f0f0',
    marginRight: getResponsiveSpacing(10),
  },
  editPill: {
    marginTop: getResponsiveSpacing(12),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E04F85',
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(14),
    paddingVertical: getResponsiveSpacing(8),
  },
  editPillText: {
    color: '#E04F85',
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
  },
  radioOption: {
    flex: 1,
    borderRadius: getResponsiveSpacing(10),
    borderWidth: 1,
    borderColor: '#eee',
    padding: getResponsiveSpacing(10),
    backgroundColor: '#fff',
    marginRight: getResponsiveSpacing(8),
  },
  radioSelected: {
    borderColor: '#E04F85',
    backgroundColor: '#fff',
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: getResponsiveSpacing(22),
    height: getResponsiveSpacing(22),
    borderRadius: getResponsiveSpacing(11),
    borderWidth: 1,
    borderColor: '#E04F85',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing(10),
  },
  radioOuterEmpty: {
    width: getResponsiveSpacing(22),
    height: getResponsiveSpacing(22),
    borderRadius: getResponsiveSpacing(11),
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: getResponsiveSpacing(10),
  },
  radioInner: {
    width: getResponsiveSpacing(12),
    height: getResponsiveSpacing(12),
    borderRadius: getResponsiveSpacing(6),
    backgroundColor: '#E04F85',
  },
  radioText: {
    fontSize: getResponsiveFontSize(14),
    color: '#333',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(10),
    padding: getResponsiveSpacing(12),
  },
  addressName: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '700',
    color: '#222',
    marginBottom: getResponsiveSpacing(6),
  },
  addressText: {
    color: '#666',
    fontSize: getResponsiveFontSize(12),
  },
  editAddressPill: {
    marginTop: getResponsiveSpacing(12),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E04F85',
    borderRadius: getResponsiveSpacing(18),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
  },
  editAddressText: {
    color: '#E04F85',
    fontWeight: '600',
  },
  policyText: {
    color: '#666',
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveFontSize(16),
  },
  learnMore: {
    color: '#1E88E5',
    marginTop: getResponsiveSpacing(8),
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: getResponsiveSpacing(20),
    alignItems: 'center',
  },
  bottomButton: {
    width: '90%',
    backgroundColor: '#E04F85',
    borderRadius: getResponsiveSpacing(30),
    paddingVertical: getResponsiveSpacing(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveFontSize(15),
  },
});
// End of file - bookingpaylater is a static component.
