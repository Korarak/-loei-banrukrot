import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';

export interface CartItem {
    _id: string; // generated or cart_item_id
    product: {
        _id: string;
        productName: string;
        shippingSize?: 'small' | 'large';
        imageUrl?: string;
    };
    variant: {
        _id: string;
        sku: string;
        price: number;
    };
    quantity: number;
}

export interface Cart {
    _id: string;
    customer: string;
    items: CartItem[];
    totalAmount: number;
}

// Get customer's cart
export function useCart() {
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated);
    const isAuth = isCustomerAuthenticated();

    return useQuery<Cart>({
        queryKey: ['cart'],
        queryFn: async () => {
            try {
                const response = await api.get('/cart');
                const { cart, items, totalAmount } = response.data.data;
                return {
                    _id: cart._id,
                    customer: cart.customerId,
                    items,
                    totalAmount
                };
            } catch (error) {
                // If 404 (no cart yet), return empty structure
                return { _id: 'new', customer: 'me', items: [], totalAmount: 0 };
            }
        },
        retry: 1,
        enabled: isAuth,
    });
}

interface AddToCartData {
    productId: string;
    variantId: string;
    quantity: number;
}

// Add item to cart
export function useAddToCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: AddToCartData) => {
            const response = await api.post('/cart/items', {
                productId: data.productId,
                variantId: data.variantId,
                quantity: data.quantity
            });
            return response.data;
        },
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData<Cart>(['cart']);

            queryClient.setQueryData<Cart>(['cart'], (old) => {
                if (!old) return old;
                const existingIdx = old.items.findIndex(i => i.variant._id === newItem.variantId);
                if (existingIdx >= 0) {
                    const items = [...old.items];
                    items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + newItem.quantity };
                    return { ...old, items };
                }
                return {
                    ...old,
                    items: [...old.items, {
                        _id: `optimistic-${Date.now()}`,
                        product: { _id: newItem.productId, productName: '' },
                        variant: { _id: newItem.variantId, sku: '', price: 0 },
                        quantity: newItem.quantity,
                    }],
                };
            });

            return { previousCart };
        },
        onError: (_err, _newItem, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}

// Update cart item quantity
export function useUpdateCartItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
            const response = await api.put(`/cart/items/${itemId}`, { quantity });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update cart');
        },
    });
}

// Remove item from cart
export function useRemoveCartItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (itemId: string) => {
            const response = await api.delete(`/cart/items/${itemId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Removed from cart');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove item');
        },
    });
}

// Clear entire cart
export function useClearCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.delete('/cart');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Cart cleared');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to clear cart');
        },
    });
}
