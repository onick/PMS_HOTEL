-- Actualizar el rol del usuario a HOTEL_OWNER (administrador completo)
UPDATE user_roles 
SET role = 'HOTEL_OWNER'
WHERE user_id = '6574ca82-e81d-4e01-9bce-42cffc4d2c79' 
  AND hotel_id = 'a1111111-1111-1111-1111-111111111111';