-- Enable RLS on incidents table if not already enabled
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view incidents from their hotel" ON incidents;
DROP POLICY IF EXISTS "Users can insert incidents for their hotel" ON incidents;
DROP POLICY IF EXISTS "Users can update incidents from their hotel" ON incidents;
DROP POLICY IF EXISTS "Users can delete incidents from their hotel" ON incidents;

-- Create RLS policies for incidents table
CREATE POLICY "Users can view incidents from their hotel"
  ON incidents FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert incidents for their hotel"
  ON incidents FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update incidents from their hotel"
  ON incidents FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete incidents from their hotel"
  ON incidents FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on incident_history if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incident_history') THEN
    ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view incident history from their hotel" ON incident_history;
    DROP POLICY IF EXISTS "Users can insert incident history for their hotel" ON incident_history;
    
    CREATE POLICY "Users can view incident history from their hotel"
      ON incident_history FOR SELECT
      USING (
        hotel_id IN (
          SELECT hotel_id FROM user_roles
          WHERE user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Users can insert incident history for their hotel"
      ON incident_history FOR INSERT
      WITH CHECK (
        hotel_id IN (
          SELECT hotel_id FROM user_roles
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
