-- Asegurar que todos los hoteles tengan una suscripción
-- Esta migración es idempotente (puede ejecutarse múltiples veces sin problema)

-- Crear suscripciones para cualquier hotel que no tenga una
INSERT INTO subscriptions (
  hotel_id,
  plan,
  status,
  current_period_start,
  current_period_end,
  trial_ends_at
)
SELECT 
  h.id,
  'FREE'::plan_type,
  'TRIAL'::subscription_status,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.hotel_id = h.id
)
ON CONFLICT (hotel_id) DO NOTHING;
