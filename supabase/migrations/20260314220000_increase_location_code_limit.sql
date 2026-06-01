-- 1. Change character type for location codes to text per Supabase recommendation
-- Apply this in the Supabase Dashboard SQL Editor
ALTER TABLE locations ALTER COLUMN code TYPE text;

-- 2. Update existing city codes to province-city slug format
-- This joins the locations table with itself to get the parent's code
UPDATE locations city
SET code = LOWER(parent.code) || '-' || TRIM(BOTH '-' FROM LOWER(regexp_replace(city.name, '[^a-zA-Z0-9]+', '-', 'g')))
FROM locations parent
WHERE city.parent_id = parent.id
AND city.type = 'city';
