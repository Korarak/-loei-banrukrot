import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePicture?: string;
}

interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePicture?: string;
}

interface AuthState {
    user: User | null;
    customer: Customer | null;
    userToken: string | null;
    customerToken: string | null;
    isHydrated: boolean;

    loginUser: (user: User, token: string) => void;
    logoutUser: () => void;

    loginCustomer: (customer: Customer, token: string) => void;
    logoutCustomer: () => void;

    isAuthenticated: () => boolean;
    isUserAuthenticated: () => boolean;
    isCustomerAuthenticated: () => boolean;
    setHydrated: () => void;
    updateCustomer: (customer: Partial<Customer>) => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            customer: null,
            userToken: null,
            customerToken: null,
            isHydrated: false,

            loginUser: (user, token) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('userToken', token);
                }
                set({ user, userToken: token });
            },

            logoutUser: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('userToken');
                }
                set({ user: null, userToken: null });
            },

            loginCustomer: (customer, token) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('customerToken', token);
                }
                set({ customer, customerToken: token });
            },

            logoutCustomer: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('customerToken');
                }
                set({ customer: null, customerToken: null });
            },

            isAuthenticated: () => {
                const state = get();
                return !!(state.user || state.customer);
            },

            isUserAuthenticated: () => {
                const state = get();
                return !!(state.user && state.userToken);
            },

            isCustomerAuthenticated: () => {
                const state = get();
                return !!(state.customer && state.customerToken);
            },

            setHydrated: () => {
                set({ isHydrated: true });
            },

            updateCustomer: (updatedData) => {
                set((state) => ({
                    customer: state.customer ? { ...state.customer, ...updatedData } : null
                }));
            },

            updateUser: (updatedData: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedData } : null
                }));
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                customer: state.customer,
                userToken: state.userToken,
                customerToken: state.customerToken,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);

