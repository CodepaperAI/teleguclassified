-- Fix missing block_reason column and repair account block trigger
-- 1. Add block_reason column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- 2. Repair trigger function to be robust and not fail on missing data
-- We use unique variable names to avoid any potential naming conflicts or misinterpretations
CREATE OR REPLACE FUNCTION public.trigger_account_block_email()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, net
AS $$
DECLARE
    _user_email_address TEXT;
    _user_full_name TEXT;
    _restriction_action TEXT;
    _edge_function_url TEXT;
    _request_headers JSONB;
BEGIN
    -- Only trigger if status or restrictions changed
    IF (OLD.is_blocked IS DISTINCT FROM NEW.is_blocked) OR 
       (OLD.block_features IS DISTINCT FROM NEW.block_features) OR
       (OLD.block_reason IS DISTINCT FROM NEW.block_reason) THEN
        
        -- Get user details safely
        SELECT full_name INTO _user_full_name FROM public.profiles WHERE id = NEW.id;
        SELECT email INTO _user_email_address FROM auth.users WHERE id = NEW.id;

        IF _user_email_address IS NOT NULL THEN
            -- Determine the type of action for the email template
            IF NEW.is_blocked = true AND (OLD.is_blocked = false OR OLD.is_blocked IS NULL) THEN
                _restriction_action := 'block';
            ELSIF NEW.is_blocked = false AND OLD.is_blocked = true THEN
                _restriction_action := 'unblock';
            ELSE
                _restriction_action := 'restrict';
            END IF;

            -- Safely get request headers for determining the host
            BEGIN
                _request_headers := current_setting('request.headers', true)::jsonb;
            EXCEPTION WHEN OTHERS THEN
                _request_headers := '{}'::jsonb;
            END;

            -- Determine base URL for the Edge Function call
            _edge_function_url := COALESCE(_request_headers->>'host', 'gquhrewpuxzjlexghsio.supabase.co');
            IF NOT (_edge_function_url LIKE 'http%') THEN 
                _edge_function_url := 'https://' || _edge_function_url; 
            END IF;

            -- Call send-email Edge Function via pg_net
            BEGIN
                PERFORM net.http_post(
                    url := _edge_function_url || '/functions/v1/send-email',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'x-internal-key', 'canada-telugu-internal-key-2026'
                    ),
                    body := jsonb_build_object(
                        'event', 'account_block',
                        'to', _user_email_address,
                        'payload', jsonb_build_object(
                            'action', _restriction_action,
                            'name', COALESCE(_user_full_name, 'User'),
                            'is_blocked', NEW.is_blocked,
                            'block_features', NEW.block_features,
                            'reason', COALESCE(NEW.block_reason, 'Updated by administrator')
                        )
                    )
                );
            EXCEPTION WHEN OTHERS THEN
                -- Log warning but don't fail the database transaction
                RAISE WARNING 'Failed to trigger account block email: %', SQLERRM;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Ensure trigger is properly set up and linked to the updated function
DROP TRIGGER IF EXISTS on_account_block_change ON public.profiles;
CREATE TRIGGER on_account_block_change
    AFTER UPDATE OF is_blocked, block_features, block_reason
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_account_block_email();
