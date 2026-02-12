// API client layer for Laravel backend
// This will eventually replace all direct Supabase calls

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RequestOptions {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    getToken(): string | null {
        // Try from memory first, then localStorage
        return this.token || localStorage.getItem('api_token');
    }

    private buildUrl(endpoint: string, params?: Record<string, string>): string {
        const url = new URL(`${API_BASE}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, value);
                }
            });
        }
        return url.toString();
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, params } = options;
        const token = this.getToken();

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(endpoint, params), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new ApiError(response.status, error.message || 'Request failed', error);
        }

        return response.json();
    }

    // --- Auth ---
    async login(email: string, password: string) {
        return this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
    }

    // --- Reports ---
    async getManagerDashboard() {
        return this.request<{ data: ManagerDashboardData }>('/reports/dashboard');
    }

    async getOccupancyReport(from: string, to: string) {
        return this.request<{ data: OccupancyReportData }>('/reports/occupancy', {
            params: { from, to },
        });
    }

    async getAdrReport(from: string, to: string) {
        return this.request<{ data: AdrReportData }>('/reports/adr', {
            params: { from, to },
        });
    }

    async getRevparReport(from: string, to: string) {
        return this.request<{ data: RevparReportData }>('/reports/revpar', {
            params: { from, to },
        });
    }

    async getRevenueReport(from: string, to: string, granularity: 'day' | 'week' | 'month' = 'day') {
        return this.request<{ data: RevenueReportData }>('/reports/revenue', {
            params: { from, to, granularity },
        });
    }

    async getNoShowReport(from: string, to: string) {
        return this.request<{ data: NoShowReportData }>('/reports/no-shows', {
            params: { from, to },
        });
    }

    async getPaymentDistribution(from: string, to: string) {
        return this.request<{ data: PaymentDistributionData }>('/reports/payments', {
            params: { from, to },
        });
    }
}

// --- Error class ---
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: any,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// --- Types ---
export interface ManagerDashboardData {
    generated_at: string;
    today: {
        date: string;
        arrivals_pending: number;
        departures_pending: number;
        in_house: number;
        revenue_cents: number;
        revenue: string;
        payments_count: number;
    };
    kpis_30d: {
        avg_occupancy_rate: number;
        avg_adr_cents: number;
        avg_adr: string;
        avg_revpar_cents: number;
        avg_revpar: string;
        total_revenue_cents: number;
        total_revenue: string;
        total_no_shows: number;
        days_with_data: number;
    };
    kpis_7d: {
        avg_occupancy_rate: number;
        avg_adr_cents: number;
        avg_adr: string;
        total_revenue_cents: number;
        total_revenue: string;
    };
    trends: {
        occupancy_direction: 'up' | 'down' | 'stable';
        adr_direction: 'up' | 'down' | 'stable';
        revenue_direction: 'up' | 'down' | 'stable';
    };
    sparkline: Array<{
        date: string;
        occupancy: number;
        revenue_cents: number;
    }>;
}

export interface OccupancyReportData {
    period: { from: string; to: string };
    summary: {
        avg_occupancy_rate: number;
        peak_occupancy_rate: number;
        lowest_occupancy_rate: number;
        days_with_data: number;
    };
    daily: Array<{
        date: string;
        total_rooms: number;
        occupied_rooms: number;
        occupancy_rate: number | null;
    }>;
}

export interface AdrReportData {
    period: { from: string; to: string };
    summary: {
        avg_adr_cents: number;
        avg_adr: string;
        max_adr_cents: number;
        min_adr_cents: number;
    };
    daily: Array<{
        date: string;
        adr_cents: number;
        adr: string;
        room_revenue_cents: number;
        occupied_rooms: number;
    }>;
}

export interface RevparReportData {
    period: { from: string; to: string };
    summary: {
        avg_revpar_cents: number;
        avg_revpar: string;
        max_revpar_cents: number;
        min_revpar_cents: number;
    };
    daily: Array<{
        date: string;
        revpar_cents: number;
        revpar: string;
        room_revenue_cents: number;
        total_rooms: number;
        occupancy_rate: number;
    }>;
}

export interface RevenueReportData {
    period: { from: string; to: string };
    granularity: string;
    summary: {
        total_room_revenue_cents: number;
        total_room_revenue: string;
        total_other_revenue_cents: number;
        total_other_revenue: string;
        total_revenue_cents: number;
        total_revenue: string;
        avg_daily_revenue_cents: number;
    };
    data: Array<{
        period: string;
        label: string;
        room_revenue_cents: number;
        room_revenue: string;
        other_revenue_cents: number;
        other_revenue: string;
        total_revenue_cents: number;
        total_revenue: string;
        days_in_period: number;
    }>;
}

export interface NoShowReportData {
    period: { from: string; to: string };
    summary: {
        total_no_shows: number;
        total_expected_arrivals: number;
        no_show_rate: number;
        lost_revenue_cents: number;
        lost_revenue: string;
    };
    daily: Array<{ date: string; no_shows: number }>;
    no_show_reservations: Array<{
        id: number;
        confirmation_code: string;
        check_in_date: string;
        guest: { name: string; email: string } | null;
        total_cents: number;
        total: string;
        source: string;
    }>;
}

export interface PaymentDistributionData {
    period: { from: string; to: string };
    summary: {
        total_payments: number;
        total_amount_cents: number;
        total_amount: string;
        avg_payment_cents: number;
        refunds_count: number;
        refunds_total_cents: number;
        net_revenue_cents: number;
    };
    by_provider: Array<{
        provider: string;
        count: number;
        amount_cents: number;
        amount: string;
        percentage_amount: number;
        percentage_count: number;
    }>;
    daily: Array<{
        date: string;
        count: number;
        total_cents: number;
        total: string;
        by_provider: Record<string, { count: number; amount_cents: number }>;
    }>;
}

// Singleton instance
export const api = new ApiClient();
export default api;
