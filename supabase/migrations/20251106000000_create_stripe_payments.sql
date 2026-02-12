-- ===========================================
-- STRIPE PAYMENTS TRACKING
-- Complete payment history with Stripe integration
-- ===========================================

-- Tipo de estado de pago
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'REQUIRES_ACTION'
);

-- Tabla principal de pagos de Stripe
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  folio_id uuid NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  
  -- IDs de Stripe
  stripe_payment_intent_id text UNIQUE NOT NULL,
  stripe_customer_id text,
  stripe_charge_id text,
  
  -- Detalles del pago
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'DOP',
  status payment_status NOT NULL DEFAULT 'PENDING',
  
  -- Método de pago
  payment_method_type text, -- card, cash, transfer, etc.
  payment_method_brand text, -- visa, mastercard, etc.
  payment_method_last4 text, -- últimos 4 dígitos
  
  -- Información adicional
  description text,
  receipt_url text,
  receipt_email text,
  
  -- Metadata y rastreo
  metadata jsonb DEFAULT '{}',
  failure_code text,
  failure_message text,
  
  -- Timestamps
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Índice para búsquedas rápidas
  CONSTRAINT unique_payment_intent UNIQUE (stripe_payment_intent_id)
);

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_stripe_payments_folio ON stripe_payments(folio_id);
CREATE INDEX idx_stripe_payments_hotel ON stripe_payments(hotel_id);
CREATE INDEX idx_stripe_payments_customer ON stripe_payments(stripe_customer_id);
CREATE INDEX idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX idx_stripe_payments_created_at ON stripe_payments(created_at DESC);

-- ===========================================
-- RLS POLICIES
-- ===========================================

ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- Staff del hotel puede ver pagos
CREATE POLICY "Hotel staff can view stripe payments"
  ON stripe_payments FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Solo service role puede insertar/actualizar (desde Edge Functions)
CREATE POLICY "Service role can manage stripe payments"
  ON stripe_payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_stripe_payments_updated_at
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE stripe_payments IS 'Complete payment history from Stripe with full transaction details';
COMMENT ON COLUMN stripe_payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID (pi_xxxxx)';
COMMENT ON COLUMN stripe_payments.stripe_customer_id IS 'Stripe Customer ID (cus_xxxxx)';
COMMENT ON COLUMN stripe_payments.stripe_charge_id IS 'Stripe Charge ID (ch_xxxxx)';
COMMENT ON COLUMN stripe_payments.amount_cents IS 'Payment amount in cents (e.g., 5000 = $50.00)';
COMMENT ON COLUMN stripe_payments.payment_method_last4 IS 'Last 4 digits of card/account';
COMMENT ON COLUMN stripe_payments.receipt_url IS 'URL to Stripe-hosted receipt';
COMMENT ON COLUMN stripe_payments.metadata IS 'Additional data: reservation_id, customer_info, etc.';
