import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';

export interface Order {
    _id: string;
    orderReference: string;
    hasSlip?: boolean;
    slipVerified?: boolean;
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    items: OrderItem[];
    totalAmount: number;
    orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
    shippingAddress: string;
    shippingAddressId?: {
        _id: string;
        addressLabel?: string;
        recipientName: string;
        phone?: string;
        streetAddress: string;
        subDistrict?: string;
        district: string;
        province: string;
        zipCode: string;
        isDefault: boolean;
    };
    paymentMethod: string;
    source: 'online' | 'pos';
    createdAt: string;
    updatedAt: string;
    shippingInfo?: {
        provider: string;
        trackingNumber: string;
        cost: number;
    };
    payments?: {
        _id: string;
        paymentMethod: string;
        amountPaid: number;
        transactionDate: string;
        slipImage?: string;
        isVerified: boolean;
    }[];
}

export interface OrderItem {
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    shippingSize?: 'small' | 'large';
    imageUrl?: string;
}

export interface CreateOrderData {
    shippingAddress?: string;
    paymentMethod?: string;
    shippingMethodId?: string;
    shippingAddressId?: string;
}

// Fetch all orders (admin) — request enough to support client-side filtering
export function useOrders(options?: any) {
    return useQuery<Order[]>({
        queryKey: ['orders', 'all'],
        queryFn: async () => {
            const response = await api.get('/orders/all/list?limit=500');
            return response.data.data as Order[];
        },
        staleTime: 30_000,
        ...options
    });
}

// Fetch customer orders
export function useCustomerOrders() {
    const customer = useAuthStore((state) => state.customer);

    return useQuery({
        queryKey: ['orders', 'customer'],
        queryFn: async () => {
            const response = await api.get('/orders');
            return response.data.data as Order[];
        },
        enabled: !!customer,
        staleTime: 60_000,
    });
}

// Fetch single order
export function useOrder(id: string) {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await api.get(`/orders/${id}`);
            return response.data.data as Order;
        },
        enabled: !!id,
        staleTime: 5 * 60_000,
    });
}

// Create order from cart
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateOrderData = {}) => {
            const response = await api.post('/orders', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('สั่งซื้อสำเร็จแล้ว!', {
                description: 'ขอบคุณสำหรับการสั่งซื้อ',
            });
        },
        onError: (error: any) => {
            toast.error('ไม่สามารถสั่งซื้อได้', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}

// Cancel order by customer
export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/orders/${id}/cancel`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('ยกเลิกคำสั่งซื้อสำเร็จ');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'ไม่สามารถยกเลิกได้');
        },
    });
}

// Update order status (admin)
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, shippingInfo }: { id: string; status?: Order['orderStatus']; shippingInfo?: Order['shippingInfo'] }) => {
            const payload: any = {};
            if (status) payload.orderStatus = status;
            if (shippingInfo) payload.shippingInfo = shippingInfo;

            const response = await api.patch(`/orders/${id}/status`, payload);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
            toast.success('Order status updated!');
        },
        onError: (error: any) => {
            toast.error('Failed to update order status', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}
// Upload payment slip
export function useUploadSlip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            const formData = new FormData();
            formData.append('slip', file);
            const response = await api.post(`/orders/${id}/slip`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
            toast.success('อัปโหลดสลิปการโอนเงินเรียบร้อยแล้ว');
        },
        onError: (error: any) => {
            toast.error('ไม่สามารถอัปโหลดสลิปได้', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}
// Verify payment (admin)
export function useVerifyPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
            const response = await api.post(`/orders/${id}/verify-payment`, { isVerified });
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
            toast.success(variables.isVerified ? 'Payment verified' : 'Payment unverified');
        },
        onError: (error: any) => {
            toast.error('Failed to verify payment', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}

// Get PromptPay QR Code — immutable once generated
export function useOrderQRCode(id: string, enabled = true) {
    return useQuery({
        queryKey: ['order', id, 'qrcode'],
        queryFn: async () => {
            const response = await api.get(`/orders/${id}/qrcode`);
            return response.data.data.qrCode as string;
        },
        enabled: !!id && enabled,
        staleTime: Infinity,
    });
}
