import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AddImageData {
    productId: string;
    imagePath: string;
    isPrimary?: boolean;
}

interface UpdateImageData {
    productId: string;
    imageId: string;
    isPrimary?: boolean;
    sortOrder?: number;
}

interface DeleteImageData {
    productId: string;
    imageId: string;
}

interface ReorderImageData {
    productId: string;
    images: { id: string; sortOrder: number }[];
}

// Add product image
export function useAddProductImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, imagePath, isPrimary }: AddImageData) => {
            const { data } = await api.post(`/products/${productId}/images`, {
                imagePath,
                isPrimary
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Image added successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add image');
        }
    });
}

// Update product image
export function useUpdateProductImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, imageId, isPrimary, sortOrder }: UpdateImageData) => {
            const { data } = await api.put(`/products/${productId}/images/${imageId}`, {
                isPrimary,
                sortOrder
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Image updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update image');
        }
    });
}

// Delete product image
export function useDeleteProductImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, imageId }: DeleteImageData) => {
            const { data } = await api.delete(`/products/${productId}/images/${imageId}`);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Image deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete image');
        }
    });
}

// Reorder product images
export function useReorderProductImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, images }: ReorderImageData) => {
            const { data } = await api.put(`/products/${productId}/images/reorder`, {
                images
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Images reordered successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reorder images');
        }
    });
}
