import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
    _id: string;
    productName: string;
    imageUrl?: string;
    price: number;
    slug: string; // Assuming we use slug or ID for navigation
}

interface WishlistStore {
    items: WishlistItem[];
    addToWishlist: (item: WishlistItem) => void;
    removeFromWishlist: (id: string) => void;
    isInWishlist: (id: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],
            addToWishlist: (item) => {
                const { items } = get();
                if (!items.find((i) => i._id === item._id)) {
                    set({ items: [...items, item] });
                }
            },
            removeFromWishlist: (id) => {
                set({ items: get().items.filter((item) => item._id !== id) });
            },
            isInWishlist: (id) => {
                return !!get().items.find((item) => item._id === id);
            },
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: 'wishlist-storage', // name of the item in the storage (must be unique)
        }
    )
);
