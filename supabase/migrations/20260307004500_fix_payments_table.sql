-- Migration to fix payments table by adding missing metadata column
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Ensure listing_id is uuid and matches listings.id
-- (Assuming it was already created as uuid, but good to check or ensure)
-- ALTER TABLE public.payments ALTER COLUMN listing_id TYPE uuid USING listing_id::uuid;
