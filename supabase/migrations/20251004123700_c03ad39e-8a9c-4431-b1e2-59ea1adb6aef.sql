-- Fix search path for the function
DROP FUNCTION IF EXISTS public.check_and_reset_daily_clicks() CASCADE;

CREATE OR REPLACE FUNCTION public.check_and_reset_daily_clicks()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_click_date < CURRENT_DATE THEN
    NEW.daily_clicks := 0;
    NEW.last_click_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER reset_daily_clicks_trigger
  BEFORE UPDATE OF daily_clicks ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_reset_daily_clicks();