-- Create trigger function for account block/restriction notifications
CREATE OR REPLACE FUNCTION public.trigger_account_block_email()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
    v_user_name TEXT;
    v_action TEXT;
BEGIN
    -- Only trigger if status or restrictions changed
    IF (OLD.is_blocked IS DISTINCT FROM NEW.is_blocked) OR 
       (OLD.block_features IS DISTINCT FROM NEW.block_features) THEN
        
        -- Get user details
        SELECT full_name INTO v_user_name FROM public.profiles WHERE id = NEW.id;
        SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;

        IF v_user_email IS NOT NULL THEN
            -- Determine action
            IF NEW.is_blocked = true AND (OLD.is_blocked = false OR OLD.is_blocked IS NULL) THEN
                v_action := 'block';
            ELSIF NEW.is_blocked = false AND OLD.is_blocked = true THEN
                v_action := 'unblock';
            ELSE
                v_action := 'restrict';
            END IF;

            -- Call send-email function
            PERFORM net.http_post(
                url := 'https://gquhrewpuxzjlexghsio.supabase.co/functions/v1/send-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'x-internal-key', 'canada-telugu-internal-key-2026'
                ),
                body := jsonb_build_object(
                    'event', 'account_block',
                    'to', v_user_email,
                    'payload', jsonb_build_object(
                        'action', v_action,
                        'name', COALESCE(v_user_name, 'User'),
                        'is_blocked', NEW.is_blocked,
                        'block_features', NEW.block_features
                    )
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_account_block_change ON public.profiles;
CREATE TRIGGER on_account_block_change
    AFTER UPDATE OF is_blocked, block_features
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_account_block_email();
