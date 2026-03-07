"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Skull,
  Swords,
  Shield,
  Heart,
  Zap,
  Trophy,
  ArrowLeft,
  Flame,
  Timer,
  Star,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Question } from "@/lib/game-types";
import { RankUpCelebration } from "../_components/RankUpCelebration";
import { resolveBossId, handleBossNotFound, RealBossId } from "@/lib/boss-mapping";

type BossPhase = "intro" | "combat" | "shield" | "victory" | "defeat";

interface BossState {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  phase: BossPhase;
  enraged: boolean;
  shieldActive: boolean;
  shieldHp: number;
}

interface CombatStats {
  damageDealt: number;
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
  maxStreak: number;
}

interface RankUpData {
  previous: { name: string; symbol: string; gradient: string };
  new: { name: string; symbol: string; gradient: string };
}

const BOSS_DATA: Record<string, { name: string; maxHp: number; element: string }> = {
  "acid-baron": { name: "The Acid Baron", maxHp: 1000, element: "Acid-Base" },
  "redox-reaper": { name: "The Redox Reaper", maxHp: 1100, element: "Redox" },
  "organic-overlord": { name: "The Organic Overlord", maxHp: 1200, element: "Organic" },
  "thermo-titan": { name: "The Thermodynamic Titan", maxHp: 1000, element: "Thermodynamics" },
  "equilibrium-emperor": { name: "The Equilibrium Emperor", maxHp: 1050, element: "Equilibrium" },
  "kinetic-king": { name: "The Kinetic King", maxHp: 950, element: "Kinetics" },
  "atomic-archmage": { name: "The Atomic Archmage", maxHp: 1150, element: "Atomic Structure" },
  "solution-sovereign": { name: "The Solution Sovereign", maxHp: 1000, element: "Solutions" }
};

const SHIELD_PHASES = [0.75, 0.5, 0.25]; // HP percentages where shields trigger

