-- Agregar foreign key para incidents -> rooms
ALTER TABLE public.incidents
ADD CONSTRAINT incidents_room_id_fkey 
FOREIGN KEY (room_id) 
REFERENCES public.rooms(id) 
ON DELETE SET NULL;