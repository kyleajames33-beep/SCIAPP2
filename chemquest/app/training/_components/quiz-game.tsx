'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useAnimation } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { GameMode, Question, PowerUpId } from '@/lib/game-types'
import { GAME_MODE_CONFIG, INITIAL_COINS, INITIAL_LIVES } from '@/lib/game-config'

// Decomposed components
import { ModeSelect } from './ModeSelect'
import { LobbyScreen } from './LobbyScreen'
import { ResultsScreen } from './ResultsScreen'
import { StatsBar } from './StatsBar'
import { ProgressBar } from './ProgressBar'
import { PowerUpBar } from './PowerUpBar'
import { ShopPowerUpBar } from './ShopPowerUpBar'
import { PowerUpShop } from './PowerUpShop'
import { QuestionCard } from './QuestionCard'
import { CoinAnimation } from './CoinAnimation'

// Boss Battle components
import { BossHpBar } from '@/app/battle/_components/boss-hp-bar'
import { DamagePopup } from '@/app/battle/_components/damage-popup'
import { BossVictory } from '@/app/battle/_components/boss-victory'
import { BattleArena } from '@/app/battle/_components/battle-arena'
import { CombatEffects } from './combat-effects'
import { AbilityBar } from './ability-bar'
import { CharacterCustomizer } from './character-customizer'

// Phase 5: Enhanced Boss Battle components
import { BossIntentDisplay, BossIntent } from './boss-intent'
import { StatusEffectsBar, StatusEffectOverlay, StatusEffect, StatusEffectType } from './status-effects'
import { EnhancedBattleArena } from './enhanced-battle-arena'
import { ElementalType } from './elemental-particles'
import { 
  Boss, 
  SpecialMove, 
  determineBossIntent, 
  applyStatusEffect, 
  processStatusEffects,
  calculateDamageWithEffects,
  updateCooldowns,
  checkPhaseTransition
} from '@/lib/boss-battle-types'
import bossesData from '@/data/bosses.json'

// Tower Climb components
import { TowerDisplay } from './tower-display'

// Sound effects
import { playSound } from '@/lib/sounds'
import { SoundToggle } from './SoundToggle'

type GameState = 'mode-select' | 'lobby' | 'playing' | 'results'

