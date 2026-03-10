"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Shield,
  Trophy,
  ArrowLeft,
  Flame,
  Star,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Question } from "@/lib/game-types";
import { RankUpCelebration } from "../_components/RankUpCelebration";
import { resolveBossId, handleBossNotFound } from "@/lib/boss-mapping";
import bossesData from "@/data/bosses.json";

// Build lookup from bosses.json
const BOSS_LOOKUP: Record<string, typeof bossesData.bosses[0]> = Object.fromEntries(
  bossesData.bosses.map((b) => [b.id, b])
);

type BossPhase = "intro" | "combat" | "shield" | "victory" | "defeat";
type PlayerSprite = "idle" | "attack" | "hurt";

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

interface DamagePopup {
  id: number;
  value: number;
}

const SHIELD_PHASES = [0.75, 0.5, 0.25];

function playSound(name: "correct" | "wrong" | "boss_hit" | "level_up" | "coin") {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.volume = 0.4;
  audio.play().catch(() => {});
}

export default function BossBattlePage() {
  const params = useParams();
  const router = useRouter();
  const bossId = (params?.bossId as string) ?? "";
  const questionSetId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("questionSetId")
      : null;

  const [boss, setBoss] = useState<BossState | null>(null);
  const [bossJsonData, setBossJsonData] = useState<typeof bossesData.bosses[0] | null>(null);
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
    maxStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpData, setRankUpData] = useState<RankUpData | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; coins: number; gems: number } | null>(null);
  const [playerSprite, setPlayerSprite] = useState<PlayerSprite>("idle");
  const [bossShaking, setBossShaking] = useState(false);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);

  const popupIdRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shieldTriggeredRef = useRef<number[]>([]);

  const resolvedBossId = resolveBossId(bossId);

  useEffect(() => {
    if (!resolvedBossId) {
      handleBossNotFound(bossId, () => router.push("/campaign"));
      setIsLoading(false);
      return;
    }

    const data = BOSS_LOOKUP[resolvedBossId];
    if (!data) {
      handleBossNotFound(bossId, () => router.push("/campaign"));
      setIsLoading(false);
      return;
    }

    setBossJsonData(data);
    setBoss({
      id: resolvedBossId,
      name: data.name,
      maxHp: data.baseHp,
      currentHp: data.baseHp,
      phase: "intro",
      enraged: false,
      shieldActive: false,
      shieldHp: 0,
    });

    const qs = questionSetId ? `&questionSetId=${questionSetId}` : "";
    fetch(`/api/questions?count=15${qs}`)
      .then((res) => res.json())
      .then((d) => {
        setQuestions(d.questions || []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load questions");
        setIsLoading(false);
      });
  }, [resolvedBossId, bossId, router]);

  // Timer
  useEffect(() => {
    if (boss?.phase !== "combat" || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
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
    setStats((prev) => ({ ...prev, questionsAnswered: prev.questionsAnswered + 1, streak: 0 }));
    if (boss) {
      const healAmount = Math.floor(boss.maxHp * 0.05);
      setBoss((prev) =>
        prev ? { ...prev, currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount) } : null
      );
      toast.error(`Time's up! ${boss.name} healed ${healAmount} HP!`);
    }
    setTimeout(() => nextQuestion(), 2000);
  }, [isAnswered, boss]);

  const calculateDamage = (isCorrect: boolean, streak: number): number => {
    if (!isCorrect) return 0;
    return 50 + streak * 10;
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

  const triggerAttackAnimation = (isCorrect: boolean, damage: number) => {
    if (isCorrect) {
      setPlayerSprite("attack");
      setTimeout(() => setBossShaking(true), 200);
      setTimeout(() => {
        setBossShaking(false);
        setPlayerSprite("idle");
      }, 600);
      // Floating damage popup
      const id = ++popupIdRef.current;
      setDamagePopups((prev) => [...prev, { id, value: damage }]);
      setTimeout(() => setDamagePopups((prev) => prev.filter((p) => p.id !== id)), 1100);
      playSound("correct");
      setTimeout(() => playSound("boss_hit"), 200);
    } else {
      setPlayerSprite("hurt");
      setTimeout(() => setPlayerSprite("idle"), 600);
      playSound("wrong");
    }
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswered || !boss || boss.phase !== "combat") return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = questions[currentQuestionIndex];
    const options = [
      currentQuestion.optionA,
      currentQuestion.optionB,
      currentQuestion.optionC,
      currentQuestion.optionD,
    ];
    const answerIndex = options.indexOf(answer);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const damage = calculateDamage(isCorrect, newStreak);

    triggerAttackAnimation(isCorrect, damage);

    setStats((prev) => ({
      damageDealt: prev.damageDealt + damage,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
    }));

    if (isCorrect) {
      const newHp = Math.max(0, boss.currentHp - damage);
      if (checkShieldPhase(newHp, boss.maxHp)) {
        setBoss((prev) =>
          prev
            ? {
                ...prev,
                currentHp: newHp,
                shieldActive: true,
                shieldHp: Math.floor(prev.maxHp * 0.15),
                phase: "shield",
              }
            : null
        );
      } else {
        setBoss((prev) => (prev ? { ...prev, currentHp: newHp } : null));
      }

      if (newHp <= 0) {
        setBoss((prev) => (prev ? { ...prev, phase: "victory", currentHp: 0 } : null));
        playSound("level_up");
        await submitBossAttempt(true);
        return;
      }
    } else {
      if (!boss.enraged && stats.questionsAnswered > 5) {
        setBoss((prev) => (prev ? { ...prev, enraged: true } : null));
      }
    }

    setTimeout(() => nextQuestion(), 1500);
  };

  const handleShieldBreak = () => {
    if (!boss || !boss.shieldActive) return;
    const shieldDamage = 30;
    const newShieldHp = boss.shieldHp - shieldDamage;
    if (newShieldHp <= 0) {
      setBoss((prev) =>
        prev ? { ...prev, shieldActive: false, shieldHp: 0, phase: "combat" } : null
      );
      toast.success("Shield broken!");
    } else {
      setBoss((prev) => (prev ? { ...prev, shieldHp: newShieldHp } : null));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      setBoss((prev) => (prev ? { ...prev, phase: "defeat" } : null));
      submitBossAttempt(false);
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeRemaining(30);
  };

  const submitBossAttempt = async (victory: boolean) => {
    try {
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
          victory,
        }),
      });
      const data = await response.json();
      if (data.rewards) setRewards(data.rewards);
      if (data.rankUp) {
        setRankUpData(data.rankUp);
        setShowRankUp(true);
      }
    } catch (error) {
      console.error("Failed to submit boss attempt:", error);
    }
  };

  const startBattle = () => {
    setBoss((prev) => (prev ? { ...prev, phase: "combat" } : null));
  };

  if (isLoading || !boss || !bossJsonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading boss battle...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hpPercent = (boss.currentHp / boss.maxHp) * 100;
  const themeColor = bossJsonData.themeColor;

  const playerSpriteMap = {
    idle: "/sprites/player_strong_idle.png",
    attack: "/sprites/player_strong_attack.png",
    hurt: "/sprites/player_strong_hurt.png",
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${bossJsonData.particleColors[0]}33 0%, #0d0d1a 45%, ${bossJsonData.particleColors[1]}22 100%)`,
      }}
    >
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0px) scale(1); }
          100% { opacity: 0; transform: translateY(-70px) scale(1.4); }
        }
        @keyframes bossShake {
          0%, 100% { transform: translateX(0) scaleX(-1); }
          20%       { transform: translateX(-10px) scaleX(-1); }
          40%       { transform: translateX(10px) scaleX(-1); }
          60%       { transform: translateX(-7px) scaleX(-1); }
          80%       { transform: translateX(7px) scaleX(-1); }
        }
        .boss-shake { animation: bossShake 0.4s ease-in-out; }
      `}</style>

      {/* Exit button */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => router.push("/campaign")}
          className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
      </div>

      {/* ── BATTLE ARENA (top ~50%) ─────────────────────────────────── */}
      <div className="relative" style={{ height: "50vh" }}>
        {/* Boss HP bar — top left */}
        <div className="absolute top-4 left-4 z-10" style={{ width: "42%" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-bold text-sm truncate">{boss.name}</span>
            {boss.enraged && (
              <span className="text-red-400 text-xs font-bold animate-pulse flex items-center gap-1">
                <Flame className="w-3 h-3" /> ENRAGED
              </span>
            )}
          </div>
          <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/20 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${hpPercent}%`, backgroundColor: themeColor }}
            />
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {boss.currentHp} / {boss.maxHp} HP
          </div>
          {boss.shieldActive && (
            <div className="mt-1">
              <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-blue-400/30">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${(boss.shieldHp / (boss.maxHp * 0.15)) * 100}%` }}
                />
              </div>
              <div className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Shield: {boss.shieldHp}
              </div>
            </div>
          )}
        </div>

        {/* Player HP bar — top right */}
        <div className="absolute top-4 right-4 z-10" style={{ width: "42%" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-bold text-sm">You</span>
            {stats.streak > 1 && (
              <span className="text-orange-400 text-xs font-bold">
                🔥 {stats.streak}x streak
              </span>
            )}
          </div>
          <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/20 shadow-inner">
            <div className="h-full rounded-full bg-green-400 w-full" />
          </div>
          {boss.phase === "combat" && (
            <div
              className={`text-xs mt-0.5 font-mono font-bold ${
                timeRemaining <= 10 ? "text-red-400 animate-pulse" : "text-white/40"
              }`}
            >
              ⏱ {timeRemaining}s
            </div>
          )}
        </div>

        {/* Sprites */}
        <div className="absolute inset-0 flex items-end justify-between px-10 pb-3">
          {/* Player — bottom left */}
          <div className="relative">
            <img
              src={playerSpriteMap[playerSprite]}
              alt="Player"
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {/* Boss — bottom right, flipped */}
          <div className="relative">
            {/* Damage popups */}
            {damagePopups.map((popup) => (
              <div
                key={popup.id}
                className="absolute pointer-events-none font-black text-yellow-300 text-2xl"
                style={{
                  animation: "floatUp 1.1s ease-out forwards",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 30,
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
                -{popup.value}
              </div>
            ))}
            <img
              src={bossJsonData.sprite}
              alt={boss.name}
              className={`w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-2xl ${
                bossShaking ? "boss-shake" : ""
              }`}
              style={{ transform: "scaleX(-1)", imageRendering: "pixelated" }}
            />
          </div>
        </div>
      </div>

      {/* ── QUESTION PANEL (bottom ~50%) ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden border-t-2"
        style={{
          background: "rgba(10,10,20,0.92)",
          borderColor: `${themeColor}44`,
        }}
      >
        <AnimatePresence mode="wait">
          {/* ── INTRO ── */}
          {boss.phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 p-6 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-1">{boss.name} appears!</h2>
              <p className="text-gray-400 text-sm mb-1">{bossJsonData.description}</p>
              <p className="text-gray-500 text-xs mb-5">
                Correct answers deal damage · Streaks boost damage · Wrong answers may enrage the boss
              </p>
              <Button
                size="lg"
                onClick={startBattle}
                className="font-bold text-white border-0"
                style={{ backgroundColor: themeColor }}
              >
                <Swords className="w-5 h-5 mr-2" /> Begin Battle
              </Button>
            </motion.div>
          )}

          {/* ── COMBAT ── */}
          {boss.phase === "combat" && currentQuestion && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 p-4 overflow-hidden"
            >
              {/* Question text */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className="text-xs">{currentQuestion.topic}</Badge>
                  <span className="text-xs text-white/30">
                    {currentQuestionIndex + 1}/{questions.length}
                  </span>
                </div>
                <p className="text-white font-medium text-sm leading-snug">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer buttons */}
              <div className="grid grid-cols-2 gap-2 flex-1">
                {(
                  [
                    currentQuestion.optionA,
                    currentQuestion.optionB,
                    currentQuestion.optionC,
                    currentQuestion.optionD,
                  ] as string[]
                ).map((option, index) => {
                  const letter = ["A", "B", "C", "D"][index];
                  const isCorrectAnswer = index === currentQuestion.correctAnswer;
                  const isSelected = option === selectedAnswer;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      className={`w-full text-left text-sm py-2.5 px-3 rounded-lg border transition-all font-medium ${
                        isAnswered
                          ? isCorrectAnswer
                            ? "bg-green-500/20 border-green-500 text-green-300"
                            : isSelected
                            ? "bg-red-500/20 border-red-500 text-red-300"
                            : "opacity-30 bg-white/5 border-white/10 text-white/40"
                          : "bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/30 active:scale-95"
                      }`}
                    >
                      <span className="text-white/30 mr-1.5 font-mono">{letter}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/40">
                <span>
                  Streak:{" "}
                  <span className="text-orange-400 font-bold">{stats.streak}</span>
                </span>
                <span>
                  DMG dealt:{" "}
                  <span className="text-yellow-400 font-bold">{stats.damageDealt}</span>
                </span>
                <span>
                  Accuracy:{" "}
                  <span className="text-green-400 font-bold">
                    {stats.questionsAnswered > 0
                      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
                      : 0}
                    %
                  </span>
                </span>
              </div>

              {/* Explanation */}
              {isAnswered && currentQuestion.explanation && (
                <div className="mt-2 p-2 bg-white/5 rounded text-xs text-white/50 leading-relaxed">
                  {currentQuestion.explanation}
                </div>
              )}
            </motion.div>
          )}

          {/* ── SHIELD ── */}
          {boss.phase === "shield" && (
            <motion.div
              key="shield"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 p-6 text-center"
            >
              <Shield className="w-14 h-14 text-blue-400 mb-3 animate-pulse" />
              <h2 className="text-xl font-bold text-white mb-1">Shield Activated!</h2>
              <p className="text-gray-400 text-sm mb-4">Destroy the shield to continue attacking!</p>
              <div className="w-52 mb-4">
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-blue-400/30">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${(boss.shieldHp / (boss.maxHp * 0.15)) * 100}%` }}
                  />
                </div>
                <p className="text-blue-400 text-xs mt-1">Shield HP: {boss.shieldHp}</p>
              </div>
              <Button onClick={handleShieldBreak} className="bg-blue-600 hover:bg-blue-700">
                <Swords className="w-4 h-4 mr-2" /> Attack Shield!
              </Button>
            </motion.div>
          )}

          {/* ── VICTORY ── */}
          {boss.phase === "victory" && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center flex-1 p-6 text-center"
            >
              <Trophy className="w-14 h-14 text-yellow-400 mb-2" />
              <h2 className="text-2xl font-bold text-white mb-1">Victory!</h2>
              <p className="text-gray-400 text-sm mb-3">You defeated {boss.name}!</p>
              {rewards && (
                <div className="flex gap-6 mb-4">
                  <div className="text-center">
                    <Star className="w-5 h-5 text-purple-400 mx-auto" />
                    <div className="text-xl font-bold text-white">{rewards.xp}</div>
                    <div className="text-xs text-gray-400">XP</div>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-5 h-5 text-yellow-400 mx-auto" />
                    <div className="text-xl font-bold text-white">{rewards.coins}</div>
                    <div className="text-xs text-gray-400">Coins</div>
                  </div>
                  <div className="text-center">
                    <Zap className="w-5 h-5 text-cyan-400 mx-auto" />
                    <div className="text-xl font-bold text-white">{rewards.gems}</div>
                    <div className="text-xs text-gray-400">Gems</div>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Damage: {stats.damageDealt} · Accuracy:{" "}
                {stats.questionsAnswered > 0
                  ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
                  : 0}
                % · Best streak: {stats.maxStreak}
              </div>
              <Button
                onClick={() => router.push("/campaign")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Continue Campaign
              </Button>
            </motion.div>
          )}

          {/* ── DEFEAT ── */}
          {boss.phase === "defeat" && (
            <motion.div
              key="defeat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center flex-1 p-6 text-center"
            >
              <div className="text-5xl mb-3">💀</div>
              <h2 className="text-2xl font-bold text-red-400 mb-1">Defeated</h2>
              <p className="text-gray-400 text-sm mb-4">
                {boss.name} has prevailed... for now.
              </p>
              <div className="text-xs text-gray-500 mb-5">
                Damage dealt: {stats.damageDealt} · Boss HP remaining: {boss.currentHp}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/campaign")}>
                  Return to Map
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
