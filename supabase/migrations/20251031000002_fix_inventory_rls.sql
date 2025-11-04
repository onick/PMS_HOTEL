-- Fix inventory_items RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view inventory items of their hotel" ON inventory_items;
DROP POLICY IF EXISTS "Managers can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can delete inventory items" ON inventory_items;

-- Recreate policies
CREATE POLICY "Users can view inventory items of their hotel"
  ON inventory_items FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update inventory items"
  ON inventory_items FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete inventory items"
  ON inventory_items FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

-- Fix inventory_movements RLS policies
DROP POLICY IF EXISTS "Users can view inventory movements of their hotel" ON inventory_movements;
DROP POLICY IF EXISTS "Staff can insert inventory movements" ON inventory_movements;

CREATE POLICY "Users can view inventory movements of their hotel"
  ON inventory_movements FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