export default function QuizGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subjectFromUrl = searchParams.get('subject') || 'Chemistry'
  
  // Screen shake animation
  const screenControls = useAnimation()
  
  // Core state
  const [gameState, setGameState] = useState<GameState>('mode-select')
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFromUrl)
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [gameCode, setGameCode] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(INITIAL_COINS)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [baseTime, setBaseTime] = useState(30)
  const [isAnswered, setIsAnswered] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [coinAnimation, setCoinAnimation] = useState<number | null>(null)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0) // Track coins earned this session
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id: string; username: string; displayName: string; totalCoins: number } | null>(null)
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null) // Explanation for current question
  
  // Boss Battle state
  const [bossHp, setBossHp] = useState<number>(1000)
  const [bossMaxHp, setBossMaxHp] = useState<number>(1000)
  const [bossEnraged, setBossEnraged] = useState<boolean>(false)
  const [bossDefeated, setBossDefeated] = useState<boolean>(false)
  const [gemsEarned, setGemsEarned] = useState<number>(0)
  const [lastDamage, setLastDamage] = useState<{amount: number, isHeal: boolean} | null>(null)
  const [prevBossHp, setPrevBossHp] = useState<number>(1000)
  const [lastAction, setLastAction] = useState<'attack' | 'miss' | null>(null)
  const [bossPhase, setBossPhase] = useState<1 | 2 | 3>(1)
  const [prevBossPhase, setPrevBossPhase] = useState<1 | 2 | 3>(1)

  // Phase 5: Enhanced Boss Battle state
  const [currentBoss, setCurrentBoss] = useState<Boss | null>(null)
  const [bossIntent, setBossIntent] = useState<BossIntent | null>(null)
  const [showBossIntent, setShowBossIntent] = useState<boolean>(false)
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([])
  const [moveCooldowns, setMoveCooldowns] = useState<Record<string, number>>({})
  const [turnCount, setTurnCount] = useState<number>(0)
  const [consecutiveMisses, setConsecutiveMisses] = useState<number>(0)
  const [isBossDefending, setIsBossDefending] = useState<boolean>(false)
  const [defenseBonus, setDefenseBonus] = useState<number>(0)
  const [isCriticalHit, setIsCriticalHit] = useState<boolean>(false)
  const [bossAttackPending, setBossAttackPending] = useState<boolean>(false)

  // Active abilities system
  const [gems, setGems] = useState<number>(100) // Start with 100 gems
  const [activeAbilities, setActiveAbilities] = useState<string[]>([])
  const [shieldUses, setShieldUses] = useState<number>(0)

  // Shop power-ups
  const [ownedItems, setOwnedItems] = useState<string[]>(['shield']) // TODO: Load from DB
  const [isShielded, setIsShielded] = useState<boolean>(false)

  // Combat effects for BattleArena
  const [effects, setEffects] = useState<{ id: number; text: string; type: 'damage' | 'heal' | 'crit'; x: number; y: number }[]>([])

  // Distance tracking for Battle Arena
  const [totalCorrect, setTotalCorrect] = useState<number>(0)

  // Track previous streak for confetti trigger
  const [prevStreak, setPrevStreak] = useState<number>(0)

  // Tower Climb state
  const [currentFloor, setCurrentFloor] = useState<number>(1)
  const [maxLives, setMaxLives] = useState<number>(3)
  const [gemsCollected, setGemsCollected] = useState<number>(0)
  
  // Character customization state
  const [characterConfig, setCharacterConfig] = useState<{ bodyType: string; hairColor: string; weaponType: string } | null>(null)
  const [showCustomizer, setShowCustomizer] = useState(false)

  // Construct player sprite URL from character config
  // Uses animation sprites: player_strong_idle.png, player_strong_attack.png, player_strong_hurt.png
  const playerSpriteUrl = characterConfig
    ? `/sprites/player_${characterConfig.bodyType}_idle.png`
    : '/sprites/player_strong_idle.png'

  // Game summary state
  const [showSummary, setShowSummary] = useState(false)
  const [gameStats, setGameStats] = useState({
    accuracy: 0,
    coinsEarned: 0,
    maxStreak: 0,
    bossDefeated: false,
    isNewHighScore: false,
    previousBestScore: 0
  })

  // Refs to avoid stale closures in timer callbacks
  const livesRef = useRef(lives)
  const gameModeRef = useRef(gameMode)
  const isAnsweredRef = useRef(isAnswered)
  const sessionIdRef = useRef(sessionId)
  const questionsRef = useRef(questions)
  const currentQuestionIndexRef = useRef(currentQuestionIndex)
  const questionStartTimeRef = useRef(questionStartTime)
  const coinsEarnedRef = useRef(coinsEarned)
  
  // Keep refs in sync with state
  useEffect(() => { livesRef.current = lives }, [lives])
  useEffect(() => { gameModeRef.current = gameMode }, [gameMode])
  useEffect(() => { isAnsweredRef.current = isAnswered }, [isAnswered])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex }, [currentQuestionIndex])
  useEffect(() => { questionStartTimeRef.current = questionStartTime }, [questionStartTime])
  useEffect(() => { coinsEarnedRef.current = coinsEarned }, [coinsEarned])
  
  // Power-up states
  const [isTimeFrozen, setIsTimeFrozen] = useState(false)
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([])
  const [hasDoublePoints, setHasDoublePoints] = useState(false)
  const [ownedPowerUps, setOwnedPowerUps] = useState<Record<PowerUpId, number>>({
    timeFreeze: 0,
    fiftyFifty: 0,
    doublePoints: 0,
    skip: 0
  })

  // Stable handleTimeOut that uses refs for current values
  const handleTimeOut = useCallback(async () => {
    if (isAnsweredRef.current) return
    setIsAnswered(true)
    toast.error("Time's up!")
    
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    
    try {
      await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          questionId: questionsRef.current?.[currentQuestionIndexRef.current]?.id,
          selectedAnswer: -1,
          timeSpent,
        }),
      })

      setStreak(0)
      setIncorrectAnswers((prev) => prev + 1)
      setQuestionsAnswered(prev => prev + 1)
      
      // Handle lives for survival mode and tower climb
      if (gameModeRef.current === 'survival' || gameModeRef.current === 'tower_climb') {
        const currentLives = livesRef.current
        const newLives = currentLives - 1
        setLives(newLives)
        if (newLives <= 0) {
          setTimeout(() => finishGame(), 1500)
          return
        }
      }
    } catch (error) {
      console.error('Submit timeout error:', error)
    }

    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered || timeLeft <= 0 || isTimeFrozen) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, isAnswered, timeLeft, isTimeFrozen, handleTimeOut])

  // Auto-trigger game end when boss is defeated
  useEffect(() => {
    if (gameMode === 'boss_battle' && bossDefeated && gameState === 'playing') {
      // Wait for victory screen animations to play
      const timer = setTimeout(() => {
        finishGame()
      }, 3000) // 3 second delay to let victory screen show

      return () => clearTimeout(timer)
    }
  }, [bossDefeated, gameMode, gameState])

  // Question set state
  const [questionSetId, setQuestionSetId] = useState<string | null>(null)

  const selectMode = (mode: GameMode, qSetId?: string | null) => {
    setGameMode(mode)
    setQuestionSetId(qSetId ?? null)
    setGameState('lobby')
  }

  const startGame = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameMode, questionSetId, subject: selectedSubject }),
      })

      if (!response?.ok) throw new Error('Failed to start game')

      const data = await response.json()
      setGameCode(data?.gameCode || '')
      setSessionId(data?.sessionId || '')
      setQuestions(data?.questions || [])
      setBaseTime(data?.config?.timePerQuestion || 30)
      setTimeLeft(data?.config?.timePerQuestion || 30)
      if (data?.config?.lives) {
        setLives(data.config.lives)
      }
      
      // Initialize Boss Battle state
      if (gameMode === 'boss_battle') {
        // Phase 5: Load random boss from bosses.json
        const bosses = (bossesData as { bosses: Boss[] }).bosses
        const randomBoss = bosses[Math.floor(Math.random() * bosses.length)]
        setCurrentBoss(randomBoss)
        
        const initialBossHp = randomBoss?.baseHp || data?.config?.bossHp || 1000
        setBossHp(initialBossHp)
        setBossMaxHp(randomBoss?.baseHp || data?.config?.bossMaxHp || 1000)
        setPrevBossHp(initialBossHp)
        setBossEnraged(false)
        setBossDefeated(false)
        setGemsEarned(0)
        setBossPhase(1)
        setPrevBossPhase(1)
        setGems(100) // Start with 100 gems
        setActiveAbilities([])
        setShieldUses(0)
        setTotalCorrect(0)
        
        // Phase 5: Initialize enhanced boss battle state
        setBossIntent(null)
        setShowBossIntent(false)
        setPlayerStatusEffects([])
        setMoveCooldowns({})
        setTurnCount(0)
        setConsecutiveMisses(0)
        setIsBossDefending(false)
        setDefenseBonus(0)
        setIsCriticalHit(false)
        setBossAttackPending(false)
        
        // Show initial boss intent after a short delay
        setTimeout(() => {
          if (randomBoss) {
            const initialIntent = determineBossIntent(
              {
                boss: randomBoss,
                currentHp: initialBossHp,
                maxHp: initialBossHp,
                isEnraged: false,
                isDefeated: false,
                currentPhase: 1,
                turnCount: 0,
                nextIntent: null,
                activeStatusEffects: [],
                moveCooldowns: {},
                isDefending: false,
                defenseBonus: 0,
                consecutiveMisses: 0,
                lastDamageDealt: 0,
              },
              0,
              0
            )
            setBossIntent(initialIntent)
            setShowBossIntent(true)
          }
        }, 1500)
      }

      // Initialize Tower Climb state
      if (gameMode === 'tower_climb') {
        setCurrentFloor(1)
        setMaxLives(data?.config?.lives || 3)
        setLives(data?.config?.lives || 3)
        setGemsCollected(0)
      }
      // Use authenticated user's coins if available, otherwise default
      if (data?.user) {
        setAuthenticatedUser(data.user)
        setCoins(data.user.totalCoins || INITIAL_COINS)
        
        // Fetch character customization
        try {
          const charResponse = await fetch('/api/user/customize')
          if (charResponse.ok) {
            const charData = await charResponse.json()
            setCharacterConfig(charData.character)
          }
        } catch (error) {
          console.error('Failed to fetch character config:', error)
        }
      } else {
        setCoins(INITIAL_COINS)
      }
      setCoinsEarned(0) // Reset coins earned for new game
      setGameState('playing')
      setQuestionStartTime(Date.now())
    } catch (error) {
      toast.error('Failed to start game. Please try again.')
      console.error('Start game error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCoins = (amount: number) => {
    setCoinAnimation(amount)
    setCoins(prev => prev + amount)
    setCoinsEarned(prev => prev + amount) // Track earned coins for persistence
    setTimeout(() => setCoinAnimation(null), 1000)
  }

  // Handle saving character customization
  const handleSaveCharacter = async (config: { body: string; hair: string; weapon: string }) => {
    try {
      const response = await fetch('/api/user/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyType: config.body,
          hairColor: config.hair,
          weaponType: config.weapon,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCharacterConfig(data.character)
        toast.success('Character saved!')
        setShowCustomizer(false)
      } else {
        toast.error('Failed to save character')
      }
    } catch (error) {
      console.error('Failed to save character:', error)
      toast.error('Failed to save character')
    }
  }

  const handleAnswerSelect = async (answerIndex: number) => {
    if (isAnswered) return

    setSelectedAnswer(answerIndex)
    setIsAnswered(true)
    setIsTimeFrozen(false)

    const currentQuestion = questions?.[currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const timeRemaining = timeLeft

    try {
      const response = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion?.id,
          selectedAnswer: answerIndex,
          timeSpent,
        }),
      })

      if (!response?.ok) throw new Error('Failed to submit answer')

      const data = await response.json()
      const isCorrect = data?.isCorrect
      
      // Store the correct answer for UI display
      if (currentQuestion) {
        currentQuestion.correctAnswer = data?.correctAnswer
      }
      
      // Store explanation (if available)
      setCurrentExplanation(data?.explanation || null)
      
      setQuestionsAnswered(prev => prev + 1)
      
      if (isCorrect) {
        const newStreak = (streak || 0) + 1
        let pointsEarned = data?.pointsEarned || 100
        let coinsEarned = data?.coinsEarned || (50 + (newStreak * 10))

        // Track total correct answers for distance tracking
        setTotalCorrect(prev => prev + 1)

        // Tower Climb: Increment floor and collect gems
        if (gameMode === 'tower_climb') {
          const newFloor = currentFloor + 1
          setCurrentFloor(newFloor)

          // Collect gems every 5 floors
          if (newFloor % 5 === 0) {
            const gemsToAdd = 5
            setGemsCollected(prev => prev + gemsToAdd)

            // Call API to persist gems
            if (authenticatedUser?.id) {
              fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'COLLECT_GEMS',
                  payload: {
                    userId: authenticatedUser.id,
                    floorReached: newFloor,
                  },
                }),
              }).catch(err => console.error('Failed to collect gems:', err))
            }

            // Play gem collection sound
            playSound('level_up', 0.6)
            toast.success(`💎 Floor ${newFloor}! +${gemsToAdd} gems collected!`, { duration: 2500 })
          }
        }

        // Boss Battle: Calculate damage to boss with combo system
        else if (gameMode === 'boss_battle') {
          // Phase 5: Reset consecutive misses on correct answer
          setConsecutiveMisses(0)
          setIsCriticalHit(false)
          
          const baseDamage = 50
          const streakBonus = newStreak * 10
          
          // Phase 5: Calculate damage with status effects and boss defense
          let totalDamage = isBossDefending 
            ? calculateDamageWithEffects(baseDamage, newStreak, playerStatusEffects, true, defenseBonus)
            : baseDamage + streakBonus
          
          let isCrit = false

          // Crit chance: 30% if streak > 5
          if (newStreak > 5 && Math.random() < 0.3) {
            totalDamage *= 2
            isCrit = true
            setIsCriticalHit(true)
            setTimeout(() => setIsCriticalHit(false), 500)
          }

          // Overdrive: Double all damage
          if (activeAbilities.includes('overdrive')) {
            totalDamage *= 2
            toast.success(`⚡ OVERDRIVE! ${totalDamage} damage!`, { duration: 1500 })
          }

          // Trigger attack animation
          setLastAction('attack')
          setTimeout(() => setLastAction(null), 600)

          // Add combat effect
          const effectId = Date.now()
          const effectType = isCrit ? 'crit' : 'damage'
          const effectText = `-${totalDamage}`
          
          setEffects(prev => [...prev, {
            id: effectId,
            text: effectText,
            type: effectType,
            x: 60, // Near the boss (right side)
            y: 200
          }])
          
          // Remove effect after 1 second
          setTimeout(() => {
            setEffects(prev => prev.filter(e => e.id !== effectId))
          }, 1000)

          setBossHp(prev => {
            const newHp = Math.max(0, prev - totalDamage)

            // Calculate boss phase based on HP percentage
            const hpPercent = (newHp / bossMaxHp) * 100
            let currentPhase: 1 | 2 | 3 = 1
            if (hpPercent < 25) currentPhase = 3
            else if (hpPercent < 60) currentPhase = 2

            // Detect phase transitions
            if (currentPhase !== prevBossPhase) {
              setBossPhase(currentPhase)
              setPrevBossPhase(currentPhase)

              if (currentPhase === 2) {
                // Entering Phase 2
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.6 },
                  colors: ['#f59e0b', '#ef4444'],
                  shapes: ['square']
                })
                toast.warning('⚠️ PHASE 2: BOSS ENRAGED! Wrong answers cost 2x coins!', {
                  duration: 4000,
                  style: { background: '#f59e0b', color: 'white', fontWeight: 'bold' }
                })
              } else if (currentPhase === 3) {
                // Entering Phase 3
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.5 },
                  colors: ['#dc2626', '#991b1b', '#7f1d1d'],
                  shapes: ['circle', 'square'],
                  scalar: 1.5
                })
                toast.error('🔥 PHASE 3: CRITICAL! Wrong answers cost 3x coins and double heal!', {
                  duration: 5000,
                  style: { background: '#dc2626', color: 'white', fontWeight: 'bold', fontSize: '16px' }
                })

                // Intense screen shake for phase 3 transition
                screenControls.start({
                  x: [0, -20, 20, -20, 20, -10, 10, 0],
                  y: [0, -10, 10, -10, 10, 0],
                  transition: { duration: 0.8 }
                })
              }
            }

            // Check for boss defeat
            if (newHp === 0 && !bossDefeated) {
              setBossDefeated(true)
              // Calculate gems earned based on performance
              const gems = Math.floor((correctAnswers + 1) / 2) + 5
              setGemsEarned(gems)

              // Boss defeat confetti
              confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#ec4899', '#3b82f6', '#eab308'],
                shapes: ['circle', 'square'],
                scalar: 1.2
              })

              // Second burst for dramatic effect
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 120,
                  origin: { y: 0.8 },
                  colors: ['#22c55e', '#eab308', '#ffffff'],
                  shapes: ['circle']
                })
              }, 300)
            }
            return newHp
          })

          // Play boss hit sound
          playSound('boss_hit', 0.7)

          // Trigger damage popup
          setLastDamage({ amount: totalDamage, isHeal: false })
          setTimeout(() => setLastDamage(null), 1500)

          // Enrage boss when HP is low (unless Freeze is active)
          if (bossHp < bossMaxHp * 0.3 && !bossEnraged && !activeAbilities.includes('freeze')) {
            setBossEnraged(true)
            toast.error('🔥 BOSS IS ENRAGED! Watch out!', { duration: 3000 })
          }
          
          // Phase 5: Process status effects at end of turn
          if (playerStatusEffects.length > 0) {
            const { updatedEffects, burnDamage, isStunned, energyReduction } = processStatusEffects(playerStatusEffects)
            setPlayerStatusEffects(updatedEffects)
            
            if (burnDamage > 0) {
              // Deduct coins for burn damage
              setCoins(prev => Math.max(0, prev - burnDamage))
              toast.error(`🔥 Burn damage: -${burnDamage} coins!`, { duration: 1500 })
            }
          }
          
          // Phase 5: Update cooldowns and turn counter
          setTurnCount(prev => prev + 1)
          setMoveCooldowns(prev => updateCooldowns(prev))
          setIsBossDefending(false)
          setDefenseBonus(0)
          
          // Phase 5: Generate next boss intent
          if (currentBoss && !bossDefeated) {
            setTimeout(() => {
              const nextIntent = determineBossIntent(
                {
                  boss: currentBoss,
                  currentHp: bossHp - totalDamage,
                  maxHp: bossMaxHp,
                  isEnraged: bossEnraged,
                  isDefeated: false,
                  currentPhase: bossPhase,
                  turnCount: turnCount + 1,
                  nextIntent: null,
                  activeStatusEffects: playerStatusEffects,
                  moveCooldowns,
                  isDefending: false,
                  defenseBonus: 0,
                  consecutiveMisses: 0,
                  lastDamageDealt: totalDamage,
                },
                incorrectAnswers,
                timeSpent
              )
              setBossIntent(nextIntent)
              setShowBossIntent(true)
            }, 800)
          }
        }

        // Rush mode: bonus for speed
        if (gameMode === 'rush' && timeRemaining > 10) {
          toast.success(`⚡ Speed bonus!`, { duration: 1500 })
        }
        
        // Apply double points if active
        if (hasDoublePoints) {
          pointsEarned *= 2
          coinsEarned *= 2
          setHasDoublePoints(false)
          toast.success(`⚡ Double Points! +${pointsEarned} points`, { duration: 2000 })
        }
        
        setScore((prev) => (prev || 0) + pointsEarned)
        setStreak(newStreak)
        setMaxStreak((prev) => Math.max(prev || 0, newStreak))
        setCorrectAnswers((prev) => (prev || 0) + 1)
        addCoins(coinsEarned)
        
        // Confetti on 10-streak
        if (newStreak === 10 && prevStreak < 10) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ef4444', '#eab308', '#ffffff']
          })
          toast.success('🔥🔥🔥 10 STREAK! INFERNO MODE! 🔥🔥🔥', { duration: 3000 })
        }
        
        setPrevStreak(newStreak)

        // Play correct answer and coin sounds
        playSound('correct', 0.5)
        setTimeout(() => playSound('coin', 0.4), 150)

        // Show streak messages (skip for tower climb as it shows floor messages)
        if (gameMode !== 'tower_climb') {
          if (newStreak >= 7) {
            toast.success(`🔥 Amazing! ${newStreak} streak! +${pointsEarned} points (5x bonus)`, { duration: 2000 })
          } else if (newStreak >= 5) {
            toast.success(`🔥 Great streak! ${newStreak} in a row! +${pointsEarned} points (3x bonus)`, { duration: 2000 })
          } else if (newStreak >= 3) {
            toast.success(`🔥 Nice streak! ${newStreak} correct! +${pointsEarned} points (2x bonus)`, { duration: 2000 })
          } else {
            toast.success(`Correct! +${pointsEarned} points`, { duration: 2000 })
          }
        }
      } else {
        setStreak(0)
        setPrevStreak(0)
        setHasDoublePoints(false)
        setIncorrectAnswers((prev) => (prev || 0) + 1)

        // Boss Battle: Phase-based penalties
        if (gameMode === 'boss_battle') {
          // Check if Shield is active (gem ability or shop power-up)
          const isGemShieldActive = activeAbilities.includes('shield')
          const isShopShieldActive = isShielded
          const isFreezeActive = activeAbilities.includes('freeze')

          if (isGemShieldActive || isShopShieldActive) {
            // Shield blocks penalties and boss healing
            
            // Handle gem-based shield
            if (isGemShieldActive) {
              const newShieldUses = shieldUses + 1
              setShieldUses(newShieldUses)

              // Remove shield after 2 uses
              if (newShieldUses >= 2) {
                setActiveAbilities(prev => prev.filter(a => a !== 'shield'))
                toast.info('🛡️ Gem Shield depleted!')
              }
            }
            
            // Handle shop-based shield (consumed after 1 use)
            if (isShopShieldActive) {
              setIsShielded(false)
              toast.info('🛡️ Shield used up!')
            }

            // Trigger miss animation but no damage
            setLastAction('miss')
            setTimeout(() => setLastAction(null), 600)

            // Play wrong answer sound
            playSound('wrong', 0.5)

            toast.success('🛡️ Shield blocked the attack! No penalties!', {
              duration: 2500,
              style: { background: '#3b82f6', color: 'white', fontWeight: 'bold' }
            })

            // Normal screen shake (not the intense one)
            screenControls.start({
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.4 }
            })

            // Skip the rest of the boss battle wrong answer logic
          } else {
            // Calculate phase-based heal amount
            let baseHeal = bossEnraged ? 50 : 25
            let healAmount = baseHeal

            // Freeze prevents boss healing
            if (isFreezeActive) {
              healAmount = 0
              toast.info('❄️ Freeze prevented boss healing!')
            } else {
              // Phase 3: Double healing (only if not frozen)
              if (bossPhase === 3) {
                healAmount = baseHeal * 2
              }
            }

            // Phase-based coin penalty
            let coinPenalty = 0
            if (bossPhase === 2) {
              // Phase 2: Lose 2x coins (100 coins)
              coinPenalty = 100
              setCoins(prev => Math.max(0, prev - coinPenalty))
            } else if (bossPhase === 3) {
              // Phase 3: Lose 3x coins (150 coins)
              coinPenalty = 150
              setCoins(prev => Math.max(0, prev - coinPenalty))
            }

            // Phase 3: Intense screen shake
            if (bossPhase === 3) {
              screenControls.start({
                x: [0, -25, 25, -25, 25, -15, 15, 0],
                y: [0, -15, 15, -15, 15, 0],
                rotate: [0, -2, 2, -2, 2, 0],
                transition: { duration: 0.6 }
              })
            } else {
              // Normal screen shake
              screenControls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
              })
            }

            // Play wrong answer sound
            playSound('wrong', 0.5)

            // Trigger miss animation (boss attacks player)
            setLastAction('miss')
            setTimeout(() => setLastAction(null), 600)

            // Add heal effect (only if healing occurred)
            if (healAmount > 0) {
              const effectId = Date.now()
              setEffects(prev => [...prev, {
                id: effectId,
                text: `+${healAmount}`,
                type: 'heal',
                x: 60, // Near the boss (right side)
                y: 200
              }])

              // Remove effect after 1 second
              setTimeout(() => {
                setEffects(prev => prev.filter(e => e.id !== effectId))
              }, 1000)
            }

            setBossHp(prev => {
              const newHp = Math.min(bossMaxHp, prev + healAmount)
              return newHp
            })

            // Trigger heal popup (only if healing occurred)
            if (healAmount > 0) {
              setLastDamage({ amount: healAmount, isHeal: true })
              setTimeout(() => setLastDamage(null), 1500)
            }

            // Phase-specific messages
            if (isFreezeActive && healAmount === 0) {
              if (bossPhase === 3) {
                toast.error(`💀 PHASE 3 PENALTY! ❄️ Freeze blocked heal! -${coinPenalty} coins!`, {
                  duration: 3000,
                  style: { background: '#dc2626', color: 'white', fontWeight: 'bold' }
                })
              } else if (bossPhase === 2) {
                toast.error(`⚠️ Wrong! ❄️ Freeze blocked heal! -${coinPenalty} coins!`, {
                  duration: 2500,
                  style: { background: '#f59e0b', color: 'white' }
                })
              } else {
                toast.error('❄️ Freeze blocked boss heal!', { duration: 2000 })
              }
            } else {
              if (bossPhase === 3) {
                toast.error(`💀 PHASE 3 PENALTY! Boss heals ${healAmount} HP! -${coinPenalty} coins!`, {
                  duration: 3000,
                  style: { background: '#dc2626', color: 'white', fontWeight: 'bold' }
                })
              } else if (bossPhase === 2) {
                toast.error(`⚠️ Wrong! Boss heals ${healAmount} HP! -${coinPenalty} coins!`, {
                  duration: 2500,
                  style: { background: '#f59e0b', color: 'white' }
                })
              } else {
                toast.error(`Wrong! Boss heals ${healAmount} HP!`, { duration: 2000 })
              }
            }
            
            // Phase 5: Execute boss special move based on current intent
            if (bossIntent && currentBoss) {
              setConsecutiveMisses(prev => prev + 1)
              
              // Check if boss should use a special move (every 2 misses or if taking too long)
              const shouldUseSpecial = consecutiveMisses >= 1 || timeSpent > 20 || bossPhase >= 2
              
              if (shouldUseSpecial && bossIntent.effect) {
                const effectType = bossIntent.effect as StatusEffectType
                const duration = currentBoss.specialMoves.find(m => m.name === bossIntent.moveName)?.duration || 2
                
                // Apply status effect to player
                const newEffects = applyStatusEffect(playerStatusEffects, effectType, duration, bossPhase)
                setPlayerStatusEffects(newEffects)
                
                // Show status effect application message
                const effectMessages: Record<StatusEffectType, string> = {
                  corrosion: `☠️ ${bossIntent.moveName}! You're corroded! Energy efficiency reduced!`,
                  stun: `⚡ ${bossIntent.moveName}! You're stunned!`,
                  burn: `🔥 ${bossIntent.moveName}! You're burning! Taking damage over time!`,
                }
                
                toast.error(effectMessages[effectType], {
                  duration: 3000,
                  style: { 
                    background: effectType === 'burn' ? '#f97316' : effectType === 'stun' ? '#eab308' : '#10b981',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                })
                
                // Set cooldown for the move
                const move = currentBoss.specialMoves.find(m => m.name === bossIntent.moveName)
                if (move) {
                  setMoveCooldowns(prev => ({ ...prev, [move.id]: move.cooldown }))
                }
              }
              
              // Handle boss defend intent
              if (bossIntent.type === 'defend') {
                setIsBossDefending(true)
                setDefenseBonus(bossPhase) // Higher defense in later phases
                toast.info(`🛡️ ${currentBoss.name} is defending! Damage reduced!`, { duration: 2000 })
              }
            }
            
            // Phase 5: Update cooldowns and generate next intent
            setTurnCount(prev => prev + 1)
            setMoveCooldowns(prev => updateCooldowns(prev))
            
            // Generate next boss intent
            if (currentBoss && !bossDefeated) {
              setTimeout(() => {
                const nextIntent = determineBossIntent(
                  {
                    boss: currentBoss,
                    currentHp: bossHp + healAmount,
                    maxHp: bossMaxHp,
                    isEnraged: bossEnraged,
                    isDefeated: false,
                    currentPhase: bossPhase,
                    turnCount: turnCount + 1,
                    nextIntent: null,
                    activeStatusEffects: playerStatusEffects,
                    moveCooldowns,
                    isDefending: false,
                    defenseBonus: 0,
                    consecutiveMisses: consecutiveMisses + 1,
                    lastDamageDealt: 0,
                  },
                  incorrectAnswers + 1,
                  timeSpent
                )
                setBossIntent(nextIntent)
                setShowBossIntent(true)
              }, 1200)
            }
          }
        } else if (gameMode === 'survival' || gameMode === 'tower_climb') {
          // Handle lives for survival mode and tower climb
          const newLives = lives - 1
          setLives(newLives)

          // Screen shake
          screenControls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
          })

          // Play wrong answer sound
          playSound('wrong', 0.5)

          if (gameMode === 'tower_climb') {
            toast.error(`Wrong! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining. Floor ${currentFloor}`, { duration: 2000 })
          } else {
            toast.error(`Wrong! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining`, { duration: 2000 })
          }

          if (newLives <= 0) {
            toast.error('Game Over!', { duration: 2000 })
            setTimeout(() => finishGame(), 1500)
            return
          }
        } else {
          // Classic/Rush modes
          // Screen shake
          screenControls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
          })

          // Play wrong answer sound
          playSound('wrong', 0.5)

          toast.error('Incorrect answer', { duration: 2000 })
        }
      }
    } catch (error) {
      console.error('Submit answer error:', error)
      toast.error('Failed to submit answer')
    }

    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }

  const nextQuestion = () => {
    setHiddenOptions([])
    setIsTimeFrozen(false)
    setCurrentExplanation(null) // Reset explanation for next question

    const isLastQuestion = (currentQuestionIndex || 0) >= (questions?.length || 0) - 1
    const outOfLives = (gameMode === 'survival' || gameMode === 'tower_climb') && lives <= 0
    const bossDead = gameMode === 'boss_battle' && bossDefeated

    if (isLastQuestion || outOfLives || bossDead) {
      finishGame()
    } else {
      setCurrentQuestionIndex((prev) => (prev || 0) + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(baseTime)
      setQuestionStartTime(Date.now())
    }
  }

  const finishGame = async () => {
    try {
      const payload: any = {
        sessionId: sessionIdRef.current,
        coinsEarned: coinsEarnedRef.current,
      }

      // Add tower climb specific data
      if (gameMode === 'tower_climb') {
        payload.floorReached = currentFloor
        payload.gemsCollected = gemsCollected
      }

      // Add boss battle specific data
      if (gameMode === 'boss_battle') {
        payload.bossDefeated = bossDefeated
        payload.gemsEarned = gemsEarned
      }

      const response = await fetch('/api/game/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()

        // Calculate accuracy
        const totalAnswered = correctAnswers + incorrectAnswers
        const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

        // Store game stats
        setGameStats({
          accuracy,
          coinsEarned: coinsEarnedRef.current,
          maxStreak,
          bossDefeated: gameMode === 'boss_battle' && bossDefeated,
          isNewHighScore: data.summary?.isNewHighScore || false,
          previousBestScore: data.summary?.previousBestScore || 0
        })

        setShowSummary(true)
      }
    } catch (error) {
      console.error('Finish game error:', error)
    }
    setGameState('results')
  }

  const restartGame = () => {
    setGameState('mode-select')
    setGameCode('')
    setSessionId('')
    setQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCoins(INITIAL_COINS)
    setStreak(0)
    setMaxStreak(0)
    setCorrectAnswers(0)
    setIncorrectAnswers(0)
    setTimeLeft(30)
    setBaseTime(30)
    setIsAnswered(false)
    setShowShop(false)
    setIsTimeFrozen(false)
    setHiddenOptions([])
    setHasDoublePoints(false)
    setLives(INITIAL_LIVES)
    setQuestionsAnswered(0)
    setCoinsEarned(0)
    setAuthenticatedUser(null)
    setQuestionSetId(null)
    setCurrentExplanation(null)
    setOwnedPowerUps({
      timeFreeze: 0,
      fiftyFifty: 0,
      doublePoints: 0,
      skip: 0
    })
    // Reset Boss Battle state
    setBossHp(1000)
    setBossMaxHp(1000)
    setBossEnraged(false)
    setBossDefeated(false)
    setGemsEarned(0)
    setLastDamage(null)
    setPrevBossHp(1000)
    setLastAction(null)
    setBossPhase(1)
    setPrevBossPhase(1)
    setGems(100)
    setActiveAbilities([])
    setShieldUses(0)
    setTotalCorrect(0)

    // Phase 5: Reset enhanced boss battle state
    setCurrentBoss(null)
    setBossIntent(null)
    setShowBossIntent(false)
    setPlayerStatusEffects([])
    setMoveCooldowns({})
    setTurnCount(0)
    setConsecutiveMisses(0)
    setIsBossDefending(false)
    setDefenseBonus(0)
    setIsCriticalHit(false)
    setBossAttackPending(false)

    // Reset Tower Climb state
    setCurrentFloor(1)
    setMaxLives(3)
    setGemsCollected(0)

    // Reset game summary state
    setShowSummary(false)
    setGameStats({
      accuracy: 0,
      coinsEarned: 0,
      maxStreak: 0,
      bossDefeated: false,
      isNewHighScore: false,
      previousBestScore: 0
    })
  }

  const buyPowerUp = (powerUpId: PowerUpId, cost: number) => {
    if (coins < cost) {
      toast.error("Not enough coins!")
      return
    }
    setCoins(prev => prev - cost)
    setOwnedPowerUps(prev => ({
      ...prev,
      [powerUpId]: (prev[powerUpId] || 0) + 1
    }))
    toast.success(`Purchased power-up!`)
  }

  const usePowerUp = (powerUpId: PowerUpId) => {
    if (ownedPowerUps[powerUpId] <= 0 || isAnswered) return

    const currentQuestion = questions?.[currentQuestionIndex]

    // Play power-up sound
    playSound('powerup', 0.5)

    switch (powerUpId) {
      case 'timeFreeze':
        setIsTimeFrozen(true)
        toast.success('⏸️ Timer frozen!')
        break
      case 'fiftyFifty':
        if (currentQuestion && currentQuestion.correctAnswer !== undefined) {
          const wrongOptions = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctAnswer)
          const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2)
          setHiddenOptions(toHide)
          toast.success('✂️ Two wrong answers removed!')
        }
        break
      case 'doublePoints':
        setHasDoublePoints(true)
        toast.success('⚡ Double points activated!')
        break
      case 'skip':
        toast.success('⏭️ Question skipped!')
        setQuestionsAnswered(prev => prev + 1)
        setTimeout(() => nextQuestion(), 500)
        break
    }

    setOwnedPowerUps(prev => ({
      ...prev,
      [powerUpId]: prev[powerUpId] - 1
    }))
  }

  // Active abilities handler for Boss Battle
  const handleUseAbility = (abilityType: 'shield' | 'overdrive' | 'freeze') => {
    const costs = { shield: 20, overdrive: 50, freeze: 40 }
    const cost = costs[abilityType]

    if (gems < cost) {
      toast.error('Not enough gems!')
      return
    }

    if (activeAbilities.includes(abilityType)) {
      toast.error('Ability already active!')
      return
    }

    // Deduct gems
    setGems(prev => prev - cost)

    // Activate ability
    setActiveAbilities(prev => [...prev, abilityType])

    // Play sound
    playSound('powerup', 0.6)

    // Show activation message
    switch (abilityType) {
      case 'shield':
        toast.success('🛡️ Shield activated! Next 2 wrong answers are blocked!', {
          duration: 3000,
          style: { background: '#3b82f6', color: 'white', fontWeight: 'bold' }
        })
        setShieldUses(0)
        break
      case 'overdrive':
        toast.success('⚡ Overdrive activated! All damage doubled!', {
          duration: 3000,
          style: { background: '#eab308', color: 'black', fontWeight: 'bold' }
        })
        // Overdrive lasts for 3 questions
        setTimeout(() => {
          setActiveAbilities(prev => prev.filter(a => a !== 'overdrive'))
          toast.info('⚡ Overdrive ended')
        }, 60000) // 60 seconds
        break
      case 'freeze':
        toast.success('❄️ Freeze activated! Boss cannot enrage or heal!', {
          duration: 3000,
          style: { background: '#06b6d4', color: 'white', fontWeight: 'bold' }
        })
        // Freeze lasts for 5 questions
        setTimeout(() => {
          setActiveAbilities(prev => prev.filter(a => a !== 'freeze'))
          toast.info('❄️ Freeze ended')
        }, 90000) // 90 seconds
        break
    }
  }

  // Mode Selection Screen
  if (gameState === 'mode-select') {
    return (
      <>
        <ModeSelect onSelectMode={selectMode} onCustomize={() => setShowCustomizer(true)} />
        
        {/* Character Customizer Modal */}
        {showCustomizer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
            >
              <button
                onClick={() => setShowCustomizer(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10"
              >
                ×
              </button>
              <CharacterCustomizer
                initialData={characterConfig || { body: 'athletic', hair: 'blue', weapon: 'sword' }}
                onSave={handleSaveCharacter}
              />
            </motion.div>
          </div>
        )}
      </>
    )
  }

  // Lobby Screen
  if (gameState === 'lobby') {
    return (
      <LobbyScreen
        gameMode={gameMode}
        isLoading={isLoading}
        onStartGame={startGame}
        onBack={() => setGameState('mode-select')}
      />
    )
  }

  // Results Screen
  if (gameState === 'results') {
    return (
      <ResultsScreen
        gameMode={gameMode}
        score={score}
        coins={coins}
        correctAnswers={correctAnswers}
        incorrectAnswers={incorrectAnswers}
        maxStreak={maxStreak}
        questionsAnswered={questionsAnswered}
        lives={lives}
        onRestart={restartGame}
        isNewHighScore={gameStats.isNewHighScore}
        previousBestScore={gameStats.previousBestScore}
        bossDefeated={gameStats.bossDefeated}
      />
    )
  }

  // Game Playing Screen
  const currentQuestion = questions?.[currentQuestionIndex]

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500"
      animate={screenControls}
    >
      {/* Sound Toggle */}
      <SoundToggle />

      {/* Boss Battle Victory Screen */}
      {gameMode === 'boss_battle' && bossDefeated && (
        <BossVictory
          gemsEarned={gemsEarned}
          questionsAnswered={questionsAnswered}
          onContinue={() => {
            finishGame()
            setGameState('results')
          }}
        />
      )}

      {/* Shop Modal */}
      <PowerUpShop
        isOpen={showShop}
        coins={coins}
        ownedPowerUps={ownedPowerUps}
        onClose={() => setShowShop(false)}
        onBuy={buyPowerUp}
      />

      {/* Coin Animation */}
      <CoinAnimation amount={coinAnimation} />

      {/* Damage Popup */}
      {lastDamage && <DamagePopup damage={lastDamage.amount} isHeal={lastDamage.isHeal} />}

      <div className={`mx-auto ${gameMode === 'boss_battle' ? 'max-w-4xl h-screen flex flex-col p-2 overflow-hidden' : 'max-w-5xl p-4 py-6'}`}>
        {/* Tower Climb Display */}
        {gameMode === 'tower_climb' && (
          <TowerDisplay
            currentFloor={currentFloor}
            lives={lives}
            maxLives={maxLives}
            gemsCollected={gemsCollected}
          />
        )}

        {/* Boss Battle - Compact Layout */}
        {gameMode === 'boss_battle' && (
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {/* Boss HP Bar with Boss Name */}
            <BossHpBar
              currentHp={bossHp}
              maxHp={bossMaxHp}
              isEnraged={bossEnraged}
              bossName={currentBoss?.name || 'Chemistry Boss'}
            />

            {/* Phase 5: Boss Intent Display */}
            {showBossIntent && bossIntent && currentBoss && (
              <BossIntentDisplay
                intent={bossIntent}
                isVisible={showBossIntent}
                bossName={currentBoss.name}
                themeColor={currentBoss.themeColor}
              />
            )}

            {/* Phase 5: Player Status Effects Bar */}
            {playerStatusEffects.length > 0 && (
              <div className="flex-shrink-0 px-2">
                <StatusEffectsBar effects={playerStatusEffects} />
              </div>
            )}

            {/* Shop Power-ups Bar */}
            <ShopPowerUpBar
              ownedItems={ownedItems}
              isShielded={isShielded}
              onActivateShield={() => {
                if (ownedItems.includes('shield') && !isShielded) {
                  setIsShielded(true)
                  toast.success('🛡️ Shield activated! Ready to block!', {
                    duration: 2000,
                    style: { background: '#3b82f6', color: 'white' }
                  })
                }
              }}
            />

            {/* Active Abilities Bar */}
            <AbilityBar
              gems={gems}
              onUseAbility={handleUseAbility}
              activeAbilities={activeAbilities}
            />

            {/* Phase 5: Enhanced Battle Arena with Elemental Particles */}
            <div
              className={`relative flex-shrink-0 ${
                activeAbilities.includes('overdrive')
                  ? 'ring-4 ring-yellow-400 rounded-3xl shadow-[0_0_40px_rgba(234,179,8,0.6)] animate-pulse'
                  : ''
              } ${isCriticalHit ? 'animate-shake-medium' : ''}`}
            >
              <EnhancedBattleArena
                bossHp={bossHp}
                bossMaxHp={bossMaxHp}
                isEnraged={bossEnraged}
                lastAction={lastAction}
                playerStreak={streak}
                totalQuestionsAnswered={totalCorrect}
                subject={selectedSubject}
                playerSpriteUrl={playerSpriteUrl}
                elementalType={(currentBoss?.elementalType as ElementalType) || 'Acid-Base'}
                activeStatusEffects={playerStatusEffects}
                isCriticalHit={isCriticalHit}
                bossSprite={currentBoss?.sprite}
                themeColor={currentBoss?.themeColor}
              />
              <CombatEffects effects={effects} />
            </div>

            {/* Stats Bar - Compact */}
            <div className="flex-shrink-0">
              <StatsBar
                score={score}
                coins={coins}
                streak={streak}
                lives={lives}
                timeLeft={timeLeft}
                isTimeFrozen={isTimeFrozen}
                gameMode={gameMode}
                onOpenShop={() => setShowShop(true)}
              />
            </div>

            {/* Question Card - Takes remaining space */}
            <div className="flex-1 min-h-[200px] overflow-auto">
              <QuestionCard
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                selectedAnswer={selectedAnswer}
                isAnswered={isAnswered}
                hiddenOptions={hiddenOptions}
                explanation={currentExplanation}
                onSelectAnswer={handleAnswerSelect}
              />
            </div>
          </div>
        )}

        {/* Non-Boss Battle Layout */}
        {gameMode !== 'boss_battle' && (
          <>
            {/* Mode Badge & Progress */}
            <ProgressBar
              gameMode={gameMode}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions?.length || 0}
              questionsAnswered={questionsAnswered}
              hasDoublePoints={hasDoublePoints}
              topic={currentQuestion?.topic || 'Chemistry'}
            />

            {/* Top Stats Bar */}
            <StatsBar
              score={score}
              coins={coins}
              streak={streak}
              lives={lives}
              timeLeft={timeLeft}
              isTimeFrozen={isTimeFrozen}
              gameMode={gameMode}
              onOpenShop={() => setShowShop(true)}
            />

            {/* Power-ups Bar */}
            <PowerUpBar
              ownedPowerUps={ownedPowerUps}
              isAnswered={isAnswered}
              onUsePowerUp={usePowerUp}
              onOpenShop={() => setShowShop(true)}
            />

            {/* Question Card */}
            <QuestionCard
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              selectedAnswer={selectedAnswer}
              isAnswered={isAnswered}
              hiddenOptions={hiddenOptions}
              explanation={currentExplanation}
              onSelectAnswer={handleAnswerSelect}
            />
          </>
        )}
      </div>
    </motion.div>
  )
}
