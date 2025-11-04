-- =====================================================
-- REVENUE MANAGEMENT SYSTEM
-- Gestión de ingresos con historial de precios y competidores
-- =====================================================

-- Historial de precios del hotel
CREATE TABLE IF NOT EXISTS rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE NOT NULL,
  rate_plan_id uuid REFERENCES rate_plans(id) ON DELETE SET NULL,
  date date NOT NULL,
  price_cents int NOT NULL,
  occupancy_percent numeric(5,2), -- Porcentaje de ocupación ese día
  source text DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'AUTOMATIC', 'DYNAMIC_PRICING')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (hotel_id, room_type_id, date, rate_plan_id)
);

-- Tarifas de competidores
CREATE TABLE IF NOT EXISTS competitor_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  competitor_name text NOT NULL,
  competitor_url text,
  date date NOT NULL,
  room_category text NOT NULL, -- Categoría equivalente a nuestros room_types
  price_cents int NOT NULL,
  currency text DEFAULT 'DOP',
  source text DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'SCRAPER', 'API')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Configuración de Revenue Management
CREATE TABLE IF NOT EXISTS revenue_settings (
  hotel_id uuid PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  enable_dynamic_pricing boolean DEFAULT false,
  min_price_threshold_percent numeric(5,2) DEFAULT 20.00, -- No bajar más de 20% del precio base
  max_price_threshold_percent numeric(5,2) DEFAULT 200.00, -- No subir más de 200% del precio base
  competitor_weight numeric(3,2) DEFAULT 0.70, -- 70% peso a competencia
  occupancy_weight numeric(3,2) DEFAULT 0.30, -- 30% peso a ocupación
  track_competitors jsonb DEFAULT '[]', -- Array de competidores a seguir
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
