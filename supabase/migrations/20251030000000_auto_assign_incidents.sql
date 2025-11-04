-- Migration: Auto-assign incidents based on category
-- Created: 2025-10-30

-- Create table for auto-assignment rules
CREATE TABLE IF NOT EXISTS incident_assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hotel_id, category)
);

-- Enable RLS
ALTER TABLE incident_assignment_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view rules from their hotel"
  ON incident_assignment_rules FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert rules"
  ON incident_assignment_rules FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

CREATE POLICY "Managers can update rules"
  ON incident_assignment_rules FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

CREATE POLICY "Managers can delete rules"
  ON incident_assignment_rules FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

-- Function to auto-assign incidents based on category
CREATE OR REPLACE FUNCTION auto_assign_incident()
RETURNS TRIGGER AS $$
DECLARE
  target_role TEXT;
  target_user_id uuid;
BEGIN
  -- Only auto-assign if not manually assigned
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get the target role for this category
  SELECT assigned_role INTO target_role
  FROM incident_assignment_rules
  WHERE hotel_id = NEW.hotel_id
    AND category = NEW.category
  ORDER BY priority DESC
  LIMIT 1;

  -- If no rule found, don't assign
  IF target_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find a user with that role in the hotel (round-robin could be added)
  SELECT user_id INTO target_user_id
  FROM user_roles
  WHERE hotel_id = NEW.hotel_id
    AND role = target_role
  ORDER BY RANDOM() -- Simple random assignment
  LIMIT 1;

  -- Assign if user found
  IF target_user_id IS NOT NULL THEN
    NEW.assigned_to := target_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign on incident creation
DROP TRIGGER IF EXISTS trigger_auto_assign_incident ON incidents;
CREATE TRIGGER trigger_auto_assign_incident
  BEFORE INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_incident();

-- Insert default rules for common scenarios
INSERT INTO incident_assignment_rules (hotel_id, category, assigned_role, priority)
SELECT DISTINCT 
  h.id,
  'MAINTENANCE',
  'HOUSEKEEPING',
  100
FROM hotels h
ON CONFLICT (hotel_id, category) DO NOTHING;

INSERT INTO incident_assignment_rules (hotel_id, category, assigned_role, priority)
SELECT DISTINCT 
  h.id,
  'CLEANING',
  'HOUSEKEEPING',
  100
FROM hotels h
ON CONFLICT (hotel_id, category) DO NOTHING;

INSERT INTO incident_assignment_rules (hotel_id, category, assigned_role, priority)
SELECT DISTINCT 
  h.id,
  'SUPPLIES',
  'MANAGER',
  50
FROM hotels h
ON CONFLICT (hotel_id, category) DO NOTHING;

-- Comment
COMMENT ON TABLE incident_assignment_rules IS 'Rules for automatically assigning incidents to staff based on category';
COMMENT ON FUNCTION auto_assign_incident() IS 'Automatically assigns new incidents to appropriate staff member based on category rules';

