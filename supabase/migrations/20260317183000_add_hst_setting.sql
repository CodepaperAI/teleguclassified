-- Migration to add is_hst_enabled column to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS is_hst_enabled BOOLEAN DEFAULT false;
