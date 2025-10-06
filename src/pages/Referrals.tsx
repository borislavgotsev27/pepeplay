import { Navbar } from "@/components/Navbar";
import { ReferralTree } from "@/components/ReferralTree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion"; // ✅ added

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

const Referrals = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  
  useEffect(() => {
    fetchReferralCode();
  }, []);
  
  const fetchReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setReferralCode(profile.referral_code);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
      toast.error('Failed to load referral code');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
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
            Referral Program
          </h1>
          <p className="text-muted-foreground">Earn up to 10% commission on 3 levels of referrals</p>
        </div>
        
        <Card className="p-6 mb-8 gradient-card border-primary/20 glow-primary">
          <h3 className="text-xl font-bold mb-4">Your Referral Link</h3>
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 rounded-lg bg-game-bg border border-border focus:outline-none focus:border-primary"
              />
              <Button
                onClick={() => copyToClipboard(referralLink)}
                className="gap-2"
                size="lg"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Join PEPE Game",
                      text: "Play and earn USDT with me!",
                      url: referralLink,
                    });
                  } else {
                    copyToClipboard(referralLink);
                  }
                }}
                variant="hero"
                size="lg"
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          )}
          
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-semibold mb-2">💰 Referral Commission Structure:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <span className="text-primary font-semibold">Level 1:</span> 10% of referral earnings</li>
              <li>• <span className="text-accent font-semibold">Level 2:</span> 5% of sub-referral earnings</li>
              <li>• <span className="text-muted-foreground font-semibold">Level 3:</span> 2% of third-level earnings</li>
            </ul>
          </div>
        </Card>
        
        <ReferralTree />
      </main>
    </motion.div>
  );
};

export default Referrals;
