-- ========================================
-- HOTEL RESERVATION SYSTEM - Multi-tenant Schema
-- Region: Pedernales, RD (ITBIS 18%)
-- ========================================

-- Tipo de roles de usuario
CREATE TYPE app_role AS ENUM ('SUPER_ADMIN', 'HOTEL_OWNER', 'MANAGER', 'RECEPTION', 'HOUSEKEEPING');

-- Estado de reserva
CREATE TYPE reservation_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT');

-- Tipo de habitación
CREATE TYPE room_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED');

-- ===================
-- TABLAS DE USUARIOS
-- ===================

-- Roles de usuario (CRITICAL: separado de profiles)
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hotel_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, hotel_id, role)
);

-- Perfiles de usuario
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===================
-- HOTELES Y CONFIG
-- ===================

CREATE TABLE hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  city text DEFAULT 'Pedernales',
  country text DEFAULT 'República Dominicana',
  currency text DEFAULT 'DOP' CHECK (currency IN ('DOP', 'USD')),
  tax_rate numeric(5,4) DEFAULT 0.18, -- ITBIS 18%
  timezone text DEFAULT 'America/Santo_Domingo',
  created_at timestamptz DEFAULT now()
);

-- Tipos de habitación por hotel
CREATE TABLE room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  base_occupancy int DEFAULT 2,
  max_occupancy int DEFAULT 3,
  base_price_cents int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (hotel_id, name)
);

-- Habitaciones físicas
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE NOT NULL,
  room_number text NOT NULL,
  floor int,
  status room_status DEFAULT 'AVAILABLE',
  created_at timestamptz DEFAULT now(),
  UNIQUE (hotel_id, room_number)
);

-- Rate plans (tarifas)
CREATE TABLE rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  modifier_type text CHECK (modifier_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  modifier_value numeric(10,2),
  min_nights int DEFAULT 1,
  max_nights int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (hotel_id, name)
);

-- ===================
-- INVENTARIO ATÓMICO
-- ===================

-- Inventario por día (control de cupos)
CREATE TABLE inventory_by_day (
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE NOT NULL,
  day date NOT NULL,
  total int NOT NULL DEFAULT 0,
  reserved int NOT NULL DEFAULT 0,
  holds int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (hotel_id, room_type_id, day),
  CHECK (reserved >= 0),
  CHECK (holds >= 0),
  CHECK (reserved + holds <= total)
);

-- Lock de habitación física (opcional, para asignación específica)
CREATE TABLE room_locks (
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  day date NOT NULL,
  reservation_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (hotel_id, room_id, day)
);

-- ===================
-- RESERVAS Y FOLIOS
-- ===================

-- Tabla de idempotencia (evita duplicados)
CREATE TABLE idempotency_keys (
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (hotel_id, key)
);

-- Folios (cuentas de cargos/pagos)
CREATE TABLE folios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  reservation_id uuid UNIQUE,
  currency text NOT NULL,
  balance_cents int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Reservas
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE NOT NULL,
  rate_plan_id uuid REFERENCES rate_plans(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests int NOT NULL CHECK (guests > 0),
  status reservation_status DEFAULT 'PENDING_PAYMENT',
  customer jsonb NOT NULL,
  currency text NOT NULL,
  total_amount_cents int NOT NULL,
  folio_id uuid REFERENCES folios(id) NOT NULL,
  hold_expires_at timestamptz,
  payment_intent_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (check_out > check_in)
);

