import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { fonts } from '@/app/shared/styles/fonts';
import { colors } from '@/app/shared/styles/commonStyles';
import { getResponsiveFontSize, getResponsiveSpacing } from '@/app/shared/utils/responsive';

interface CartItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    subtitle?: string;
    description?: string;
    medicineId?: number;
    cartId?: number;
    image?: string;
}

interface CartItemsListProps {
    items: CartItem[];
    onIncreaseQuantity: (id: string) => void;
    onDecreaseQuantity: (id: string) => void;
    itemsTotal: number;
    deliveryCharges?: number;
    displayedTotal: number;
    showPricingDetails?: boolean;
    noPadding?: boolean;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
    items,
    onIncreaseQuantity,
    onDecreaseQuantity,
    itemsTotal,
    deliveryCharges = 0,
    displayedTotal,
    showPricingDetails = true,
    noPadding = false,
}) => {
    return (
        <View style={[styles.container, noPadding && { paddingHorizontal: 0 }]}>
            <View style={styles.medicineList}>
                {items.length === 0 ? (
                    <Text style={styles.emptyText}>No medicines selected</Text>
                ) : (
                    items.map((ci, idx) => (
                        <View key={`${ci.id ?? idx}_${ci.cartId ?? 0}`} style={styles.itemWrapper}>
                            <View style={styles.medicineItem}>
                                <View style={styles.imageContainer}>
                                    {ci.image ? (
                                        <Image source={{ uri: ci.image }} style={styles.medicineImage} />
                                    ) : (
                                        <View style={styles.medicineImagePlaceholder} />
                                    )}
                                </View>
                                <View style={styles.medicineMainInfo}>
                                    <Text style={styles.medicineName} numberOfLines={2}>
                                        {ci.name}
                                    </Text>
                                    {ci.subtitle && (
                                        <Text style={styles.medicinePack}>{ci.subtitle}</Text>
                                    )}
                                </View>

                                <View style={styles.medicineActionGroup}>
                                    <View style={styles.priceContainer}>
                                        {ci.originalPrice && ci.originalPrice > ci.price && (
                                            <Text style={styles.originalPrice}>
                                                {"\u20B9"}{Math.round(ci.originalPrice)}
                                            </Text>
                                        )}
                                        <Text style={styles.currentPrice}>
                                            {"\u20B9"}{Math.round(ci.price)}
                                        </Text>
                                    </View>

                                    <View style={styles.qtyControl}>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => onDecreaseQuantity(ci.id)}
                                        >
                                            <Text style={styles.qtyBtnText}>{"\u2212"}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>
                                            {ci.quantity || 1}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => onIncreaseQuantity(ci.id)}
                                        >
                                            <Text style={styles.qtyBtnText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            {idx !== items.length - 1 && (
                                <View style={styles.itemDivider} />
                            )}
                        </View>
                    ))
                )}
            </View>

            {showPricingDetails && (
                <View style={styles.deliveryCard}>
                    <View style={styles.deliveryRow}>
                        <Text style={styles.deliveryLabel}>Item Price</Text>
                        <Text style={styles.deliveryValue}>
                            {"\u20B9"}{itemsTotal.toFixed(0)}
                        </Text>
                    </View>
                    <View style={styles.deliveryRow}>
                        <Text style={styles.deliveryLabel}>Delivery Charges</Text>
                        <Text style={styles.deliveryValue}>
                            {"\u20B9"}{deliveryCharges}
                        </Text>
                    </View>
                    <View style={styles.lineSeparator} />
                    <View style={[styles.deliveryRow, { marginTop: 6 }]}>
                        <Text style={styles.toPayLabel}>TO PAY</Text>
                        <Text style={styles.toPayValue}>
                            {"\u20B9"}{displayedTotal.toFixed(0)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default CartItemsList;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
    },
    medicineList: {
        backgroundColor: "#fff",
        paddingHorizontal: getResponsiveSpacing(16),
    },
    itemWrapper: {
        // paddingVertical: getResponsiveSpacing(5),
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        color: '#666',
        fontFamily: fonts.regular,
        fontSize: getResponsiveFontSize(14),
    },
    medicineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: getResponsiveSpacing(15),
    },
    medicineMainInfo: {
        flex: 1,
        paddingRight: 10,
    },
    medicineName: {
        fontFamily: fonts.semiBold,
        fontSize: getResponsiveFontSize(14),
        color: '#3B2032',
        lineHeight: 20,
    },
    medicinePack: {
        fontFamily: fonts.regular,
        fontSize: getResponsiveFontSize(12),
        color: '#8A6F7F',
        marginTop: 4,
    },
    medicineActionGroup: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveSpacing(8),
    },
    originalPrice: {
        fontSize: getResponsiveFontSize(12),
        color: '#A0A0A0',
        fontFamily: fonts.regular,
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    currentPrice: {
        fontSize: getResponsiveFontSize(16),
        color: '#000',
        fontFamily: fonts.bold,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C15E9C',
        borderRadius: 20,
        backgroundColor: '#fff',
        paddingHorizontal: 4,
    },
    qtyButton: {
        width: getResponsiveSpacing(28),
        height: getResponsiveSpacing(28),
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnText: {
        fontSize: getResponsiveFontSize(18),
        color: '#C15E9C',
        fontWeight: 'bold',
    },
    qtyText: {
        fontFamily: fonts.semiBold,
        marginHorizontal: getResponsiveSpacing(12),
        color: '#C15E9C',
        fontSize: getResponsiveFontSize(14),
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    deliveryCard: {
        backgroundColor: "#fff",
        padding: 15,
        borderTopWidth: 8,
        borderTopColor: '#f5f5f5',
        marginTop: getResponsiveSpacing(10),
    },
    deliveryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    deliveryLabel: {
        fontFamily: fonts.regular,
        fontSize: getResponsiveFontSize(14),
        color: '#666',
    },
    deliveryValue: {
        fontFamily: fonts.semiBold,
        fontSize: getResponsiveFontSize(14),
        color: '#000',
    },
    lineSeparator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 4,
        borderStyle: 'dashed',
    },
    toPayLabel: {
        fontFamily: fonts.semiBold,
        fontSize: getResponsiveFontSize(14),
        color: '#000',
    },
    toPayValue: {
        fontFamily: fonts.bold,
        fontSize: getResponsiveFontSize(16),
        color: '#C15E9C',
    },
    imageContainer: {
        marginRight: getResponsiveSpacing(12),
        justifyContent: 'center',
    },
    medicineImage: {
        width: getResponsiveSpacing(60),
        height: getResponsiveSpacing(60),
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    medicineImagePlaceholder: {
        width: getResponsiveSpacing(60),
        height: getResponsiveSpacing(60),
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
});
