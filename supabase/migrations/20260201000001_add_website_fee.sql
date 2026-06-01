-- Migration to add website_fee column to site_settings table

alter table public.site_settings
add column if not exists website_fee numeric default 4.95;
