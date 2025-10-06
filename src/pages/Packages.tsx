import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string;
  amount: number;
  bonus_percentage: number;
  icon: string;
  features: string[];
  is_active: boolean;
}

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentPackageAmount, setCurrentPackageAmount] = useState<number>(0);
  const [ownedPackageId, setOwnedPackageId] = useState<string | null>(null);
  const [showPackages, setShowPackages] = useState(true); // control exit animation
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    fetchUserPackage();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('amount');

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast.error("Failed to load packages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPackage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userPackage } = await supabase
        .from('user_packages')
        .select('package_id, amount')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userPackage) {
        setCurrentPackageAmount(userPackage.amount);
        setOwnedPackageId(userPackage.package_id);
      }
    } catch (error: any) {
      console.error('Failed to fetch user package:', error);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (currentPackageAmount > 0 && pkg.amount <= currentPackageAmount) {
      toast.error("You cannot downgrade to a lower package!");
      return;
    }

    setPurchasing(pkg.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate('/auth');
        return;
      }

      const bonusAmount = (pkg.amount * pkg.bonus_percentage) / 100;

      const { error } = await supabase
        .from('user_packages')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          amount: pkg.amount,
          bonus_amount: bonusAmount,
          status: 'completed'
        });

      if (error) throw error

      toast.success(`🎉 ${pkg.name} activated! Start playing to earn rewards.`);

      await fetchUserPackage();

      // trigger exit animation
      setShowPackages(false);
      setTimeout(() => navigate('/dashboard'), 400);
      
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
      console.error(error);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐸</div>
          <p className="text-xl text-primary">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-dark flex justify-center items-start py-12 min-h-screen">
      <AnimatePresence>
        {showPackages && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50, transition: { duration: 0.4, ease: "easeInOut" } }}
            className="bg-card/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-6xl w-full"
          >
            <div className="container mx-auto px-4 py-10 relative z-10 max-w-6xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Investment Packages
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Select a package to start earning. Return your investment in 50 days!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full mb-6">
                {packages.map((pkg) => {
                  const isOwned = pkg.id === ownedPackageId;
                  const isLowerThanOwned = currentPackageAmount > 0 && pkg.amount <= currentPackageAmount;
                  const isDisabled = isOwned || isLowerThanOwned || purchasing !== null;

                  return (
                    <Card
                      key={pkg.id}
                      className={`p-6 gradient-card relative overflow-hidden transition-transform duration-300 ease-out
                      hover:scale-105 hover:shadow-xl min-h-[300px] ${
                        isOwned ? 'border-primary/40 glow-primary' :
                        isLowerThanOwned ? 'opacity-50' :
                        'border-primary/20 hover:scale-105'
                      }`}
                    >
                      {isOwned && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                          Owned
                        </Badge>
                      )}
                      {isLowerThanOwned && !isOwned && (
                        <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs">
                          Lower
                        </Badge>
                      )}

                      <div className="text-center mb-3">
                        <div className="text-4xl mb-2">{pkg.icon}</div>
                        <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-primary">${pkg.amount}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          +{pkg.bonus_percentage}% Bonus
                        </Badge>
                      </div>

                      <Button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isDisabled}
                        className="w-full"
                        size="sm"
                        variant={isOwned ? "outline" : "default"}
                      >
                        {purchasing === pkg.id ? "Processing..." :
                          isOwned ? "Active" :
                          isLowerThanOwned ? "Cannot Downgrade" :
                          "Upgrade"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Total: ${(pkg.amount + (pkg.amount * pkg.bonus_percentage / 100)).toFixed(2)}
                      </p>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center -mt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPackages(false);
                    setTimeout(() => navigate('/dashboard'), 400);
                  }}
                >
                  Back to the Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Packages;
