import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts } from '@/app/shared/styles/fonts';
import { colors } from '@/app/shared/styles/commonStyles';
import { getResponsiveFontSize, getResponsiveSpacing } from '@/app/shared/utils/responsive';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtitle?: string;
    description?: string;
    medicineId?: number;
    cartId?: number;
}

interface CartItemsListProps {
    items: CartItem[];
    onIncreaseQuantity: (id: string) => void;
    onDecreaseQuantity: (id: string) => void;
    itemsTotal: number;
    deliveryCharges?: number;
    displayedTotal: number;
    showPricingDetails?: boolean;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
    items,
    onIncreaseQuantity,
    onDecreaseQuantity,
    itemsTotal,
    deliveryCharges = 0,
    displayedTotal,
    showPricingDetails = true,
}) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medicine List</Text>
            <View style={styles.medicineListCard}>
                {items.length === 0 ? (
                    <Text style={styles.emptyText}>No medicines selected</Text>
                ) : (
                    items.map((ci, idx) => (
                        <View key={`${ci.id ?? idx}_${ci.cartId ?? 0}`}>
                            <View style={styles.medicineItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.medicineName}>
                                        {ci.name}
                                    </Text>
                                    {ci.subtitle && (
                                        <Text style={styles.medicinePack}>{ci.subtitle}</Text>
                                    )}
                                    {ci.description && (
                                        <Text style={styles.medicineDesc} numberOfLines={2}>
                                            {ci.description}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.medicineRight}>
                                    <Text style={styles.medicinePrice}>
                                        {"\u20B9"}
                                        {(
                                            Number(ci.price || 0) * Number(ci.quantity || 1)
                                        ).toFixed(0)}
                                    </Text>
                                    <View style={styles.qtyControl}>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => onDecreaseQuantity(ci.id)}
                                        >
                                            <Text style={styles.qtyBtnText}>
                                                {"\u2212"}
                                            </Text>
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
                            {"\u20B9"}
                            {itemsTotal.toFixed(0)}
                        </Text>
                    </View>
                    <View style={styles.deliveryRow}>
                        <Text style={styles.deliveryLabel}>Delivery Charges</Text>
                        <Text style={styles.deliveryValue}>
                            {"\u20B9"}
                            {deliveryCharges}
                        </Text>
                    </View>
                    <View style={styles.lineSeparator} />
                    <View style={[styles.deliveryRow, { marginTop: 6 }]}>
                        <Text style={styles.toPayLabel}>TO PAY</Text>
                        <Text style={styles.toPayValue}>
                            {"\u20B9"}
                            {displayedTotal.toFixed(0)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default CartItemsList;

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: getResponsiveSpacing(16),
        marginTop: getResponsiveSpacing(15),
    },
    sectionTitle: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: fonts.semiBold,
        color: '#000',
        marginBottom: getResponsiveSpacing(10),
    },
    medicineListCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: "#dbdbdb",
        marginBottom: getResponsiveSpacing(15),
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#666',
        fontFamily: fonts.regular,
    },
    medicineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: getResponsiveSpacing(10),
    },
    medicineName: {
        fontFamily: fonts.semiBold,
        fontSize: getResponsiveFontSize(14),
        color: '#000',
    },
    medicinePack: {
        fontFamily: fonts.regular,
        fontSize: getResponsiveFontSize(12),
        color: '#8A6F7F',
        marginTop: 2,
    },
    medicineDesc: {
        fontFamily: fonts.regular,
        fontSize: getResponsiveFontSize(12),
        color: '#000',
    },
    medicineRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    medicinePrice: {
        fontSize: getResponsiveFontSize(16),
        color: '#C15E9C',
        fontFamily: fonts.semiBold,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C15E9C',
        borderRadius: 20,
        marginTop: getResponsiveSpacing(5),
    },
    qtyButton: {
        width: getResponsiveSpacing(26),
        height: getResponsiveSpacing(26),
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnText: {
        fontSize: getResponsiveFontSize(18),
        color: '#C15E9C',
        fontWeight: '700',
    },
    qtyText: {
        fontFamily: fonts.semiBold,
        marginHorizontal: getResponsiveSpacing(10),
        color: '#C15E9C',
        fontSize: getResponsiveFontSize(14),
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#f5f5f5',
    },
    deliveryCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: "#dbdbdb",
        marginBottom: getResponsiveSpacing(20),
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
});
