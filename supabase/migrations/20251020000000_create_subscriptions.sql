-- ===================
-- SUSCRIPCIONES Y PLANES
-- ===================

-- Tipo de plan
CREATE TYPE plan_type AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- Estado de suscripción
CREATE TYPE subscription_status AS ENUM (
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED'
);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  plan plan_type NOT NULL DEFAULT 'FREE',
  status subscription_status NOT NULL DEFAULT 'TRIAL',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_subscription_per_hotel UNIQUE (hotel_id)
);

-- Tabla de historial de cambios de plan
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  old_plan plan_type,
  new_plan plan_type NOT NULL,
  old_status subscription_status,
  new_status subscription_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla de uso mensual (para tracking de límites)
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  reservations_count int NOT NULL DEFAULT 0,
  rooms_count int NOT NULL DEFAULT 0,
  users_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_hotel_month UNIQUE (hotel_id, year, month)
);

-- ===================
-- ÍNDICES
-- ===================

CREATE INDEX idx_subscriptions_hotel ON subscriptions(hotel_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_monthly_usage_hotel_period ON monthly_usage(hotel_id, year, month);

-- ===================
-- RLS POLICIES
-- ===================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their hotel subscription"
  ON subscriptions FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only hotel owners can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'HOTEL_OWNER')
    )
  );

-- Subscription history policies
CREATE POLICY "Users can view their hotel subscription history"
  ON subscription_history FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Monthly usage policies
CREATE POLICY "Users can view their hotel usage"
  ON monthly_usage FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- ===================
-- FUNCTIONS
-- ===================

-- Function to update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (OLD.plan != NEW.plan OR OLD.status != NEW.status)) THEN
    INSERT INTO subscription_history (
      subscription_id,
      hotel_id,
      old_plan,
      new_plan,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.hotel_id,
      OLD.plan,
      NEW.plan,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_change_log
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Function to create default subscription for new hotel
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    hotel_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'FREE',
    'TRIAL',
    now(),
    now() + interval '30 days',
    now() + interval '30 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hotel_default_subscription
  AFTER INSERT ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to update monthly usage
CREATE OR REPLACE FUNCTION update_monthly_usage(
  p_hotel_id uuid,
  p_resource text,
  p_increment int DEFAULT 1
)
RETURNS void AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now());
  current_month int := EXTRACT(MONTH FROM now());
BEGIN
  INSERT INTO monthly_usage (hotel_id, year, month, reservations_count, rooms_count, users_count)
  VALUES (p_hotel_id, current_year, current_month, 0, 0, 0)
  ON CONFLICT (hotel_id, year, month) DO NOTHING;

  IF p_resource = 'reservations' THEN
    UPDATE monthly_usage
    SET reservations_count = reservations_count + p_increment,
        updated_at = now()
    WHERE hotel_id = p_hotel_id
      AND year = current_year
      AND month = current_month;
  ELSIF p_resource = 'rooms' THEN
    UPDATE monthly_usage
    SET rooms_count = rooms_count + p_increment,
        updated_at = now()
    WHERE hotel_id = p_hotel_id
      AND year = current_year
      AND month = current_month;
  ELSIF p_resource = 'users' THEN
    UPDATE monthly_usage
    SET users_count = users_count + p_increment,
        updated_at = now()
    WHERE hotel_id = p_hotel_id
      AND year = current_year
      AND month = current_month;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- INITIAL DATA
-- ===================

-- Create subscriptions for existing hotels (if any don't have one)
INSERT INTO subscriptions (hotel_id, plan, status, current_period_start, current_period_end, trial_ends_at)
SELECT 
  h.id,
  'FREE',
  'TRIAL',
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.hotel_id = h.id
);
