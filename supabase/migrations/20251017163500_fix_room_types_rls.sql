-- Enable RLS on room_types if not already enabled
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view room types from their hotel" ON room_types;
DROP POLICY IF EXISTS "Users can insert room types for their hotel" ON room_types;
DROP POLICY IF EXISTS "Users can update room types from their hotel" ON room_types;
DROP POLICY IF EXISTS "Users can delete room types from their hotel" ON room_types;

-- Create policies for room_types
CREATE POLICY "Users can view room types from their hotel"
  ON room_types FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert room types for their hotel"
  ON room_types FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update room types from their hotel"
  ON room_types FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete room types from their hotel"
  ON room_types FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
