import React, { useCallback, useMemo, useEffect } from 'react';
import { useCart } from './shared/context/CartContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { fonts } from '@/app/shared/styles/fonts';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar as RNStatusBar,
  StatusBar,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import BackButton from './shared/components/BackButton';
import { images } from '../assets';
import { colors } from './shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
} from './shared/utils/responsive';
import CartItemsList from './shared/components/CartItemsList';

export default function CartScreen() {
  const { cartItems, loading, updateQuantity, removeItem, refreshCart } = useCart();

  useFocusEffect(
    useCallback(() => {
      refreshCart();
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          RNStatusBar.setBackgroundColor("#F5F4F9", true);
        }, 400);
        return () => clearTimeout(timeout);
      }
    }, [refreshCart])
  );

  const totalAmount = useMemo(() =>
    cartItems.reduce((s, it) => s + (Number(it.price) * it.quantity), 0),
    [cartItems]
  );

  const handleIncreaseQty = useCallback(async (medicineId: string) => {
    const item = cartItems.find(i => i.id === medicineId);
    if (item && item.cartId) {
      await updateQuantity(item.cartId, item.quantity + 1, medicineId);
    }
  }, [cartItems, updateQuantity]);

  const handleDecreaseQty = useCallback(async (medicineId: string) => {
    const item = cartItems.find(i => i.id === medicineId);
    if (!item) return;

    if (item.quantity > 1) {
      if (item.cartId) {
        await updateQuantity(item.cartId, item.quantity - 1, medicineId);
      }
    } else {
      if (item.cartId) {
        await removeItem(item.cartId, medicineId);
      } else {
        // Fallback for items without cartId
        await refreshCart();
      }
    }
  }, [cartItems, updateQuantity, removeItem, refreshCart]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          translucent={false}
          backgroundColor="#fff"
        />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Items in Cart</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Image source={images.icons.close} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: getResponsiveSpacing(100) }}>
          <CartItemsList
            items={cartItems}
            onIncreaseQuantity={handleIncreaseQty}
            onDecreaseQuantity={handleDecreaseQty}
            itemsTotal={totalAmount}
            deliveryCharges={0}
            displayedTotal={totalAmount}
            showPricingDetails={false}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              try {
                const qs = `?isFromMedical=true&cartItems=${encodeURIComponent(JSON.stringify(cartItems))}`;
                console.log('CartScreen - navigating to Booking with items:', cartItems.length);
                // Temporary fallback for legacy code
                (global as any).__BOOKING_CART = cartItems;
                router.push((`/features/booking/booking${qs}`) as any);
              } catch (e) {
                console.error('Failed to navigate to checkout', e);
                router.push(('/features/booking/booking') as any);
              }
            }}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4F9' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(16),
    color: '#202427',
  },
  // closeButton: {
  //   width: 36,
  //   height: 36,
  //   borderRadius: 18,
  //   backgroundColor: '#E0E0E0',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  closeButton: {
    padding: 4,
  },

  closeIcon: {
    width: 28,
    height: 28,
    tintColor: "black",
  },
  list: {
    flex: 1,
    backgroundColor: '#F5F4F9',
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(15),
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(16),
  },
});
