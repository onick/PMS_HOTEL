-- Permitir que MANAGER y RECEPTION también puedan actualizar la configuración del hotel
DROP POLICY IF EXISTS "Hotel owners can update their hotels" ON hotels;

CREATE POLICY "Hotel managers can update their hotels" 
ON hotels 
FOR UPDATE 
USING (
  has_hotel_role(auth.uid(), id, 'HOTEL_OWNER') OR 
  has_hotel_role(auth.uid(), id, 'SUPER_ADMIN') OR
  has_hotel_role(auth.uid(), id, 'MANAGER') OR
  has_hotel_role(auth.uid(), id, 'RECEPTION')
);