import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { TransactionHistory } from "@/components/TransactionHistory";
import { WalletActions } from "@/components/WalletActions";
import { Wallet, TrendingUp, Users, Coins } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.42, 0, 0.58, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] },
  },
};

const Dashboard = () => {
  const [user, setUser] = useState<any | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [pendingGameRewards, setPendingGameRewards] = useState(0);
  const [pendingReferralBonus, setPendingReferralBonus] = useState(0);
  const [loading, setLoading] = useState(true);

  // fetch user profile & related data, accepts user object
  const fetchUserData = useCallback(async (u: any) => {
    setLoading(true);
    try {
      console.log("DEBUG: fetchUserData for user:", u?.id);
      if (!u?.id) {
        setLoading(false);
        return;
      }

      // profile
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("balance, total_earnings")
        .eq("id", u.id)
        .single();

      if (profileErr) {
        console.warn("DEBUG: profileErr", profileErr);
      } else if (profile) {
        setBalance(profile.balance ?? 0);
        setTotalEarnings(profile.total_earnings ?? 0);
      }

      // referral earnings
      const { data: referralData, error: referralErr } = await supabase
        .from("referral_earnings")
        .select("amount")
        .eq("user_id", u.id);

      if (referralErr) {
        console.warn("DEBUG: referralErr", referralErr);
      } else {
        const totalReferralEarnings =
          referralData?.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0) || 0;
        setReferralEarnings(totalReferralEarnings);
      }

      // active referrals count
      const { count, error: countErr } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", u.id);

      if (countErr) {
        console.warn("DEBUG: countErr", countErr);
        setActiveReferrals(0);
      } else {
        setActiveReferrals(count ?? 0);
      }

      // pending transactions
      const { data: pendingTransactions, error: pendingErr } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", u.id)
        .eq("status", "pending");

      if (pendingErr) {
        console.warn("DEBUG: pendingErr", pendingErr);
      } else {
        const gameRewards =
          pendingTransactions
            ?.filter((t: any) => t.type === "game_earning")
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;
        const refBonus =
          pendingTransactions
            ?.filter((t: any) => t.type === "referral_bonus")
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

        setPendingGameRewards(gameRewards);
        setPendingReferralBonus(refBonus);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // init auth: try getUser, fallback to getSession, subscribe to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userRes = await supabase.auth.getUser();
        console.log("DEBUG auth.getUser()", userRes);
        const u = userRes?.data?.user ?? null;

        if (!u) {
          // fallback: try getSession
          const sessionRes = await supabase.auth.getSession();
          console.log("DEBUG auth.getSession()", sessionRes);
          const sessUser = sessionRes?.data?.session?.user ?? null;
          if (mounted) setUser(sessUser);
          if (sessUser) await fetchUserData(sessUser);
        } else {
          if (mounted) setUser(u);
          await fetchUserData(u);
        }
      } catch (err) {
        console.error("DEBUG auth init error:", err);
        setLoading(false);
      }
    })();

    // subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        console.log("DEBUG onAuthStateChange:", event, session);
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) fetchUserData(newUser);
      } catch (e) {
        console.error("DEBUG auth change handler error:", e);
      }
    });

    return () => {
      mounted = false;
      // cleanup subscription (supabase returns .subscription for older versions)
      if (authListener) {
        // try multiple cleanup methods depending on SDK version
        // @ts-ignore
        if (authListener.subscription?.unsubscribe) {
          // v1-ish
          try { authListener.subscription.unsubscribe(); } catch {}
        } else if (authListener.unsubscribe) {
          // v2-ish
          try { authListener.unsubscribe(); } catch {}
        }
      }
    };
  }, [fetchUserData]);

  // show explicit loading / not-signed-in messages to avoid blank page
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="text-center text-muted-foreground">
          <p>Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // normal rendering when user is available
  return (
    <motion.div
      className="min-h-screen bg-gradient-dark"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your earnings, referrals, and game progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Balance"
            value={`$${balance.toFixed(2)}`}
            icon={Wallet}
            variant="gold"
            trend="+12.5% this week"
          />
          <StatsCard
            title="Total Earnings"
            value={`$${totalEarnings.toFixed(2)}`}
            icon={Coins}
            variant="primary"
            trend="+8.3% this week"
          />
          <StatsCard
            title="Referral Earnings"
            value={`$${referralEarnings.toFixed(2)}`}
            icon={TrendingUp}
            variant="gold"
          />
          <StatsCard
            title="Active Referrals"
            value={activeReferrals.toString()}
            icon={Users}
          />
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          {/* pass the user object as required by WalletActions */}
          <WalletActions currentBalance={balance} user={user} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionHistory />

          <div className="space-y-6">
            <div className="p-6 rounded-lg gradient-card border border-earnings-gold/20 glow-gold">
              <h3 className="text-xl font-bold mb-4">Pending Rewards</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Game Rewards</span>
                  <span className="text-earnings-gold font-bold">
                    ${pendingGameRewards.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Referral Bonus</span>
                  <span className="text-earnings-gold font-bold">
                    ${pendingReferralBonus.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-semibold">Total Pending</span>
                  <span className="text-2xl text-earnings-gold font-bold">
                    ${(pendingGameRewards + pendingReferralBonus).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;
