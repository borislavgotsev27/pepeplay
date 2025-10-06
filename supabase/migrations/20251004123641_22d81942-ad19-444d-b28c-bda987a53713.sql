-- Add daily click tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN daily_clicks INTEGER DEFAULT 0,
ADD COLUMN last_click_date DATE DEFAULT CURRENT_DATE;

-- Create function to check and reset daily clicks
CREATE OR REPLACE FUNCTION public.check_and_reset_daily_clicks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_click_date < CURRENT_DATE THEN
    NEW.daily_clicks := 0;
    NEW.last_click_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic daily click reset
CREATE TRIGGER reset_daily_clicks_trigger
  BEFORE UPDATE OF daily_clicks ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_reset_daily_clicks();