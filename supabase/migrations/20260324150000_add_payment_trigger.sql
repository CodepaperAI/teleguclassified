-- 20260324150000_add_payment_trigger.sql
-- This migration adds a trigger to the payments table to send confirmation emails upon completion.

-- Function to trigger payment confirmation email
CREATE OR REPLACE FUNCTION public.trigger_payment_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  base_url text;
  profile_record record;
  request_headers jsonb;
  plan_name text;
BEGIN
  -- 1. Check if payment is completed
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') THEN
    -- 2. Get owner profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    IF FOUND AND profile_record.email IS NOT NULL THEN
      -- 3. Get request headers safely
      BEGIN
        request_headers := current_setting('request.headers', true)::jsonb;
      EXCEPTION WHEN OTHERS THEN
        request_headers := '{}'::jsonb;
      END;

      -- 4. Get base URL
      base_url := request_headers->>'host';
      IF base_url IS NULL THEN
          base_url := 'gquhrewpuxzjlexghsio.supabase.co'; -- Fallback
      END IF;
      IF NOT (base_url LIKE 'http%') THEN
        base_url := 'https://' || base_url;
      END IF;

      -- 5. Extract plan name from metadata
      plan_name := COALESCE(NEW.metadata->>'plan_name', NEW.metadata->>'name', 'Premium Listing');

      -- 6. Send request to Edge Function
      BEGIN
        PERFORM
          net.http_post(
            url := base_url || '/functions/v1/send-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-internal-key', 'canada-telugu-internal-key-2026'
            ) || (
              CASE 
                WHEN request_headers->>'authorization' IS NOT NULL AND request_headers->>'authorization' != '' THEN 
                  jsonb_build_object('Authorization', request_headers->>'authorization')
                WHEN request_headers->>'anon' IS NOT NULL AND request_headers->>'anon' != '' THEN 
                  jsonb_build_object('Authorization', 'Bearer ' || (request_headers->>'anon'))
                ELSE 
                  '{}'::jsonb
              END
            ),
            body := jsonb_build_object(
              'event', 'payment_confirmation',
              'payload', jsonb_build_object(
                'to', profile_record.email,
                'order_id', NEW.id::text,
                'amount', TO_CHAR(NEW.amount, 'FM999,999.00'),
                'plan', plan_name,
                'metadata', NEW.metadata
              )
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to trigger payment confirmation email for payment %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add trigger to payments table
DROP TRIGGER IF EXISTS on_payment_completed_email ON public.payments;
CREATE TRIGGER on_payment_completed_email
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_payment_confirmation_email();
