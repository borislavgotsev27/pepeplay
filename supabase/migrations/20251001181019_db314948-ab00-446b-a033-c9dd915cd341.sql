-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  wallet_address TEXT,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles for referrals"
  ON public.profiles FOR SELECT
  USING (true);

-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  bonus_percentage INTEGER DEFAULT 0,
  icon TEXT NOT NULL,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true);

-- Create user_packages table to track deposits
CREATE TABLE public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  amount DECIMAL(10, 2) NOT NULL,
  bonus_amount DECIMAL(10, 2) DEFAULT 0.00,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

-- Users can view their own packages
CREATE POLICY "Users can view their own packages"
  ON public.user_packages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own packages
CREATE POLICY "Users can create their own package purchases"
  ON public.user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'PEPE-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    generate_referral_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default packages
INSERT INTO public.packages (name, description, amount, bonus_percentage, icon, features, sort_order) VALUES
('Tadpole Starter', 'Perfect for beginners starting their PEPE journey', 10.00, 5, '🥚', ARRAY['5% Bonus', 'Basic Rewards', 'Energy Boost'], 1),
('Frog Hopper', 'Level up your gameplay with more rewards', 50.00, 10, '🐸', ARRAY['10% Bonus', 'Premium Rewards', '2x Energy', 'Priority Support'], 2),
('PEPE Champion', 'Become a champion with elite benefits', 100.00, 15, '👑', ARRAY['15% Bonus', 'Elite Rewards', '3x Energy', 'VIP Support', 'Exclusive NFTs'], 3),
('Diamond PEPE', 'Rare package for serious players', 500.00, 20, '💎', ARRAY['20% Bonus', 'Diamond Rewards', '5x Energy', 'Personal Manager', 'Limited Edition NFTs'], 4),
('Mega PEPE', 'Ultimate package for PEPE legends', 1000.00, 25, '🚀', ARRAY['25% Bonus', 'Legendary Rewards', '10x Energy', 'Dedicated Support', 'Ultra Rare NFTs', 'VIP Events'], 5);