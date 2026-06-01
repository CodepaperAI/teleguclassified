-- Add payment_method column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

-- Make stripe_session_id nullable to allow manual payments
ALTER TABLE public.payments 
ALTER COLUMN stripe_session_id DROP NOT NULL;

-- Update RLS for payments if needed (usually admin has full access via service role or admin flag)
-- Assuming admin has access.
