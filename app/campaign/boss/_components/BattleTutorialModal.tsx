'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Shield, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TUTORIAL_KEY = 'chemquest_battle_tutorial_seen';

const STEPS = [
  {
    icon: <Swords className="w-10 h-10 text-red-400" />,
    title: 'Answer to Attack',
    body: 'Answer questions correctly to deal damage to the boss. The faster you answer, the more energy you build.',
    color: 'from-red-500/20 to-red-900/10',
    border: 'border-red-500/30',
  },
  {
    icon: <Zap className="w-10 h-10 text-yellow-400" />,
    title: 'Build Your Streak',
    body: 'Consecutive correct answers increase your streak multiplier. A higher streak means more damage per hit.',
    color: 'from-yellow-500/20 to-yellow-900/10',
    border: 'border-yellow-500/30',
  },
  {
    icon: <Shield className="w-10 h-10 text-blue-400" />,
    title: 'Wrong Answers Hurt',
    body: "Miss a question and the boss attacks you. Lose all your HP and you'll have to retry the battle.",
    color: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500/30',
  },
];

export function useBattleTutorial() {
  // Default to true (seen) to avoid flashing the modal on SSR
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setShowTutorial(false);
  };

  return { showTutorial, dismissTutorial };
}

interface BattleTutorialModalProps {
  onDismiss: () => void;
}

export function BattleTutorialModal({ onDismiss }: BattleTutorialModalProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -16 }}
          transition={{ duration: 0.25 }}
          className={`relative w-full max-w-sm rounded-2xl bg-gradient-to-br ${current.color} border ${current.border} bg-slate-900 p-8 shadow-2xl`}
        >
          {/* Skip */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-white/60' : 'bg-white/15'}`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">{current.icon}</div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">{current.title}</h2>
          <p className="text-white/70 text-center text-sm leading-relaxed mb-8">{current.body}</p>

          {/* CTA */}
          <Button
            onClick={next}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            {isLast ? 'Start Battle' : (
              <span className="flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
