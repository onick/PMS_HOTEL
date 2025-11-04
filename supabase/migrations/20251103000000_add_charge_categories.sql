-- Add charge_category column to folio_charges
ALTER TABLE folio_charges 
ADD COLUMN IF NOT EXISTS charge_category TEXT DEFAULT 'OTHER' 
CHECK (charge_category IN (
  'ROOM',
  'FOOD', 
  'BEVERAGE',
  'MINIBAR',
  'LAUNDRY',
  'SPA',
  'PARKING',
  'OTHER'
));

-- Add quantity column for items that can have multiple units
ALTER TABLE folio_charges
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_folio_charges_category ON folio_charges(charge_category);

-- Comment
COMMENT ON COLUMN folio_charges.charge_category IS 'Category of the charge for better organization and reporting';
COMMENT ON COLUMN folio_charges.quantity IS 'Quantity of items charged (for items like minibar)';
