-- 20260324000000_repair_database_schema.sql
-- This migration repairs the database schema and hardens triggers to prevent signup failures.

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create site_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_listings BIGINT DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    total_transactions BIGINT DEFAULT 0,
    total_users BIGINT DEFAULT 0,
    total_sold_ads BIGINT DEFAULT 0,
    total_active_ads BIGINT DEFAULT 0,
    total_inactive_ads BIGINT DEFAULT 0,
    total_pending_ads BIGINT DEFAULT 0,
    total_paid_users BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure a default row exists in site_stats
INSERT INTO public.site_stats (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 4. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_features JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- 5. Hardened handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Wrap the insert in a nested BEGIN...EXCEPTION block to catch issues
  BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone, 
        email, 
        avatar_url, 
        auth_provider, 
        last_login_at,
        is_verified
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      COALESCE(new.phone, new.raw_user_meta_data->>'phone', ''),
      new.email,
      COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
      COALESCE(new.raw_app_meta_data->>'provider', 'email'),
      new.created_at,
      (new.email_confirmed_at IS NOT NULL)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      avatar_url = EXCLUDED.avatar_url,
      auth_provider = EXCLUDED.auth_provider,
      last_login_at = EXCLUDED.last_login_at,
      is_verified = (new.email_confirmed_at IS NOT NULL);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error as a warning but don't fail the user creation
    RAISE WARNING 'Failed to create/update profile for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Hardened update_paid_users_count function
CREATE OR REPLACE FUNCTION public.update_paid_users_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
    BEGIN
        IF (TG_OP = 'UPDATE') THEN
            IF COALESCE(OLD.is_paid, false) = false AND COALESCE(NEW.is_paid, false) = true THEN
                UPDATE public.site_stats SET total_paid_users = total_paid_users + 1 WHERE id = 1;
            ELSIF COALESCE(OLD.is_paid, false) = true AND COALESCE(NEW.is_paid, false) = false THEN
                 UPDATE public.site_stats SET total_paid_users = total_paid_users - 1 WHERE id = 1;
            END IF;
        ELSIF (TG_OP = 'INSERT') THEN
            IF COALESCE(NEW.is_paid, false) = true THEN
                 UPDATE public.site_stats SET total_paid_users = total_paid_users + 1 WHERE id = 1;
            END IF;
        ELSIF (TG_OP = 'DELETE') THEN
            IF COALESCE(OLD.is_paid, false) = true THEN
                 UPDATE public.site_stats SET total_paid_users = total_paid_users - 1 WHERE id = 1;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to update paid users count: %', SQLERRM;
    END;
    RETURN NULL;
END;
$$;

-- 7. Hardened email trigger functions

-- Function: trigger_new_inquiry_email
CREATE OR REPLACE FUNCTION public.trigger_new_inquiry_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_record RECORD;
  listing_record RECORD;
  recipient_email TEXT;
  sender_name TEXT;
  payload JSONB;
  request_headers JSONB;
  base_url TEXT;
BEGIN
  -- 1. Get room details
  SELECT * INTO room_record FROM public.chat_rooms WHERE id = NEW.room_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- 2. Get listing details
  SELECT * INTO listing_record FROM public.listings WHERE id = room_record.listing_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- 3. Only send email for the first message (Inquiry)
  IF (SELECT count(*) FROM public.chat_messages WHERE room_id = NEW.room_id) != 1 THEN
    RETURN NEW;
  END IF;

  -- 4. Determine recipient
  IF NEW.sender_id = room_record.buyer_id THEN
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.seller_id;
  ELSE
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.buyer_id;
  END IF;

  -- 5. Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  -- 6. Prepare payload
  payload := jsonb_build_object(
    'event', 'new_inquiry',
    'payload', jsonb_build_object(
      'to', recipient_email,
      'subject', 'New Inquiry for: ' || listing_record.title,
      'listing_title', listing_record.title,
      'sender_name', COALESCE(sender_name, 'Interested Buyer'),
      'message', NEW.content
    )
  );

  -- 7. Get request headers safely
  BEGIN
    request_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    request_headers := '{}'::json;
  END;

  -- 8. Get base URL
  base_url := request_headers->>'host';
  IF base_url IS NULL THEN
      base_url := 'gquhrewpuxzjlexghsio.supabase.co'; -- Fallback
  END IF;
  IF NOT (base_url LIKE 'http%') THEN
    base_url := 'https://' || base_url;
  END IF;

  -- 9. Send request to Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url := base_url || '/functions/v1/send-email',
        body := payload::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-key', 'canada-telugu-internal-key-2026',
          'Authorization', 'Bearer ' || COALESCE(request_headers->>'authorization', request_headers->>'anon', '')
        )
      );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in trigger_new_inquiry_email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Function: trigger_welcome_email
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger AS $$
DECLARE
  base_url text;
  request_headers jsonb;
