"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RankData {
  name: string;
  symbol: string;
  gradient: string;
}

interface RankUpCelebrationProps {
  previousRank: RankData;
  newRank: RankData;
  onComplete: () => void;
}

export function RankUpCelebration({
  previousRank,
  newRank,
  onComplete
}: RankUpCelebrationProps) {
  const [phase, setPhase] = useState<"intro" | "transition" | "reveal" | "complete">("intro");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("transition"), 1500),
      setTimeout(() => setPhase("reveal"), 3000),
      setTimeout(() => setPhase("complete"), 5000)
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      >
        {/* Particle effects background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{
                x: "50vw",
                y: "50vh",
                scale: 0
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative text-center z-10">
          {/* Intro phase - "RANK UP!" text */}
          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <motion.div
                key="intro"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <ChevronUp className="w-16 h-16 text-yellow-400 mx-auto" />
                </motion.div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                  RANK UP!
                </h1>
              </motion.div>
            )}

            {/* Transition phase - showing old rank fading */}
            {phase === "transition" && (
              <motion.div
                key="transition"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${previousRank.gradient} flex items-center justify-center shadow-2xl`}
                >
                  <span className="text-4xl font-bold text-white drop-shadow-lg">
                    {previousRank.symbol}
                  </span>
                </motion.div>
                <p className="text-2xl text-gray-400">{previousRank.name}</p>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto" />
                </motion.div>
              </motion.div>
            )}

            {/* Reveal phase - new rank with celebration */}
            {(phase === "reveal" || phase === "complete") && (
              <motion.div
                key="reveal"
                initial={{ scale: 0, rotate: 360 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="space-y-6"
              >
                {/* Glowing ring effect */}
                <div className="relative">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(234, 179, 8, 0.5)",
                        "0 0 60px rgba(234, 179, 8, 0.8)",
                        "0 0 20px rgba(234, 179, 8, 0.5)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-40 h-40 mx-auto rounded-full bg-gradient-to-br ${newRank.gradient} flex items-center justify-center`}
                  >
                    <span className="text-5xl font-bold text-white drop-shadow-lg">
                      {newRank.symbol}
                    </span>
                  </motion.div>
                  
                  {/* Orbiting stars */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 1
                      }}
                      style={{ transformOrigin: "0 0" }}
                    >
                      <Star
                        className="w-6 h-6 text-yellow-400 fill-yellow-400"
                        style={{
                          transform: `translate(${80 + i * 10}px, -50%)`
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-white"
                >
                  {newRank.name}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-400"
                >
                  You&apos;ve achieved a new rank!
                </motion.p>

                {phase === "complete" && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      size="lg"
                      onClick={onComplete}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
