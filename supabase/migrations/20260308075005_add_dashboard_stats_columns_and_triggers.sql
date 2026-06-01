-- Add stats columns to site_stats
ALTER TABLE public.site_stats
ADD COLUMN total_sold_ads BIGINT DEFAULT 0,
ADD COLUMN total_active_ads BIGINT DEFAULT 0,
ADD COLUMN total_inactive_ads BIGINT DEFAULT 0,
ADD COLUMN total_pending_ads BIGINT DEFAULT 0,
ADD COLUMN total_paid_users BIGINT DEFAULT 0;

-- Backfill initial stats efficiently
UPDATE public.site_stats 
SET 
  total_sold_ads = (SELECT COUNT(*) FROM public.listings WHERE status = 'sold'),
  total_active_ads = (SELECT COUNT(*) FROM public.listings WHERE status = 'active'),
  total_pending_ads = (SELECT COUNT(*) FROM public.listings WHERE status = 'payment_pending'),
  total_inactive_ads = (SELECT COUNT(*) FROM public.listings WHERE status NOT IN ('active', 'sold', 'payment_pending', 'deleted')),
  total_paid_users = (SELECT COUNT(DISTINCT user_id) FROM public.payments WHERE status = 'completed')
WHERE id = 1;

-- Add paid profile tracking 
ALTER TABLE public.profiles
ADD COLUMN is_paid BOOLEAN DEFAULT false;

-- Backfill profiles
UPDATE public.profiles p
SET is_paid = true
WHERE EXISTS (SELECT 1 FROM public.payments pay WHERE pay.user_id = p.id AND pay.status = 'completed');

-- Update listings trigger logic to track changes
CREATE OR REPLACE FUNCTION public.update_total_listings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.site_stats SET total_listings = total_listings + 1, updated_at = NOW() WHERE id = 1;

        IF NEW.status = 'active' THEN
             UPDATE public.site_stats SET total_active_ads = total_active_ads + 1 WHERE id = 1;
        ELSIF NEW.status = 'sold' THEN
             UPDATE public.site_stats SET total_sold_ads = total_sold_ads + 1 WHERE id = 1;
        ELSIF NEW.status = 'payment_pending' THEN
             UPDATE public.site_stats SET total_pending_ads = total_pending_ads + 1 WHERE id = 1;
        ELSIF NEW.status != 'deleted' THEN
             UPDATE public.site_stats SET total_inactive_ads = total_inactive_ads + 1 WHERE id = 1;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            -- Decrement old status
            IF OLD.status = 'active' THEN
                UPDATE public.site_stats SET total_active_ads = total_active_ads - 1 WHERE id = 1;
            ELSIF OLD.status = 'sold' THEN
                UPDATE public.site_stats SET total_sold_ads = total_sold_ads - 1 WHERE id = 1;
            ELSIF OLD.status = 'payment_pending' THEN
                UPDATE public.site_stats SET total_pending_ads = total_pending_ads - 1 WHERE id = 1;
            ELSIF OLD.status != 'deleted' THEN
                UPDATE public.site_stats SET total_inactive_ads = total_inactive_ads - 1 WHERE id = 1;
            END IF;

            -- Increment new status
            IF NEW.status = 'active' THEN
                UPDATE public.site_stats SET total_active_ads = total_active_ads + 1 WHERE id = 1;
            ELSIF NEW.status = 'sold' THEN
                UPDATE public.site_stats SET total_sold_ads = total_sold_ads + 1 WHERE id = 1;
            ELSIF NEW.status = 'payment_pending' THEN
                UPDATE public.site_stats SET total_pending_ads = total_pending_ads + 1 WHERE id = 1;
            ELSIF NEW.status != 'deleted' THEN
                UPDATE public.site_stats SET total_inactive_ads = total_inactive_ads + 1 WHERE id = 1;
            END IF;
        END IF;
        
        UPDATE public.site_stats SET updated_at = NOW() WHERE id = 1;

    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.site_stats SET total_listings = total_listings - 1, updated_at = NOW() WHERE id = 1;
        
        IF OLD.status = 'active' THEN
             UPDATE public.site_stats SET total_active_ads = total_active_ads - 1 WHERE id = 1;
        ELSIF OLD.status = 'sold' THEN
             UPDATE public.site_stats SET total_sold_ads = total_sold_ads - 1 WHERE id = 1;
        ELSIF OLD.status = 'payment_pending' THEN
             UPDATE public.site_stats SET total_pending_ads = total_pending_ads - 1 WHERE id = 1;
        ELSIF OLD.status != 'deleted' THEN
             UPDATE public.site_stats SET total_inactive_ads = total_inactive_ads - 1 WHERE id = 1;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;

-- Ensure trigger handles UPDATE now
DROP TRIGGER IF EXISTS trigger_update_total_listings ON public.listings;
CREATE TRIGGER trigger_update_total_listings
AFTER INSERT OR UPDATE OR DELETE ON public.listings
FOR EACH ROW EXECUTE FUNCTION update_total_listings();


-- Payment stats logic updates
CREATE OR REPLACE FUNCTION public.update_payment_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.site_stats 
        SET 
            total_transactions = total_transactions + 1,
            total_revenue = total_revenue + (NEW.amount / 100.0), 
            updated_at = NOW() 
        WHERE id = 1;
        
        -- Update profile if completed
        IF NEW.status = 'completed' THEN
            UPDATE public.profiles SET is_paid = true WHERE id = NEW.user_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle revenue adjustments on status change if necessary, 
        -- but mostly just handle profile status flips here
        IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
            UPDATE public.profiles SET is_paid = true WHERE id = NEW.user_id;
            
            -- also increment revenue if the payment just got completed
            UPDATE public.site_stats 
            SET 
                total_revenue = total_revenue + (NEW.amount / 100.0),
                updated_at = NOW() 
            WHERE id = 1;
        END IF;
        
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.site_stats 
        SET 
            total_transactions = total_transactions - 1,
            total_revenue = total_revenue - (OLD.amount / 100.0),
            updated_at = NOW() 
        WHERE id = 1;
    END IF;
    RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_payment_stats ON public.payments;
CREATE TRIGGER trigger_update_payment_stats
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_payment_stats();

-- Profile is_paid trigger
CREATE OR REPLACE FUNCTION public.update_paid_users_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF OLD.is_paid = false AND NEW.is_paid = true THEN
            UPDATE public.site_stats SET total_paid_users = total_paid_users + 1 WHERE id = 1;
        ELSIF OLD.is_paid = true AND NEW.is_paid = false THEN
             UPDATE public.site_stats SET total_paid_users = total_paid_users - 1 WHERE id = 1;
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        IF NEW.is_paid = true THEN
             UPDATE public.site_stats SET total_paid_users = total_paid_users + 1 WHERE id = 1;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_paid = true THEN
             UPDATE public.site_stats SET total_paid_users = total_paid_users - 1 WHERE id = 1;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_paid_users_count ON public.profiles;
CREATE TRIGGER trigger_update_paid_users_count
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_paid_users_count();
