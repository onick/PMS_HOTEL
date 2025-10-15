-- ============================================
-- SISTEMA DE PERMISOS GRANULARES
-- ============================================

-- Tabla de permisos disponibles
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL, -- 'reservations', 'billing', 'housekeeping', etc.
  action text NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
  resource text, -- recurso específico, ej: 'guest_data', 'payment_info'
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module, action, resource)
);

-- Permisos asignados a roles
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Permisos individuales (override de roles)
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true, -- true = concedido, false = revocado
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  reason text,
  UNIQUE(user_id, hotel_id, permission_id)
);

-- ============================================
-- AUDITORÍA Y LOGGING
-- ============================================

-- Logs de auditoría general
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  user_id uuid,
  action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'READ', 'EXPORT'
  entity_type text NOT NULL, -- 'reservation', 'guest', 'payment', etc.
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logs específicos de acceso a datos personales (RGPD)
CREATE TABLE data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  user_id uuid NOT NULL,
  subject_id uuid, -- ID del huésped/usuario cuyos datos fueron accedidos
  data_type text NOT NULL, -- 'personal_info', 'payment_info', 'preferences'
  accessed_fields text[], -- campos específicos accedidos
  purpose text NOT NULL, -- 'reservation_creation', 'customer_service', etc.
  legal_basis text NOT NULL, -- 'consent', 'contract', 'legitimate_interest'
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- CUMPLIMIENTO RGPD
-- ============================================

-- Consentimientos de usuarios/huéspedes
CREATE TABLE user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  user_id uuid, -- puede ser guest_id o user interno
  guest_id uuid REFERENCES guests(id),
  consent_type text NOT NULL, -- 'marketing', 'data_processing', 'profiling'
  granted boolean NOT NULL,
  consent_text text NOT NULL, -- texto exacto del consentimiento
  ip_address inet,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  version text NOT NULL DEFAULT '1.0' -- versión del consentimiento
);

-- Solicitudes de datos personales (derecho de acceso RGPD)
CREATE TABLE data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  guest_id uuid REFERENCES guests(id),
  request_type text NOT NULL, -- 'access', 'rectification', 'erasure', 'portability'
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completed_by uuid,
  data_export jsonb, -- datos exportados en formato JSON
  notes text,
  rejection_reason text
);

-- Retención de datos
CREATE TABLE data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  data_type text NOT NULL, -- 'guest_records', 'payment_history', 'audit_logs'
  retention_period_days integer NOT NULL,
  legal_basis text NOT NULL,
  auto_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, data_type)
);

-- ============================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================

