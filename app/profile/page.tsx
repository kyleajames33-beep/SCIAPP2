"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Trophy,
  Coins,
  Target,
  Flame,
  ArrowLeft,
  LogOut,
  Crown,
  Skull,
  Zap,
  Gamepad2,
  TrendingUp,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getRankInfo, formatXP, RankInfo } from "@/lib/rank-system";

// Boss data from bosses.json
const BOSSES = [
  { id: "acid-baron", name: "Acid Baron", element: "Acid-Base" },
  { id: "redox-reaper", name: "Redox Reaper", element: "Redox" },
  { id: "organic-overlord", name: "Organic Overlord", element: "Organic" },
  { id: "thermo-titan", name: "Thermo Titan", element: "Thermodynamics" },
  { id: "equilibrium-emperor", name: "Equilibrium Emperor", element: "Equilibrium" },
  { id: "kinetic-king", name: "Kinetic King", element: "Kinetics" },
  { id: "atomic-archmage", name: "Atomic Archmage", element: "Atomic Structure" },
  { id: "solution-sovereign", name: "Solution Sovereign", element: "Solutions" },
];

interface UserData {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  totalCoins: number;
  totalScore: number;
  gamesPlayed: number;
  bestStreak: number;
  subscriptionTier: string;
}

interface BossAttempt {
  bossId: string;
  defeated: boolean;
  damageDealt: number;
  createdAt: string;
}

interface GameSession {
  id: string;
  gameMode: string;
  score: number;
  accuracy: number;
  maxStreak: number;
  totalQuestions: number;
  completedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
  const [bossAttempts, setBossAttempts] = useState<BossAttempt[]>([]);
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        // Fetch user data
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/auth/login");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // Calculate rank info
        if (userData.user?.totalScore !== undefined) {
          setRankInfo(getRankInfo(userData.user.totalScore));
        }

