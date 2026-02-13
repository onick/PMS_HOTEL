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
    async login(email: string, password: string, deviceName = 'web') {
        const res = await this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: { email, password, device_name: deviceName },
        });
        this.setToken(res.token);
        localStorage.setItem('api_token', res.token);
        return res;
    }

    async register(data: { name: string; email: string; password: string; password_confirmation: string; hotel_name: string }) {
        const res = await this.request<{ token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: data,
        });
        this.setToken(res.token);
        localStorage.setItem('api_token', res.token);
        return res;
    }

    async logout() {
        const res = await this.request<{ message: string }>('/auth/logout', { method: 'POST' });
        this.clearToken();
        localStorage.removeItem('api_token');
        return res;
    }

    async me() {
        return this.request<{ data: any }>('/auth/me');
    }

    async updateProfile(data: Record<string, unknown>) {
        return this.request<{ message: string; user: any }>('/auth/me', { method: 'PUT', body: data });
    }

    async switchHotel(hotelId: number) {
        return this.request<{ message: string }>('/auth/switch-hotel', { method: 'POST', body: { hotel_id: hotelId } });
    }

    // --- Hotel Settings ---
    async getHotel() {
        return this.request<{ data: HotelData }>('/hotel');
    }

    async updateHotel(data: Partial<HotelData>) {
        return this.request<{ message: string; hotel: HotelData }>('/hotel', {
            method: 'PUT',
            body: data as Record<string, unknown>,
        });
    }

    async getHotelStats() {
        return this.request<{ stats: HotelStats }>('/hotel/stats');
    }

    // --- Room Types ---
    async getRoomTypes(params?: Record<string, string>) {
        return this.request<{ data: any[] }>('/room-types', { params });
    }
    async createRoomType(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/room-types', { method: 'POST', body: data });
    }
    async getRoomType(id: number) {
        return this.request<{ data: any }>(`/room-types/${id}`);
    }
    async updateRoomType(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/room-types/${id}`, { method: 'PUT', body: data });
    }
    async deleteRoomType(id: number) {
        return this.request<{ message: string }>(`/room-types/${id}`, { method: 'DELETE' });
    }

    // --- Rooms ---
    async getRooms(params?: Record<string, string>) {
        return this.request<{ data: any[] }>('/rooms', { params });
    }
    async createRoom(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/rooms', { method: 'POST', body: data });
    }
    async getRoom(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}`);
    }
    async updateRoom(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/rooms/${id}`, { method: 'PUT', body: data });
    }
    async deleteRoom(id: number) {
        return this.request<{ message: string }>(`/rooms/${id}`, { method: 'DELETE' });
    }
    async getStatusGrid() {
        return this.request<{ rooms: any[]; summary: any }>('/rooms/status-grid');
    }
    async markRoomClean(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}/mark-clean`, { method: 'POST' });
    }
    async markRoomDirty(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}/mark-dirty`, { method: 'POST' });
    }
    async markRoomInspecting(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}/mark-inspecting`, { method: 'POST' });
    }
    async roomOutOfOrder(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}/out-of-order`, { method: 'POST' });
    }
    async roomBackInService(id: number) {
        return this.request<{ data: any }>(`/rooms/${id}/back-in-service`, { method: 'POST' });
    }

    // --- Guests ---
    async getGuests(params?: Record<string, string>) {
        return this.request<{ data: any[]; meta: any }>('/guests', { params });
    }
    async createGuest(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/guests', { method: 'POST', body: data });
    }
    async getGuest(id: number) {
        return this.request<{ data: any }>(`/guests/${id}`);
    }
    async updateGuest(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/guests/${id}`, { method: 'PUT', body: data });
    }
    async deleteGuest(id: number) {
        return this.request<{ message: string }>(`/guests/${id}`, { method: 'DELETE' });
    }
    async getGuestReservations(id: number) {
        return this.request<{ data: any[] }>(`/guests/${id}/reservations`);
    }
    async addGuestNote(id: number, data: { content: string }) {
        return this.request<{ message: string; data: any }>(`/guests/${id}/notes`, { method: 'POST', body: data });
    }

    // --- Availability ---
    async searchAvailability(data: Record<string, unknown>) {
        return this.request<{ data: any }>('/availability/search', { method: 'POST', body: data });
    }
    async getQuote(data: Record<string, unknown>) {
        return this.request<{ data: any }>('/availability/quote', { method: 'POST', body: data });
    }

    // --- Reservations ---
    async getReservations(params?: Record<string, string>) {
        return this.request<{ data: any[]; meta: any }>('/reservations', { params });
    }
    async createReservation(data: Record<string, unknown>) {
        return this.request<{ message: string; reservation: any }>('/reservations', { method: 'POST', body: data });
    }
    async getReservation(id: number) {
        return this.request<{ data: any }>(`/reservations/${id}`);
    }
    async getTodayArrivals() {
        return this.request<{ data: any[] }>('/reservations/today-arrivals');
    }
    async getTodayDepartures() {
        return this.request<{ data: any[] }>('/reservations/today-departures');
    }
    async getInHouseGuests() {
        return this.request<{ data: any[] }>('/reservations/in-house');
    }
    async checkIn(id: number, data?: Record<string, unknown>) {
        return this.request<{ message: string; reservation: any }>(`/reservations/${id}/check-in`, { method: 'POST', body: data });
    }
    async checkOut(id: number, data?: Record<string, unknown>) {
        return this.request<{ message: string; reservation: any }>(`/reservations/${id}/check-out`, { method: 'POST', body: data });
    }
    async cancelReservation(id: number, data?: { reason?: string }) {
        return this.request<{ message: string; reservation: any }>(`/reservations/${id}/cancel`, { method: 'POST', body: data });
    }
    async walkIn(data: Record<string, unknown>) {
        return this.request<{ message: string; reservation: any }>('/reservations/walk-in', { method: 'POST', body: data });
    }
    async checkInUnit(unitId: number, data?: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/reservation-units/${unitId}/check-in`, { method: 'POST', body: data });
    }
    async checkOutUnit(unitId: number, data?: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/reservation-units/${unitId}/check-out`, { method: 'POST', body: data });
    }

    // --- Rate Plans ---
    async getRatePlans(params?: Record<string, string>) {
        return this.request<{ data: any[] }>('/rate-plans', { params });
    }
    async createRatePlan(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/rate-plans', { method: 'POST', body: data });
    }
    async updateRatePlan(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/rate-plans/${id}`, { method: 'PUT', body: data });
    }
    async deleteRatePlan(id: number) {
        return this.request<{ message: string }>(`/rate-plans/${id}`, { method: 'DELETE' });
    }

    // --- Promo Codes ---
    async getPromoCodes(params?: Record<string, string>) {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return this.request<{ data: any[] }>(`/promo-codes${query}`);
    }
    async createPromoCode(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/promo-codes', { method: 'POST', body: data });
    }
    async updatePromoCode(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/promo-codes/${id}`, { method: 'PUT', body: data });
    }
    async deletePromoCode(id: number) {
        return this.request<{ message: string }>(`/promo-codes/${id}`, { method: 'DELETE' });
    }

    // --- Folios & Billing ---
    // --- Inventory (Supplies) ---
    async getInventoryItems() {
        return this.request<{ data: any[] }>('/inventory');
    }
    async createInventoryItem(data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>('/inventory', { method: 'POST', body: data });
    }
    async updateInventoryItem(id: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/inventory/${id}`, { method: 'PUT', body: data });
    }
    async deleteInventoryItem(id: number) {
        return this.request<{ message: string }>(`/inventory/${id}`, { method: 'DELETE' });
    }
    async getInventoryMovements(itemId: number) {
        return this.request<{ data: any[] }>(`/inventory/${itemId}/movements`);
    }
    async createInventoryMovement(itemId: number, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any; new_stock: number }>(`/inventory/${itemId}/movements`, { method: 'POST', body: data });
    }

    async getFolio(id: number) {
        return this.request<{ data: any }>(`/folios/${id}`);
    }
    async getFolioSummary(id: number) {
        return this.request<{ data: any }>(`/folios/${id}/summary`);
    }
    async postCharge(folioId: number, data: { category: string; description: string; amount_cents: number; charge_date?: string }) {
        return this.request<{ message: string; data: any; folio_balance_cents: number }>(`/folios/${folioId}/charges`, { method: 'POST', body: data });
    }
    async postAdjustment(folioId: number, data: { amount_cents: number; description?: string }) {
        return this.request<{ message: string; data: any; folio_balance_cents: number }>(`/folios/${folioId}/adjustments`, { method: 'POST', body: data });
    }
    async voidCharge(folioId: number, chargeId: number) {
        return this.request<{ message: string; folio_balance_cents: number }>(`/folios/${folioId}/charges/${chargeId}`, { method: 'DELETE' });
    }
    async postRoomCharges(folioId: number) {
        return this.request<{ message: string; data: any[]; folio_balance_cents: number }>(`/folios/${folioId}/post-room-charges`, { method: 'POST' });
    }

    // --- Payments ---
    async getFolioPayments(folioId: number) {
        return this.request<{ data: any[] }>(`/folios/${folioId}/payments`);
    }
    async recordPayment(folioId: number, data: { provider: string; amount_cents: number; description?: string; reference_number?: string; card_brand?: string; card_last_four?: string }) {
        return this.request<{ message: string; data: any; folio_balance_cents: number }>(`/folios/${folioId}/payments`, { method: 'POST', body: data });
    }
    async getPayment(id: number) {
        return this.request<{ data: any }>(`/payments/${id}`);
    }
    async refundPayment(id: number, data: { amount_cents?: number; reason: string; notes?: string }) {
        return this.request<{ message: string; data: any; folio_balance_cents: number }>(`/payments/${id}/refund`, { method: 'POST', body: data });
    }
    async getPaymentsByReservation(reservationId: number) {
        return this.request<{ data: any[] }>(`/payments/by-reservation/${reservationId}`);
    }

    // --- Night Audits ---
    async getNightAudits(params?: Record<string, string>) {
        return this.request<{ data: any[]; meta: any }>('/night-audits', { params });
    }
    async getNightAudit(id: number) {
        return this.request<{ data: any }>(`/night-audits/${id}`);
    }
    async runNightAudit() {
        return this.request<{ message: string; data: any }>('/night-audits/run', { method: 'POST' });
    }

    // --- Notifications ---
    async getNotifications(params?: Record<string, string>) {
        return this.request<{ data: any[]; meta: any }>('/notifications', { params });
    }
    async getUnreadCount() {
        return this.request<{ unread_count: number }>('/notifications/unread-count');
    }
    async markNotificationRead(id: number) {
        return this.request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' });
    }
    async markAllNotificationsRead() {
        return this.request<{ message: string }>('/notifications/read-all', { method: 'POST' });
    }

    // --- Booking Engine (public) ---
    async getBookingHotel(slug: string) {
        return this.request<{ data: any }>(`/booking/${slug}`);
    }
    async searchBookingAvailability(slug: string, data: Record<string, unknown>) {
        return this.request<{ data: any }>(`/booking/${slug}/search`, { method: 'POST', body: data });
    }
    async getBookingQuote(slug: string, data: Record<string, unknown>) {
        return this.request<{ data: any }>(`/booking/${slug}/quote`, { method: 'POST', body: data });
    }
    async createBookingReservation(slug: string, data: Record<string, unknown>) {
        return this.request<{ message: string; data: any }>(`/booking/${slug}/reserve`, { method: 'POST', body: data });
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

// --- Hotel Types ---
export interface HotelData {
    id: number;
    name: string;
    slug: string;
    legal_name?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    timezone?: string;
    currency?: string;
    logo_url?: string;
    check_in_time?: string;
    check_out_time?: string;
    tax_rate?: number;
    settings?: Record<string, unknown>;
}

export interface HotelStats {
    total_rooms: number;
    occupied: number;
    vacant: number;
    blocked: number;
    dirty: number;
    clean: number;
    today_arrivals: number;
    today_departures: number;
    in_house: number;
    occupancy_rate: number;
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
