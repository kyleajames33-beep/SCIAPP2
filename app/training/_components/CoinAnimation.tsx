'use client'

import { Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type CoinAnimationProps = {
  amount: number | null
}

export function CoinAnimation({ amount }: CoinAnimationProps) {
  return (
    <AnimatePresence>
      {amount && (
        <motion.div
          initial={{ opacity: 1, y: 0, x: '-50%' }}
          animate={{ opacity: 0, y: -100 }}
          exit={{ opacity: 0 }}
          className="fixed top-1/2 left-1/2 z-50 text-4xl font-bold text-yellow-400 flex items-center gap-2"
        >
          <Coins className="w-8 h-8" />
          +{amount}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
