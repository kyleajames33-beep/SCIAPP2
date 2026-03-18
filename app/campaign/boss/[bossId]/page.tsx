"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
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
import dynamic from "next/dynamic";
import type { PhaserBattleSceneHandle } from "../_components/PhaserBattleScene";
import BattleCharacter from "../_components/BattleCharacter";
import CharacterSelectModal from "../_components/CharacterSelectModal";
import { useSupabaseAuth } from "@/app/auth/supabase-provider";
import { authFetch } from "@/lib/auth-fetch";

const PhaserBattleScene = dynamic(
  () => import("../_components/PhaserBattleScene"),
  { ssr: false, loading: () => <div style={{ height: 260 }} /> }
);

import { resolveBossId, handleBossNotFound } from "@/lib/boss-mapping";
import bossesData from "@/data/bosses.json";

// Build lookup from bosses.json
const BOSS_LOOKUP: Record<string, typeof bossesData.bosses[0]> = Object.fromEntries(
  bossesData.bosses.map((b) => [b.id, b])
);

type BossPhase = "intro" | "combat" | "victory" | "defeat";
type PlayerSprite = "idle" | "attack" | "hurt";

interface BossState {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  phase: BossPhase;
  enraged: boolean;
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

function playSound(name: "correct" | "wrong" | "boss_hit" | "level_up" | "coin") {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.volume = 0.4;
  audio.play().catch(() => {});
}

export default function BossBattleClient() {
  const params = useParams();
  const router = useRouter();
  const { session } = useSupabaseAuth();
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
  // Power-ups: each starts with 1 use (free starter kit)
  const [powerUps, setPowerUps] = useState({ hint: 1 });
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  // Animation state
  const [bossFlash, setBossFlash] = useState(false);
  const [screenFlash, setScreenFlash] = useState<"correct" | "wrong" | null>(null);
  const [animKey, setAnimKey] = useState(0); // forces re-trigger of framer animations — TODO Phase 2: wire to arena key prop

  // ── Energy system state (BATTLE_SPEC.md §6) ──────────────────────────────
  const [playerEnergy, setPlayerEnergy]     = useState(0);
  const [playerHp, setPlayerHp]             = useState(100);
  const [bossCharge, setBossCharge]         = useState(0);
  const [wrongStreak, setWrongStreak]       = useState(0);
  const [currentStreak, setCurrentStreak]   = useState(0);
  const [shieldActive, setShieldActive]     = useState(false);
  const [shieldCooldown, setShieldCooldown] = useState(false);

  // Character animation states for Framer Motion
  const [heroState, setHeroState]   = useState<"idle" | "attack" | "hurt">("idle");
  const [bossState, setBossState]   = useState<"idle" | "attack" | "hurt">("idle");

  // Character selection state
  const [characterChoice, setCharacterChoice] = useState<"electron" | "proton" | "neutron" | null>(null);

  const popupIdRef = useRef(0);
  const phaserRef = useRef<PhaserBattleSceneHandle>(null);

  // ── Timer refs ────────────────────────────────────────────────────────────
  const bossChargeIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const shieldExpiryTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossAttackingRef       = useRef(false);
  const battleActiveRef        = useRef(false);

  // Ref mirrors — keep in sync with state so timers can read current values (stale closure prevention)
  const playerEnergyRef  = useRef(0);
  const shieldActiveRef  = useRef(false);
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      x: 8 + (i * 7.5) % 85,
      y: 10 + (i * 13) % 75,
      size: 4 + (i % 3) * 3,
      dur: 3 + (i % 4),
      delay: (i % 5) * 0.6,
    }))
  ).current;

  const resolvedBossId = resolveBossId(bossId);

  // Derive character images based on user choice  
  const characterForm = "baby"; // Phase 2: always baby, Phase 7 adds form progression
  const characterBase = characterChoice ?? "electron"; // fallback to electron
  
  const heroImages = {
    idle:   `/images/characters/${characterBase}-${characterForm}-idle.png`,
    attack: `/images/characters/${characterBase}-${characterForm}-attack.png`,
    hurt:   `/images/characters/${characterBase}-${characterForm}-hurt.png`,
  };

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
    });

    // Boss battles always fetch from the full question pool — no questionSetId filter
    // (DB has questionSetId=null on all questions; proper seeding is Phase 3)
    fetch(`/api/questions?count=15`)
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

  // Boss charge timer — runs only during combat phase
  useEffect(() => {
    if (!boss || boss.phase !== "combat" || !bossJsonData) return;

    battleActiveRef.current = true;

    const chargeMs  = ((bossJsonData as { chargeTime?: number }).chargeTime ?? 15) * 1000;
    const tickMs    = 100;
    const increment = (100 / chargeMs) * tickMs;

    bossChargeIntervalRef.current = setInterval(() => {
      if (!battleActiveRef.current) return;
      setBossCharge(prev => {
        const next = prev + increment;
        if (next >= 100) {
          handleBossAttack();
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => {
      battleActiveRef.current = false;
      if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss?.phase, bossJsonData]);

  // Auto-reset hero animation state to idle after action completes
  useEffect(() => {
    if (heroState === "idle") return;
    const t = setTimeout(() => setHeroState("idle"), heroState === "attack" ? 520 : 420);
    return () => clearTimeout(t);
  }, [heroState]);

  // Auto-reset boss animation state to idle after action completes
  useEffect(() => {
    if (bossState === "idle") return;
    const t = setTimeout(() => setBossState("idle"), 480);
    return () => clearTimeout(t);
  }, [bossState]);

  // Preload character images to prevent blank-frame flash on state swap
  useEffect(() => {
    if (!bossJsonData) return;
    const srcs = [
      "/images/characters/electron-baby-idle.png",
      "/images/characters/electron-baby-attack.png", 
      "/images/characters/electron-baby-hurt.png",
      "/images/characters/proton-baby-idle.png",
      "/images/characters/proton-baby-attack.png",
      "/images/characters/proton-baby-hurt.png",
      "/images/characters/neutron-baby-idle.png",
      "/images/characters/neutron-baby-attack.png",
      "/images/characters/neutron-baby-hurt.png",
      bossJsonData.images?.idle,
      bossJsonData.images?.attack,
      bossJsonData.images?.hurt,
    ].filter(Boolean) as string[];

    srcs.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });
  }, [bossJsonData]);

  const updatePlayerEnergy = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    playerEnergyRef.current = clamped;
    setPlayerEnergy(clamped);
  };

  const updateShieldActive = (value: boolean) => {
    shieldActiveRef.current = value;
    setShieldActive(value);
  };

  // PHASE 1: replaced by energy system — direct damage removed
  // const calculateDamage = (isCorrect: boolean, streak: number): number => {
  //   if (!isCorrect) return 0;
  //   return 50 + streak * 10;
  // };

  const useHint = () => {
    const q = questions[currentQuestionIndex];
    if (powerUps.hint <= 0 || isAnswered || boss?.phase !== "combat" || !q) return;
    // Eliminate 2 wrong answers
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== q.correctAnswer);
    const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setPowerUps((p) => ({ ...p, hint: p.hint - 1 }));
    setEliminatedOptions(toEliminate);
    toast.success("Two wrong answers eliminated!");
  };

  const triggerAttackAnimation = (isCorrect: boolean, damage: number) => {
    setAnimKey((k) => k + 1);
    if (isCorrect) {
      setPlayerSprite("attack");
      setScreenFlash("correct");
      setTimeout(() => setScreenFlash(null), 300);
      // Player attack animation now handled by Framer Motion in Sub-phase 2.3
      setTimeout(() => {
        if (damage > 0) {
          phaserRef.current?.triggerBossHurt(damage);
          setBossShaking(true);
          setBossFlash(true);
          const id = ++popupIdRef.current;
          setDamagePopups((prev) => [...prev, { id, value: damage }]);
          setTimeout(() => setDamagePopups((prev) => prev.filter((p) => p.id !== id)), 1100);
        }
      }, 180);
      setTimeout(() => {
        setBossShaking(false);
        setBossFlash(false);
        setPlayerSprite("idle");
      }, 650);
      playSound("correct");
      if (damage > 0) setTimeout(() => playSound("boss_hit"), 200);
    } else {
      setPlayerSprite("hurt");
      setScreenFlash("wrong");
      setTimeout(() => setScreenFlash(null), 350);
      setTimeout(() => setPlayerSprite("idle"), 650);
      // Player hurt animation now handled by Framer Motion in Sub-phase 2.3
      playSound("wrong");
    }
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered || !boss || boss.phase !== "combat") return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const currentQuestion = questions[currentQuestionIndex];
    const options = [
      currentQuestion.optionA,
      currentQuestion.optionB,
      currentQuestion.optionC,
      currentQuestion.optionD,
    ];
    const answerIndex = options.indexOf(answer);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    triggerAttackAnimation(isCorrect, 0);

    if (isCorrect) {
      // Energy gain — streak scaled (per BATTLE_SPEC.md §1)
      const ENERGY_BY_STREAK: Record<number, number> = { 1: 15, 2: 22, 3: 30, 4: 38 };
      const newCurrentStreak = currentStreak + 1;
      const energyGain = newCurrentStreak >= 5 ? 45 : (ENERGY_BY_STREAK[newCurrentStreak] ?? 15);

      setCurrentStreak(newCurrentStreak);
      setWrongStreak(0);
      updatePlayerEnergy(playerEnergyRef.current + energyGain);

      setStats((prev) => ({
        ...prev,
        streak: newCurrentStreak,
        maxStreak: Math.max(prev.maxStreak, newCurrentStreak),
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: prev.correctAnswers + 1,
      }));
    } else {
      // Energy drain (per BATTLE_SPEC.md §1)
      const newWrongStreak = wrongStreak + 1;
      setWrongStreak(newWrongStreak);
      setCurrentStreak(0);
      updatePlayerEnergy(playerEnergyRef.current - 25);

      setStats((prev) => ({
        ...prev,
        streak: 0,
        questionsAnswered: prev.questionsAnswered + 1,
      }));

      // 3rd consecutive wrong: boss fires immediately (per BATTLE_SPEC.md §1)
      if (newWrongStreak >= 3) {
        setWrongStreak(0);
        handleBossAttack();
      }
    }

    setTimeout(() => nextQuestion(), 1500);
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
    setEliminatedOptions([]);
  };

  const submitBossAttempt = async (victory: boolean) => {
    try {
      const apiBossId = resolvedBossId || bossId;
      const response = await authFetch("/api/campaign/boss/attempt", session, {
        method: "POST",
        body: JSON.stringify({
          bossId: apiBossId,
          damageDealt: stats.damageDealt,
          questionsAnswered: stats.questionsAnswered,
          correctAnswers: stats.correctAnswers,
          streak: stats.maxStreak,
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

  const handleBossAttack = () => {
    if (!boss || !battleActiveRef.current) return;
    if (bossAttackingRef.current) return;

    bossAttackingRef.current = true;
    setTimeout(() => { bossAttackingRef.current = false; }, 800);

    // Shield absorbs the attack
    if (shieldActiveRef.current) {
      updateShieldActive(false);
      if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
      setHeroState("hurt");
      return;
    }

    // Damage = 8% of boss maxHp (per BATTLE_SPEC.md §3)
    const damage = Math.floor(boss.maxHp * 0.08);
    setHeroState("hurt");

    setPlayerHp(prev => {
      const next = Math.max(0, prev - damage);
      if (next <= 0) {
        setTimeout(() => handleBattleLoss(), 800);
      }
      return next;
    });
  };

  const handleBattleLoss = () => {
    battleActiveRef.current = false;
    if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
    if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
    setBoss(prev => prev ? { ...prev, phase: "defeat" } : null);
    submitBossAttempt(false);
  };

  const handleBattleWin = () => {
    battleActiveRef.current = false;
    if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
    if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
    setBoss(prev => prev ? { ...prev, phase: "victory", currentHp: 0 } : null);
    playSound("level_up");
    submitBossAttempt(true);
  };

  // Per BATTLE_SPEC.md §2 — damage scales with energy at time of hit
  const calcHitDamage = (energy: number): number => {
    if (energy >= 100) return Math.floor(energy * 2.5);
    if (energy >= 70)  return Math.floor(energy * 2.0);
    if (energy >= 40)  return Math.floor(energy * 1.5);
    return Math.floor(energy * 1.0);
  };

  const handleHit = () => {
    if (playerEnergyRef.current < 1 || !battleActiveRef.current) return;
    if (boss?.phase !== "combat") return;

    const damage = calcHitDamage(playerEnergyRef.current);
    updatePlayerEnergy(0);

    setHeroState("attack");
    setTimeout(() => {
      phaserRef.current?.triggerBossHurt(damage);
      setBossState("hurt"); // 300ms after hero attack starts
    }, 300);

    setStats((prev) => ({ ...prev, damageDealt: prev.damageDealt + damage }));

    setBoss((prev) => {
      if (!prev) return null;
      const newHp = Math.max(0, prev.currentHp - damage);
      if (newHp <= 0) {
        setTimeout(() => handleBattleWin(), 1200);
      }
      return { ...prev, currentHp: newHp };
    });
  };

  const handleBlock = () => {
    if (playerEnergyRef.current < 40) return;
    if (shieldCooldown || shieldActiveRef.current) return;
    if (boss?.phase !== "combat") return;

    updatePlayerEnergy(playerEnergyRef.current - 40);
    updateShieldActive(true);

    // Shield expires after 8s if boss doesn't attack (per BATTLE_SPEC.md §4)
    shieldExpiryTimerRef.current = setTimeout(() => {
      updateShieldActive(false);
      setShieldCooldown(true);
      setTimeout(() => setShieldCooldown(false), 5000); // 5s cooldown
    }, 8000);
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

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#0a0a14" }}
    >
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0px) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
        }
        @keyframes bossRecoil {
          0%   { transform: scaleX(-1) translateX(0)  brightness(1); }
          15%  { transform: scaleX(-1) translateX(30px) brightness(5); }
          35%  { transform: scaleX(-1) translateX(-20px); }
          55%  { transform: scaleX(-1) translateX(14px); }
          75%  { transform: scaleX(-1) translateX(-8px); }
          100% { transform: scaleX(-1) translateX(0); }
        }
        @keyframes bossEnrage {
          0%,100% { filter: drop-shadow(0 0 0px #ef4444); }
          50%      { filter: drop-shadow(0 0 16px #ef4444); }
        }
        .boss-recoil { animation: bossRecoil 0.55s ease-out; }
        .boss-enrage { animation: bossEnrage 1s ease-in-out infinite; }
      `}</style>

      {/* Screen flash overlay */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            key={screenFlash}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: screenFlash === "correct" ? "#22c55e" : "#ef4444" }}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Exit button */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => router.push("/campaign")}
          className="flex items-center gap-1 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
      </div>

      {/* ── BATTLE ARENA (top ~50%) ─────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "50vh" }}>

        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0"
          animate={{ background: [
            `radial-gradient(ellipse at 30% 60%, ${themeColor}18 0%, #0a0a14 55%)`,
            `radial-gradient(ellipse at 70% 40%, ${themeColor}22 0%, #0a0a14 55%)`,
            `radial-gradient(ellipse at 30% 60%, ${themeColor}18 0%, #0a0a14 55%)`,
          ]}}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              background: themeColor,
              opacity: 0.18,
              filter: "blur(1px)",
            }}
            animate={{ y: [p.y + "%", (p.y - 18) + "%", p.y + "%"], opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Stage ground */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${themeColor}15 60%, ${themeColor}30 100%)`,
            borderTop: `1px solid ${themeColor}25`,
          }}
        />

        {/* HP bars */}
        {/* Boss HP bar — top left */}
        <div className="absolute top-4 left-4 z-10" style={{ width: "42%" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-bold text-sm truncate">{boss.name}</span>
            {boss.enraged && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-red-400 text-xs font-bold flex items-center gap-1"
              >
                <Flame className="w-3 h-3" /> ENRAGED
              </motion.span>
            )}
          </div>
          <div className="h-4 bg-black/70 rounded-full overflow-hidden border border-white/15 shadow-inner">
            <motion.div
              className="h-full rounded-full shadow-lg"
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                backgroundColor: hpPercent < 25 ? "#ef4444" : themeColor,
                boxShadow: hpPercent < 25 ? "0 0 12px #ef4444" : `0 0 8px ${themeColor}`,
              }}
            />
          </div>
          <div className="text-xs text-white/35 mt-0.5">{boss.currentHp} / {boss.maxHp} HP</div>
          {/* Boss charge bar — only show during combat */}
          {boss.phase === "combat" && (
            <div className="w-full mt-1.5">
              <div className="text-xs text-orange-400 font-mono mb-0.5 tracking-wide">
                CHARGING ▶
              </div>
              <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-orange-900/40">
                <div
                  className="h-full bg-orange-500 rounded-full transition-none"
                  style={{ width: `${bossCharge}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Player HP bar — top right */}
        <div className="absolute top-4 right-4 z-10" style={{ width: "42%" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-bold text-sm">You</span>
            {stats.streak > 1 && (
              <motion.span
                key={stats.streak}
                initial={{ scale: 1.5, color: "#fb923c" }}
                animate={{ scale: 1, color: "#f97316" }}
                className="text-xs font-black"
              >
                🔥 {stats.streak}x
              </motion.span>
            )}
          </div>
          <div className="h-4 bg-black/70 rounded-full overflow-hidden border border-white/15 shadow-inner">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${playerHp}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                backgroundColor: playerHp > 60 ? "#22c55e" : playerHp > 30 ? "#f59e0b" : "#ef4444",
                boxShadow: playerHp > 60 ? "0 0 8px #4ade80" : playerHp > 30 ? "0 0 8px #f59e0b" : "0 0 8px #ef4444",
              }}
            />
          </div>
          <div className="text-xs text-white/35 mt-0.5">{playerHp} / 100 HP</div>
        </div>

        {/* Player energy bar */}
        {boss.phase === "combat" && (
          <div className="absolute z-10" style={{ top: "4.5rem", right: "1rem", width: "42%" }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-blue-400 text-xs font-mono">ENERGY</span>
              <span className="text-blue-400 text-xs font-mono">{Math.floor(playerEnergy)}</span>
            </div>
            <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-blue-900/40">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${playerEnergy}%`,
                  backgroundColor: playerEnergy >= 100 ? "#a855f7" : "#3b82f6",
                  boxShadow: playerEnergy >= 100 ? "0 0 10px #a855f7" : "none",
                }}
              />
            </div>
          </div>
        )}

        {/* Arena — battle area */}
        <div className="relative w-full" style={{ height: 280 }}>

          {/* Arena background */}
          {bossJsonData?.arenaBackground && (
            <img
              src={bossJsonData.arenaBackground}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              style={{ zIndex: 0 }}
              draggable={false}
            />
          )}

          {/* Characters — Framer Motion */}
          <div className="absolute inset-0 flex items-end justify-between px-8 pb-4" style={{ zIndex: 2 }}>
            <BattleCharacter
              idleSrc={heroImages.idle}
              attackSrc={heroImages.attack}
              hurtSrc={heroImages.hurt}
              state={heroState}
              width={150}
              height={190}
              alt="Hero"
            />
            <BattleCharacter
              idleSrc={bossJsonData?.images?.idle   ?? "/images/characters/boss-acid-baron-idle.png"}
              attackSrc={bossJsonData?.images?.attack ?? "/images/characters/boss-acid-baron-attack.png"}
              hurtSrc={bossJsonData?.images?.hurt    ?? "/images/characters/boss-acid-baron-hurt.png"}
              state={bossState}
              flip
              width={160}
              height={200}
              alt={bossJsonData?.name ?? "Boss"}
            />
          </div>

          {/* Phaser canvas — particles and damage numbers only */}
          <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none" }}>
            <PhaserBattleScene
              width={600}
              height={280}
              onReady={(handle) => { (phaserRef as any).current = handle; }}
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
                  const isEliminated = eliminatedOptions.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered || isEliminated}
                      className={`w-full text-left text-sm py-2.5 px-3 rounded-lg border transition-all font-medium ${
                        isEliminated
                          ? "opacity-20 bg-white/5 border-white/5 text-white/20 line-through cursor-not-allowed"
                          : isAnswered
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

              {/* Primary combat buttons — above power-ups */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleHit}
                  disabled={playerEnergy < 1 || boss.phase !== "combat"}
                  className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all border
                    ${playerEnergy >= 70
                      ? "bg-purple-600/80 border-purple-500 text-white shadow-lg shadow-purple-900/50"
                      : playerEnergy >= 40
                      ? "bg-blue-700/80 border-blue-500 text-white"
                      : playerEnergy >= 1
                      ? "bg-blue-900/60 border-blue-800 text-blue-300"
                      : "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
                    }`}
                >
                  HIT
                  {playerEnergy >= 1
                    ? ` · ${calcHitDamage(Math.floor(playerEnergy))} dmg`
                    : " · (need energy)"}
                </button>
                <button
                  onClick={handleBlock}
                  disabled={playerEnergy < 40 || shieldCooldown || shieldActive || boss.phase !== "combat"}
                  className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all border
                    ${shieldActive
                      ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse"
                      : shieldCooldown
                      ? "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
                      : playerEnergy >= 40
                      ? "bg-cyan-800/80 border-cyan-600 text-cyan-300 hover:bg-cyan-700/80"
                      : "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
                    }`}
                >
                  {shieldActive ? "SHIELDED" : shieldCooldown ? "COOLDOWN" : "BLOCK · 40"}
                </button>
              </div>

              {/* Power-up bar */}
              {!isAnswered && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={useHint}
                    disabled={powerUps.hint <= 0 || eliminatedOptions.length > 0}
                    title="Eliminate 2 wrong answers"
                    className={`flex-1 flex flex-col items-center py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      powerUps.hint > 0 && eliminatedOptions.length === 0
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 active:scale-95"
                        : "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-base leading-none">💡</span>
                    <span className="mt-0.5">Hint {powerUps.hint > 0 && `(${powerUps.hint})`}</span>
                  </button>
                </div>
              )}

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

      {/* Character selection — shown before first battle if no choice saved */}
      {characterChoice === null && (
        <CharacterSelectModal
          session={session}
          onSelect={(choice) => setCharacterChoice(choice)}
        />
      )}
    </div>
  );
}
