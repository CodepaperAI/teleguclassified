-- Add expires_at column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill expires_at for existing listings (default 30 days from creation)
UPDATE public.listings 
SET expires_at = created_at + INTERVAL '30 days' 
WHERE expires_at IS NULL;

-- Add index for performance on expiration checks
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON public.listings(expires_at);

-- Function to get listings expiring on a specific date
CREATE OR REPLACE FUNCTION public.get_listings_expiring_on(target_date TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    contact_email TEXT,
    owner_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.contact_email,
        p.email as owner_email
    FROM 
        public.listings l
    JOIN 
        public.profiles p ON l.user_id = p.id
    WHERE 
        l.status = 'active'
        AND l.expires_at::date = target_date::date;
END;
$$;
