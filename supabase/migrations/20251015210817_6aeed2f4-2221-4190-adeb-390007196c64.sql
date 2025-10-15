-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  related_entity_type text,
  related_entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_role ON public.notifications(role);
CREATE INDEX idx_notifications_hotel_id ON public.notifications(hotel_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id OR
  (role IS NOT NULL AND has_hotel_role(auth.uid(), hotel_id, role))
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Función para crear notificación (parámetros con default al final)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_hotel_id uuid,
  p_title text,
  p_message text,
  p_user_id uuid DEFAULT NULL,
  p_role app_role DEFAULT NULL,
  p_type text DEFAULT 'info',
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    hotel_id, user_id, role, title, message, type,
    related_entity_type, related_entity_id
  )
  VALUES (
    p_hotel_id, p_user_id, p_role, p_title, p_message, p_type,
    p_entity_type, p_entity_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger para notificar checkouts a housekeeping
CREATE OR REPLACE FUNCTION public.notify_checkout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'CHECKED_OUT' AND OLD.status != 'CHECKED_OUT' THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Nuevo checkout',
      'Habitación disponible para limpieza',
      NULL,
      'HOUSEKEEPING',
      'checkout',
      'reservations',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER checkout_notification
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.notify_checkout();

-- Trigger para notificar nuevos incidentes a housekeeping
CREATE OR REPLACE FUNCTION public.notify_new_incident()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category IN ('MAINTENANCE', 'CLEANING') THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Nuevo incidente: ' || NEW.title,
      NEW.description,
      NEW.assigned_to,
      CASE WHEN NEW.assigned_to IS NULL THEN 'HOUSEKEEPING' ELSE NULL END,
      'incident',
      'incidents',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER incident_notification
AFTER INSERT ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_incident();

-- Trigger para notificar asignaciones de incidentes
CREATE OR REPLACE FUNCTION public.notify_incident_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.hotel_id,
      'Incidente asignado: ' || NEW.title,
      'Se te ha asignado un nuevo incidente',
      NEW.assigned_to,
      NULL,
      'assignment',
      'incidents',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER incident_assignment_notification
AFTER UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.notify_incident_assignment();

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;