-- Agregar campo de asignación a la tabla incidents
ALTER TABLE incidents 
ADD COLUMN assigned_to uuid REFERENCES auth.users(id);

-- Índice para búsquedas rápidas por asignado
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);

-- Tabla para historial de cambios en incidencias
CREATE TABLE incident_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'RESOLVED', 'COMMENT'
  old_value jsonb,
  new_value jsonb,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para incident_history
CREATE POLICY "Hotel staff can view incident history"
  ON incident_history
  FOR SELECT
  USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can create history entries"
  ON incident_history
  FOR INSERT
  WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

-- Índices para rendimiento
CREATE INDEX idx_incident_history_incident ON incident_history(incident_id);
CREATE INDEX idx_incident_history_hotel ON incident_history(hotel_id);

-- Trigger para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION log_incident_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar cambio de estado
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO incident_history (incident_id, hotel_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      NEW.hotel_id,
      auth.uid(),
      'STATUS_CHANGED',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;

  -- Registrar cambio de asignación
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO incident_history (incident_id, hotel_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      NEW.hotel_id,
      auth.uid(),
      'ASSIGNED',
      jsonb_build_object('assigned_to', OLD.assigned_to),
      jsonb_build_object('assigned_to', NEW.assigned_to)
    );
  END IF;

  -- Registrar resolución
  IF (TG_OP = 'UPDATE' AND OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL) THEN
    INSERT INTO incident_history (incident_id, hotel_id, user_id, action)
    VALUES (NEW.id, NEW.hotel_id, auth.uid(), 'RESOLVED');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER incident_changes
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_incident_change();