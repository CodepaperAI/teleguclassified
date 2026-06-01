-- First, fix the current stats to only count completed payments
UPDATE public.site_stats 
SET 
    total_transactions = (SELECT COUNT(*) FROM public.payments WHERE status = 'completed'),
    total_revenue = COALESCE((SELECT SUM(amount / 100.0) FROM public.payments WHERE status = 'completed'), 0),
    updated_at = NOW()
WHERE id = 1;

-- Now replace the trigger function
CREATE OR REPLACE FUNCTION public.update_payment_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Only increment if the payment is inserted already as 'completed'
        IF NEW.status = 'completed' THEN
            UPDATE public.site_stats 
            SET 
                total_transactions = total_transactions + 1,
                total_revenue = total_revenue + (NEW.amount / 100.0), 
                updated_at = NOW() 
            WHERE id = 1;
            
            UPDATE public.profiles SET is_paid = true WHERE id = NEW.user_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If payment changed from non-completed to completed
        IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
            
            UPDATE public.site_stats 
            SET 
                total_transactions = total_transactions + 1,
                total_revenue = total_revenue + (NEW.amount / 100.0),
                updated_at = NOW() 
            WHERE id = 1;

            UPDATE public.profiles SET is_paid = true WHERE id = NEW.user_id;

        -- If payment changed from completed to non-completed (e.g. refunded/cancelled later)
        ELSIF OLD.status = 'completed' AND NEW.status IS DISTINCT FROM OLD.status THEN
            
            UPDATE public.site_stats 
            SET 
                total_transactions = total_transactions - 1,
                total_revenue = total_revenue - (OLD.amount / 100.0),
                updated_at = NOW() 
            WHERE id = 1;

        END IF;
        
    ELSIF (TG_OP = 'DELETE') THEN
        -- Only decrement if we are deleting a completed payment record
        IF OLD.status = 'completed' THEN
            UPDATE public.site_stats 
            SET 
                total_transactions = total_transactions - 1,
                total_revenue = total_revenue - (OLD.amount / 100.0),
                updated_at = NOW() 
            WHERE id = 1;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;
