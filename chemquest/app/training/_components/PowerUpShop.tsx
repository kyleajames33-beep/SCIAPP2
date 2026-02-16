'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Coins, X, Timer, Percent, Zap, SkipForward } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PowerUpId } from '@/lib/game-types'
import { POWER_UP_DISPLAY } from '@/lib/game-config'

type PowerUpShopProps = {
  isOpen: boolean
  coins: number
  ownedPowerUps: Record<PowerUpId, number>
  onClose: () => void
  onBuy: (powerUpId: PowerUpId, cost: number) => void
}

const POWER_UP_ICONS: Record<PowerUpId, React.ReactNode> = {
  timeFreeze: <Timer className="w-5 h-5" />,
  fiftyFifty: <Percent className="w-5 h-5" />,
  doublePoints: <Zap className="w-5 h-5" />,
  skip: <SkipForward className="w-5 h-5" />,
}

export function PowerUpShop({
  isOpen,
  coins,
  ownedPowerUps,
  onClose,
  onBuy
}: PowerUpShopProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="bg-white shadow-2xl border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                    Power-Up Shop
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-yellow-600">{coins}</span> coins available
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {POWER_UP_DISPLAY.map(powerUp => (
                  <motion.div
                    key={powerUp.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        coins >= powerUp.cost ? 'opacity-100' : 'opacity-50'
                      }`}
                      onClick={() => onBuy(powerUp.id, powerUp.cost)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${powerUp.color} text-white`}>
                          {POWER_UP_ICONS[powerUp.id]}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{powerUp.name}</p>
                          <p className="text-sm text-gray-500">{powerUp.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-600 font-bold">
                            <Coins className="w-4 h-4" />
                            {powerUp.cost}
                          </div>
                          <p className="text-xs text-gray-500">Owned: {ownedPowerUps[powerUp.id]}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
