import { Card } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Referral {
  id: string;
  name: string;
  earnings: number;
  level: number;
  referrals?: Referral[];
}

const ReferralNode = ({ referral }: { referral: Referral }) => {
  const levelColors = {
    1: "border-primary/40 bg-primary/5",
    2: "border-accent/40 bg-accent/5",
    3: "border-muted/40 bg-muted/5",
  };
  
  return (
    <div className="space-y-2">
      <Card className={`p-4 ${levelColors[referral.level as keyof typeof levelColors]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xl">
              🐸
            </div>
            <div>
              <p className="font-semibold">{referral.name}</p>
              <p className="text-xs text-muted-foreground">Level {referral.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-earnings-gold">${referral.earnings.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>
      </Card>
      
      {referral.referrals && referral.referrals.length > 0 && (
        <div className="ml-8 space-y-2 border-l-2 border-primary/20 pl-4">
          {referral.referrals.map((child) => (
            <ReferralNode key={child.id} referral={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ReferralTree = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch referral earnings for this user
      const { data: earnings, error: earningsError } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;

      console.log('Earnings data:', earnings);

      // Calculate total earnings
      const total = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      setTotalEarnings(total);

      // Get unique referred user IDs
      const referredUserIds = [...new Set(earnings?.map(e => e.referred_user_id) || [])];
      
      console.log('Referred user IDs:', referredUserIds);

      // Fetch usernames for all referred users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', referredUserIds);

      if (profilesError) throw profilesError;

      console.log('Profiles data:', profiles);

      // Create a map of user IDs to usernames
      const usernameMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      console.log('Username map:', usernameMap);

      // Group earnings by referred user and level
      const referralMap = new Map<string, Referral>();
      
      earnings?.forEach(earning => {
        const userId = earning.referred_user_id;
        const existing = referralMap.get(userId);
        
        if (existing) {
          existing.earnings += Number(earning.amount);
        } else {
          const username = usernameMap.get(userId);
          console.log(`User ${userId} -> username: ${username}`);
          referralMap.set(userId, {
            id: userId,
            name: username || `User ${userId.slice(0, 8)}`,
            earnings: Number(earning.amount),
            level: earning.level,
            referrals: []
          });
        }
      });

      // Convert map to array and organize by levels
      const level1Referrals = Array.from(referralMap.values()).filter(r => r.level === 1);
      const level2Referrals = Array.from(referralMap.values()).filter(r => r.level === 2);
      const level3Referrals = Array.from(referralMap.values()).filter(r => r.level === 3);

      // Nest referrals (simplified - in production you'd track parent-child relationships)
      level1Referrals.forEach(l1 => {
        l1.referrals = level2Referrals.slice(0, 2); // Simplified nesting
        l1.referrals.forEach(l2 => {
          l2.referrals = level3Referrals.slice(0, 1);
        });
      });

      setReferrals(level1Referrals);
      setTotalReferrals(referralMap.size);

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 gradient-card border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{totalReferrals}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 gradient-card border-earnings-gold/20 glow-gold">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-earnings-gold" />
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-earnings-gold">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 gradient-card">
          <div>
            <p className="text-sm text-muted-foreground">Commission Rate</p>
            <p className="text-2xl font-bold">10% / 5% / 2%</p>
            <p className="text-xs text-muted-foreground mt-1">Level 1 / 2 / 3</p>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 gradient-card">
        <h3 className="text-xl font-bold mb-4">Your Referral Network</h3>
        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No referrals yet</p>
            <p className="text-sm text-muted-foreground">Share your referral code to start earning commissions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <ReferralNode key={referral.id} referral={referral} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
