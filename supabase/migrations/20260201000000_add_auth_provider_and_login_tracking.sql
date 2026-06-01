-- Migration to add auth tracking fields and update triggers

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider text,
ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 2. Update the handle_new_user trigger to capture the provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, avatar_url, auth_provider, last_login_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.phone,
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    -- Extract provider from app_metadata.provider
    COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    -- Set initial last_login to creation time
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    auth_provider = EXCLUDED.auth_provider,
    last_login_at = EXCLUDED.last_login_at;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. We use auth.users.last_sign_in_at to track logins.
-- Create a new trigger specifically and only for keeping last_login_at updated when the user signs in.
-- On every update to auth.users, check if last_sign_in_at changed.
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  -- Only update profiles if last_sign_in_at actually changed (meaning a new login)
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    UPDATE public.profiles
    SET last_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Create trigger attached to UPDATE on auth.users
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_login();

