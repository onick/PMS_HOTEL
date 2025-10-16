-- Create function to get occupancy and revenue statistics
CREATE OR REPLACE FUNCTION public.get_occupancy_stats(hotel_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month_start DATE;
  previous_month_start DATE;
  current_revenue DECIMAL(10,2) := 0;
  previous_revenue DECIMAL(10,2) := 0;
  revenue_change DECIMAL(5,2) := 0;
  occupancy_change DECIMAL(5,2) := 0;
  result JSON;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  previous_month_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');

  -- Calculate current month revenue
  SELECT COALESCE(SUM(total_amount_cents / 100.0), 0)
  INTO current_revenue
  FROM reservations
  WHERE hotel_id = hotel_id_param
    AND status = 'CONFIRMED'
    AND created_at >= current_month_start;

  -- Calculate previous month revenue
  SELECT COALESCE(SUM(total_amount_cents / 100.0), 0)
  INTO previous_revenue
  FROM reservations
  WHERE hotel_id = hotel_id_param
    AND status = 'CONFIRMED'
    AND created_at >= previous_month_start
    AND created_at < current_month_start;

  -- Calculate revenue change percentage
  IF previous_revenue > 0 THEN
    revenue_change := ((current_revenue - previous_revenue) / previous_revenue) * 100;
  END IF;

  result := json_build_object(
    'revenueChange', ROUND(revenue_change, 2),
    'occupancyChange', ROUND(occupancy_change, 2)
  );

  RETURN result;
END;
$$;