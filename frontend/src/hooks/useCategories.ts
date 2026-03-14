import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Category {
    _id: string;
    categoryId: number;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    dateCreated: string;
}

interface CreateCategoryData {
    name: string;
    description?: string;
    sortOrder?: number;
}

interface UpdateCategoryData {
    name?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
}

// Get all categories
export function useCategories(isActive?: boolean) {
    return useQuery({
        queryKey: ['categories', isActive],
        queryFn: async () => {
            const params = isActive !== undefined ? { isActive: isActive.toString() } : {};
            const { data } = await api.get('/categories', { params });
            return data.data as Category[];
        }
    });
}

// Get single category
export function useCategory(id: string) {
    return useQuery({
        queryKey: ['category', id],
        queryFn: async () => {
            const { data } = await api.get(`/categories/${id}`);
            return data.data as Category;
        },
        enabled: !!id
    });
}

// Create category
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categoryData: CreateCategoryData) => {
            const { data } = await api.post('/categories', categoryData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    });
}

// Update category
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }) => {
            const response = await api.put(`/categories/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        }
    });
}

// Delete category
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/categories/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    });
}

// Reorder categories
export function useReorderCategories() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categories: { id: string; sortOrder: number }[]) => {
            const response = await api.put('/categories/reorder', { categories });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categories reordered successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reorder categories');
        }
    });
}
