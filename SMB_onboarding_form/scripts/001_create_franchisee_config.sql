-- Create franchisee_config table for storing franchise onboarding data
CREATE TABLE IF NOT EXISTS public.franchisee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_name TEXT NOT NULL,
  business_phone_number TEXT NOT NULL,
  agent_phone_number TEXT NOT NULL,
  timezone TEXT NOT NULL,
  allowed_channels TEXT[] NOT NULL,
  contact_days TEXT[] NOT NULL,
  min_hours_between_followups INTEGER NOT NULL CHECK (min_hours_between_followups >= 1),
  max_followups_per_lead INTEGER NOT NULL CHECK (max_followups_per_lead >= 1 AND max_followups_per_lead <= 20),
  preferred_reply_name TEXT,
  preferred_message_tone TEXT NOT NULL DEFAULT 'friendly',
  outbound_phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.franchisee_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anon users (public form)
CREATE POLICY "Allow public inserts" ON public.franchisee_config
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reads (for potential admin access later)
CREATE POLICY "Allow public reads" ON public.franchisee_config
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_franchisee_config_updated_at
  BEFORE UPDATE ON public.franchisee_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