-- Cargos del folio
CREATE TABLE folio_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid REFERENCES folios(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount_cents int NOT NULL,
  charge_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- ===================
-- ÍNDICES
-- ===================

CREATE INDEX idx_reservations_hotel_dates ON reservations(hotel_id, check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(status) WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED');
CREATE INDEX idx_inventory_lookup ON inventory_by_day(hotel_id, room_type_id, day);
CREATE INDEX idx_user_roles_hotel ON user_roles(hotel_id, user_id);

-- ===================
-- RLS POLICIES
-- ===================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_by_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar roles
CREATE OR REPLACE FUNCTION has_hotel_role(_user_id uuid, _hotel_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
      AND role = _role
  )
$$;

-- Función helper para verificar cualquier acceso al hotel
CREATE OR REPLACE FUNCTION has_hotel_access(_user_id uuid, _hotel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND hotel_id = _hotel_id
  )
$$;

-- Profiles: usuarios pueden ver/editar su propio perfil
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles: usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Hotels: acceso según roles
CREATE POLICY "Staff can view their hotels" ON hotels 
  FOR SELECT USING (has_hotel_access(auth.uid(), id));

CREATE POLICY "Hotel owners can update their hotels" ON hotels 
  FOR UPDATE USING (has_hotel_role(auth.uid(), id, 'HOTEL_OWNER') OR has_hotel_role(auth.uid(), id, 'SUPER_ADMIN'));

-- Room types: staff del hotel puede ver
CREATE POLICY "Hotel staff can view room types" ON room_types 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

-- Rooms: staff del hotel puede gestionar
CREATE POLICY "Hotel staff can view rooms" ON rooms 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

-- Rate plans: staff del hotel puede ver
CREATE POLICY "Hotel staff can view rate plans" ON rate_plans 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

-- Inventory: staff del hotel puede ver
CREATE POLICY "Hotel staff can view inventory" ON inventory_by_day 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

-- Reservations: staff del hotel puede gestionar
CREATE POLICY "Hotel staff can view reservations" ON reservations 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Reception can create reservations" ON reservations 
  FOR INSERT WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Reception can update reservations" ON reservations 
  FOR UPDATE USING (has_hotel_access(auth.uid(), hotel_id));

-- Folios: staff del hotel puede gestionar
CREATE POLICY "Hotel staff can view folios" ON folios 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can manage folio charges" ON folio_charges 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM folios 
    WHERE folios.id = folio_charges.folio_id 
    AND has_hotel_access(auth.uid(), folios.hotel_id)
  ));

-- ===================
-- TRIGGERS
-- ===================

-- Auto-actualizar updated_at en reservations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ===================
-- DATOS DEMO
-- ===================

-- Hotel demo
INSERT INTO hotels (id, name, slug, city, currency, tax_rate) 
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Hotel Playa Paraíso',
  'playa-paraiso',
  'Pedernales',
  'DOP',
  0.18
);

-- Room types demo
INSERT INTO room_types (id, hotel_id, name, description, base_occupancy, max_occupancy, base_price_cents) 
VALUES 
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Doble Estándar', 'Habitación con cama doble y vista al jardín', 2, 3, 250000),
  ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Suite Vista Mar', 'Suite con balcón y vista panorámica al mar', 2, 4, 450000);

-- Habitaciones físicas demo
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status) 
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '101', 1, 'AVAILABLE'),
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '102', 1, 'AVAILABLE'),
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '103', 1, 'AVAILABLE'),
  ('a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '201', 2, 'AVAILABLE'),
  ('a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '202', 2, 'AVAILABLE');

-- Rate plan demo
INSERT INTO rate_plans (id, hotel_id, room_type_id, name, description, modifier_type, modifier_value, is_active) 
VALUES 
  ('c4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', NULL, 'Tarifa Base', 'Precio estándar sin modificadores', NULL, NULL, true),
  ('c5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', NULL, 'Early Bird 15%', 'Descuento por reserva anticipada', 'PERCENTAGE', -15.00, true);

-- Inventario inicial (próximos 90 días)
INSERT INTO inventory_by_day (hotel_id, room_type_id, day, total)
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  CURRENT_DATE + (n || ' days')::interval,
  3
FROM generate_series(0, 90) n;

INSERT INTO inventory_by_day (hotel_id, room_type_id, day, total)
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  'b3333333-3333-3333-3333-333333333333',
  CURRENT_DATE + (n || ' days')::interval,
  2
FROM generate_series(0, 90) n;