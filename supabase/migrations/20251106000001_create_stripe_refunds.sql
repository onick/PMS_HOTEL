-- ===========================================
-- STRIPE REFUNDS TRACKING
-- Track all refunds issued through Stripe
-- ===========================================

-- Tipo de estado de refund
CREATE TYPE refund_status AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED'
);

-- Tipo de razón de refund
CREATE TYPE refund_reason AS ENUM (
  'DUPLICATE',
  'FRAUDULENT',
  'REQUESTED_BY_CUSTOMER',
  'CANCELED_RESERVATION',
  'OTHER'
);

-- Tabla de refunds de Stripe
CREATE TABLE IF NOT EXISTS public.stripe_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  payment_id uuid NOT NULL REFERENCES public.stripe_payments(id) ON DELETE CASCADE,
  folio_id uuid NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  
  -- IDs de Stripe
  stripe_refund_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  stripe_charge_id text,
  
  -- Detalles del refund
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'DOP',
  status refund_status NOT NULL DEFAULT 'PENDING',
  reason refund_reason NOT NULL DEFAULT 'OTHER',
  
  -- Información adicional
  description text,
  notes text,
  receipt_number text,
  
  -- Usuario que procesó el refund
  processed_by uuid REFERENCES auth.users(id),
  
  -- Metadata y rastreo
  metadata jsonb DEFAULT '{}',
  failure_reason text,
  
  -- Timestamps
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_stripe_refund UNIQUE (stripe_refund_id)
);

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_stripe_refunds_payment ON stripe_refunds(payment_id);
CREATE INDEX idx_stripe_refunds_folio ON stripe_refunds(folio_id);
CREATE INDEX idx_stripe_refunds_hotel ON stripe_refunds(hotel_id);
CREATE INDEX idx_stripe_refunds_status ON stripe_refunds(status);
CREATE INDEX idx_stripe_refunds_created_at ON stripe_refunds(created_at DESC);
CREATE INDEX idx_stripe_refunds_processed_by ON stripe_refunds(processed_by);

-- ===========================================
-- RLS POLICIES
-- ===========================================

ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;

-- Staff del hotel puede ver refunds
CREATE POLICY "Hotel staff can view stripe refunds"
  ON stripe_refunds FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Solo managers y owners pueden crear refunds
CREATE POLICY "Managers can create stripe refunds"
  ON stripe_refunds FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'HOTEL_OWNER', 'MANAGER')
    )
  );

-- Service role puede hacer todo
CREATE POLICY "Service role can manage stripe refunds"
  ON stripe_refunds FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_stripe_refunds_updated_at
  BEFORE UPDATE ON stripe_refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar balance del folio cuando se crea un refund
CREATE OR REPLACE FUNCTION handle_refund_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'SUCCEEDED' AND (OLD IS NULL OR OLD.status != 'SUCCEEDED') THEN
    -- Restar el monto del refund del balance del folio
    UPDATE folios
    SET balance_cents = balance_cents - NEW.amount_cents
    WHERE id = NEW.folio_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER refund_update_folio_balance
  AFTER INSERT OR UPDATE ON stripe_refunds
  FOR EACH ROW
  EXECUTE FUNCTION handle_refund_balance();

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE stripe_refunds IS 'Complete refund history from Stripe with full transaction details';
COMMENT ON COLUMN stripe_refunds.stripe_refund_id IS 'Stripe Refund ID (re_xxxxx)';
COMMENT ON COLUMN stripe_refunds.amount_cents IS 'Refund amount in cents (can be partial)';
COMMENT ON COLUMN stripe_refunds.reason IS 'Reason for the refund';
COMMENT ON COLUMN stripe_refunds.processed_by IS 'User who initiated the refund';
COMMENT ON COLUMN stripe_refunds.metadata IS 'Additional data: original_reservation_id, notes, etc.';
