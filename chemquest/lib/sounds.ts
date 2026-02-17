/**
 * Sound Effects Manager
 * Manages game sound effects using HTML5 Audio API
 */

type SoundEffect = 'correct' | 'wrong' | 'coin' | 'boss_hit' | 'powerup' | 'level_up'

class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map()
  private isMuted: boolean = false

  constructor() {
    // TODO: Re-enable sound loading once audio files are added to /public/sounds/
    // this.loadSound('correct', '/sounds/correct.mp3')
    // this.loadSound('wrong', '/sounds/wrong.mp3')
    // this.loadSound('coin', '/sounds/coin.mp3')
    // this.loadSound('boss_hit', '/sounds/boss_hit.mp3')
    // this.loadSound('powerup', '/sounds/powerup.mp3')
    // this.loadSound('level_up', '/sounds/level_up.mp3')

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
      audio.volume = 0.5
      this.sounds.set(name, audio)
    }
  }

  /** Play a sound effect */
  play(sound: SoundEffect, volume?: number) {
    // TODO: Re-enable playback once audio files are added to /public/sounds/
    // if (this.isMuted) return
    // const audio = this.sounds.get(sound)
    // if (audio) {
    //   const clone = audio.cloneNode(true) as HTMLAudioElement
    //   if (volume !== undefined) clone.volume = Math.max(0, Math.min(1, volume))
    //   else clone.volume = audio.volume
    //   clone.play().catch(err => console.warn(`Failed to play sound: ${sound}`, err))
    //   clone.addEventListener('ended', () => clone.remove())
    // }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (typeof window !== 'undefined') localStorage.setItem('soundMuted', this.isMuted.toString())
    return this.isMuted
  }

  setMuted(muted: boolean) {
    this.isMuted = muted
    if (typeof window !== 'undefined') localStorage.setItem('soundMuted', muted.toString())
  }

  getMuted(): boolean { return this.isMuted }

  setVolume(sound: SoundEffect, volume: number) {
    const audio = this.sounds.get(sound)
    if (audio) audio.volume = Math.max(0, Math.min(1, volume))
  }

  setMasterVolume(volume: number) {
    const normalizedVolume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(audio => { audio.volume = normalizedVolume })
  }
}

export const soundManager = new SoundManager()
export const playSound = (sound: SoundEffect, volume?: number) => soundManager.play(sound, volume)
export const toggleMute = () => soundManager.toggleMute()
export const setMuted = (muted: boolean) => soundManager.setMuted(muted)
export const isMuted = () => soundManager.getMuted()
