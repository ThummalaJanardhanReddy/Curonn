import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import axiosClient from '../../../src/api/axiosClient';
import { SafeAreaView } from "react-native-safe-area-context";
import ApiRoutes from '../../../src/api/employee/employee';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar as RNStatusBar,
  StatusBar,
  Platform
} from 'react-native';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import commonStyles, { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from '../../shared/utils/responsive';
import { useUser } from '../../shared/context/UserContext';
import { useCart } from '../../shared/context/CartContext';
import CartIcon from '../../../assets/AppIcons/Curonn_icons/carticon.svg';
import SeacrchIcon from '../../../assets/AppIcons/Curonn_icons/search.svg';
import { fonts } from '@/app/shared/styles/fonts';
import { LinearGradient } from "expo-linear-gradient";
import { Item } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';
import { useFocusEffect } from "@react-navigation/native";
interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  price: string;
  originalPrice: string;
  discount: string;
  image: string;
  inStock: boolean;
  description: string;
  rating: number;
  reviews: number;
  // API specific
  curonnPrice?: number;
  streepBoxPrice?: number;
  streepBoxQty?: string;
  totalPrice?: number;
  drugGroup?: string;
}

export default function MedicineListScreen() {
  // State for medicines fetched from API
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  // Get drugGroup from the first medicine (if available)
  const drugGroup = (medicines?.length ?? 0) > 0 ? medicines[0]?.drugGroup ?? '' : '';
  const { userData } = useUser();
  const { refreshCart, cartCount, cartItems, addItem, updateQuantity, removeItem } = useCart();
  const patientId = userData?.e_id ?? 0;
  const { category } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshCart();
      if (Platform.OS === 'android') {
        const timeout = setTimeout(() => {
          RNStatusBar.setBackgroundColor("#ffffff", true);
        }, 400);
        return () => clearTimeout(timeout);
      }
    }, [refreshCart])
  );

  // Per-item loading state to prevent duplicate rapid clicks
  const [cartLoading, setCartLoading] = useState<{ [key: string]: boolean }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);

  const group = (useLocalSearchParams() as any).groupName as string | undefined;

  // Map API item to our UI model
  const mapApiToMedicine = (item: any): Medicine => {
    const curPrice = item.curonnPrice ?? item.offerPrice ?? item.totalPrice ?? 0;
    const original = item.streepBoxPrice ?? item.originalPrice ?? 0;
    return {
      id: (item.id ?? item.medicineMasterId ?? item.medicineId ?? Math.random().toString()).toString(),
      name: item.medicineName ?? item.name ?? item.drugName ?? 'Unknown',
      manufacturer: item.manufacturer ?? item.brand ?? '',
      price: `₹${curPrice}`,
      originalPrice: original ? `₹${original}` : '',
      discount: item.discount ?? item.discountText ?? '',
      image: item.imageUrl ?? item.image ?? '',
      inStock: item.instock ?? item.inStock ?? item.available ?? true,
      description: item.streepBoxQty ?? item.shortDescription ?? item.streepBoxQty ?? '',
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      curonnPrice: curPrice,
      streepBoxPrice: original,
      streepBoxQty: item.streepBoxQty ?? '',
      totalPrice: item.totalPrice ?? 0,
      drugGroup: item.drugGroup ?? '',
    };
  };

  const loadMedicines = async (opts?: { reset?: boolean }) => {
    if (!group && !category) {
      setMedicines([]);
      return;
    }

    const groupName = group ?? ((): string => {
      return (category ?? '').toString().replace(/-/g, ' ');
    })();

    const currentPage = opts?.reset ? 1 : page;

    try {
      setLoading(true);
      setError(null);
      const url = ApiRoutes.MedicalOrders.getMedicinesByGroup(groupName, currentPage, pageSize, searchQuery || undefined);
      const res: any = await axiosClient.get(url);
      const list: any[] = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
      const mapped = list.map(mapApiToMedicine);

      setMedicines(prev => (currentPage === 1 ? mapped : [...prev, ...mapped]));
      setHasMore(mapped.length >= pageSize);
      if (opts?.reset) setPage(1);
    } catch (err: any) {
      setError(err?.message || 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadMedicines({ reset: true });
  }, [category, group, searchQuery]);

  useEffect(() => {
    if (page === 1) return;
    loadMedicines();
  }, [page]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return medicines;

    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [medicines, searchQuery]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleIncrement = useCallback(async (medicine: Medicine) => {
    const medicineId = medicine.id;
    if (cartLoading[medicineId]) return;

    setCartLoading(prev => ({ ...prev, [medicineId]: true }));
    try {
      const itemInCart = cartItems.find(i => i.id === medicineId);
      if (itemInCart) {
        if (itemInCart.cartId) {
          await updateQuantity(itemInCart.cartId, itemInCart.quantity + 1, medicineId);
        } else {
          await addItem(medicine, 1);
        }
      } else {
        await addItem(medicine, 1);
      }
    } finally {
      setCartLoading(prev => ({ ...prev, [medicineId]: false }));
    }
  }, [cartItems, cartLoading, addItem, updateQuantity]);

  const handleDecrement = useCallback(async (medicineId: string) => {
    if (cartLoading[medicineId]) return;
    setCartLoading(prev => ({ ...prev, [medicineId]: true }));
    try {
      const itemInCart = cartItems.find(i => i.id === medicineId);
      if (!itemInCart) return;

      if (itemInCart.quantity > 1) {
        if (itemInCart.cartId) {
          await updateQuantity(itemInCart.cartId, itemInCart.quantity - 1, medicineId);
        }
      } else {
        if (itemInCart.cartId) {
          await removeItem(itemInCart.cartId, medicineId);
        }
      }
    } finally {
      setCartLoading(prev => ({ ...prev, [medicineId]: false }));
    }
  }, [cartItems, cartLoading, updateQuantity, removeItem]);

  const getCategoryTitle = useCallback(() => {
    switch (category) {
      case 'vitamins-supplements':
        return 'Vitamins & Supplements';
      case 'pain-relief':
        return 'Pain Relief';
      case 'skin-hair-care':
        return 'Skin & Hair Care';
      case 'sexual-wellness':
        return 'Sexual Wellness';
      case 'digestive-health':
        return 'Digestive Health';
      case 'diabetes-care':
        return 'Diabetes Care';
      default:
        return 'Medicines';
    }
  }, [category]);

  const renderMedicineCard = useCallback(
    ({ item }: { item: Medicine }) => {
      const itemInCart = cartItems.find(i => i.id === item.id);
      const quantity = itemInCart?.quantity || 0;
      const isInCart = quantity > 0;

      const displayPrice = item.curonnPrice ?? item.totalPrice ?? 0;
      const displayOriginal = item.streepBoxPrice ?? 0;

      return (
        <View style={styles.medicineCardLarge}>
          <View style={styles.cardRow}>
            <View style={styles.imageColumn}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.imagePriceContainer}>
                {displayOriginal ? (
                  <Text style={styles.imageOriginalPrice}>₹{displayOriginal}</Text>
                ) : null}
                <Text style={styles.imagePrice}>₹{displayPrice}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>{item.streepBoxQty}</Text>

              <View style={styles.actionUnderSubtitle}>
                {isInCart ? (
                  <View style={styles.quantityPill}>
                    <TouchableOpacity onPress={() => handleDecrement(item.id)}>
                      <Text style={styles.quantitySign}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityNumber}>{quantity}</Text>
                    <TouchableOpacity onPress={() => handleIncrement(item)}>
                      <Text style={styles.quantitySign}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addPill} onPress={() => handleIncrement(item)}>
                    <Text style={styles.addPillText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    },
    [cartItems, handleIncrement, handleDecrement]
  );

  // Removed redundant getTotalCartItems as we use cartCount from useCart()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          translucent={false}
          backgroundColor="#ffffffff"
        />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton
              title={getCategoryTitle()}
              onPress={handleBack}
              style={styles.backButton}
              textStyle={styles.headerTitle}
            />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart' as unknown as any)}>
              {/* <Image source={images.icons.cart} style={styles.cartIcon} /> */}
              <CartIcon style={styles.cartIcon} width={15} height={15} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 1)",
            "rgba(247, 84, 10, 0.2)",
          ]}
          start={{ x: 0.1, y: 0.4 }}
          end={{ x: 0.1, y: 0.1 }}
          style={{
            paddingHorizontal: 20, // ✅ works
            paddingVertical: 5,
          }}
        >
          {/* Search Field */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for Medicines"
                placeholderTextColor="#000"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Image source={images.icons.close} style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          {/* Display drugGroup if available */}
          {drugGroup ? (
            <Text style={styles.dragtitle}>{drugGroup}</Text>
          ) : null}
        </View>
        {/* Medicines List */}
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.medicinesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Continue button fixed at bottom */}
        <View style={styles.continueContainer} pointerEvents="box-none">
          <TouchableOpacity style={styles.continueButton} onPress={() => router.push('/cart' as unknown as any)}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.containercontent_layout,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(0),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    color: "#202427",
    fontFamily: fonts.semiBold
  },
  cartButton: {
    padding: getResponsiveSpacing(3),
    backgroundColor: '#FED8EC',
    width: getResponsiveSpacing(30),
    height: getResponsiveSpacing(30),
    borderRadius: getResponsiveSpacing(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    ...getResponsiveImageSize(28, 28),
  },
  cartBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(-8),
    right: getResponsiveSpacing(-2),
    backgroundColor: '#FF4444',
    borderRadius: getResponsiveSpacing(10),
    minWidth: getResponsiveSpacing(20),
    height: getResponsiveSpacing(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(4),
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(9),
    fontFamily: fonts.bold,
  },
  searchContainer: {
    marginBottom: 5,
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
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    color: "#000",
    paddingTop: 4,
    fontFamily: fonts.regular,
  },
  content: {
    marginHorizontal: getResponsiveSpacing(20),
  },
  dragtitle: {
    fontFamily: fonts.medium,
  },
  clearButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  clearIcon: {
    ...getResponsiveImageSize(16, 16),
    tintColor: '#999',
  },
  medicinesList: {
    paddingBottom: getResponsiveSpacing(160),
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(2),
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(12),
    marginBottom: getResponsiveSpacing(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  /* Large card to match design */
  medicineCardLarge: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    paddingBottom: getResponsiveSpacing(8),
    marginBottom: getResponsiveSpacing(10),
    borderWidth: 1,
    borderColor: '#DBDBDB',
    paddingTop: 5,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.06,
    // shadowRadius: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImage: {
    //...getResponsiveImageSize(54, 54),
    borderRadius: getResponsiveSpacing(8),
    marginRight: getResponsiveSpacing(12),
    backgroundColor: '#fff',
    height: getResponsiveSpacing(54),
    minWidth: getResponsiveSpacing(54),
  },
  cardBody: {
    flex: 1,
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13),
    color: '#3B2032',
    marginBottom: getResponsiveSpacing(0),
    fontFamily: fonts.semiBold
  },
  cardSubtitle: {
    fontSize: getResponsiveFontSize(12),
    color: '#737274',
    fontFamily: fonts.regular
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(12),
  },
  cardOriginalPrice: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  cardPrice: {
    fontSize: getResponsiveFontSize(16),
    color: '#E04F85',
    fontWeight: '700',
    marginTop: getResponsiveSpacing(4),
  },
  cardAction: {
    marginLeft: getResponsiveSpacing(12),
  },
  actionUnderSubtitle: {
    marginTop: getResponsiveSpacing(3),
    alignItems: 'flex-end',
  },
  imageColumn: {
    width: getResponsiveSpacing(80),
    alignItems: 'center',
    marginRight: getResponsiveSpacing(12),
  },
  imagePriceContainer: {
    marginTop: getResponsiveSpacing(8),
    alignItems: 'center',
    flexDirection: 'row',
  },
  imageOriginalPrice: {
    fontSize: getResponsiveFontSize(12),
    color: '#887f8b',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    marginRight: getResponsiveSpacing(6),
    fontFamily: fonts.regular
  },
  imagePrice: {
    fontSize: getResponsiveFontSize(12),
    color: '#C35E9C',
    fontFamily: fonts.bold,
    marginLeft: getResponsiveSpacing(2),
  },
  quantityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: getResponsiveSpacing(20),
    borderWidth: 1,
    borderColor: '#C35E9C',
    paddingHorizontal: getResponsiveSpacing(10),
    paddingVertical: getResponsiveSpacing(3),
    paddingBottom: getResponsiveSpacing(2),
  },
  quantitySign: {
    color: '#C35E9C',
    fontSize: getResponsiveFontSize(15),
    paddingHorizontal: getResponsiveSpacing(8),
  },
  quantityNumber: {
    color: '#3B2032',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '500',
    fontFamily: fonts.regular
  },
  addPill: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(14),
    paddingVertical: getResponsiveSpacing(6),
    paddingBottom: getResponsiveSpacing(5),
  },
  addPillText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '500',
    fontFamily: fonts.regular
  },
  medicineInfo: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(8),
  },
  medicineImage: {
    ...getResponsiveImageSize(60, 60),
    borderRadius: getResponsiveSpacing(8),
    marginRight: getResponsiveSpacing(12),
  },
  // compact row layout for list items
  medicineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicineImageSmall: {
    ...getResponsiveImageSize(72, 72),
    borderRadius: getResponsiveSpacing(8),
    marginRight: getResponsiveSpacing(12),
  },
  medicineDetailsSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  medicineNameSmall: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '700',
    color: '#3B2032',
  },
  descriptionSmall: {
    fontSize: getResponsiveFontSize(12),
    color: '#7A6B78',
    marginTop: getResponsiveSpacing(4),
  },
  priceRow: {
    marginTop: getResponsiveSpacing(6),
  },
  priceLarge: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '700',
    color: '#E04F85',
  },
  originalPriceSmall: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  actionRight: {
    marginLeft: getResponsiveSpacing(8),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  quantityContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(6),
    paddingVertical: getResponsiveSpacing(4),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quantityButtonSmall: {
    width: getResponsiveSpacing(28),
    height: getResponsiveSpacing(28),
    borderRadius: getResponsiveSpacing(14),
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextSmall: {
    color: colors.primary,
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    marginHorizontal: getResponsiveSpacing(8),
  },
  addToCartButtonSmall: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
  },
  addToCartButtonTextSmall: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  medicineDetails: {
    flex: 1,
  },
  medicineName: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: getResponsiveSpacing(2),
  },
  manufacturer: {
    fontSize: getResponsiveFontSize(12),
    color: colors.primary,
    marginBottom: getResponsiveSpacing(2),
  },
  description: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginBottom: getResponsiveSpacing(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#333',
    marginRight: getResponsiveSpacing(6),
  },
  originalPrice: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: getResponsiveSpacing(6),
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: getResponsiveSpacing(4),
    paddingVertical: getResponsiveSpacing(1),
    borderRadius: getResponsiveSpacing(3),
  },
  discountText: {
    fontSize: getResponsiveFontSize(8),
    color: '#fff',
    fontWeight: 'bold',
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(4),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quantityButton: {
    width: getResponsiveSpacing(28),
    height: getResponsiveSpacing(28),
    borderRadius: getResponsiveSpacing(14),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.primary,
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  quantityText: {
    color: colors.primary,
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    marginHorizontal: getResponsiveSpacing(12),
    minWidth: getResponsiveSpacing(20),
    textAlign: 'center',
  },
  continueContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
  },
  continueButton: {
    width: '90%',
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(30),
    paddingVertical: getResponsiveSpacing(10),
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(15),
    // elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(15),
  },
});
