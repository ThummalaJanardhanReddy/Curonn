import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { images } from '../../../assets';
import BackButton from '../../shared/components/BackButton';
import { colors } from '../../shared/styles/commonStyles';
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from '../../shared/utils/responsive';

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
}

export default function MedicineListScreen() {
  const { category } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Mock medicines data based on category
  const medicines = useMemo(() => {
    const baseMedicines: Medicine[] = [
      {
        id: '1',
        name: 'Vitamin D3 1000IU',
        manufacturer: 'Health Plus',
        price: '₹299',
        originalPrice: '₹399',
        discount: '25%',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa0b2b?w=100&h=100&fit=crop',
        inStock: true,
        description: 'Essential vitamin for bone health and immune support',
        rating: 4.7,
        reviews: 89,
      },
      {
        id: '2',
        name: 'Multivitamin Complex',
        manufacturer: 'NutriLife',
        price: '₹499',
        originalPrice: '₹599',
        discount: '17%',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        inStock: true,
        description: 'Complete daily multivitamin for overall health',
        rating: 4.5,
        reviews: 156,
      },
      {
        id: '3',
        name: 'Omega-3 Fish Oil',
        manufacturer: 'Marine Health',
        price: '₹699',
        originalPrice: '₹899',
        discount: '22%',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa0b2b?w=100&h=100&fit=crop',
        inStock: true,
        description: 'High-quality fish oil for heart and brain health',
        rating: 4.6,
        reviews: 203,
      },
      {
        id: '4',
        name: 'Calcium + Vitamin D',
        manufacturer: 'BoneCare',
        price: '₹399',
        originalPrice: '₹499',
        discount: '20%',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        inStock: false,
        description: 'Strong bones and teeth support formula',
        rating: 4.4,
        reviews: 78,
      },
      {
        id: '5',
        name: 'Iron Supplement',
        manufacturer: 'Vitality Plus',
        price: '₹249',
        originalPrice: '₹299',
        discount: '17%',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa0b2b?w=100&h=100&fit=crop',
        inStock: true,
        description: 'Gentle iron supplement for energy and vitality',
        rating: 4.3,
        reviews: 92,
      },
      {
        id: '6',
        name: 'Vitamin C 1000mg',
        manufacturer: 'Immune Boost',
        price: '₹199',
        originalPrice: '₹249',
        discount: '20%',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        inStock: true,
        description: 'High potency vitamin C for immune support',
        rating: 4.8,
        reviews: 167,
      },
    ];

    // Filter medicines based on category
    switch (category) {
      case 'vitamins-supplements':
        return baseMedicines;
      case 'pain-relief':
        return baseMedicines.map(med => ({
          ...med,
          name: med.name.replace('Vitamin', 'Pain Relief').replace('Multivitamin', 'Ibuprofen').replace('Omega-3', 'Paracetamol').replace('Calcium', 'Aspirin').replace('Iron', 'Acetaminophen').replace('Vitamin C', 'Naproxen'),
          description: 'Effective pain relief and inflammation reduction',
        }));
      case 'skin-hair-care':
        return baseMedicines.map(med => ({
          ...med,
          name: med.name.replace('Vitamin D3', 'Biotin').replace('Multivitamin', 'Collagen').replace('Omega-3', 'Hair Growth').replace('Calcium', 'Skin Care').replace('Iron', 'Keratin').replace('Vitamin C', 'Anti-Aging'),
          description: 'Nourishing formula for healthy skin and hair',
        }));
      case 'sexual-wellness':
        return baseMedicines.map(med => ({
          ...med,
          name: med.name.replace('Vitamin D3', 'Testosterone').replace('Multivitamin', 'Libido Boost').replace('Omega-3', 'Energy Plus').replace('Calcium', 'Stamina').replace('Iron', 'Vitality').replace('Vitamin C', 'Performance'),
          description: 'Natural support for sexual wellness and vitality',
        }));
      case 'digestive-health':
        return baseMedicines.map(med => ({
          ...med,
          name: med.name.replace('Vitamin D3', 'Probiotics').replace('Multivitamin', 'Digestive Enzymes').replace('Omega-3', 'Fiber Plus').replace('Calcium', 'Gut Health').replace('Iron', 'Prebiotics').replace('Vitamin C', 'Digestive Aid'),
          description: 'Support for healthy digestion and gut health',
        }));
      case 'diabetes-care':
        return baseMedicines.map(med => ({
          ...med,
          name: med.name.replace('Vitamin D3', 'Blood Sugar').replace('Multivitamin', 'Glucose Control').replace('Omega-3', 'Insulin Support').replace('Calcium', 'Diabetic Care').replace('Iron', 'Sugar Balance').replace('Vitamin C', 'Metabolic'),
          description: 'Natural support for blood sugar management',
        }));
      default:
        return baseMedicines;
    }
  }, [category]);

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

  const addToCart = useCallback((medicineId: string) => {
    setCart(prev => ({
      ...prev,
      [medicineId]: (prev[medicineId] || 0) + 1
    }));
  }, []);

  const removeFromCart = useCallback((medicineId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[medicineId] > 1) {
        newCart[medicineId] -= 1;
      } else {
        delete newCart[medicineId];
      }
      return newCart;
    });
  }, []);

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
      const quantity = cart[item.id] || 0;
      const isInCart = quantity > 0;

      return (
        <View style={styles.medicineCard}>
          <View style={styles.medicineInfo}>
            <Image source={{ uri: item.image }} style={styles.medicineImage} />
            <View style={styles.medicineDetails}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.manufacturer}>{item.manufacturer}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount} OFF</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.actionContainer}>
            {isInCart ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => addToCart(item.id)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => addToCart(item.id)}
              >
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [cart, addToCart, removeFromCart]
  );

  const getTotalCartItems = useCallback(() => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  }, [cart]);

  return (
    <View style={styles.container}>
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
          <TouchableOpacity style={styles.cartButton}>
            <Image source={images.icons.cart} style={styles.cartIcon} />
            {getTotalCartItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalCartItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Image source={images.icons.search} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for medicines"
            placeholderTextColor="#999"
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

      {/* Medicines List */}
      <FlatList
        data={filteredMedicines}
        renderItem={renderMedicineCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.medicinesList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(50),
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
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.text,
  },
  cartButton: {
    position: 'relative',
    padding: getResponsiveSpacing(8),
  },
  cartIcon: {
    ...getResponsiveImageSize(24, 24),
    tintColor: colors.primary,
  },
  cartBadge: {
    position: 'absolute',
    top: getResponsiveSpacing(2),
    right: getResponsiveSpacing(2),
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
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: '#f9f9f9',
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    paddingVertical: getResponsiveSpacing(4),
    color: '#333',
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
    padding: getResponsiveSpacing(20),
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
  medicineInfo: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(8),
  },
  medicineImage: {
    ...getResponsiveImageSize(60, 60),
    borderRadius: getResponsiveSpacing(8),
    marginRight: getResponsiveSpacing(12),
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
});
