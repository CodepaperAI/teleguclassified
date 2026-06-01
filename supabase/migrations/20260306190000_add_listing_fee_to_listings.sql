-- Migration to add listing_fee column to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS listing_fee numeric DEFAULT 0;
