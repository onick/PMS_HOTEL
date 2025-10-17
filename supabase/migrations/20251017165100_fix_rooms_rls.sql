-- Enable RLS on rooms if not already enabled
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rooms from their hotel" ON rooms;
DROP POLICY IF EXISTS "Users can insert rooms for their hotel" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms from their hotel" ON rooms;
DROP POLICY IF EXISTS "Users can delete rooms from their hotel" ON rooms;

-- Create policies for rooms
CREATE POLICY "Users can view rooms from their hotel"
  ON rooms FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rooms for their hotel"
  ON rooms FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms from their hotel"
  ON rooms FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rooms from their hotel"
  ON rooms FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
