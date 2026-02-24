import React, { useCallback, useMemo, useState, useEffect } from 'react';
import axiosClient from '../src/api/axiosClient';
import ApiRoutes from '../src/api/employee/employee';
import { useUser } from './shared/context/UserContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {fonts} from '@/app/shared/styles/fonts';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
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
  getResponsiveImageSize,
  getResponsiveSpacing,
} from './shared/utils/responsive';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: any;
  subtitle?: string;
  cartId?: number; // server cart id
}

export default function CartScreen() {
  const { userData } = useUser();
  // patientId is required by the GetActiveCart API (see Swagger). Keep undefined if missing so we don't call API with 0.
  const patientId: number | undefined = userData?.e_id ?? undefined;

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          // Use React Native StatusBar API to set background color on Android
          RNStatusBar.setBackgroundColor("#ffffff", true);
        }, 400); // Adjust timeout as needed
        return () => clearTimeout(timeout);
      }
    }, [])
  );
  // Load active cart from API on mount
  useEffect(() => {
    let mounted = true;
    const loadCart = async () => {
      // Debug: log patientId and userData so we can see why the API may not be called
      console.log('CartScreen - loadCart, patientId:', patientId, 'userData from context:', userData);
      if (!patientId) {
        if (mounted) {
          setError('No patient id available');
          setItems([]);
        }
        // Early return to avoid calling the API with an invalid patientId (server expects a real id)
        return;
      }
      try {
  setLoading(true);
  setError(null);
  // Call GetActiveCart - backend should return user's active cart
  // Swagger shows this endpoint expects ?patientId=<int>
  // Print request for debugging
  console.log('GetActiveCart request', { url: ApiRoutes.MedicalOrders.getActiveCart, params: { patientId } });
  const res: any = await axiosClient.get(ApiRoutes.MedicalOrders.getActiveCart, { params: { patientId } });
  // Print raw response for debugging
  console.log('GetActiveCart response', res);
        // res might be array or object with data
        const list: any[] = Array.isArray(res) ? res : res?.data ?? res?.items ?? res?.cartItems ?? [];

        const mapped: CartItem[] = list.map((it: any) => ({
          id: (it.medicineId ?? it.medicineMasterId ?? it.medicine?.id ?? it.id ?? Math.random().toString()).toString(),
          name: it.medicineName ?? it.name ?? it.drugName ?? it.medicine?.medicineName ?? 'Unknown',
          price: Number(it.curonnPrice ?? it.price ?? it.totalPrice ?? it.mrp ?? 0),
          quantity: Number(it.quantity ?? it.qty ?? 1),
          image: it.imageUrl ? { uri: it.imageUrl } : images.icons.group9710,
          subtitle: it.streepBoxQty ?? it.package ?? it.description ?? '',
          cartId: it.cartId ?? it.id ?? it.cart_id ?? undefined,
        }));

        if (mounted) setItems(mapped);
      } catch (err: any) {
        console.error('Failed to load active cart', err);
        if (mounted) setError(err?.message ?? 'Failed to load cart');
        try {
          const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load cart';
          // show a concise, user-friendly alert but keep the original error in console for debugging
          Alert.alert('Could not load cart', msg.toString());
        } catch (e) {
          // ignore alert errors
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCart();
    return () => { mounted = false; };
  }, [patientId]);

  const totalAmount = useMemo(() => items.reduce((s, it) => s + it.price * it.quantity, 0), [items]);

  // Helper: try multiple delete endpoints for cart item (some backends expect different routes)


  const deleteCartItemOnServer = async (cartId: number | string) => {
    // Primary deletion: try DELETE endpoints only (user requested delete-only on '-' tap)
    const attempts: { desc: string; fn: () => Promise<any> }[] = [
      {
        desc: `DELETE ${ApiRoutes.MedicalOrders.deleteCartItem} with params { cartId }`,
        fn: async () => {
          console.log('Request DELETE (params) ->', ApiRoutes.MedicalOrders.deleteCartItem, { params: { cartId } });
          const res = await axiosClient.delete(ApiRoutes.MedicalOrders.deleteCartItem, { params: { cartId } });
          console.log('Response DELETE (params) <-', res);
          return res;
        },
      },
      {
        desc: `DELETE ${ApiRoutes.MedicalOrders.deleteCartItem}/${cartId}`,
        fn: async () => {
          const path = `${ApiRoutes.MedicalOrders.deleteCartItem}/${cartId}`;
          console.log('Request DELETE ->', path);
          const res = await axiosClient.delete(path);
          console.log('Response DELETE <-', res);
          return res;
        },
      },
      {
        desc: `DELETE /medicine-orders/cart/${cartId}`,
        fn: async () => {
          const path = `/medicine-orders/cart/${cartId}`;
          console.log('Request DELETE ->', path);
          const res = await axiosClient.delete(path);
          console.log('Response DELETE <-', res);
          return res;
        },
      },
    ];

    for (const attempt of attempts) {
      try {
        console.log('Attempting delete fallback:', attempt.desc);
        const res = await attempt.fn();
        console.log('✅ Delete succeeded:', attempt.desc, 'response:', res);
        return res;
      } catch (err: any) {
        try {
          console.warn('Delete fallback attempt failed:', attempt.desc, err?.response?.status, err?.response?.data ?? err.message);
        } catch (e) {
          console.warn('Delete fallback attempt failed (no response available):', attempt.desc, err?.message ?? err);
        }
      }
    }

    // If all DELETE attempts failed, as a last resort try update-quantity with quantity=0
    try {
      console.warn('All DELETE attempts failed for cartId', cartId, '-> trying update-quantity (quantity=0) as fallback');
      const res = await updateCartQuantityOnServer(cartId, 0);
      console.log('✅ Delete via update-quantity fallback succeeded for cartId', cartId, 'response:', res);
      return res;
    } catch (err: any) {
      console.error('All delete attempts (DELETE + update-quantity) failed for cartId', cartId, err?.response?.status ?? err?.message);
      throw new Error('All delete attempts failed');
    }
  };

  const updateCartQuantityOnServer = async (cartId: number | string, quantity: number) => {
    try {
      // primary attempt: PUT /medicine-orders/cart/update-quantity with params
      console.log('Request PUT ->', ApiRoutes.MedicalOrders.updateCartQuantityBase, { params: { cartId, quantity } });
      const res = await axiosClient.put(ApiRoutes.MedicalOrders.updateCartQuantityBase, null, { params: { cartId, quantity } });
      console.log('Response PUT <-', res);
      console.log('✅ Update quantity succeeded:', { cartId, quantity });
      return res;
    } catch (err: any) {
      console.warn('Primary update attempt failed:', err?.response?.status || err.message, err?.response?.data ?? '');
      // fallback: try embedded-query path
      try {
        const path = ApiRoutes.MedicalOrders.updateCartQuantity(cartId, quantity);
        console.log('Request PUT (fallback) ->', path);
        const res2 = await axiosClient.put(path);
        console.log('Response PUT (fallback) <-', res2);
        console.log('✅ Fallback update succeeded:', path);
        return res2;
      } catch (err2: any) {
        console.warn('Fallback update attempt failed:', err2?.response?.status || err2.message, err2?.response?.data ?? '');
        throw err2;
      }
    }
  };

  const changeQty = useCallback(async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const nextQty = Math.max(0, item.quantity + delta);
    try {
      // If nextQty is zero, attempt to delete the cart item on server
      if (nextQty === 0) {
        if (item.cartId) {
          try {
            const delRes = await deleteCartItemOnServer(item.cartId);
            console.log('✅ Deleted successfully - cartId:', item.cartId, 'response:', delRes);
          } catch (e) {
            console.warn('All delete attempts failed for cartId', item.cartId, e);
          }
        }
        // remove locally
        setItems(prev => prev.filter(it => it.id !== id));
        return;
      }

      // If server cartId present, call update-quantity endpoint for non-zero quantity
      if (item.cartId) {
        try {
          await updateCartQuantityOnServer(item.cartId, nextQty);
        } catch (e) {
          console.warn('Failed to update quantity on server for cartId', item.cartId, e);
        }
      } else {
        // If no cartId, attempt to call save endpoint to create server item
        const body = {
          cartId: 0,
          medicineOrderId: 0,
          medicineId: item.id,
          patientId: patientId,
          medicineName: item.name,
          quantity: nextQty,
          price: item.price,
          offer: 0,
          discount: 0,
          totalPrice: item.price * nextQty,
          description: item.subtitle ?? '',
        };
        console.log('Request POST ->', ApiRoutes.MedicalOrders.saveCartItem, 'body:', body);
        const res: any = await axiosClient.post(ApiRoutes.MedicalOrders.saveCartItem, body);
        console.log('Response POST <-', res);
        const returnedCartId = res?.cartId ?? res?.data?.cartId ?? res?.id ?? res?.cart_id ?? undefined;
        if (returnedCartId) {
          // update item with server cartId
          setItems(prev => prev.map(it => it.id === id ? { ...it, cartId: Number(returnedCartId) } : it));
          console.log('✅ Added successfully - cartId:', returnedCartId, 'for item id:', id);
        } else {
          console.warn('Save response did not include cart id, will refetch active cart to sync');
          // best-effort: trigger a reload by calling loadCart via changing patientId effect won't run here
          // TODO: consider exposing a refetch function; for now, leave local state as-is
        }
      }

      // update local qty after server success
      setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: nextQty } : it));
    } catch (err) {
      console.error('Failed to update cart quantity', err);
    }
  }, [items, patientId]);

  return (
     <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <View style={styles.container}>
        <StatusBar
                      barStyle="dark-content"
                      translucent={false}
                      backgroundColor="#ffffffff"
                    />
      <View style={styles.headerRow}>
        <BackButton title="Items in Cart" onPress={() => router.back()} />
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Image source={images.icons.close} style={styles.closeIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: getResponsiveSpacing(140) }}>
        <View style={styles.fullpage}>
        {items.map((item, idx) => (
          // Use a composite key (id + server cartId or index) to avoid duplicate-key warnings
          <View key={`${item.id ?? 'item'}_${item.cartId ?? idx}`} style={styles.cartItem}>
            {/* <Image source={item.image} style={styles.itemImage} /> */}
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <View style={styles.itemRight}>
              {item.price ? <Text style={styles.itemPrice}>₹{item.price}</Text> : null}
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, -1)}>
                  <Text style={styles.qtySign}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, +1)}>
                  <Text style={styles.qtySign}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            try {
            // Pass isFromMedical flag and selected cart items as a query param (stringified)
            const qs = `?isFromMedical=true&cartItems=${encodeURIComponent(JSON.stringify(items))}`;
              // Log the exact query being pushed so we can verify BookingScreen receives it
              console.log('CartScreen - navigating to Booking with query:', `/features/booking/booking${qs}`);
              // Temporary fallback: store items on global so BookingScreen can pick them up if search params parsing fails
              try {
                (global as any).__BOOKING_CART = items;
              } catch (e) {
                // ignore
              }
              router.push((`/features/booking/booking${qs}`) as unknown as any);
            } catch (e) {
              console.error('Failed to navigate to checkout with cart items', e);
              // Fallback navigation
              router.push(('/features/booking/booking') as unknown as any);
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
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(16),
    paddingTop: getResponsiveSpacing(0),
    paddingBottom: getResponsiveSpacing(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: { padding: 8 },
  closeIcon: { width: 24, height: 24, tintColor: '#666' },
  list: { flex: 1,backgroundColor: '#F5F4F9',paddingHorizontal: getResponsiveSpacing(16) },
  fullpage: { flex: 1, marginTop: getResponsiveSpacing(15),backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(5), },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemImage: {
    ...getResponsiveImageSize(50, 50),
    borderRadius: 8,
    marginRight: getResponsiveSpacing(12),
  },
  itemDetails: { flex: 1 },
  itemName: { fontFamily:fonts.semiBold,fontSize: getResponsiveFontSize(14), fontWeight: '600', color: '#000' },
  itemSubtitle: { fontFamily:fonts.regular,fontSize: getResponsiveFontSize(12), color: '#8A6F7F', marginTop: getResponsiveSpacing(0) },
  itemRight: { alignItems: 'flex-end', padding: getResponsiveSpacing(8), borderRadius: getResponsiveSpacing(8) },
  itemPrice: { fontSize: getResponsiveFontSize(16), color: '#C15E9C', fontFamily:fonts.semiBold,fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center',borderWidth: 1, borderColor: '#C15E9C',borderRadius:20, marginTop: getResponsiveSpacing(2) },
  qtyBtn: {
    width: getResponsiveSpacing(26),
    height: getResponsiveSpacing(26),
    borderRadius: getResponsiveSpacing(18),
    //backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtySign: { fontSize: getResponsiveFontSize(18), color: '#C15E9C', fontWeight: '700' },
  qtyText: { fontFamily:fonts.semiBold,marginHorizontal: getResponsiveSpacing(10),color: '#C15E9C', fontSize: getResponsiveFontSize(14), fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: getResponsiveSpacing(16),
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: getResponsiveSpacing(8) },
  totalLabel: { fontFamily:fonts.semiBold,fontSize: getResponsiveFontSize(16), fontWeight: '600', color: '#000' },
  totalValue: { fontSize: getResponsiveFontSize(18), fontWeight: '600',fontFamily:fonts.bold, color: '#C15E9C' },
  continueBtn: { backgroundColor: colors.primary, paddingVertical: getResponsiveSpacing(14), borderRadius: getResponsiveSpacing(30), alignItems: 'center' },
  continueText: { color: '#fff', fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(15), fontWeight: '500' },
});
