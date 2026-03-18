'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, ArrowRight, Home, Clock, Target, Skull } from 'lucide-react';
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: number;
}

// Mapping from campaign chamber IDs to question chamber IDs
const CHAMBER_CONFIG: Record<string, string> = {
  'm1-c1': 'atomic-structure-and-periodicity',
  'm1-c2': 'chemical-bonding',
  'm1-c3': 'intermolecular-forces', 
  'm1-c4': 'states-of-matter',
};

// Chamber display names
const CHAMBER_NAMES: Record<string, string> = {
  'm1-c1': 'Atomic Structure',
  'm1-c2': 'Periodic Table', 
  'm1-c3': 'Chemical Bonding',
  'm1-c4': 'IMF',
};

export default function ChamberPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useSupabaseAuth();
  const sessionRef = useRef(session);
  
  const chamberId = params?.chamberId as string;
  const chamberName = CHAMBER_NAMES[chamberId] || 'Chamber';
  const questionChamberId = CHAMBER_CONFIG[chamberId];

  // Game state
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [gameComplete, setGameComplete] = useState(false);

  // Keep session ref in sync
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      if (!questionChamberId) {
        console.error('No question chamber ID mapping for:', chamberId);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/questions?chamberId=${questionChamberId}&count=10`);
        const data = await response.json();
        
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          console.error('No questions found for chamberId:', questionChamberId);
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [chamberId, questionChamberId]);

  // Timer countdown
  useEffect(() => {
    if (loading || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, gameComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        completeGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const completeGame = async () => {
    setGameComplete(true);
    
    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const passed = accuracy >= 60; // 60% pass threshold
    
    // Save progress if authenticated
    if (sessionRef.current) {
      try {
        await authFetch('/api/campaign/chamber/complete', sessionRef.current, {
          method: 'POST',
          body: JSON.stringify({
            chamberId,
            score: accuracy,
            passed,
            timeSpent: 300 - timeLeft,
          }),
        });
      } catch (error) {
        console.error('Failed to save chamber progress:', error);
      }
    } else if (passed) {
      // Save guest progress to sessionStorage for later migration
      try {
        const storageKey = 'chemquest_session_progress';
        const existingProgress: string[] = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
        
        if (!existingProgress.includes(chamberId)) {
          existingProgress.push(chamberId);
          sessionStorage.setItem(storageKey, JSON.stringify(existingProgress));
          console.log('[GUEST] Chamber progress saved to sessionStorage:', chamberId);
        }
      } catch (error) {
        console.warn('[GUEST] Failed to save progress to sessionStorage:', error);
      }
    }
  };

  // Get module info for boss navigation
  const getModuleInfo = () => {
    if (chamberId.startsWith('m1-')) return { id: 'module-1', bossId: 'acid-baron' };
    if (chamberId.startsWith('m2-')) return { id: 'module-2', bossId: 'mole-master' };
    if (chamberId.startsWith('m3-')) return { id: 'module-3', bossId: 'reaction-king' };
    return null;
  };

  const handleChallengeBoss = () => {
    const moduleInfo = getModuleInfo();
    if (moduleInfo) {
      router.push(`/campaign/boss/${moduleInfo.bossId}`);
    }
  };

  const handleReturnToMap = () => {
    router.push('/campaign');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questionChamberId || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Chamber Unavailable</h2>
          <p className="text-gray-400 mb-6">
            Questions for {chamberName} are not yet available.
          </p>
          <button 
            onClick={handleReturnToMap}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            Return to Campaign
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  if (gameComplete) {
    const accuracy = Math.round((score / questions.length) * 100);
    const passed = accuracy >= 60;
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto p-8 bg-gray-800 rounded-2xl border border-gray-700 text-center"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {passed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {passed ? 'Chamber Complete!' : 'Chamber Failed'}
          </h2>
          
          <div className="space-y-2 mb-6 text-gray-300">
            <p>Score: {score}/{questions.length} ({accuracy}%)</p>
            <p>Time: {formatTime(300 - timeLeft)}</p>
            {passed && <p className="text-green-400">+25 XP earned</p>}
          </div>
          
          <div className="space-y-3">
            {passed && (
              <button 
                onClick={handleChallengeBoss}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Skull className="w-4 h-4" />
                Challenge Boss
              </button>
            )}
            <button 
              onClick={handleReturnToMap}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Home className="w-4 h-4" />
              Return to Campaign
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-800/90 backdrop-blur border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{chamberName}</h1>
            <p className="text-sm text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-300">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <Target className="w-4 h-4" />
              <span>{score}/{questions.length}</span>
            </div>
            <button 
              onClick={handleReturnToMap}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-700">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-6"
          >
            {/* Question text */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl text-white mb-4">{currentQuestion.question}</h2>
              
              {/* Answer options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(letter => {
                  const option = currentQuestion[`option${letter}` as keyof Question] as string;
                  const isSelected = selectedAnswer === letter;
                  const isCorrect = letter === currentQuestion.correctAnswer;
                  const isWrong = showResult && isSelected && !isCorrect;
                  const shouldHighlight = showResult && isCorrect;
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleAnswerSelect(letter)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        shouldHighlight 
                          ? 'border-green-500 bg-green-500/20' 
                          : isWrong 
                          ? 'border-red-500 bg-red-500/20'
                          : isSelected 
                          ? 'border-blue-500 bg-blue-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className={`font-bold ${
                          shouldHighlight ? 'text-green-400' : 
                          isWrong ? 'text-red-400' : 
                          isSelected ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {letter}.
                        </span>
                        <span className="text-white">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            {showResult && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <h3 className="font-bold text-white mb-2">Explanation</h3>
                <p className="text-gray-300">{currentQuestion.explanation}</p>
              </motion.div>
            )}

            {/* Submit button */}
            {!showResult && (
              <div className="flex justify-center">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  Submit Answer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}