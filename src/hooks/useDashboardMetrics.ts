import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardMetricsResult {
  totalRooms: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouse: number;
  // From manager dashboard
  totalRevenue: number;
  avgAdr: number;
  avgRevpar: number;
  revenueChange: number;
  occupancyChange: number;
  // Today's live data
  todayRevenue: number;
  todayPaymentsCount: number;
  // Arrivals/departures detail
  arrivalsDetail: any[];
  departuresDetail: any[];
  // Sparkline
  sparkline: Array<{ date: string; occupancy: number; revenue_cents: number }>;
}

export function useDashboardMetrics(_hotelId: string) {
  return useQuery<DashboardMetricsResult>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // Fetch hotel stats and manager dashboard in parallel
      const [statsRes, dashboardRes, arrivalsRes, departuresRes] = await Promise.all([
        api.getHotelStats(),
        api.getManagerDashboard(),
        api.getTodayArrivals(),
        api.getTodayDepartures(),
      ]);

      const stats = statsRes.stats;
      const dashboard = dashboardRes.data;

      // Calculate revenue direction as percentage change
      const kpis30d = dashboard.kpis_30d;
      const kpis7d = dashboard.kpis_7d;
      const avgDailyRevenue30d = kpis30d.days_with_data > 0
        ? kpis30d.total_revenue_cents / kpis30d.days_with_data
        : 0;
      const avgDailyRevenue7d = kpis7d.total_revenue_cents / 7;
      const revenueChange = avgDailyRevenue30d > 0
        ? ((avgDailyRevenue7d - avgDailyRevenue30d) / avgDailyRevenue30d) * 100
        : 0;

      const occupancyChange = kpis30d.avg_occupancy_rate > 0
        ? kpis7d.avg_occupancy_rate - kpis30d.avg_occupancy_rate
        : 0;

      return {
        totalRooms: stats.total_rooms,
        occupied: stats.occupied,
        vacant: stats.vacant,
        occupancyRate: stats.occupancy_rate,
        todayArrivals: stats.today_arrivals,
        todayDepartures: stats.today_departures,
        inHouse: stats.in_house,
        totalRevenue: kpis30d.total_revenue_cents / 100,
        avgAdr: kpis30d.avg_adr_cents / 100,
        avgRevpar: kpis30d.avg_revpar_cents / 100,
        revenueChange: Math.round(revenueChange * 10) / 10,
        occupancyChange: Math.round(occupancyChange * 10) / 10,
        todayRevenue: dashboard.today.revenue_cents / 100,
        todayPaymentsCount: dashboard.today.payments_count,
        arrivalsDetail: arrivalsRes.data || [],
        departuresDetail: departuresRes.data || [],
        sparkline: dashboard.sparkline || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