        // Fetch campaign progress (includes boss attempts)
        const progressRes = await fetch("/api/campaign/progress");
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setBossAttempts(progressData.bossAttempts || []);
        }

        // Fetch recent games from profile API
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setRecentGames(profileData.recentGames?.slice(0, 5) || []);
        }
      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  // Calculate stats
  const defeatedBosses = bossAttempts.filter((b) => b.defeated).map((b) => b.bossId);
  const uniqueDefeatedBosses = [...new Set(defeatedBosses)];
  const accuracy =
    recentGames.length > 0
      ? Math.round(
          recentGames.reduce((acc, g) => acc + g.accuracy, 0) / recentGames.length
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-10 h-10 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hub">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
              </Button>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> Profile
          </h1>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <CardContent className="p-8 relative">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar with Rank Badge */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <Avatar className="w-28 h-28 border-4 border-white/10">
                      <AvatarFallback className={`text-3xl font-bold bg-gradient-to-br ${rankInfo?.currentRank.gradient} text-white`}>
                        {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Rank Badge Overlay */}
                    {rankInfo && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                        style={{ 
                          background: rankInfo.currentRank.color,
                          boxShadow: `0 0 20px ${rankInfo.currentRank.color}80`
                        }}
                      >
                        {rankInfo.currentRank.badge}
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* User Info */}
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{user.displayName}</h2>
                    {user.subscriptionTier === "pro" && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                        <Crown className="w-3 h-3 mr-1" /> PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/50 mb-1">@{user.username}</p>
                  <p className="text-white/30 text-sm">{user.email}</p>
                  
                  {/* Rank Display */}
                  {rankInfo && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          {rankInfo.currentRank.name}
                        </span>
                        <span className="text-white/30">Rank</span>
                      </div>
                      
                      {/* XP Progress Bar */}
                      <div className="max-w-md mx-auto md:mx-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/50">
                            {formatXP(rankInfo.currentXP - rankInfo.currentRank.minXP)} /{" "}
                            {formatXP((rankInfo.nextRank?.minXP || rankInfo.currentRank.minXP) - rankInfo.currentRank.minXP)} XP
                          </span>
                          <span className="text-purple-400">
                            {rankInfo.isMaxRank ? "MAX RANK" : `${Math.round(rankInfo.xpProgress)}%`}
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rankInfo.xpProgress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full bg-gradient-to-r ${rankInfo.currentRank.gradient}`}
                          />
                        </div>
                        {!rankInfo.isMaxRank && rankInfo.nextRank && (
                          <p className="text-xs text-white/40 mt-1">
                            {formatXP(rankInfo.xpToNextRank)} XP to {rankInfo.nextRank.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Coins className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{user.totalCoins.toLocaleString()}</div>
                      <div className="text-xs text-white/50">Coins</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatXP(user.totalScore)}</div>
                      <div className="text-xs text-white/50">Total XP</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{user.gamesPlayed}</div>
                <div className="text-sm text-white/50">Total Quizzes</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{accuracy}%</div>
                <div className="text-sm text-white/50">Accuracy Rate</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{user.bestStreak}</div>
                <div className="text-sm text-white/50">Best Streak</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Boss Trophies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-400" /> Boss Trophies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {BOSSES.map((boss, index) => {
                    const isDefeated = uniqueDefeatedBosses.includes(boss.id);
                    return (
                      <motion.div
                        key={boss.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                          isDefeated
                            ? "bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30"
                            : "bg-white/5 border border-white/10 grayscale opacity-50"
                        }`}
                      >
                        {isDefeated ? (
                          <>
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Skull className="w-8 h-8 text-red-400" />
                            </motion.div>
                            <span className="text-[10px] text-white/70 text-center mt-1 leading-tight">
                              {boss.name.split(" ").slice(1).join(" ")}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-6 h-6 text-white/30" />
                            <span className="text-[10px] text-white/30 text-center mt-1">Locked</span>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-white/50">
                    Defeated {uniqueDefeatedBosses.length} / {BOSSES.length} Bosses
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentGames.length === 0 ? (
                  <div className="text-center py-8 text-white/30">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No games played yet</p>
                    <p className="text-sm mt-1">Start playing to see your history!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentGames.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            game.accuracy >= 80
                              ? "bg-green-500/20"
                              : game.accuracy >= 50
                              ? "bg-yellow-500/20"
                              : "bg-red-500/20"
                          }`}>
                            <Zap className={`w-5 h-5 ${
                              game.accuracy >= 80
                                ? "text-green-400"
                                : game.accuracy >= 50
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`} />
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize">{game.gameMode} Mode</p>
                            <p className="text-xs text-white/50">
                              {game.totalQuestions} questions • {game.accuracy}% accuracy
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{game.score.toLocaleString()}</p>
                          <p className="text-xs text-white/30">
                            {new Date(game.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Rank Showcase */}
        {rankInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${rankInfo.currentRank.color}, ${rankInfo.currentRank.color}80)`,
                        boxShadow: `0 0 40px ${rankInfo.currentRank.color}60`,
                      }}
                    >
                      {rankInfo.currentRank.symbol}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{rankInfo.currentRank.name} Rank</h3>
                      <p className="text-white/50">Element: {rankInfo.currentRank.element}</p>
                    </div>
                  </div>

                  {!rankInfo.isMaxRank && rankInfo.nextRank && (
                    <div className="flex items-center gap-4">
                      <ChevronRight className="w-6 h-6 text-white/30 hidden md:block" />
                      <div className="text-center md:text-left opacity-50">
                        <p className="text-sm text-white/50">Next Rank</p>
                        <p className="text-xl font-bold text-white">{rankInfo.nextRank.name}</p>
                        <p className="text-xs text-white/30">
                          {formatXP(rankInfo.xpToNextRank)} XP needed
                        </p>
                      </div>
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                        style={{ background: rankInfo.nextRank.color }}
                      >
                        {rankInfo.nextRank.symbol}
                      </div>
                    </div>
                  )}

                  {rankInfo.isMaxRank && (
                    <div className="flex items-center gap-2">
                      <Crown className="w-8 h-8 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">Maximum Rank Achieved!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
