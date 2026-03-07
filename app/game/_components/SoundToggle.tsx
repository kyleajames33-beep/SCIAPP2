'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX } from 'lucide-react'
import { toggleMute, isMuted } from '@/lib/sounds'
import { motion } from 'framer-motion'

export function SoundToggle() {
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    // Initialize mute state from soundManager
    setMuted(isMuted())
  }, [])

  const handleToggle = () => {
    const newMutedState = toggleMute()
    setMuted(newMutedState)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="fixed top-4 right-4 z-50"
    >
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="icon"
        className="bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-full w-12 h-12 transition-all"
        aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {muted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </Button>
    </motion.div>
  )
}
