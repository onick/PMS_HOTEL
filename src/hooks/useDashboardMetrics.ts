import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyStats {
  revenue: number;
  revenueChange: number;
  occupancy: number;
  occupancyChange: number;
  adr: number;
  adrChange: number;
  revpar: number;
  revparChange: number;
}

interface DashboardReservation {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  total_amount_cents: number;
  guests: number;
  customer: {
    name: string;
  };
  room_types?: {
    name: string;
  };
}

interface DashboardMetricsResult {
  allReservations: DashboardReservation[];
  totalRooms: number;
  activeToday: DashboardReservation[];
  checkInsToday: DashboardReservation[];
  checkOutsToday: DashboardReservation[];
  monthlyStats: MonthlyStats | null;
}

export function useDashboardMetrics(hotelId: string) {
  return useSupabaseQuery<DashboardMetricsResult>(
    ['dashboard-metrics', hotelId],
    async () => {      const today = new Date().toISOString().split('T')[0];

      // Ejecutar consultas en paralelo para mejor performance
      const [
        { data: allReservations },
        { count: totalRooms },
        { data: activeToday },
        { data: checkInsToday },
        { data: checkOutsToday },
        { data: monthlyStats, error: statsError },
      ] = await Promise.all([
        // Total de reservas
        supabase
          .from('reservations')
          .select('*, room_types(name)')
          .eq('hotel_id', hotelId),

        // Total de habitaciones
        supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', hotelId),

        // Reservas activas hoy
        supabase
          .from('reservations')
          .select('*')
          .eq('hotel_id', hotelId)
          .eq('status', 'CONFIRMED')
          .lte('check_in', today)
          .gte('check_out', today),

        // Check-ins hoy
        supabase
          .from('reservations')
          .select('*, room_types(name)')
          .eq('hotel_id', hotelId)
          .eq('check_in', today)
          .order('check_in', { ascending: true })
          .limit(5),

        // Check-outs hoy
        supabase
          .from('reservations')
          .select('*, room_types(name)')
          .eq('hotel_id', hotelId)
          .eq('check_out', today)
          .order('check_out', { ascending: true })
          .limit(5),

        // Métricas mes-sobre-mes
        supabase.rpc('get_occupancy_stats', { hotel_id_param: hotelId }),
      ]);

      if (statsError) {
        console.error('Error loading monthly stats:', statsError);
      }

      return {
        allReservations: (allReservations as DashboardReservation[]) || [],
        totalRooms: totalRooms || 0,
        activeToday: (activeToday as DashboardReservation[]) || [],
        checkInsToday: (checkInsToday as DashboardReservation[]) || [],
        checkOutsToday: (checkOutsToday as DashboardReservation[]) || [],
        monthlyStats: monthlyStats as MonthlyStats | null,
      };
    },
    {
      staleTime: 5 * 60 * 1000, // Considerar datos frescos por 5 minutos
      cacheTime: 10 * 60 * 1000, // Mantener en cache por 10 minutos
      refetchOnWindowFocus: true, // Refetch al volver a la ventana
      showErrorToast: true,
      errorMessage: 'Error al cargar métricas del dashboard',
    }
  );
}
