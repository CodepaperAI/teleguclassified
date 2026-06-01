-- 1. AD STATUS Emails: Strictly handle using profiles.email
CREATE OR REPLACE FUNCTION public.trigger_ad_status_change_email()
RETURNS trigger AS $$
DECLARE
  base_url text;
  profile_record record;
  request_headers jsonb;
  send_email boolean := false;
BEGIN
  -- Determine if we should send the email
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN send_email := true; END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND (NEW.status = 'active' OR NEW.status = 'blocked') THEN
      send_email := true;
    END IF;
  END IF;

  IF send_email THEN
    -- Strictly get email from profiles table linked to the listing owner
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    IF FOUND AND profile_record.email IS NOT NULL THEN
      BEGIN
        request_headers := current_setting('request.headers', true)::json;
      EXCEPTION WHEN OTHERS THEN
        request_headers := '{}'::jsonb;
      END;

      base_url := COALESCE(request_headers->>'host', 'gquhrewpuxzjlexghsio.supabase.co');
      IF NOT (base_url LIKE 'http%') THEN base_url := 'https://' || base_url; END IF;

      PERFORM net.http_post(
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
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. NEW INQUIRY Emails: Strictly handle using profiles.email of the recipient
CREATE OR REPLACE FUNCTION public.trigger_new_inquiry_email()
RETURNS trigger AS $$
DECLARE
  room_record RECORD;
  listing_record RECORD;
  recipient_email TEXT;
  sender_name TEXT;
  payload JSONB;
  request_headers JSONB;
  base_url TEXT;
BEGIN
  -- Get room and listing details
  SELECT * INTO room_record FROM public.chat_rooms WHERE id = NEW.room_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO listing_record FROM public.listings WHERE id = room_record.listing_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Only send email for the first message (Inquiry)
  IF (SELECT count(*) FROM public.chat_messages WHERE room_id = NEW.room_id) != 1 THEN
    RETURN NEW;
  END IF;

  -- Strictly determine recipient email from the profiles table
  IF NEW.sender_id = room_record.buyer_id THEN
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.seller_id;
  ELSE
    SELECT email INTO recipient_email FROM public.profiles WHERE id = room_record.buyer_id;
  END IF;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  IF recipient_email IS NOT NULL THEN
    BEGIN
      request_headers := current_setting('request.headers', true)::json;
    EXCEPTION WHEN OTHERS THEN
      request_headers := '{}'::json;
    END;

    base_url := COALESCE(request_headers->>'host', 'gquhrewpuxzjlexghsio.supabase.co');
    IF NOT (base_url LIKE 'http%') THEN base_url := 'https://' || base_url; END IF;

    PERFORM net.http_post(
      url := base_url || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-key', 'canada-telugu-internal-key-2026',
        'Authorization', 'Bearer ' || COALESCE(request_headers->>'authorization', request_headers->>'anon', '')
      ),
      body := jsonb_build_object(
        'event', 'new_inquiry',
        'payload', jsonb_build_object(
          'to', recipient_email,
          'subject', 'New Inquiry for: ' || listing_record.title,
          'listing_title', listing_record.title,
          'sender_name', COALESCE(sender_name, 'Interested Buyer'),
          'message', NEW.content
        )
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure triggers are correctly assigned and pointing to these functions
DROP TRIGGER IF EXISTS on_ad_status_updated_email ON public.listings;
CREATE TRIGGER on_ad_status_updated_email
  AFTER INSERT OR UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_ad_status_change_email();

DROP TRIGGER IF EXISTS on_new_message_email ON public.chat_messages;
CREATE TRIGGER on_new_message_email
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_new_inquiry_email();

-- 4. Clean up any misplaced triggers that might have been accidentally created in the past
DROP TRIGGER IF EXISTS on_ad_status_updated_email ON public.chat_messages;
DROP TRIGGER IF EXISTS on_ad_status_updated_email ON public.chat_rooms;
