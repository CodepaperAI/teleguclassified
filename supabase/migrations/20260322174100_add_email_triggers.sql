-- Enable the pg_net extension for making HTTP requests from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger welcome email
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger AS $$
DECLARE
  base_url TEXT;
  headers JSONB;
BEGIN
  -- Safely get headers with second argument as true (missing_ok)
  -- Use exception handling because cast to jsonb can still fail
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    headers := NULL;
  END;
  
  -- Determine base URL (fallback to hardcoded if host is missing)
  IF headers IS NOT NULL AND headers ? 'host' THEN
    base_url := 'https://' || (headers->>'host');
  ELSE
    -- Fallback to project URL
    base_url := 'https://gquhrewpuxzjlexghsio.supabase.co';
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := base_url || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-key', 'canada-telugu-internal-key-2026',
        'Authorization', 'Bearer ' || COALESCE(headers->>'anon', '') -- Service role might be better
      ),
      body := jsonb_build_object(
        'event', 'welcome',
        'payload', jsonb_build_object(
          'to', NEW.email,
          'name', COALESCE(NEW.full_name, 'User')
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Suppress errors to ensure the main transaction (user creation) succeeds
    RAISE WARNING 'Failed to trigger welcome email: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for welcome email
DROP TRIGGER IF EXISTS on_profile_created_email ON public.profiles;
CREATE TRIGGER on_profile_created_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_welcome_email();

-- Function to trigger ad status change email
CREATE OR REPLACE FUNCTION public.trigger_ad_status_change_email()
RETURNS trigger AS $$
DECLARE
  owner_email TEXT;
  base_url TEXT;
  headers JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'active' OR NEW.status = 'blocked' THEN
        -- Get owner email from profiles
        SELECT email INTO owner_email FROM public.profiles WHERE id = NEW.user_id;

        -- Safely get headers
        BEGIN
          headers := current_setting('request.headers', true)::jsonb;
        EXCEPTION WHEN OTHERS THEN
          headers := NULL;
        END;
        
        -- Determine base URL
        IF headers IS NOT NULL AND headers ? 'host' THEN
          base_url := 'https://' || (headers->>'host');
        ELSE
          base_url := 'https://gquhrewpuxzjlexghsio.supabase.co';
        END IF;

        BEGIN
          PERFORM net.http_post(
            url := base_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-internal-key', 'canada-telugu-internal-key-2026',
              'Authorization', 'Bearer ' || COALESCE(headers->>'anon', '')
            ),
            body := jsonb_build_object(
              'event', 'ad_status_change',
              'payload', jsonb_build_object(
                'to', COALESCE(NEW.contact_email, owner_email),
                'title', NEW.title,
                'id', NEW.id,
                'new_status', NEW.status,
                'reason', CASE WHEN NEW.status = 'blocked' THEN 'Violation of terms' ELSE 'Updated by Administrator' END
              )
            )
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to trigger ad status change email: %', SQLERRM;
        END;
      END IF;
    END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ad status change email
DROP TRIGGER IF EXISTS on_ad_status_updated_email ON public.listings;
CREATE TRIGGER on_ad_status_updated_email
  AFTER UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_ad_status_change_email();

-- Function to trigger new inquiry email
CREATE OR REPLACE FUNCTION public.trigger_new_inquiry_email()
RETURNS trigger AS $$
DECLARE
  room_record RECORD;
  listing_record RECORD;
  recipient_email TEXT;
  sender_name TEXT;
  base_url TEXT;
  headers JSONB;
BEGIN
  -- Get room and listing details
  SELECT * INTO room_record FROM public.chat_rooms WHERE id = NEW.room_id;
  SELECT * INTO listing_record FROM public.listings WHERE id = room_record.listing_id;
  
  -- Determine recipient and sender
  IF NEW.sender_id = room_record.buyer_id THEN
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.seller_id;
  ELSE
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.buyer_id;
  END IF;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  -- Only send email for the first message in a room (Inquiry)
  IF (SELECT count(*) FROM public.chat_messages WHERE room_id = NEW.room_id) = 1 THEN
    -- Safely get headers
    BEGIN
      headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
      headers := NULL;
    END;
    
    -- Determine base URL
    IF headers IS NOT NULL AND headers ? 'host' THEN
      base_url := 'https://' || (headers->>'host');
    ELSE
      base_url := 'https://gquhrewpuxzjlexghsio.supabase.co';
    END IF;

    BEGIN
      PERFORM net.http_post(
        url := base_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-key', 'canada-telugu-internal-key-2026',
          'Authorization', 'Bearer ' || COALESCE(headers->>'anon', '')
        ),
        body := jsonb_build_object(
          'event', 'new_inquiry',
          'payload', jsonb_build_object(
            'to', recipient_email,
            'listing_title', listing_record.title,
            'sender_name', COALESCE(sender_name, 'Interested Buyer'),
            'message', NEW.content
          )
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to trigger new inquiry email: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new inquiry email
DROP TRIGGER IF EXISTS on_new_message_email ON public.chat_messages;
CREATE TRIGGER on_new_message_email
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_new_inquiry_email();
