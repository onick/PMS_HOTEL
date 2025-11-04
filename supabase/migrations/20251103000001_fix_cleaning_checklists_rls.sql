-- Fix RLS policies for cleaning_checklists table
-- This table was missing proper RLS policies

-- Drop any existing policies first (in case they exist)
DROP POLICY IF EXISTS "Hotel staff can view cleaning checklists" ON cleaning_checklists;
DROP POLICY IF EXISTS "Hotel staff can insert cleaning checklists" ON cleaning_checklists;
DROP POLICY IF EXISTS "Hotel staff can update cleaning checklists" ON cleaning_checklists;
DROP POLICY IF EXISTS "Hotel staff can delete cleaning checklists" ON cleaning_checklists;

-- Create comprehensive RLS policies for cleaning_checklists
CREATE POLICY "Hotel staff can view cleaning checklists"
  ON cleaning_checklists FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM rooms
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hotel staff can insert cleaning checklists"
  ON cleaning_checklists FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT id FROM rooms
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hotel staff can update cleaning checklists"
  ON cleaning_checklists FOR UPDATE
  USING (
    room_id IN (
      SELECT id FROM rooms
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hotel staff can delete cleaning checklists"
  ON cleaning_checklists FOR DELETE
  USING (
    room_id IN (
      SELECT id FROM rooms
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comment
COMMENT ON TABLE cleaning_checklists IS 'Checklists for room cleaning tasks - RLS policies updated 2025-11-03';
