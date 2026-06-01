-- SQL Functions for Boost Expiration and Notifications

-- 1. Function to get listings with paid boosts expiring on a specific date
CREATE OR REPLACE FUNCTION public.get_boosts_expiring_on(target_date TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    contact_email TEXT,
    owner_email TEXT,
    boost_plan_label TEXT
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
        p.email as owner_email,
        pp.label as boost_plan_label
    FROM 
        public.listings l
    JOIN 
        public.profiles p ON l.user_id = p.id
    JOIN
        public.premium_plans pp ON l.boost_plan = pp.id
    WHERE 
        l.status = 'active'
        AND pp.price > 0 -- Only paid boosts
        AND l.boost_expires_at::date = target_date::date;
END;
$$;

-- 2. Function to clean up expired boosts
CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.listings
    SET 
        boost_plan = NULL,
        boost_expires_at = NULL
    WHERE 
        status = 'active'
        AND boost_expires_at < NOW();
END;
$$;
