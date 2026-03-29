import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ReportParams {
    startDate?: string;
    endDate?: string;
    source?: 'all' | 'online' | 'pos';
    status?: 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
    categoryId?: string;
}

const buildParams = (params?: ReportParams) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.source && params.source !== 'all') searchParams.set('source', params.source);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.categoryId && params.categoryId !== 'all') searchParams.set('categoryId', params.categoryId);
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const useSalesReport = (params?: ReportParams) => {
    return useQuery({
        queryKey: ['report-sales', params],
        queryFn: async () => {
            const { data } = await api.get(`/reports/sales${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useProductReport = (params?: ReportParams) => {
    return useQuery({
        queryKey: ['report-products', params],
        queryFn: async () => {
            const { data } = await api.get(`/reports/products${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useCustomerReport = (params?: ReportParams) => {
    return useQuery({
        queryKey: ['report-customers', params],
        queryFn: async () => {
            const { data } = await api.get(`/reports/customers${buildParams(params)}`);
            return data.data;
        },
    });
};

export const exportReportUrl = (type: 'sales' | 'products' | 'customers', params?: ReportParams) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const query = buildParams(params);
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : '';
    
    // We append the token to the URL for simple GET downloads if needed, 
    // or handle download via api instance
    if (query) {
        return `${baseURL}/reports/export/csv${query}&type=${type}`;
    } else {
        return `${baseURL}/reports/export/csv?type=${type}`;
    }
};

export const downloadReportCSV = async (type: 'sales' | 'products' | 'customers', params?: ReportParams) => {
    try {
        const response = await api.get(`/reports/export/csv${buildParams(params)}&type=${type}`, {
            responseType: 'blob' // Important
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `${type}_report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        console.error('Error downloading CSV', error);
        throw error;
    }
};
