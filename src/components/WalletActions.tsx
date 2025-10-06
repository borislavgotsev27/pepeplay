import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Rocket, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const WalletActions = ({ currentBalance, user }: { currentBalance: number; user: any }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<"USDT" | "USDC">("USDT");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawWallet, setWithdrawWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const [depositWallet, setDepositWallet] = useState<string | null>(null);
  const [depositTrackId, setDepositTrackId] = useState<string | null>(null);
  const [depositProgress, setDepositProgress] = useState(0);
  const [depositStatus, setDepositStatus] = useState<"pending" | "confirmed" | "failed" | null>(null);

  // --- AUTO-POLLING FOR DEPOSIT CONFIRMATION ---
  useEffect(() => {
    if (!depositTrackId || depositStatus === "confirmed" || depositStatus === "failed") return;

    setDepositProgress(0);
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("process-deposit", {
          body: { wallet_address: depositTrackId, user_id: user.id },
        });

        if (error) throw error;

        if (data?.success) {
          setDepositStatus("confirmed");
          toast.success(`Deposit of $${data.amount.toFixed(2)} confirmed!`);
          setDepositDialogOpen(false);
          setDepositWallet(null);
          setDepositTrackId(null);
          setDepositProgress(100);
          clearInterval(interval);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 300) {
            setDepositStatus("failed");
            toast.error("Deposit failed or not confirmed in time");
            setDepositProgress(100);
            clearInterval(interval);
          } else {
            setDepositProgress((prev) => Math.min(prev + 2, 95));
          }
        }
      } catch (err) {
        console.error("Deposit verification error:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [depositTrackId, depositStatus]);

  // --- HANDLE DEPOSIT REQUEST ---
  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-deposit", {
        body: { amount, user_id: user.id, currency: depositCurrency },
      });

      if (error || !data?.wallet_address) throw new Error(data?.error || "Failed to create deposit wallet");

      setDepositWallet(data.wallet_address);
      setDepositTrackId(data.trackId);
      setDepositStatus("pending");
      toast.success(`Deposit request created! Click the payment link to complete.`);
    } catch (err: any) {
      console.error("Deposit request error:", err);
      toast.error(err.message || "Deposit request failed");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE WITHDRAWAL REQUEST ---
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < 10) {
      toast.error("Minimum withdrawal is $10");
      return;
    }
    if (!withdrawWallet) {
      toast.error("Please enter your wallet address for withdrawal");
      return;
    }

    const withdrawalFee = amount * 0.02;
    const totalDeduction = amount + withdrawalFee;

    if (currentBalance < totalDeduction) {
      toast.error(`Insufficient balance. You need $${totalDeduction.toFixed(2)} (including 2% fee)`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: { amount, wallet_address: withdrawWallet, user_id: user.id },
      });

      if (error || !data?.success) throw new Error(data?.error || "Withdrawal failed");

      toast.success(`✅ Withdrawal of $${amount.toFixed(2)} initiated!`);
      setWithdrawAmount("");
      setWithdrawWallet("");
      setWithdrawDialogOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* --- DEPOSIT CARD --- */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 gradient-card border-primary/20 hover:border-primary/40 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Deposit</h3>
                <p className="text-sm text-muted-foreground">Add funds via OxaPay</p>
              </div>
              <Coins className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit</DialogTitle>
            <DialogDescription>
              Enter the amount and send funds to the generated wallet. Your deposit will auto-confirm.
            </DialogDescription>
          </DialogHeader>

          {!depositWallet ? (
            <form onSubmit={handleDepositRequest} className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="100.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="mt-1 w-full rounded-lg border p-2"
                  value={depositCurrency}
                  onChange={(e) => setDepositCurrency(e.target.value as "USDT" | "USDC")}
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "Creating deposit..." : "Generate Deposit Wallet"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <motion.div
                className={`p-6 rounded-xl relative ${
                  depositStatus === "failed"
                    ? "bg-red-200"
                    : "bg-gradient-to-br from-yellow-400/20 to-emerald-400/20"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Rocket className="w-12 h-12 mx-auto text-emerald-500 animate-bounce" />
                <p className="mt-2 font-bold text-lg">Complete Payment</p>
                <a
                  href={depositWallet || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Open Payment Page
                </a>
                <p className="mt-3 text-xs text-muted-foreground break-all">Track ID: {depositTrackId}</p>
                <div className="relative w-full h-2 bg-border rounded-full mt-4 overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-2 ${
                      depositStatus === "failed" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${depositProgress}%` }}
                    animate={{ width: depositProgress }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {depositStatus === "failed"
                    ? "Deposit failed"
                    : "Waiting for payment confirmation..."}
                </p>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- WITHDRAWAL CARD --- */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 gradient-card border-earnings-gold/20 hover:border-earnings-gold/40 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Withdraw</h3>
                <p className="text-sm text-muted-foreground">Instant payout via OxaPay</p>
              </div>
              <Zap className="w-8 h-8 text-earnings-gold group-hover:scale-110 transition-transform" />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw</DialogTitle>
            <DialogDescription>
              Minimum $10, 2% processing fee. Instant payout!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-earnings-gold">${currentBalance.toFixed(2)}</p>
            </div>

            <div>
              <Label htmlFor="withdrawWallet">Your Wallet Address</Label>
              <Input
                id="withdrawWallet"
                type="text"
                placeholder="0x..."
                value={withdrawWallet}
                onChange={(e) => setWithdrawWallet(e.target.value)}
                required
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="withdrawAmount">Amount</Label>
              <Input
                id="withdrawAmount"
                type="number"
                step="0.01"
                min="10"
                max={currentBalance}
                placeholder="50.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                className="mt-1"
              />
              {withdrawAmount && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fee: ${(parseFloat(withdrawAmount) * 0.02).toFixed(2)} • You'll
                  receive: ${(parseFloat(withdrawAmount) * 0.98).toFixed(2)}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg" variant="hero">
              {loading ? "Processing Withdrawal..." : "Withdraw Now"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
