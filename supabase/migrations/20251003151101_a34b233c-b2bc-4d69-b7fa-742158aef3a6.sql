-- Remove the overly permissive policy that exposes sensitive financial data
DROP POLICY IF EXISTS "Users can view other profiles for referrals" ON public.profiles;

-- The apply_referral_code function is SECURITY DEFINER, so it can still
-- access profiles to look up referral codes without this public policy