-- Crear tabla para configuración de canales
CREATE TABLE IF NOT EXISTS public.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  credentials JSONB,
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hotel_id, channel_id)
);

-- Habilitar RLS
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Hotel staff can view channel connections"
  ON public.channel_connections
  FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel managers can manage channel connections"
  ON public.channel_connections
  FOR ALL
  USING (
    has_hotel_role(auth.uid(), hotel_id, 'MANAGER') OR
    has_hotel_role(auth.uid(), hotel_id, 'HOTEL_OWNER') OR
    has_hotel_role(auth.uid(), hotel_id, 'SUPER_ADMIN')
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_channel_connections_updated_at
  BEFORE UPDATE ON public.channel_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();