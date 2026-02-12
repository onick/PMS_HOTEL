import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
    ManagerDashboardData,
    OccupancyReportData,
    AdrReportData,
    RevparReportData,
    RevenueReportData,
    NoShowReportData,
    PaymentDistributionData,
} from '@/lib/api';

// ─── Manager Dashboard ─────────────────────────────────────
export function useManagerDashboard() {
    return useQuery<ManagerDashboardData>({
        queryKey: ['manager-dashboard'],
        queryFn: async () => {
            const res = await api.getManagerDashboard();
            return res.data;
        },
        refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 min
        staleTime: 2 * 60 * 1000,
    });
}

// ─── Individual Reports ─────────────────────────────────────
export function useOccupancyReport(from: string, to: string, enabled = true) {
    return useQuery<OccupancyReportData>({
        queryKey: ['report-occupancy', from, to],
        queryFn: async () => {
            const res = await api.getOccupancyReport(from, to);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}

export function useAdrReport(from: string, to: string, enabled = true) {
    return useQuery<AdrReportData>({
        queryKey: ['report-adr', from, to],
        queryFn: async () => {
            const res = await api.getAdrReport(from, to);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRevparReport(from: string, to: string, enabled = true) {
    return useQuery<RevparReportData>({
        queryKey: ['report-revpar', from, to],
        queryFn: async () => {
            const res = await api.getRevparReport(from, to);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRevenueReport(from: string, to: string, granularity: 'day' | 'week' | 'month' = 'day', enabled = true) {
    return useQuery<RevenueReportData>({
        queryKey: ['report-revenue', from, to, granularity],
        queryFn: async () => {
            const res = await api.getRevenueReport(from, to, granularity);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}

export function useNoShowReport(from: string, to: string, enabled = true) {
    return useQuery<NoShowReportData>({
        queryKey: ['report-no-shows', from, to],
        queryFn: async () => {
            const res = await api.getNoShowReport(from, to);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}

export function usePaymentDistribution(from: string, to: string, enabled = true) {
    return useQuery<PaymentDistributionData>({
        queryKey: ['report-payments', from, to],
        queryFn: async () => {
            const res = await api.getPaymentDistribution(from, to);
            return res.data;
        },
        enabled: enabled && !!from && !!to,
        staleTime: 5 * 60 * 1000,
    });
}
