/**
 * prescriptionStore.ts
 *
 * A lightweight module-level singleton used to pass prescription data
 * (selected images + notes) between screens without relying on query params
 * (which can't carry complex objects in expo-router).
 *
 * Usage:
 *   - Write:  prescriptionStore.set({ images, notes, option })
 *   - Read:   prescriptionStore.get()
 *   - Clear:  prescriptionStore.clear()
 */

export interface PrescriptionImage {
    uri: string;
    fileName?: string;
}

export interface PrescriptionStoreData {
    images: PrescriptionImage[];
    notes: string;
    option: 'all' | 'specific';
    /** true when the store was populated from an "Edit" action on BookingPayLater */
    isEditMode?: boolean;
}

const defaultData: PrescriptionStoreData = {
    images: [],
    notes: '',
    option: 'all',
    isEditMode: false,
};

let _store: PrescriptionStoreData = { ...defaultData };

export const prescriptionStore = {
    set(data: PrescriptionStoreData): void {
        _store = { ...data };
    },

    get(): PrescriptionStoreData {
        return { ..._store, images: [..._store.images] };
    },

    clear(): void {
        _store = { ...defaultData };
    },

    hasData(): boolean {
        return _store.images.length > 0;
    },
};
