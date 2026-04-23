-- Add business hours columns to franchisee_config table
ALTER TABLE public.franchisee_config
ADD COLUMN IF NOT EXISTS business_hours_start TIME NOT NULL DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS business_hours_end TIME NOT NULL DEFAULT '18:00';
