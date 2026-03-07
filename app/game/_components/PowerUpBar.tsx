'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Timer, Percent, Zap, SkipForward } from 'lucide-react'
import { motion } from 'framer-motion'
import { PowerUpId } from '@/lib/game-types'
import { POWER_UP_DISPLAY } from '@/lib/game-config'

type PowerUpBarProps = {
  ownedPowerUps: Record<PowerUpId, number>
  isAnswered: boolean
  onUsePowerUp: (powerUpId: PowerUpId) => void
  onOpenShop: () => void
}

const POWER_UP_ICONS: Record<PowerUpId, React.ReactNode> = {
  timeFreeze: <Timer className="w-5 h-5" />,
  fiftyFifty: <Percent className="w-5 h-5" />,
  doublePoints: <Zap className="w-5 h-5" />,
  skip: <SkipForward className="w-5 h-5" />,
}

export function PowerUpBar({
  ownedPowerUps,
  isAnswered,
  onUsePowerUp,
  onOpenShop
}: PowerUpBarProps) {
  return (
    <Card className="bg-white/95 backdrop-blur shadow-lg border-0 mb-4">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Power-ups:</span>
          {POWER_UP_DISPLAY.map(powerUp => {
            const count = ownedPowerUps[powerUp.id]
            return (
              <motion.button
                key={powerUp.id}
                whileHover={{ scale: count > 0 && !isAnswered ? 1.1 : 1 }}
                whileTap={{ scale: count > 0 && !isAnswered ? 0.9 : 1 }}
                onClick={() => onUsePowerUp(powerUp.id)}
                disabled={count <= 0 || isAnswered}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  count > 0 && !isAnswered
                    ? `bg-gradient-to-r ${powerUp.color} text-white shadow-md hover:shadow-lg cursor-pointer`
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {POWER_UP_ICONS[powerUp.id]}
                <span className="text-xs font-bold">{powerUp.name}</span>
                <Badge variant="secondary" className="ml-1 bg-white/30 text-white text-xs">
                  {count}
                </Badge>
              </motion.button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShop}
            className="ml-auto whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            Shop
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
