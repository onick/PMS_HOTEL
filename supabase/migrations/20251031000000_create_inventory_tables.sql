-- =====================================================
-- INVENTORY & SUPPLIES MANAGEMENT
-- =====================================================
-- Created: 2025-10-31
-- Purpose: Inventory control system for hotel supplies

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'CLEANING',
    'MINIBAR',
    'AMENITIES',
    'LINENS',
    'MAINTENANCE',
    'OFFICE',
    'OTHER'
  )),
  unit TEXT NOT NULL CHECK (unit IN (
    'unit',
    'box',
    'kg',
    'liter',
    'pack'
  )),
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements Table (for tracking stock changes)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'PURCHASE',    -- New stock purchased
    'USAGE',       -- Stock used/consumed
    'ADJUSTMENT',  -- Manual adjustment
    'TRANSFER',    -- Transfer between locations
    'WASTE'        -- Damaged or expired
  )),
  quantity INTEGER NOT NULL, -- Positive for additions, negative for subtractions
  reference_id uuid, -- Could link to reservation, room, order, etc.
  reference_type TEXT, -- 'reservation', 'room', 'maintenance_order', etc.
  notes TEXT,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'ORDERED',
    'RECEIVED',
    'CANCELLED'
  )),
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  notes TEXT,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, order_number)
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_cost_cents INTEGER NOT NULL,
  total_cost_cents INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_hotel_id ON inventory_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(hotel_id, current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_hotel_id ON inventory_movements(hotel_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_hotel_id ON purchase_orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Row Level Security Policies

-- inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory items of their hotel"
  ON inventory_items FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER', 'HOUSEKEEPING')
    )
  );

CREATE POLICY "Managers can update inventory items"
  ON inventory_items FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER', 'HOUSEKEEPING')
    )
  );

-- inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

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

-- purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase orders of their hotel"
  ON purchase_orders FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage purchase orders"
  ON purchase_orders FOR ALL
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

-- purchase_order_items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase order items through orders"
  ON purchase_order_items FOR SELECT
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers can manage purchase order items"
  ON purchase_order_items FOR ALL
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('HOTEL_OWNER', 'MANAGER')
      )
    )
  );

-- Trigger to update inventory stock automatically when movements are recorded
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory_items
  SET current_stock = current_stock + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE inventory_items IS 'Catalog of all inventory items (supplies, amenities, etc.)';
COMMENT ON TABLE inventory_movements IS 'History of all inventory movements (purchases, usage, adjustments)';
COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory replenishment';
COMMENT ON TABLE purchase_order_items IS 'Line items in purchase orders';
