-- Add is_recommended column to premium_plans table
ALTER TABLE public.premium_plans 
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;
