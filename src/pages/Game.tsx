import { Navbar } from "@/components/Navbar";
import { GameArea } from "@/components/GameArea";
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

const Game = () => {
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
            Play & Earn
          </h1>
          <p className="text-muted-foreground">
            Click PEPE to earn USDT rewards! The more you play, the more you earn.
          </p>
        </div>
        
        <GameArea />
      </main>
    </motion.div>
  );
};

export default Game;
