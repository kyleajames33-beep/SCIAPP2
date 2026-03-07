/**
 * Sound Effects Manager
 * Manages game sound effects using HTML5 Audio API
 */

type SoundEffect = 'correct' | 'wrong' | 'coin' | 'boss_hit' | 'powerup' | 'level_up'

class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private isMuted: boolean = false

  constructor() {
    // Initialize sounds (paths relative to public folder)
    this.loadSound('correct', '/sounds/correct.mp3')
    this.loadSound('wrong', '/sounds/wrong.mp3')
    this.loadSound('coin', '/sounds/coin.mp3')
    this.loadSound('boss_hit', '/sounds/boss_hit.mp3')
    this.loadSound('powerup', '/sounds/powerup.mp3')
    this.loadSound('level_up', '/sounds/level_up.mp3')

    // Load mute preference from localStorage
    if (typeof window !== 'undefined') {
      const savedMuteState = localStorage.getItem('soundMuted')
      this.isMuted = savedMuteState === 'true'
    }
  }

  private loadSound(name: SoundEffect, path: string) {
    if (typeof window !== 'undefined') {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = 0.5 // Default volume at 50%
      this.sounds.set(name, audio)
    }
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundEffect, volume?: number) {
    if (this.isMuted) return

    const audio = this.sounds.get(sound)
    if (audio) {
      // Clone the audio to allow multiple simultaneous plays
      const clone = audio.cloneNode(true) as HTMLAudioElement
      if (volume !== undefined) {
        clone.volume = Math.max(0, Math.min(1, volume))
      } else {
        clone.volume = audio.volume
      }

      // Play and handle errors silently
      clone.play().catch(err => {
        console.warn(`Failed to play sound: ${sound}`, err)
      })

      // Clean up after playing
      clone.addEventListener('ended', () => {
        clone.remove()
      })
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', this.isMuted.toString())
    }

    return this.isMuted
  }

  /**
   * Set mute state explicitly
   */
  setMuted(muted: boolean) {
    this.isMuted = muted

    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', muted.toString())
    }
  }

  /**
   * Get current mute state
   */
  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Set volume for a specific sound (0.0 to 1.0)
   */
  setVolume(sound: SoundEffect, volume: number) {
    const audio = this.sounds.get(sound)
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Set master volume for all sounds (0.0 to 1.0)
   */
  setMasterVolume(volume: number) {
    const normalizedVolume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(audio => {
      audio.volume = normalizedVolume
    })
  }
}

// Export singleton instance
export const soundManager = new SoundManager()

// Convenience functions
export const playSound = (sound: SoundEffect, volume?: number) => {
  soundManager.play(sound, volume)
}

export const toggleMute = () => {
  return soundManager.toggleMute()
}

export const setMuted = (muted: boolean) => {
  soundManager.setMuted(muted)
}

export const isMuted = () => {
  return soundManager.getMuted()
}
