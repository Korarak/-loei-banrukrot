import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useDashboardSummary = () => {
    return useQuery({
        queryKey: ['dashboard-summary'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/summary');
            return data.data;
        },
    });
};
