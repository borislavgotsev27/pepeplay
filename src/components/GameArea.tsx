import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export const GameArea = () => {
  const [dailyClicks, setDailyClicks] = useState(0);
  const [activePackageAmount, setActivePackageAmount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [clickAnimating, setClickAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); // Lock for fast clicks

  const MAX_DAILY_CLICKS = 3;
  const DAYS_TO_ROI = 50;

  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_clicks, total_earnings')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDailyClicks(profile.daily_clicks || 0);
        setTotalEarnings(profile.total_earnings || 0);
      }

      const { data: userPackage } = await supabase
        .from('user_packages')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userPackage) {
        setActivePackageAmount(userPackage.amount);
      } else {
        toast.error("No active package found. Please purchase a package first!");
      }
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
    }
  };
  
  const handlePepeClick = async () => {
    if (isProcessing) return; // Prevent rapid consecutive clicks
    if (dailyClicks >= MAX_DAILY_CLICKS) {
      toast.error("Daily click limit reached! Come back tomorrow.");
      return;
    }
    if (activePackageAmount === 0) {
      toast.error("Please purchase a package to start earning!");
      return;
    }

    setIsProcessing(true); // Lock clicks
    setClickAnimating(true);
    setParticles(prev => [...prev, Date.now()]);

    const dailyEarning = activePackageAmount / DAYS_TO_ROI;
    const earningPerClick = dailyEarning / MAX_DAILY_CLICKS;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to earn");
        return;
      }

      const { data, error } = await supabase.functions.invoke('record-game-earning', {
        body: { score: 1, earnings: earningPerClick }
      });

      if (error) throw error;

      if (data?.success) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ daily_clicks: dailyClicks + 1 })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Use functional state updates to prevent race conditions
        setDailyClicks(prev => prev + 1);
        setTotalEarnings(prev => prev + earningPerClick);

        toast.success(`💰 +$${earningPerClick.toFixed(2)} earned! ${MAX_DAILY_CLICKS - dailyClicks - 1} clicks left today.`);
      }

    } catch (error: any) {
      console.error('Failed to record earning:', error);
      toast.error("Failed to record earning. Try again!");
    } finally {
      setTimeout(() => setClickAnimating(false), 500);
      setIsProcessing(false); // Unlock clicks
    }
  };

  const clicksRemaining = MAX_DAILY_CLICKS - dailyClicks;
  const dailyEarningPotential = activePackageAmount > 0 
    ? (activePackageAmount / DAYS_TO_ROI).toFixed(2)
    : "0.00";
  const earningPerClick = activePackageAmount > 0
    ? (activePackageAmount / DAYS_TO_ROI / MAX_DAILY_CLICKS).toFixed(2)
    : "0.00";
  const progressPercent = (dailyClicks / MAX_DAILY_CLICKS) * 100;

  return (
    <div className="space-y-6 relative">
      {/* Daily Clicks Card with Progress Bar */}
      <Card className="p-6 gradient-card border-primary/20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Daily Clicks Remaining</p>
            <p className="text-3xl font-bold text-primary">{clicksRemaining}/{MAX_DAILY_CLICKS}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Earning Per Click</p>
            <p className="text-2xl font-bold text-earnings-gold">${earningPerClick}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Package</p>
            <p className="text-2xl font-bold">${activePackageAmount}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-border/20 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* PEPE Click Area */}
      <Card className="p-12 gradient-dark border-primary/20 flex flex-col items-center justify-center min-h-[400px] relative">
        <Badge className="mb-4 text-lg px-4 py-2" variant="outline">
          {clicksRemaining > 0 ? `${clicksRemaining} Click${clicksRemaining > 1 ? 's' : ''} Left Today` : "Come Back Tomorrow!"}
        </Badge>

        <motion.div
          animate={{
            scale: clickAnimating ? [1, 1.3, 1] : 1,
            rotate: clickAnimating ? [0, 10, -10, 0] : 0,
            transition: { duration: 0.5, ease: "easeOut" }
          }}
        >
          <Button
            onClick={handlePepeClick}
            className="relative w-48 h-48 rounded-full p-0 overflow-hidden"
            disabled={clicksRemaining === 0 || activePackageAmount === 0}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow animate-pulse-glow" />
            <span className="text-8xl relative z-10 animate-float">🐸</span>
          </Button>
        </motion.div>

        {/* Coin particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: -120, opacity: 0, scale: 0.5 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute text-yellow-400 text-2xl z-20"
              style={{
                left: `${Math.random() * 120 + 30}px`,
                top: "50%"
              }}
              onAnimationComplete={() => setParticles(prev => prev.filter(id => id !== p))}
            >
              💰
            </motion.span>
          ))}
        </AnimatePresence>

        <p className="mt-6 text-xl font-bold text-center">
          {clicksRemaining > 0 ? `Click PEPE to earn $${earningPerClick}!` : "Daily limit reached! 🎉"}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          You can earn up to ${dailyEarningPotential} daily from your ${activePackageAmount} package
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 gradient-card text-center">
          <p className="text-sm text-muted-foreground">Today's Progress</p>
          <p className="text-2xl font-bold text-primary">{dailyClicks}/{MAX_DAILY_CLICKS}</p>
        </Card>
        <Card className="p-4 gradient-card text-center">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-bold text-earnings-gold">${totalEarnings.toFixed(2)}</p>
        </Card>
        <Card className="p-4 gradient-card text-center">
          <p className="text-sm text-muted-foreground">Days to ROI</p>
          <p className="text-2xl font-bold text-accent">{DAYS_TO_ROI} days</p>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2">
        💡 Click 3 times daily to earn! Your referrers earn bonuses from your earnings too!
      </p>
    </div>
  );
};
