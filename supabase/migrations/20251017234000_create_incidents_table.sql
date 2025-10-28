-- Create incidents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  category text NOT NULL DEFAULT 'MAINTENANCE' CHECK (category IN ('MAINTENANCE', 'CLEANING', 'SUPPLIES', 'OTHER')),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create incident_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.incident_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incidents_hotel_id ON public.incidents(hotel_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_history_incident_id ON public.incident_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_history_hotel_id ON public.incident_history(hotel_id);

-- Add comment
COMMENT ON TABLE public.incidents IS 'Incident reports for housekeeping and maintenance';
COMMENT ON TABLE public.incident_history IS 'Audit trail for incident changes';
