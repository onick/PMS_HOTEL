-- Migrar huéspedes existentes desde reservas
INSERT INTO public.guests (
  hotel_id,
  name,
  email,
  phone,
  total_stays,
  total_spent_cents,
  last_stay_date,
  created_at
)
SELECT 
  r.hotel_id,
  r.customer->>'name' as name,
  r.customer->>'email' as email,
  r.customer->>'phone' as phone,
  COUNT(DISTINCT r.id) as total_stays,
  SUM(CASE WHEN r.status = 'CHECKED_OUT' THEN r.total_amount_cents ELSE 0 END) as total_spent_cents,
  MAX(r.check_out) FILTER (WHERE r.status = 'CHECKED_OUT') as last_stay_date,
  MIN(r.created_at) as created_at
FROM public.reservations r
WHERE r.customer->>'email' IS NOT NULL
GROUP BY r.hotel_id, r.customer->>'name', r.customer->>'email', r.customer->>'phone'
ON CONFLICT (hotel_id, email) DO UPDATE
SET 
  total_stays = EXCLUDED.total_stays,
  total_spent_cents = EXCLUDED.total_spent_cents,
  last_stay_date = EXCLUDED.last_stay_date;