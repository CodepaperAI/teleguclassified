-- Add slug column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index for slug performance
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);

-- Update RLS if needed (usually not needed for just a new column if using * select)
