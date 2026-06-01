CREATE OR REPLACE FUNCTION public.search_users(search_term text DEFAULT ''::text, page_number integer DEFAULT 1, items_per_page integer DEFAULT 20, filter_status text DEFAULT 'all'::text, filter_type text DEFAULT 'all'::text)
 RETURNS TABLE(id uuid, email character varying, phone text, full_name text, avatar_url text, is_blocked boolean, block_features jsonb, is_paid boolean, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, auth_provider text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  offset_val int;
begin
  -- Check if caller is admin 
  if not exists (select 1 from public.admin_users au_check where au_check.id = auth.uid()) then
    raise exception 'Access denied: User is not an admin';
  end if;

  offset_val := (page_number - 1) * items_per_page;

  return query
  select
    au.id,
    au.email::varchar,
    au.phone,
    p.full_name,
    p.avatar_url,
    p.is_blocked,
    p.block_features,
    (exists (select 1 from public.payments py where py.user_id = au.id and py.status = 'completed')) as is_paid,
    au.created_at,
    au.last_sign_in_at,
    p.auth_provider
  from auth.users au
  left join public.profiles p on p.id = au.id
  where
    (search_term is null or search_term = ''
    or (
      au.email ilike '%' || search_term || '%'
      or au.phone ilike '%' || search_term || '%'
      or p.full_name ilike '%' || search_term || '%'
    ))
    AND (
        filter_status = 'all' 
        OR (filter_status = 'active' AND p.is_blocked = false)
        OR (filter_status = 'blocked' AND p.is_blocked = true)
    )
    AND (
        filter_type = 'all'
        OR (filter_type = 'paid' AND exists (select 1 from public.payments py where py.user_id = au.id and py.status = 'completed'))
        OR (filter_type = 'free' AND not exists (select 1 from public.payments py where py.user_id = au.id and py.status = 'completed'))
    )
  order by au.created_at desc
  limit items_per_page
  offset offset_val;
end;
$function$;