CREATE INDEX idx_audit_logs_hotel ON audit_logs(hotel_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_data_access_hotel ON data_access_logs(hotel_id);
CREATE INDEX idx_data_access_user ON data_access_logs(user_id);
CREATE INDEX idx_data_access_subject ON data_access_logs(subject_id);
CREATE INDEX idx_data_access_created ON data_access_logs(created_at DESC);

CREATE INDEX idx_user_consents_guest ON user_consents(guest_id);
CREATE INDEX idx_user_consents_hotel ON user_consents(hotel_id);

CREATE INDEX idx_data_requests_guest ON data_requests(guest_id);
CREATE INDEX idx_data_requests_status ON data_requests(status);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Políticas para permissions (solo admins)
CREATE POLICY "Hotel admins can manage permissions"
  ON permissions FOR ALL
  USING (true); -- Controlado por función has_permission

-- Políticas para audit_logs (solo lectura para managers)
CREATE POLICY "Hotel managers can view audit logs"
  ON audit_logs FOR SELECT
  USING (has_hotel_role(auth.uid(), hotel_id, 'MANAGER'::app_role) 
    OR has_hotel_role(auth.uid(), hotel_id, 'HOTEL_OWNER'::app_role));

-- Políticas para data_access_logs
CREATE POLICY "Hotel managers can view data access logs"
  ON data_access_logs FOR SELECT
  USING (has_hotel_role(auth.uid(), hotel_id, 'MANAGER'::app_role) 
    OR has_hotel_role(auth.uid(), hotel_id, 'HOTEL_OWNER'::app_role));

-- Políticas para user_consents
CREATE POLICY "Hotel staff can manage consents"
  ON user_consents FOR ALL
  USING (has_hotel_access(auth.uid(), hotel_id));

-- Políticas para data_requests
CREATE POLICY "Hotel staff can manage data requests"
  ON data_requests FOR ALL
  USING (has_hotel_access(auth.uid(), hotel_id));

-- ============================================
-- FUNCIONES DE VERIFICACIÓN DE PERMISOS
-- ============================================

-- Verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION has_permission(
  _user_id uuid,
  _hotel_id uuid,
  _module text,
  _action text,
  _resource text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
  _permission_id uuid;
  _has_perm boolean;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO _user_role
  FROM user_roles
  WHERE user_id = _user_id AND hotel_id = _hotel_id
  LIMIT 1;

  -- Super admin tiene todos los permisos
  IF _user_role = 'SUPER_ADMIN' THEN
    RETURN true;
  END IF;

  -- Obtener ID del permiso
  SELECT id INTO _permission_id
  FROM permissions
  WHERE module = _module 
    AND action = _action
    AND (resource = _resource OR (resource IS NULL AND _resource IS NULL));

  IF _permission_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar permiso individual (override)
  SELECT granted INTO _has_perm
  FROM user_permissions
  WHERE user_id = _user_id 
    AND hotel_id = _hotel_id
    AND permission_id = _permission_id
    AND (expires_at IS NULL OR expires_at > now());

  IF _has_perm IS NOT NULL THEN
    RETURN _has_perm;
  END IF;

  -- Verificar permiso del rol
  RETURN EXISTS (
    SELECT 1
    FROM role_permissions
    WHERE role = _user_role
      AND permission_id = _permission_id
  );
END;
$$;

-- Registrar acceso a datos personales
CREATE OR REPLACE FUNCTION log_data_access(
  _hotel_id uuid,
  _subject_id uuid,
  _data_type text,
  _accessed_fields text[],
  _purpose text,
  _legal_basis text DEFAULT 'legitimate_interest'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO data_access_logs (
    hotel_id,
    user_id,
    subject_id,
    data_type,
    accessed_fields,
    purpose,
    legal_basis,
    ip_address
  ) VALUES (
    _hotel_id,
    auth.uid(),
    _subject_id,
    _data_type,
    _accessed_fields,
    _purpose,
    _legal_basis,
    inet_client_addr()
  );
END;
$$;

-- ============================================
-- TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- ============================================

-- Función genérica para auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hotel_id uuid;
  _entity_type text;
BEGIN
  -- Determinar hotel_id según la tabla
  IF TG_TABLE_NAME = 'guests' THEN
    _hotel_id := COALESCE(NEW.hotel_id, OLD.hotel_id);
  ELSIF TG_TABLE_NAME = 'reservations' THEN
    _hotel_id := COALESCE(NEW.hotel_id, OLD.hotel_id);
  ELSIF TG_TABLE_NAME = 'incidents' THEN
    _hotel_id := COALESCE(NEW.hotel_id, OLD.hotel_id);
  END IF;

  _entity_type := TG_TABLE_NAME;

  -- Registrar en audit_logs
  INSERT INTO audit_logs (
    hotel_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    _hotel_id,
    auth.uid(),
    TG_OP,
    _entity_type,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers a tablas críticas
CREATE TRIGGER audit_guests
  AFTER INSERT OR UPDATE OR DELETE ON guests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_reservations
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_incidents
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ============================================
-- DATOS INICIALES DE PERMISOS
-- ============================================

-- Permisos de módulo de reservas
INSERT INTO permissions (module, action, resource, description) VALUES
('reservations', 'create', NULL, 'Crear nuevas reservas'),
('reservations', 'read', NULL, 'Ver reservas'),
('reservations', 'update', NULL, 'Modificar reservas'),
('reservations', 'delete', NULL, 'Eliminar reservas'),
('reservations', 'export', NULL, 'Exportar datos de reservas'),

-- Permisos de CRM/Huéspedes
('crm', 'create', NULL, 'Crear perfiles de huéspedes'),
('crm', 'read', NULL, 'Ver perfiles de huéspedes'),
('crm', 'update', NULL, 'Modificar perfiles de huéspedes'),
('crm', 'delete', NULL, 'Eliminar huéspedes'),
('crm', 'read', 'sensitive_data', 'Ver datos sensibles (documentos, teléfono)'),
('crm', 'export', NULL, 'Exportar datos de huéspedes'),

-- Permisos de facturación
('billing', 'create', NULL, 'Crear cargos y pagos'),
('billing', 'read', NULL, 'Ver información de facturación'),
('billing', 'update', NULL, 'Modificar cargos'),
('billing', 'delete', NULL, 'Eliminar cargos'),
('billing', 'export', NULL, 'Exportar datos financieros'),
('billing', 'read', 'payment_methods', 'Ver métodos de pago'),

-- Permisos de housekeeping
('housekeeping', 'create', NULL, 'Reportar incidencias'),
('housekeeping', 'read', NULL, 'Ver incidencias y checklists'),
('housekeeping', 'update', NULL, 'Actualizar estado de limpieza'),
('housekeeping', 'assign', NULL, 'Asignar tareas de limpieza'),

-- Permisos de administración
('admin', 'read', 'audit_logs', 'Ver logs de auditoría'),
('admin', 'read', 'data_access_logs', 'Ver logs de acceso a datos'),
('admin', 'manage', 'permissions', 'Gestionar permisos'),
('admin', 'manage', 'users', 'Gestionar usuarios'),
('admin', 'export', 'all_data', 'Exportar todos los datos');

-- Asignar permisos a roles
-- RECEPTION
INSERT INTO role_permissions (role, permission_id)
SELECT 'RECEPTION', id FROM permissions 
WHERE (module = 'reservations' AND action IN ('create', 'read', 'update'))
   OR (module = 'crm' AND action IN ('create', 'read', 'update'))
   OR (module = 'billing' AND action IN ('create', 'read'));

-- HOUSEKEEPING
INSERT INTO role_permissions (role, permission_id)
SELECT 'HOUSEKEEPING', id FROM permissions 
WHERE module = 'housekeeping';

-- MANAGER
INSERT INTO role_permissions (role, permission_id)
SELECT 'MANAGER', id FROM permissions 
WHERE module != 'admin' OR resource = 'audit_logs';

-- HOTEL_OWNER y SUPER_ADMIN tienen todos los permisos por defecto