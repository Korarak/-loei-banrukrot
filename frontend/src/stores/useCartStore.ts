import { create } from 'zustand';

interface CartStore {
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
}

// Simplified cart store - only for UI state
// Actual cart data is managed by TanStack Query (useCart hook)
export const useCartStore = create<CartStore>()((set) => ({
    isOpen: false,
    openCart: () => set({ isOpen: true }),
    closeCart: () => set({ isOpen: false }),
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
}));
