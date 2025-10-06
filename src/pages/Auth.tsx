import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion"; // 👈 add this

// 👇 reuse same easing and timing as your Index page
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

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // 👈 for redirect after login
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    const mode = searchParams.get("mode");

    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setIsLogin(false);
    }

    if (mode === "signup") setIsLogin(false);
    else if (mode === "signin") setIsLogin(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back to PEPE Play! 🐸");
        // 👇 smooth redirect to dashboard
        setTimeout(() => navigate("/dashboard"), 400);
      } else {
        if (!username.trim()) {
          toast.error("Please enter a username");
          setLoading(false);
          return;
        }
        if (!referralCode.trim()) {
          toast.error("Please enter a referral code");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username, referralCode);
        if (error) throw error;
        toast.success("Account created! Select your package to start playing! 🎉");
        setTimeout(() => navigate("/dashboard"), 400);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-dark flex items-center justify-center p-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(142_76%_59%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(43_96%_56%/0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="text-5xl animate-float">🐸</div>
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            PEPE Play
          </span>
        </Link>

        <Card className="p-8 gradient-card border-primary/20 glow-primary">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome Back!" : "Join PEPE Play"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to continue earning"
                : "Create an account to start playing and earning USDT"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="PepeChampion"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="referralCode">Referral Code *</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="PEPE-XXXXXXXX"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(e.target.value.toUpperCase())
                    }
                    required
                    className="mt-1 font-mono"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You need a valid referral code to sign up
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="pepe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary-glow font-semibold transition-colors"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </motion.div>
  );
};

export default Auth;
