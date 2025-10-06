-- Create referral earnings table
CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  percentage INTEGER NOT NULL,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  source_type TEXT NOT NULL CHECK (source_type IN ('deposit', 'game_earnings', 'withdrawal_fee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral earnings
CREATE POLICY "Users can view their own referral earnings"
  ON public.referral_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- Create transactions table for all financial movements
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_earning', 'referral_bonus', 'package_purchase')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  wallet_address TEXT,
  transaction_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_referral_earnings_user_id ON public.referral_earnings(user_id);
CREATE INDEX idx_referral_earnings_referred_user_id ON public.referral_earnings(referred_user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- Function to calculate and distribute referral bonuses
CREATE OR REPLACE FUNCTION public.distribute_referral_bonus(
  p_user_id UUID,
  p_amount DECIMAL,
  p_source_type TEXT
) RETURNS void AS $$
DECLARE
  v_referrer_id UUID;
  v_level_1_id UUID;
  v_level_2_id UUID;
  v_level_3_id UUID;
  v_level_1_bonus DECIMAL;
  v_level_2_bonus DECIMAL;
  v_level_3_bonus DECIMAL;
BEGIN
  -- Get the user's referrer (Level 1)
  SELECT referred_by INTO v_level_1_id
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If user has a referrer, distribute bonuses
  IF v_level_1_id IS NOT NULL THEN
    -- Level 1: 10% bonus
    v_level_1_bonus := p_amount * 0.10;
    
    -- Update referrer's balance
    UPDATE public.profiles
    SET total_earnings = total_earnings + v_level_1_bonus,
        balance = balance + v_level_1_bonus
    WHERE id = v_level_1_id;
    
    -- Record the earning
    INSERT INTO public.referral_earnings (user_id, referred_user_id, amount, percentage, level, source_type)
    VALUES (v_level_1_id, p_user_id, v_level_1_bonus, 10, 1, p_source_type);
    
    -- Insert transaction record
    INSERT INTO public.transactions (user_id, type, amount, status, notes)
    VALUES (v_level_1_id, 'referral_bonus', v_level_1_bonus, 'completed', 'Level 1 referral bonus from user');
    
    -- Get Level 2 referrer
    SELECT referred_by INTO v_level_2_id
    FROM public.profiles
    WHERE id = v_level_1_id;
    
    IF v_level_2_id IS NOT NULL THEN
      -- Level 2: 5% bonus
      v_level_2_bonus := p_amount * 0.05;
      
      UPDATE public.profiles
      SET total_earnings = total_earnings + v_level_2_bonus,
          balance = balance + v_level_2_bonus
      WHERE id = v_level_2_id;
      
      INSERT INTO public.referral_earnings (user_id, referred_user_id, amount, percentage, level, source_type)
      VALUES (v_level_2_id, p_user_id, v_level_2_bonus, 5, 2, p_source_type);
      
      INSERT INTO public.transactions (user_id, type, amount, status, notes)
      VALUES (v_level_2_id, 'referral_bonus', v_level_2_bonus, 'completed', 'Level 2 referral bonus from user');
      
      -- Get Level 3 referrer
      SELECT referred_by INTO v_level_3_id
      FROM public.profiles
      WHERE id = v_level_2_id;
      
      IF v_level_3_id IS NOT NULL THEN
        -- Level 3: 2% bonus
        v_level_3_bonus := p_amount * 0.02;
        
        UPDATE public.profiles
        SET total_earnings = total_earnings + v_level_3_bonus,
            balance = balance + v_level_3_bonus
        WHERE id = v_level_3_id;
        
        INSERT INTO public.referral_earnings (user_id, referred_user_id, amount, percentage, level, source_type)
        VALUES (v_level_3_id, p_user_id, v_level_3_bonus, 2, 3, p_source_type);
        
        INSERT INTO public.transactions (user_id, type, amount, status, notes)
        VALUES (v_level_3_id, 'referral_bonus', v_level_3_bonus, 'completed', 'Level 3 referral bonus from user');
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update transactions updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle signup with referral code
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_user_id UUID,
  p_referral_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code
  AND id != p_user_id;
  
  -- If referrer found, update the new user's profile
  IF v_referrer_id IS NOT NULL THEN
    UPDATE public.profiles
    SET referred_by = v_referrer_id
    WHERE id = p_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;