BEGIN
  -- Safely get request headers
  BEGIN
    request_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    request_headers := '{}'::jsonb;
  END;

  -- Logic to wait for email verification
  -- Only proceed if user is verified
  -- If TG_OP = 'UPDATE', check if it was unverified before and now verified
  IF TG_OP = 'UPDATE' THEN
    IF NOT (OLD.is_verified IS FALSE AND NEW.is_verified IS TRUE) THEN
       RETURN NEW;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NOT (NEW.is_verified IS TRUE) THEN
       RETURN NEW;
    END IF;
  END IF;

  -- Safely get base URL
  base_url := request_headers->>'host';
  IF base_url IS NULL THEN
      base_url := 'gquhrewpuxzjlexghsio.supabase.co'; -- Fallback
  END IF;
  IF NOT (base_url LIKE 'http%') THEN
    base_url := 'https://' || base_url;
  END IF;

  -- Perform the call inside an exception block
  BEGIN
    PERFORM
      net.http_post(
        url := base_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-key', 'canada-telugu-internal-key-2026',
          'Authorization', 'Bearer ' || COALESCE(request_headers->>'authorization', request_headers->>'anon', '')
        ),
        body := jsonb_build_object(
          'event', 'welcome',
          'payload', jsonb_build_object(
            'to', NEW.email,
            'subject', 'Welcome to Canada Telugu Classifieds!',
            'name', NEW.full_name
          )
        )
      );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger welcome email for profile %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: trigger_ad_status_change_email
CREATE OR REPLACE FUNCTION public.trigger_ad_status_change_email()
RETURNS trigger AS $$
DECLARE
  base_url text;
  profile_record record;
  request_headers jsonb;
  send_email boolean := false;
BEGIN
  -- 1. Determine if we should send the email
  IF TG_OP = 'INSERT' THEN
    -- Send email if listing is created as 'active' or 'pending' (wait for approval if pending?)
    -- Usually, 'active' means it's live now.
    IF NEW.status = 'active' THEN
      send_email := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Send email if status changed to 'active' or 'blocked'
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'active' OR NEW.status = 'blocked' THEN
        send_email := true;
      END IF;
    END IF;
  END IF;

  IF send_email THEN
    -- Get owner profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    IF FOUND AND profile_record.email IS NOT NULL THEN
      -- Get request headers safely
      BEGIN
        request_headers := current_setting('request.headers', true)::json;
      EXCEPTION WHEN OTHERS THEN
        request_headers := '{}'::jsonb;
      END;

      -- Get base URL
      base_url := request_headers->>'host';
      IF base_url IS NULL THEN
          base_url := 'gquhrewpuxzjlexghsio.supabase.co'; -- Fallback
      END IF;
      IF NOT (base_url LIKE 'http%') THEN
        base_url := 'https://' || base_url;
      END IF;

      BEGIN
        PERFORM
          net.http_post(
            url := base_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-internal-key', 'canada-telugu-internal-key-2026',
              'Authorization', 'Bearer ' || COALESCE(request_headers->>'authorization', request_headers->>'anon', '')
            ),
            body := jsonb_build_object(
              'event', 'ad_status_change',
              'payload', jsonb_build_object(
                'to', profile_record.email,
                'subject', CASE WHEN NEW.status = 'active' THEN 'Your Ad is Live: ' || NEW.title ELSE 'Ad Update: ' || NEW.title END,
                'new_status', NEW.status,
                'title', NEW.title,
                'id', NEW.id,
                'reason', CASE WHEN NEW.status = 'blocked' THEN 'Violation of posting guidelines' ELSE NULL END
              )
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to trigger ad status email for listing %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Re-apply all triggers
DROP TRIGGER IF EXISTS trigger_update_paid_users_count ON public.profiles;
CREATE TRIGGER trigger_update_paid_users_count
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_paid_users_count();

DROP TRIGGER IF EXISTS on_profile_created_email ON public.profiles;
CREATE TRIGGER on_profile_created_email
  AFTER INSERT OR UPDATE OF is_verified ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_welcome_email();

-- Sync Auth verification updates to profiles
DROP TRIGGER IF EXISTS on_auth_user_updated_sync ON auth.users;
CREATE TRIGGER on_auth_user_updated_sync
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_ad_status_updated_email ON public.listings;
CREATE TRIGGER on_ad_status_updated_email
  AFTER INSERT OR UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_ad_status_change_email();

DROP TRIGGER IF EXISTS on_new_message_email ON public.chat_messages;
CREATE TRIGGER on_new_message_email
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_new_inquiry_email();

-- 9. Initialize site_stats with actual counts
UPDATE public.site_stats
SET 
  total_users = (SELECT COUNT(*) FROM public.profiles),
  total_paid_users = (SELECT COUNT(*) FROM public.profiles WHERE is_paid = true),
  total_listings = (SELECT COUNT(*) FROM public.listings),
  updated_at = NOW()
WHERE id = 1;
