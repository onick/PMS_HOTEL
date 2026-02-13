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

    // --- Channel Manager ---
    async getChannelStats() {
        return this.request<{ data: ChannelStatsData }>('/channels/stats');
    }

    async getChannels() {
        return this.request<{ data: ChannelConnectionData[] }>('/channels');
    }

    async connectChannel(channel: string, credentials?: Record<string, string>) {
        return this.request<{ message: string; data: ChannelConnectionData }>('/channels', {
            method: 'POST',
            body: { channel, credentials },
        });
    }

    async updateChannel(id: number, data: { status?: string; credentials?: Record<string, string>; sync_config?: Record<string, unknown> }) {
        return this.request<{ message: string; data: ChannelConnectionData }>(`/channels/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteChannel(id: number) {
        return this.request<{ message: string }>(`/channels/${id}`, { method: 'DELETE' });
    }

    // Mapping management
    async getRoomTypeMappings(connectionId: number) {
        return this.request<{ data: RoomTypeMappingData[] }>(`/channels/${connectionId}/room-type-mappings`);
    }

    async saveRoomTypeMapping(connectionId: number, data: { room_type_id: number; ota_room_type_code: string; ota_room_type_name?: string }) {
        return this.request<{ message: string; data: RoomTypeMappingData }>(`/channels/${connectionId}/room-type-mappings`, {
            method: 'POST',
            body: data,
        });
    }

    async deleteRoomTypeMapping(connectionId: number, mappingId: number) {
        return this.request<{ message: string }>(`/channels/${connectionId}/room-type-mappings/${mappingId}`, {
            method: 'DELETE',
        });
    }

    async saveRatePlanMapping(connectionId: number, data: { rate_plan_id: number; room_type_id: number; ota_rate_plan_code: string; ota_rate_plan_name?: string }) {
        return this.request<{ message: string }>(`/channels/${connectionId}/rate-plan-mappings`, {
            method: 'POST',
            body: data,
        });
    }

    // Sync operations
    async syncChannel(id: number, options?: { dry_run?: boolean; days_ahead?: number }) {
        return this.request<{ message: string; data: SyncResultData }>(`/channels/${id}/sync`, {
            method: 'POST',
            body: options,
        });
    }

    async syncInventory(id: number, from: string, to: string, options?: { dry_run?: boolean; direct?: boolean }) {
        return this.request<{ message: string; data: SyncResultData }>(`/channels/${id}/sync-inventory`, {
            method: 'POST',
            body: { from, to, ...options },
        });
    }

    async syncRates(id: number, from: string, to: string, options?: { dry_run?: boolean; direct?: boolean }) {
        return this.request<{ message: string; data: SyncResultData }>(`/channels/${id}/sync-rates`, {
            method: 'POST',
            body: { from, to, ...options },
        });
    }

    async pullReservations(id: number, options?: { dry_run?: boolean }) {
        return this.request<{ message: string; data: SyncResultData }>(`/channels/${id}/pull-reservations`, {
            method: 'POST',
            body: options,
        });
    }

    async validateChannel(id: number) {
        return this.request<{ data: { valid: boolean; message: string } }>(`/channels/${id}/validate`, {
            method: 'POST',
        });
    }

    async syncAllChannels() {
        return this.request<{ message: string; data: { queued: number } }>('/channels/sync-all', {
            method: 'POST',
        });
    }

    async getChannelOutbox(id: number) {
        return this.request<{ data: OutboxItemData[]; stats: { pending: number; processing: number; failed: number } }>(`/channels/${id}/outbox`);
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

// --- Channel Manager Types ---
export interface ChannelConnectionData {
    id: number;
    channel: string;
    status: string;
    last_sync_at: string | null;
    last_error: string | null;
    total_reservations_received: number;
    room_type_mappings: RoomTypeMappingData[];
    rate_plan_mappings: RatePlanMappingData[];
    sync_config: Record<string, unknown> | null;
    created_at: string;
}

export interface RoomTypeMappingData {
    id: number;
    room_type_id: number;
    room_type_name?: string;
    ota_room_type_code: string;
    ota_room_type_name?: string;
    is_active: boolean;
}

export interface RatePlanMappingData {
    id: number;
    rate_plan_id: number;
    rate_plan_name?: string;
    room_type_id: number;
    ota_rate_plan_code: string;
    is_active: boolean;
}

export interface SyncLogData {
    id: number;
    channel_connection_id: number;
    channel?: string;
    direction: 'PUSH' | 'PULL';
    type: 'INVENTORY' | 'RATES' | 'RESERVATION';
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    items_processed: number;
    items_failed: number;
    error_message: string | null;
    error_code: string | null;
    retriable: boolean;
    dry_run: boolean;
    created_at: string;
}

export interface ChannelStatsData {
    channels: Array<{
        id: number;
        channel: string;
        label: string;
        color: string;
        status: string;
        last_sync_at: string | null;
        last_error: string | null;
        total_reservations: number;
        room_types_mapped: number;
        rate_plans_mapped: number;
    }>;
    recent_logs: SyncLogData[];
    pending_outbox: number;
    reservations_by_source_30d: Array<{
        source: string;
        label: string;
        count: number;
        revenue_cents: number;
        revenue: string;
    }>;
    total_active_channels: number;
    total_channels: number;
}

export interface SyncResultData {
    status: string;
    items_processed: number;
    items_failed: number;
    dry_run?: boolean;
    payload?: unknown;
    queued?: boolean;
}

export interface OutboxItemData {
    id: number;
    channel_connection_id: number;
    type: 'INVENTORY' | 'RATES';
    date: string;
    room_type_id: number;
    rate_plan_id: number | null;
    payload: Record<string, unknown>;
    status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
    attempts: number;
    max_attempts: number;
    next_retry_at: string | null;
    sent_at: string | null;
    last_error: string | null;
    created_at: string;
}

// Singleton instance
export const api = new ApiClient();
export default api;
