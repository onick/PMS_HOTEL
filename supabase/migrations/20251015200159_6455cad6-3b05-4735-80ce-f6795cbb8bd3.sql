-- Tabla de materiales/inventario de housekeeping
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 10,
  unit text NOT NULL DEFAULT 'unidades',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de checklists de limpieza
CREATE TABLE public.cleaning_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'PENDING',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla de incidencias
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid,
  reported_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'OPEN',
  category text NOT NULL DEFAULT 'MAINTENANCE',
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Trigger para updated_at en materials
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en incidents
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel staff can view materials"
  ON public.materials FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can manage materials"
  ON public.materials FOR ALL
  USING (has_hotel_access(auth.uid(), hotel_id));

-- RLS para cleaning_checklists
ALTER TABLE public.cleaning_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel staff can view checklists"
  ON public.cleaning_checklists FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can manage checklists"
  ON public.cleaning_checklists FOR ALL
  USING (has_hotel_access(auth.uid(), hotel_id));

-- RLS para incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel staff can view incidents"
  ON public.incidents FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can update incidents"
  ON public.incidents FOR UPDATE
  USING (has_hotel_access(auth.uid(), hotel_id));