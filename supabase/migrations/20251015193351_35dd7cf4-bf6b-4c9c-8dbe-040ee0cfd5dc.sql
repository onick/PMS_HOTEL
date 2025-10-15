-- Crear tabla de contactos/huéspedes
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  document_type TEXT,
  document_number TEXT,
  date_of_birth DATE,
  preferences JSONB DEFAULT '{}',
  notes TEXT,
  vip_status BOOLEAN DEFAULT false,
  total_stays INTEGER DEFAULT 0,
  total_spent_cents INTEGER DEFAULT 0,
  last_stay_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hotel_id, email)
);

-- Crear tabla de notas/interacciones
CREATE TABLE IF NOT EXISTS public.guest_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_notes ENABLE ROW LEVEL SECURITY;

-- Políticas para guests
CREATE POLICY "Hotel staff can view guests"
  ON public.guests
  FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can manage guests"
  ON public.guests
  FOR ALL
  USING (has_hotel_access(auth.uid(), hotel_id));

-- Políticas para guest_notes
CREATE POLICY "Hotel staff can view notes"
  ON public.guest_notes
  FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can create notes"
  ON public.guest_notes
  FOR INSERT
  WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

-- Triggers para updated_at
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para actualizar estadísticas de huésped desde reservas
CREATE OR REPLACE FUNCTION update_guest_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_record RECORD;
BEGIN
  -- Buscar o crear huésped
  SELECT id INTO guest_record
  FROM guests
  WHERE hotel_id = NEW.hotel_id
    AND email = NEW.customer->>'email';

  IF NOT FOUND THEN
    INSERT INTO guests (hotel_id, name, email, phone)
    VALUES (
      NEW.hotel_id,
      NEW.customer->>'name',
      NEW.customer->>'email',
      NEW.customer->>'phone'
    )
    RETURNING id INTO guest_record;
  END IF;

  -- Actualizar estadísticas si la reserva está completada
  IF NEW.status = 'CHECKED_OUT' THEN
    UPDATE guests
    SET 
      total_stays = total_stays + 1,
      total_spent_cents = total_spent_cents + NEW.total_amount_cents,
      last_stay_date = NEW.check_out
    WHERE id = guest_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para actualizar estadísticas
CREATE TRIGGER update_guest_stats_trigger
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_stats();