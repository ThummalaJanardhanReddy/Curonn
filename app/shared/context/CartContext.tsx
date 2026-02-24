import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import { useUser } from './UserContext';
import { saveCartData, getCartData } from '../utils/storage';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtitle?: string;
    description?: string;
    cartId?: number;
}

interface CartContextType {
    cartCount: number;
    cartItems: CartItem[];
    loading: boolean;
    refreshCart: () => Promise<void>;
    addItem: (medicine: any, quantity: number) => Promise<void>;
    updateQuantity: (cartId: number, nextQty: number, medicineId: string) => Promise<void>;
    removeItem: (cartId: number, medicineId: string) => Promise<void>;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { userData } = useUser();
    const patientId = userData?.e_id;

    // 1. Load from storage on mount
    useEffect(() => {
        const loadInitialCart = async () => {
            const stored = await getCartData();
            if (stored && stored.length > 0) {
                console.log('[CartContext] Loaded items from storage:', stored.length);
                setCartItems(stored);
            }
        };
        loadInitialCart();
    }, []);

    // 2. Save to storage whenever items change
    useEffect(() => {
        saveCartData(cartItems);
    }, [cartItems]);

    const refreshCart = useCallback(async () => {
        console.log('[CartContext] refreshCart triggered, patientId:', patientId);
        if (!patientId) {
            console.log('[CartContext] patientId is missing, keeping local items for now');
            return;
        }
        try {
            setLoading(true);
            const res: any = await axiosClient.get(ApiRoutes.MedicalOrders.getActiveCart, { params: { patientId } });
            const list: any[] = Array.isArray(res) ? res : res?.data ?? res?.items ?? res?.cartItems ?? [];

            const mapped: CartItem[] = list.map((it: any) => {
                const id = (it.medicineId ?? it.medicineMasterId ?? it.medicine?.id ?? it.id ?? `rand_${Math.random()}`).toString();
                return {
                    id,
                    name: it.medicineName ?? it.name ?? it.drugName ?? it.medicine?.medicineName ?? 'Unknown',
                    price: Number(it.curonnPrice ?? it.price ?? it.totalPrice ?? it.mrp ?? 0),
                    quantity: Number(it.quantity ?? it.qty ?? 1),
                    subtitle: it.streepBoxQty ?? it.package ?? it.description ?? '',
                    description: it.description ?? '',
                    cartId: it.cartId ?? it.id ?? it.cart_id,
                };
            });

            console.log('[CartContext] Successfully refreshed', mapped.length, 'items from server');
            setCartItems(mapped);
        } catch (error) {
            console.error('[CartContext] Failed to refresh cart:', error);
            // On failure, we keep the local state (it might be from storage)
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (patientId) {
            refreshCart();
        }
    }, [patientId, refreshCart]);

    const addItem = useCallback(async (medicine: any, quantity: number) => {
        if (!patientId) {
            Alert.alert('Error', 'User profile not loaded. Please try again.');
            return;
        }

        const price = medicine.curonnPrice ?? medicine.totalPrice ?? medicine.price ?? 0;
        const payload = {
            cartId: 0,
            medicineOrderId: 0,
            medicineId: medicine.id,
            patientId: patientId,
            medicineName: medicine.name,
            quantity,
            price,
            offer: 0,
            discount: 0,
            totalPrice: Number(price) * quantity,
            description: medicine.description ?? medicine.subtitle ?? '',
        };

        try {
            setLoading(true);
            const res: any = await axiosClient.post(ApiRoutes.MedicalOrders.saveCartItem, payload);
            const newCartId = res?.cartId ?? res?.data?.cartId ?? res?.id ?? res?.cart_id ?? res?.data?.cart_id;

            // Optimistic update or wait for refresh? Let's do both for maximum snappiness
            const newItem: CartItem = {
                id: medicine.id.toString(),
                name: medicine.name,
                price: Number(price),
                quantity,
                subtitle: medicine.subtitle ?? medicine.streepBoxQty ?? '',
                description: medicine.description ?? '',
                cartId: newCartId ? Number(newCartId) : undefined,
            };

            setCartItems(prev => {
                const existingIndex = prev.findIndex(item => item.id === newItem.id);
                if (existingIndex > -1) {
                    const next = [...prev];
                    next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity, cartId: newCartId || next[existingIndex].cartId };
                    return next;
                }
                return [...prev, newItem];
            });

            await refreshCart(); // Ensure server sync
        } catch (error) {
            console.error('[CartContext] addItem failed:', error);
            Alert.alert('Error', 'Failed to add item to cart');
        } finally {
            setLoading(false);
        }
    }, [patientId, refreshCart]);

    const updateQuantity = useCallback(async (cartId: number, nextQty: number, medicineId: string) => {
        if (!cartId) {
            console.warn('[CartContext] Cannot update quantity without cartId, refreshing...');
            await refreshCart();
            return;
        }
        try {
            setLoading(true);
            const url = ApiRoutes.MedicalOrders.updateCartQuantity(cartId, nextQty);
            await axiosClient.put(url);

            setCartItems(prev => prev.map(item =>
                item.id === medicineId ? { ...item, quantity: nextQty } : item
            ));

            await refreshCart();
        } catch (error) {
            console.error('[CartContext] updateQuantity failed:', error);
            Alert.alert('Error', 'Failed to update quantity');
        } finally {
            setLoading(false);
        }
    }, [refreshCart]);

    const removeItem = useCallback(async (cartId: number, medicineId: string) => {
        if (!cartId) {
            console.warn('[CartContext] Cannot remove item without cartId, refreshing...');
            setCartItems(prev => prev.filter(item => item.id !== medicineId));
            return;
        }
        try {
            setLoading(true);
            try {
                // Primary approach: cartItemId query parameter
                await axiosClient.delete(`${ApiRoutes.MedicalOrders.deleteCartItem}?cartItemId=${cartId}`);
            } catch (err1) {
                console.warn('[CartContext] Primary delete failed, trying fallback path...', err1);
                try {
                    // Fallback 1: path parameter
                    await axiosClient.delete(`${ApiRoutes.MedicalOrders.deleteCartItem}/${cartId}`);
                } catch (err2) {
                    console.warn('[CartContext] Fallback 1 failed, trying fallback 2...', err2);
                    // Fallback 2: cartId query parameter
                    await axiosClient.delete(ApiRoutes.MedicalOrders.deleteCartItem, { params: { cartId } });
                }
            }

            setCartItems(prev => prev.filter(item => item.id !== medicineId));
            await refreshCart();
        } catch (error) {
            console.error('[CartContext] removeItem failed:', error);
            Alert.alert('Error', 'Failed to remove item');
        } finally {
            setLoading(false);
        }
    }, [refreshCart]);

    const clearCart = useCallback(() => {
        console.log('[CartContext] Clearing cart globally');
        setCartItems([]);
        saveCartData([]);
    }, []);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartCount, cartItems, loading, refreshCart, addItem, updateQuantity, removeItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
