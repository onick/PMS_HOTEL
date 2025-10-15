-- Crear vista para facilitar consultas de usuarios con sus roles
CREATE OR REPLACE VIEW user_roles_with_profiles AS
SELECT 
  ur.id,
  ur.user_id,
  ur.hotel_id,
  ur.role,
  p.full_name,
  p.phone,
  ur.created_at
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id;

-- Función para obtener el rol de un usuario en un hotel
CREATE OR REPLACE FUNCTION get_user_role(_user_id uuid, _hotel_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = _user_id
    AND hotel_id = _hotel_id
  LIMIT 1;
$$;

-- Insertar permisos para el rol SALES
INSERT INTO role_permissions (role, permission_id)
SELECT 'SALES', id FROM permissions 
WHERE module = 'reservations' AND action IN ('create', 'read', 'update')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'SALES', id FROM permissions 
WHERE module = 'crm' AND action IN ('read', 'create', 'update')
ON CONFLICT DO NOTHING;