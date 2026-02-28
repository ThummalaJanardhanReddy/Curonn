import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import { useUser } from './UserContext';
import { getCartData, saveCartData } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
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

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    loading: boolean;
    addItem: (medicine: any, quantity: number) => Promise<void>;
    updateQuantity: (cartId: number, quantity: number, medicineId: string) => Promise<void>;
    removeItem: (cartId: number, medicineId: string) => Promise<void>;
    refreshCart: () => Promise<void>;
    clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const IMG_CACHE_KEY = 'medicine_image_cache';

const transformDriveUrl = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        // Thumbnail is the most robust direct-link format for Drive images in RN
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }
    return url;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { userData } = useUser();
    const patientId = userData?.e_id;

    // Helper to save image to cache
    const saveImageToCache = async (medId: string | number, url: string) => {
        if (!url) return;
        try {
            const cacheRaw = await AsyncStorage.getItem(IMG_CACHE_KEY);
            const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
            cache[medId.toString()] = url;
            await AsyncStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache));
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        const loadInitialCart = async () => {
            const stored = await getCartData();
            if (stored && stored.length > 0) {
                const transformed = stored.map(it => ({
                    ...it,
                    image: transformDriveUrl(it.image || '')
                }));
                setCartItems(transformed);
            }
        };
        loadInitialCart();
    }, []);

    const refreshCart = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            const res: any = await axiosClient.get(ApiRoutes.MedicalOrders.getActiveCart, { params: { patientId } });
            // API might return data directly or in .data/.items
            const list: any[] = Array.isArray(res) ? res : (res as any)?.items ?? (res as any)?.data ?? [];

            const cacheRaw = await AsyncStorage.getItem(IMG_CACHE_KEY);
            const cache = cacheRaw ? JSON.parse(cacheRaw) : {};

            const mapped: CartItem[] = list.map((it: any) => {
                const medId = it.medicineId ?? it.medicineMasterId ?? it.medicine?.id ?? it.id;
                const id = (medId ?? it.cartId ?? `rand_${Math.random()}`).toString();

                // Try multiple possible paths for the image
                let imgUrl = it.imageUrl ?? it.image ?? it.medicineImageUrl ?? it.medicine?.imageUrl ?? it.medicine?.image ?? '';

                // If missing from API, look in our local cache
                if (!imgUrl && medId) {
                    imgUrl = cache[medId.toString()] || '';
                }

                return {
                    id,
                    medicineId: medId,
                    name: it.medicineName ?? it.name ?? it.medicine?.medicineName ?? 'Unknown',
                    price: Number(it.curonnPrice ?? it.price ?? it.totalPrice ?? it.mrp ?? 0),
                    originalPrice: Number(it.streepBoxPrice ?? it.mrp ?? it.originalPrice ?? 0),
                    quantity: Number(it.quantity ?? it.qty ?? 1),
                    subtitle: it.streepBoxQty ?? it.package ?? it.description ?? '',
                    description: it.description ?? '',
                    cartId: it.cartId ?? it.id ?? it.cart_id,
                    image: transformDriveUrl(imgUrl),
                };
            });

            setCartItems(mapped);
            await saveCartData(mapped);
        } catch (err) {
            console.error('[CartContext] Error refreshing cart:', err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (patientId) {
            refreshCart();
        }
    }, [patientId, refreshCart]);

    const addItem = async (medicine: any, quantity: number) => {
        if (!patientId) return;
        try {
            const existingItem = cartItems.find(it => it.id === medicine.id.toString());
            const price = (medicine.curonnPrice ?? medicine.price ?? '0').toString().replace(/[^0-9.]/g, '');

            const payload = {
                patientId,
                medicineId: Number(medicine.id),
                quantity: (existingItem?.quantity ?? 0) + quantity,
                cartId: existingItem?.cartId ?? 0,
                price: Number(price),
                totalPrice: Number(price) * ((existingItem?.quantity ?? 0) + quantity),
            };

            const res: any = await axiosClient.post(ApiRoutes.MedicalOrders.saveCartItem, payload);
            const newCartId = res?.cartId ?? res?.data?.cartId ?? res?.id ?? res?.cart_id;

            // Extract and cache image URL from the medicine being added
            const rawImg = medicine.image ?? medicine.imageUrl ?? '';
            if (rawImg) {
                await saveImageToCache(medicine.id, rawImg);
            }

            const newItem: CartItem = {
                id: medicine.id.toString(),
                medicineId: Number(medicine.id),
                name: medicine.name,
                price: Number(price),
                originalPrice: Number(medicine.streepBoxPrice ?? medicine.originalPrice ?? 0),
                quantity: (existingItem?.quantity ?? 0) + quantity,
                subtitle: medicine.subtitle ?? medicine.streepBoxQty ?? '',
                description: medicine.description ?? '',
                cartId: newCartId ? Number(newCartId) : undefined,
                image: transformDriveUrl(rawImg),
            };

            setCartItems(prev => {
                const filtered = prev.filter(it => it.id !== newItem.id);
                return [...filtered, newItem];
            });

            await refreshCart();
        } catch (err) {
            console.error('[CartContext] Error adding item:', err);
            throw err;
        }
    };

    const updateQuantity = async (cartId: number, quantity: number, medicineId: string) => {
        try {
            const item = cartItems.find(it => it.id === medicineId);
            if (!item) return;

            // Use the parameterized route function
            const url = ApiRoutes.MedicalOrders.updateCartQuantity(cartId, quantity);

            const payload = {
                cartId,
                quantity,
                patientId,
                medicineId: Number(item.medicineId || medicineId),
                price: item.price,
                totalPrice: item.price * quantity,
            };

            await axiosClient.post(url, payload);

            setCartItems(prev => prev.map(it =>
                it.id === medicineId ? { ...it, quantity } : it
            ));

            await refreshCart();
        } catch (err) {
            console.error('[CartContext] Error updating quantity:', err);
        }
    };

    const removeItem = async (cartId: number, medicineId: string) => {
        try {
            await axiosClient.get(`${ApiRoutes.MedicalOrders.deleteCartItem}?cartId=${cartId}`);
            setCartItems(prev => prev.filter(it => it.id !== medicineId));
            await refreshCart();
        } catch (err) {
            console.error('[CartContext] Error removing item:', err);
        }
    };

    const clearCart = async () => {
        setCartItems([]);
        await saveCartData([]);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount: cartItems.length,
            loading,
            addItem,
            updateQuantity,
            removeItem,
            refreshCart,
            clearCart,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
