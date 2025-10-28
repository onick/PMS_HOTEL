-- Add flag to track if trial has been used
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false;

-- Mark existing trials as used if they have ended or if user has ever had a paid plan
UPDATE subscriptions 
SET trial_used = true 
WHERE status != 'TRIAL' 
   OR (trial_ends_at IS NOT NULL AND trial_ends_at < now());

-- Comment
COMMENT ON COLUMN subscriptions.trial_used IS 'Indicates if the hotel has already used their free trial period';
