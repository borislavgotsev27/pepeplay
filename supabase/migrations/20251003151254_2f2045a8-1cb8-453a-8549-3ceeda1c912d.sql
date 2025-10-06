-- Add INSERT policy for profiles table to allow new user profile creation
-- This is needed for the handle_new_user() trigger to work
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to NOT set referred_by yet
-- We'll set it separately after validating the referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    generate_referral_code()
  );
  RETURN NEW;
END;
$function$;