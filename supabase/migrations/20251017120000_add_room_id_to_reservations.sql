-- Add room_id column to reservations table
-- This column stores the specific room assigned during check-in

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);

-- Add comment to document the column
COMMENT ON COLUMN reservations.room_id IS 'The specific room assigned to this reservation during check-in. NULL until check-in is performed.';