export default function BossBattlePage() {
  const params = useParams();
  const router = useRouter();
  const bossId = params.bossId as string;
  
  const [boss, setBoss] = useState<BossState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [stats, setStats] = useState<CombatStats>({
    damageDealt: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    maxStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpData, setRankUpData] = useState<RankUpData | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; coins: number; gems: number } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shieldTriggeredRef = useRef<number[]>([]);

  // Resolve the campaign boss ID to a real boss ID
  const resolvedBossId = resolveBossId(bossId);
  
  // Initialize boss and fetch questions
  useEffect(() => {
    // Check if the boss ID could be resolved
    if (!resolvedBossId) {
      handleBossNotFound(bossId, () => router.push("/campaign"));
      setIsLoading(false);
      return;
    }
    
    const bossInfo = BOSS_DATA[resolvedBossId];
    if (!bossInfo) {
      handleBossNotFound(bossId, () => router.push("/campaign"));
      setIsLoading(false);
      return;
    }

    setBoss({
      id: resolvedBossId,
      name: bossInfo.name,
      maxHp: bossInfo.maxHp,
      currentHp: bossInfo.maxHp,
      phase: "intro",
      enraged: false,
      shieldActive: false,
      shieldHp: 0
    });

    // Fetch questions
    fetch("/api/questions?count=15&difficulty=medium")
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load questions");
        setIsLoading(false);
      });
  }, [resolvedBossId, bossId, router]);

  // Timer effect
  useEffect(() => {
    if (boss?.phase !== "combat" || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [boss?.phase, isAnswered, currentQuestionIndex]);

  const handleTimeout = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      streak: 0
    }));
    
    // Boss heals on timeout
    if (boss) {
      const healAmount = Math.floor(boss.maxHp * 0.05);
      setBoss(prev => prev ? {
        ...prev,
        currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount)
      } : null);
      toast.error(`Time's up! ${boss.name} healed ${healAmount} HP!`);
    }

    setTimeout(() => nextQuestion(), 2000);
  }, [isAnswered, boss]);

  const calculateDamage = (isCorrect: boolean, streak: number): number => {
    if (!isCorrect) return 0;
    const baseDamage = 50;
    const streakBonus = streak * 10;
    const upgradeBonus = 0; // Would come from user upgrades
    return baseDamage + streakBonus + upgradeBonus;
  };

  const checkShieldPhase = (currentHp: number, maxHp: number): boolean => {
    const hpPercent = currentHp / maxHp;
    for (const threshold of SHIELD_PHASES) {
      if (hpPercent <= threshold && !shieldTriggeredRef.current.includes(threshold)) {
        shieldTriggeredRef.current.push(threshold);
        return true;
      }
    }
    return false;
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswered || !boss || boss.phase !== "combat") return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = questions[currentQuestionIndex];
    const options = [currentQuestion.optionA, currentQuestion.optionB, currentQuestion.optionC, currentQuestion.optionD];
    const answerIndex = options.indexOf(answer);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const damage = calculateDamage(isCorrect, newStreak);

    // Update stats
    setStats(prev => ({
      damageDealt: prev.damageDealt + damage,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak)
    }));

    // Apply damage to boss
    if (isCorrect) {
      const newHp = Math.max(0, boss.currentHp - damage);
      
      // Check for shield phase
      if (checkShieldPhase(newHp, boss.maxHp)) {
        setBoss(prev => prev ? {
          ...prev,
          currentHp: newHp,
          shieldActive: true,
          shieldHp: Math.floor(prev.maxHp * 0.15),
          phase: "shield"
        } : null);
        toast.info(`${boss.name} activated a shield!`);
      } else {
        setBoss(prev => prev ? { ...prev, currentHp: newHp } : null);
      }

      // Check for victory
      if (newHp <= 0) {
        setBoss(prev => prev ? { ...prev, phase: "victory", currentHp: 0 } : null);
        await submitBossAttempt(true);
        return;
      }

      toast.success(`${damage} damage dealt!`);
    } else {
      // Boss enrages on wrong answer
      if (!boss.enraged && stats.questionsAnswered > 5) {
        setBoss(prev => prev ? { ...prev, enraged: true } : null);
        toast.warning(`${boss.name} is enraged!`);
      }
      toast.error("Wrong answer!");
    }

    setTimeout(() => nextQuestion(), 1500);
  };

  const handleShieldBreak = () => {
    if (!boss || !boss.shieldActive) return;
    
    const shieldDamage = 30;
    const newShieldHp = boss.shieldHp - shieldDamage;
    
    if (newShieldHp <= 0) {
      setBoss(prev => prev ? {
        ...prev,
        shieldActive: false,
        shieldHp: 0,
        phase: "combat"
      } : null);
      toast.success("Shield broken!");
    } else {
      setBoss(prev => prev ? { ...prev, shieldHp: newShieldHp } : null);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      // Out of questions - defeat
      setBoss(prev => prev ? { ...prev, phase: "defeat" } : null);
      submitBossAttempt(false);
      return;
    }

    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeRemaining(30);
  };

  const submitBossAttempt = async (victory: boolean) => {
    try {
      // Use resolved boss ID for the API call
      const apiBossId = resolvedBossId || bossId;
      const response = await fetch("/api/campaign/boss/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bossId: apiBossId,
          damageDealt: stats.damageDealt,
          questionsAnswered: stats.questionsAnswered,
          correctAnswers: stats.correctAnswers,
          streak: stats.maxStreak,
          timeRemaining,
          victory
        })
      });

      const data = await response.json();
      
      if (data.rewards) {
        setRewards(data.rewards);
      }

      if (data.rankUp) {
        setRankUpData(data.rankUp);
        setShowRankUp(true);
      }
    } catch (error) {
      console.error("Failed to submit boss attempt:", error);
    }
  };

  const startBattle = () => {
    setBoss(prev => prev ? { ...prev, phase: "combat" } : null);
  };

  if (isLoading || !boss) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-white text-xl">Loading boss battle...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hpPercent = (boss.currentHp / boss.maxHp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/campaign")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Exit Battle
        </Button>
      </div>

      {/* Boss Display */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-black/50 border-red-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skull className="w-8 h-8 text-red-500" />
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {boss.name}
                    {boss.enraged && (
                      <Badge variant="destructive" className="animate-pulse">
                        <Flame className="w-3 h-3 mr-1" /> ENRAGED
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-400">
                    {BOSS_DATA[bossId]?.element}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {boss.currentHp} / {boss.maxHp}
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Heart className="w-4 h-4" /> HP
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={hpPercent}
              className="h-4 bg-gray-800"
            />
            {boss.shieldActive && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Shield: {boss.shieldHp}</span>
                </div>
                <Progress value={(boss.shieldHp / (boss.maxHp * 0.15)) * 100} className="h-2 bg-gray-800" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combat Stats */}
      {boss.phase === "combat" && (
        <div className="max-w-4xl mx-auto mb-6 grid grid-cols-4 gap-4">
          <Card className="bg-black/30 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <Swords className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.damageDealt}</div>
              <div className="text-xs text-gray-400">Damage</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-orange-500/30">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{stats.streak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-green-500/30">
            <CardContent className="p-3 text-center">
              <Zap className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {stats.questionsAnswered > 0
                  ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-yellow-500/30">
            <CardContent className="p-3 text-center">
              <Timer className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className={`text-lg font-bold ${timeRemaining <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {timeRemaining}s
              </div>
              <div className="text-xs text-gray-400">Time</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* Intro Phase */}
        {boss.phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-black/50 border-red-500/50">
              <CardContent className="p-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{boss.name}</h2>
                <p className="text-gray-400 mb-6">
                  A fearsome guardian of {BOSS_DATA[bossId]?.element}. Answer questions correctly to deal damage!
                </p>
                <div className="text-sm text-gray-500 mb-6">
                  <p>• Correct answers deal damage based on your streak</p>
                  <p>• Wrong answers may enrage the boss</p>
                  <p>• Timeouts let the boss heal</p>
                  <p>• Break shields to continue dealing damage</p>
                </div>
                <Button
                  size="lg"
                  onClick={startBattle}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Swords className="w-5 h-5 mr-2" /> Begin Battle
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Combat Phase */}
        {boss.phase === "combat" && currentQuestion && (
          <motion.div
            key={`question-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-black/50 border-purple-500/30">
              <CardHeader>
                <Badge className="w-fit mb-2">{currentQuestion.topic}</Badge>
                <CardTitle className="text-white text-lg">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[currentQuestion.optionA, currentQuestion.optionB, currentQuestion.optionC, currentQuestion.optionD].map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start text-left h-auto py-3 px-4 ${
                      isAnswered
                        ? index === currentQuestion.correctAnswer
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : option === selectedAnswer
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "opacity-50"
                        : "hover:bg-purple-500/20 hover:border-purple-500"
                    }`}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered}
                  >
                    {option}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Shield Phase */}
        {boss.phase === "shield" && (
          <motion.div
            key="shield"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-black/50 border-blue-500/50">
              <CardContent className="p-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Shield className="w-24 h-24 text-blue-400 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">Shield Active!</h2>
                <p className="text-gray-400 mb-6">
                  Click rapidly to break through the shield!
                </p>
                <div className="mb-4">
                  <Progress value={(boss.shieldHp / (boss.maxHp * 0.15)) * 100} className="h-4" />
                  <p className="text-blue-400 mt-2">Shield HP: {boss.shieldHp}</p>
                </div>
                <Button
                  size="lg"
                  onClick={handleShieldBreak}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Swords className="w-5 h-5 mr-2" /> Attack Shield!
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Victory Phase */}
        {boss.phase === "victory" && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-black/50 border-yellow-500/50">
              <CardContent className="p-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Victory!</h2>
                <p className="text-gray-400 mb-6">
                  You defeated {boss.name}!
                </p>
                {rewards && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-purple-500/20 rounded-lg p-3">
                      <Star className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                      <div className="text-xl font-bold text-white">{rewards.xp}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-3">
                      <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xl font-bold text-white">{rewards.coins}</div>
                      <div className="text-xs text-gray-400">Coins</div>
                    </div>
                    <div className="bg-cyan-500/20 rounded-lg p-3">
                      <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                      <div className="text-xl font-bold text-white">{rewards.gems}</div>
                      <div className="text-xs text-gray-400">Gems</div>
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-6">
                  <p>Total Damage: {stats.damageDealt}</p>
                  <p>Accuracy: {Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)}%</p>
                  <p>Best Streak: {stats.maxStreak}</p>
                </div>
                <Button
                  size="lg"
                  onClick={() => router.push("/campaign")}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Continue Campaign
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Defeat Phase */}
        {boss.phase === "defeat" && (
          <motion.div
            key="defeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-black/50 border-red-500/50">
              <CardContent className="p-8">
                <Skull className="w-24 h-24 text-red-500 mx-auto mb-6 opacity-50" />
                <h2 className="text-3xl font-bold text-red-400 mb-2">Defeated</h2>
                <p className="text-gray-400 mb-6">
                  {boss.name} has prevailed... for now.
                </p>
                <div className="text-sm text-gray-500 mb-6">
                  <p>Damage Dealt: {stats.damageDealt}</p>
                  <p>Boss HP Remaining: {boss.currentHp}</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/campaign")}
                  >
                    Return to Campaign
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rank Up Celebration */}
      {showRankUp && rankUpData && (
        <RankUpCelebration
          previousRank={rankUpData.previous}
          newRank={rankUpData.new}
          onComplete={() => setShowRankUp(false)}
        />
      )}
    </div>
  );
}
