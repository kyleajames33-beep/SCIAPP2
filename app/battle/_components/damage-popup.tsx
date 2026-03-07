'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DamagePopupProps {
  damage: number;
  isHeal?: boolean;
}

export function DamagePopup({ damage, isHeal = false }: DamagePopupProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed top-1/3 left-1/2 -translate-x-1/2 text-6xl font-bold pointer-events-none z-50 ${
            isHeal ? 'text-green-400' : 'text-red-500'
          }`}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -100, scale: 1.5 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {isHeal ? '+' : '-'}{damage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
