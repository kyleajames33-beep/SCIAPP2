'use client'

import { useReducer, useCallback, useRef, useEffect } from 'react'
import { GameMode, GameState, Question, PowerUpId } from '@/lib/game-types'
import { GAME_MODE_CONFIG, INITIAL_COINS, INITIAL_LIVES, DEFAULT_TIME_PER_QUESTION, POWER_UP_DISPLAY } from '@/lib/game-config'

// Solo game state shape
export type SoloGameState = {
  // Screen state
  gameState: GameState
  gameMode: GameMode
  
  // Session info
  gameCode: string
  sessionId: string
  
  // Questions
  questions: Question[]
  currentQuestionIndex: number
  
  // Scoring
  score: number
  coins: number
  streak: number
  maxStreak: number
  correctAnswers: number
  incorrectAnswers: number
  
  // Timer
  timeLeft: number
  baseTime: number
  isTimeFrozen: boolean
  
  // Survival mode
  lives: number
  questionsAnswered: number
  
  // Answer state
  selectedAnswer: number | null
  isAnswered: boolean
  
  // Power-ups
  hiddenOptions: number[]
  hasDoublePoints: boolean
  ownedPowerUps: Record<PowerUpId, number>
  
  // UI state
  showShop: boolean
  coinAnimation: number | null
  isLoading: boolean
}

// Actions
export type SoloGameAction =
  | { type: 'SELECT_MODE'; mode: GameMode }
  | { type: 'START_GAME_REQUEST' }
  | { type: 'START_GAME_SUCCESS'; payload: { gameCode: string; sessionId: string; questions: Question[]; config: { timePerQuestion: number; lives?: number } } }
  | { type: 'START_GAME_FAILURE' }
  | { type: 'SELECT_ANSWER'; answerIndex: number }
  | { type: 'ANSWER_RESULT'; payload: { isCorrect: boolean; pointsEarned: number; coinsEarned: number; correctAnswer: number } }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_GAME' }
  | { type: 'RESTART_GAME' }
  | { type: 'TICK_TIMER' }
  | { type: 'LOSE_LIFE' }
  | { type: 'SET_SHOW_SHOP'; show: boolean }
  | { type: 'BUY_POWERUP'; powerUpId: PowerUpId; cost: number }
  | { type: 'USE_POWERUP'; powerUpId: PowerUpId }
  | { type: 'FREEZE_TIME' }
  | { type: 'HIDE_OPTIONS'; options: number[] }
  | { type: 'ACTIVATE_DOUBLE_POINTS' }
  | { type: 'DEACTIVATE_DOUBLE_POINTS' }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'CLEAR_COIN_ANIMATION' }
  | { type: 'BACK_TO_MODE_SELECT' }

// Initial state
export const initialSoloGameState: SoloGameState = {
  gameState: 'mode-select',
  gameMode: 'classic',
  gameCode: '',
  sessionId: '',
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  coins: INITIAL_COINS,
  streak: 0,
  maxStreak: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  timeLeft: DEFAULT_TIME_PER_QUESTION,
  baseTime: DEFAULT_TIME_PER_QUESTION,
  isTimeFrozen: false,
  lives: INITIAL_LIVES,
  questionsAnswered: 0,
  selectedAnswer: null,
  isAnswered: false,
  hiddenOptions: [],
  hasDoublePoints: false,
  ownedPowerUps: {
    timeFreeze: 0,
    fiftyFifty: 0,
    doublePoints: 0,
    skip: 0
  },
  showShop: false,
  coinAnimation: null,
  isLoading: false
}

