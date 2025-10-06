import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gamepad2, Users, Wallet, TrendingUp, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup"; // ✅ added

const Index = () => {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -40, transition: { duration: 0.4, ease: "easeInOut" } },
  };

  // Handle navigation with exit animation
  const handleAnimatedNav = (path: string) => {
    setExiting(true);
    setTimeout(() => navigate(path), 400); // match exit animation duration
  };

  return (
    <AnimatePresence mode="wait">
      {!exiting && (
        <motion.div
          key="index-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-gradient-dark"
        >
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(142_76%_59%/0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(43_96%_56%/0.1),transparent_50%)]" />

            <nav className="container mx-auto px-4 py-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="text-4xl animate-float">🐸</div>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  PEPE PLAY
                </span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="gap-2"
                onClick={() => handleAnimatedNav("/auth")}
              >
                <Wallet className="w-4 h-4" />
                Get Started
              </Button>
            </nav>

            <div className="container mx-auto px-4 py-20 text-center relative z-10">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  className="text-8xl mb-8 inline-block"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  🐸
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  Play PEPE, Earn USDT
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  The ultimate crypto gaming experience with referral rewards. Click, earn, and build your PEPE empire!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 py-6"
                    onClick={() => handleAnimatedNav("/auth?mode=signin")}
                  >
                    <Gamepad2 className="w-5 h-5" />
                    Log In
                  </Button>

                  <Button
                    variant="hero"
                    size="lg"
                    className="gap-2 text-lg px-8 py-6"
                    onClick={() => handleAnimatedNav("/auth?mode=signup")}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Create Account
                  </Button>
                </div>

                {/* Stats Cards with CountUp */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <Card className="p-6 gradient-card border-primary/20 text-center">
                    <p className="text-3xl font-bold text-primary mb-1">
                      <CountUp start={0} end={10000} duration={2.5} separator="," prefix="$" />
                    </p>
                    <p className="text-sm text-muted-foreground">Paid to Players</p>
                  </Card>
                  <Card className="p-6 gradient-card border-earnings-gold/20 text-center">
                    <p className="text-3xl font-bold text-earnings-gold mb-1">
                      <CountUp start={0} end={5000} duration={2.5} separator="," />
                    </p>
                    <p className="text-sm text-muted-foreground">Active Players</p>
                  </Card>
                  <Card className="p-6 gradient-card border-accent/20 text-center">
                    <p className="text-3xl font-bold text-accent mb-1">
                      <CountUp start={0} end={15} duration={2.5} suffix="%" />
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. ROI</p>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="container mx-auto px-4 py-20">
            <h2 className="text-4xl font-bold text-center mb-12">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                PEPE Play?
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Gamepad2 className="w-6 h-6 text-primary" />,
                  title: "Engaging Gameplay",
                  color: "primary",
                  text: "Click to earn, unlock achievements, and compete with players worldwide. Simple yet addictive!",
                },
                {
                  icon: <Users className="w-6 h-6 text-earnings-gold" />,
                  title: "3-Level Referrals",
                  color: "earnings-gold",
                  text: "Earn 10%, 5%, and 2% commission on three levels. Build your network and maximize earnings!",
                },
                {
                  icon: <Wallet className="w-6 h-6 text-accent" />,
                  title: "USDT Rewards",
                  color: "accent",
                  text: "Deposit and withdraw USDT seamlessly. Your earnings are always secure and accessible.",
                },
                {
                  icon: <Shield className="w-6 h-6 text-primary" />,
                  title: "Secure & Safe",
                  color: "primary",
                  text: "Bank-level encryption and anti-fraud measures. Your funds and data are always protected.",
                },
                {
                  icon: <TrendingUp className="w-6 h-6 text-earnings-gold" />,
                  title: "Real-Time Stats",
                  color: "earnings-gold",
                  text: "Track earnings, referrals, and transactions in real-time with our beautiful dashboard.",
                },
                {
                  icon: <Zap className="w-6 h-6 text-accent" />,
                  title: "Instant Payouts",
                  color: "accent",
                  text: "Withdraw your earnings anytime. Fast, reliable, and transparent payment processing.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className={`p-8 gradient-card border-${feature.color}/20 hover:border-${feature.color}/40 transition-all hover:scale-105`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.text}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-20">
            <Card className="p-12 gradient-primary border-primary/20 glow-primary text-center">
              <h2 className="text-4xl font-bold mb-4 text-primary-foreground">
                Ready to Start Earning?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of players earning USDT daily. Connect your wallet and start playing in seconds!
              </p>

              <Button
                variant="hero"
                size="lg"
                className="relative gap-3 text-lg font-bold px-10 py-6 rounded-2xl bg-white/10 text-black border border-white/30 hover:bg-transparent/20 hover:text-white hover:scale-105 hover:shadow-lg transition-all duration-300"
                onClick={() => handleAnimatedNav("/auth")}
              >
                <Gamepad2 className="w-6 h-6" />
                Launch Game Now
              </Button>
            </Card>
          </section>

          {/* Footer */}
          <footer className="border-t border-border py-8">
            <div className="container mx-auto px-4 text-center text-muted-foreground">
              <p>© 2025 PEPE Play. All rights reserved. Play responsibly.</p>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
