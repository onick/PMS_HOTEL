-- Agregar columna room_id a reservations para asignación de habitación física
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES rooms(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);

-- Comentario
COMMENT ON COLUMN reservations.room_id IS 'Habitación física asignada durante check-in. NULL si aún no se ha hecho check-in.';
