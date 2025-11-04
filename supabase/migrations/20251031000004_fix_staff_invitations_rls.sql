-- Fix staff_invitations RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invitations of their hotel" ON staff_invitations;
DROP POLICY IF EXISTS "Managers can create invitations" ON staff_invitations;
DROP POLICY IF EXISTS "Managers can update invitations" ON staff_invitations;

-- Recreate policies with correct permissions
CREATE POLICY "Users can view invitations of their hotel"
  ON staff_invitations FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create invitations"
  ON staff_invitations FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update invitations"
  ON staff_invitations FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete invitations"
  ON staff_invitations FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );
