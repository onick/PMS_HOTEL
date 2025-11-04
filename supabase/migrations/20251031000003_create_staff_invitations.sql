-- =====================================================
-- STAFF INVITATIONS SYSTEM
-- =====================================================
-- Created: 2025-10-31
-- Purpose: Invitation system for adding new staff members to hotels

-- Staff Invitations Table
CREATE TABLE IF NOT EXISTS staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'MANAGER',
    'RECEPTION',
    'HOUSEKEEPING',
    'MAINTENANCE',
    'STAFF'
  )),
  invitation_token uuid DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'CANCELLED'
  )),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_invitations_hotel_id ON staff_invitations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(status);

-- Row Level Security
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations of their hotel"
  ON staff_invitations FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create invitations"
  ON staff_invitations FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

CREATE POLICY "Managers can update invitations"
  ON staff_invitations FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

-- Function to check if invitation is expired
CREATE OR REPLACE FUNCTION check_invitation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PENDING' AND NEW.expires_at < NOW() THEN
    NEW.status = 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_invitation_expiry
  BEFORE UPDATE ON staff_invitations
  FOR EACH ROW
  EXECUTE FUNCTION check_invitation_expiry();

-- Comments
COMMENT ON TABLE staff_invitations IS 'Staff invitation system for hotels to invite new employees';
