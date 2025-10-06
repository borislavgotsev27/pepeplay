import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coins, Gamepad2, Users, Wallet, LogOut, Shield, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [walletConnected, setWalletConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setWalletConnected(!!user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Mobile menu animation variants
  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl animate-float">🐸</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              PEPE Play
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard">
              <Button variant={isActive("/dashboard") ? "default" : "ghost"} className="gap-2">
                <Coins className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/packages">
              <Button variant={isActive("/packages") ? "default" : "ghost"} className="gap-2">
                <Wallet className="w-4 h-4" />
                Packages
              </Button>
            </Link>
            <Link to="/game">
              <Button variant={isActive("/game") ? "default" : "ghost"} className="gap-2">
                <Gamepad2 className="w-4 h-4" />
                Play Game
              </Button>
            </Link>
            <Link to="/referrals">
              <Button variant={isActive("/referrals") ? "default" : "ghost"} className="gap-2">
                <Users className="w-4 h-4" />
                Referrals
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant={isActive("/admin") ? "default" : "ghost"} className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* Wallet / Auth Button */}
          <div className="hidden md:block">
            {walletConnected ? (
              <Button variant="outline" size="lg" className="gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="lg" className="gap-2">
                  <Wallet className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-card/90 backdrop-blur-lg border-t border-border"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={isActive("/dashboard") ? "default" : "ghost"} className="w-full gap-2 justify-start">
                  <Coins className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/packages" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={isActive("/packages") ? "default" : "ghost"} className="w-full gap-2 justify-start">
                  <Wallet className="w-4 h-4" />
                  Packages
                </Button>
              </Link>
              <Link to="/game" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={isActive("/game") ? "default" : "ghost"} className="w-full gap-2 justify-start">
                  <Gamepad2 className="w-4 h-4" />
                  Play Game
                </Button>
              </Link>
              <Link to="/referrals" onClick={() => setMobileMenuOpen(false)}>
                <Button variant={isActive("/referrals") ? "default" : "ghost"} className="w-full gap-2 justify-start">
                  <Users className="w-4 h-4" />
                  Referrals
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={isActive("/admin") ? "default" : "ghost"} className="w-full gap-2 justify-start">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <div className="pt-2 border-t border-border">
                {walletConnected ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 justify-start"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" size="lg" className="w-full gap-2 justify-start">
                      <Wallet className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
