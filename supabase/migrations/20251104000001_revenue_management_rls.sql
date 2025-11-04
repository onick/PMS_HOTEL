-- =====================================================
-- ROW LEVEL SECURITY FOR REVENUE MANAGEMENT
-- =====================================================

-- Enable RLS
ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_settings ENABLE ROW LEVEL SECURITY;

-- Rate History Policies
CREATE POLICY "Hotel staff can view rate history" ON rate_history
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can insert rate history" ON rate_history
  FOR INSERT WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can update rate history" ON rate_history
  FOR UPDATE USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can delete rate history" ON rate_history
  FOR DELETE USING (has_hotel_access(auth.uid(), hotel_id));

-- Competitor Rates Policies
CREATE POLICY "Hotel staff can view competitor rates" ON competitor_rates
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can insert competitor rates" ON competitor_rates
  FOR INSERT WITH CHECK (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can update competitor rates" ON competitor_rates
  FOR UPDATE USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can delete competitor rates" ON competitor_rates
  FOR DELETE USING (has_hotel_access(auth.uid(), hotel_id));

-- Revenue Settings Policies
CREATE POLICY "Hotel staff can view revenue settings" ON revenue_settings
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));

CREATE POLICY "Hotel admin can manage revenue settings" ON revenue_settings
  FOR ALL USING (has_hotel_access(auth.uid(), hotel_id));
