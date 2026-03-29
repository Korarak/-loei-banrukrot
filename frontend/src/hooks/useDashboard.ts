import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type DateRange = '7d' | '30d' | '90d' | 'custom';

interface DashboardParams {
    range?: DateRange;
    startDate?: string;
    endDate?: string;
}

const buildParams = (params?: DashboardParams) => {
    const searchParams = new URLSearchParams();
    if (params?.range) searchParams.set('range', params.range);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const useDashboardSummary = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-summary', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/summary${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useDailyRevenue = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-daily-revenue', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/daily-revenue${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useRevenueComparison = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-revenue-comparison', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/revenue-comparison${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useHourlySales = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-hourly-sales', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/hourly-sales${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useCustomerInsights = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-customer-insights', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/customer-insights${buildParams(params)}`);
            return data.data;
        },
    });
};

export const useTopCategories = (params?: DashboardParams) => {
    return useQuery({
        queryKey: ['dashboard-top-categories', params?.range, params?.startDate, params?.endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/top-categories${buildParams(params)}`);
            return data.data;
        },
    });
};