// Reducer
export function soloGameReducer(state: SoloGameState, action: SoloGameAction): SoloGameState {
  switch (action.type) {
    case 'SELECT_MODE':
      return { ...state, gameMode: action.mode, gameState: 'lobby' }
    
    case 'START_GAME_REQUEST':
      return { ...state, isLoading: true }
    
    case 'START_GAME_SUCCESS':
      return {
        ...state,
        isLoading: false,
        gameCode: action.payload.gameCode,
        sessionId: action.payload.sessionId,
        questions: action.payload.questions,
        baseTime: action.payload.config.timePerQuestion,
        timeLeft: action.payload.config.timePerQuestion,
        lives: action.payload.config.lives || INITIAL_LIVES,
        gameState: 'playing'
      }
    
    case 'START_GAME_FAILURE':
      return { ...state, isLoading: false }
    
    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswer: action.answerIndex,
        isAnswered: true,
        isTimeFrozen: false
      }
    
    case 'ANSWER_RESULT': {
      const { isCorrect, pointsEarned, coinsEarned, correctAnswer } = action.payload
      const newStreak = isCorrect ? state.streak + 1 : 0
      const questions = [...state.questions]
      if (questions[state.currentQuestionIndex]) {
        questions[state.currentQuestionIndex] = {
          ...questions[state.currentQuestionIndex],
          correctAnswer
        }
      }
      return {
        ...state,
        questions,
        score: isCorrect ? state.score + pointsEarned : state.score,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        correctAnswers: isCorrect ? state.correctAnswers + 1 : state.correctAnswers,
        incorrectAnswers: isCorrect ? state.incorrectAnswers : state.incorrectAnswers + 1,
        questionsAnswered: state.questionsAnswered + 1,
        coinAnimation: isCorrect ? coinsEarned : null,
        coins: isCorrect ? state.coins + coinsEarned : state.coins,
        hasDoublePoints: isCorrect ? false : state.hasDoublePoints
      }
    }
    
    case 'TIMEOUT':
      return {
        ...state,
        isAnswered: true,
        streak: 0,
        incorrectAnswers: state.incorrectAnswers + 1,
        questionsAnswered: state.questionsAnswered + 1
      }
    
    case 'LOSE_LIFE':
      return {
        ...state,
        lives: state.lives - 1
      }
    
    case 'NEXT_QUESTION': {
      const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1
      const outOfLives = state.gameMode === 'survival' && state.lives <= 0
      
      if (isLastQuestion || outOfLives) {
        return { ...state, gameState: 'results' }
      }
      
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedAnswer: null,
        isAnswered: false,
        timeLeft: state.baseTime,
        hiddenOptions: [],
        isTimeFrozen: false
      }
    }
    
    case 'FINISH_GAME':
      return { ...state, gameState: 'results' }
    
    case 'RESTART_GAME':
      return {
        ...initialSoloGameState,
        gameMode: state.gameMode
      }
    
    case 'TICK_TIMER':
      if (state.isTimeFrozen || state.isAnswered || state.timeLeft <= 0) {
        return state
      }
      return { ...state, timeLeft: state.timeLeft - 1 }
    
    case 'SET_SHOW_SHOP':
      return { ...state, showShop: action.show }
    
    case 'BUY_POWERUP':
      if (state.coins < action.cost) return state
      return {
        ...state,
        coins: state.coins - action.cost,
        ownedPowerUps: {
          ...state.ownedPowerUps,
          [action.powerUpId]: (state.ownedPowerUps[action.powerUpId] || 0) + 1
        }
      }
    
    case 'USE_POWERUP':
      if (state.ownedPowerUps[action.powerUpId] <= 0 || state.isAnswered) return state
      return {
        ...state,
        ownedPowerUps: {
          ...state.ownedPowerUps,
          [action.powerUpId]: state.ownedPowerUps[action.powerUpId] - 1
        }
      }
    
    case 'FREEZE_TIME':
      return { ...state, isTimeFrozen: true }
    
    case 'HIDE_OPTIONS':
      return { ...state, hiddenOptions: action.options }
    
    case 'ACTIVATE_DOUBLE_POINTS':
      return { ...state, hasDoublePoints: true }
    
    case 'DEACTIVATE_DOUBLE_POINTS':
      return { ...state, hasDoublePoints: false }
    
    case 'ADD_COINS':
      return {
        ...state,
        coins: state.coins + action.amount,
        coinAnimation: action.amount
      }
    
    case 'CLEAR_COIN_ANIMATION':
      return { ...state, coinAnimation: null }
    
    case 'BACK_TO_MODE_SELECT':
      return { ...state, gameState: 'mode-select' }
    
    default:
      return state
  }
}

// Custom hook for using the game reducer with side effects
export function useGameReducer() {
  const [state, dispatch] = useReducer(soloGameReducer, initialSoloGameState)
  
  // Refs for timer callbacks to avoid stale closures
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  // Timer effect
  useEffect(() => {
    if (state.gameState !== 'playing' || state.isAnswered || state.timeLeft <= 0 || state.isTimeFrozen) {
      return
    }
    
    const timer = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [state.gameState, state.isAnswered, state.timeLeft, state.isTimeFrozen])
  
  // Coin animation cleanup
  useEffect(() => {
    if (state.coinAnimation !== null) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'CLEAR_COIN_ANIMATION' })
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [state.coinAnimation])
  
  return { state, dispatch, stateRef }
}
