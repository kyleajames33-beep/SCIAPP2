"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Zap, Flame, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface XPPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  newTotalXP: number;
  newRank: string;
  currentStreak: number;
  rankChanged: boolean;
  previousRank?: string;
}

export function XPPopUp({
  isOpen,
  onClose,
  xpEarned,
  newTotalXP,
  newRank,
  currentStreak,
  rankChanged,
  previousRank,
}: XPPopUpProps) {
  // Trigger confetti when rank changes
  useEffect(() => {
    if (isOpen && rankChanged) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, rankChanged]);

  // Get rank color
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Bronze":
        return "from-amber-700 to-amber-600";
      case "Silver":
        return "from-slate-400 to-slate-300";
      case "Gold":
        return "from-yellow-500 to-yellow-400";
      case "Platinum":
        return "from-cyan-500 to-cyan-300";
      case "Diamond":
        return "from-purple-500 to-blue-500";
      default:
        return "from-gray-500 to-gray-400";
    }
  };

  // Get rank icon
  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "Bronze":
        return <Trophy className="w-8 h-8 text-amber-700" />;
      case "Silver":
        return <Trophy className="w-8 h-8 text-slate-400" />;
      case "Gold":
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case "Platinum":
        return <Star className="w-8 h-8 text-cyan-400" />;
      case "Diamond":
        return <Star className="w-8 h-8 text-purple-400" />;
      default:
        return <Trophy className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.5,
              }}
              className="relative w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-75 animate-pulse" />

              {/* Card */}
              <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 shadow-2xl border border-purple-500/30 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
                  />
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6"
                  >
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Quiz Complete! 🎉
                    </h2>
                    <p className="text-purple-200">Here&apos;s what you earned</p>
                  </motion.div>

                  {/* XP Earned Section */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-6"
                  >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full px-6 py-3 border border-yellow-500/30">
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <span className="text-4xl font-bold text-yellow-400">
                        +{xpEarned}
                      </span>
                      <span className="text-yellow-200 font-semibold">XP</span>
                    </div>
                  </motion.div>

                  {/* Stats Grid */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-4 mb-6"
                  >
                    {/* Total XP */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-purple-300 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Total XP</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {newTotalXP.toLocaleString()}
                      </p>
                    </div>

                    {/* Streak */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-orange-300 mb-1">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-medium">Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {currentStreak}{" "}
                        <span className="text-sm text-orange-300">days</span>
                      </p>
                    </div>
                  </motion.div>

                  {/* Rank Section */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <div
                      className={`relative rounded-xl p-4 border ${
                        rankChanged
                          ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      {rankChanged && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            damping: 10,
                            stiffness: 200,
                            delay: 0.6,
                          }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                        >
                          RANK UP!
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            {rankChanged && previousRank
                              ? `${previousRank} → ${newRank}`
                              : "Current Rank"}
                          </p>
                          <p
                            className={`text-2xl font-bold bg-gradient-to-r ${getRankColor(
                              newRank
                            )} bg-clip-text text-transparent`}
                          >
                            {newRank}
                          </p>
                        </div>
                        <motion.div
                          animate={
                            rankChanged
                              ? {
                                  rotate: [0, -10, 10, -10, 10, 0],
                                  scale: [1, 1.2, 1],
                                }
                              : {}
                          }
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          {getRankIcon(newRank)}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Button */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Awesome!
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default XPPopUp;
