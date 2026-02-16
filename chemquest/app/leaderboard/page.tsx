"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Medal,
  Crown,
  ArrowLeft,
  Users,
  Globe,
  Target,
  Flame,
  Sparkles,
  Zap,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getRankByXP, formatXP, Rank } from "@/lib/rank-system";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  campaignXp: number;
  totalCoins: number;
  gamesPlayed: number;
  bestStreak: number;
  prestigeLevel: number;
}

interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  totalScore: number;
}

type TabType = "global" | "friends";

const PODIUM_COLORS = {
  1: {
    bg: "from-yellow-500/20 to-amber-600/20",
    border: "border-yellow-500/50",
    icon: "text-yellow-400",
    crown: "text-yellow-400",
    height: "h-48",
    zIndex: "z-30",
  },
  2: {
    bg: "from-slate-300/20 to-slate-400/20",
    border: "border-slate-400/50",
    icon: "text-slate-300",
    crown: "text-slate-300",
    height: "h-40",
    zIndex: "z-20",
  },
  3: {
    bg: "from-orange-600/20 to-amber-700/20",
    border: "border-orange-600/50",
    icon: "text-orange-400",
    crown: "text-orange-400",
    height: "h-32",
    zIndex: "z-10",
  },
};

function RankBadge({ xp, size = "md" }: { xp: number; size?: "sm" | "md" | "lg" }) {
  const rank = getRankByXP(xp);
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-lg`}
      style={{
        background: rank.color,
        boxShadow: `0 0 15px ${rank.color}60`,
      }}
      title={rank.name}
    >
      {rank.symbol}
    </div>
  );
}

function PodiumCard({
  user,
  position,
}: {
  user: LeaderboardUser;
  position: 1 | 2 | 3;
}) {
  const colors = PODIUM_COLORS[position];
  const isFirst = position === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: position * 0.1 }}
      className={`relative ${colors.zIndex}`}
    >
      <div className="flex flex-col items-center">
        {/* Crown for #1 */}
        {isFirst && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="mb-2"
          >
            <Crown className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="relative mb-3"
        >
          <Avatar
            className={`${
              isFirst ? "w-24 h-24" : "w-20 h-20"
            } border-4 ${colors.border} shadow-2xl`}
          >
            <AvatarFallback
              className={`bg-gradient-to-br ${colors.bg} text-white text-2xl font-bold`}
            >
              {user.displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2">
            <RankBadge xp={user.campaignXp} size={isFirst ? "lg" : "md"} />
          </div>
        </motion.div>

        {/* User Info */}
        <div className="text-center mb-3">
          <h3 className="text-white font-bold text-lg truncate max-w-[120px]">
            {user.displayName}
          </h3>
          <p className="text-white/50 text-sm">@{user.username}</p>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1 text-yellow-400">
          <Zap className="w-4 h-4" />
          <span className="font-bold">{formatXP(user.campaignXp)}</span>
        </div>

        {/* Position Badge */}
        <div
          className={`mt-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl ${colors.icon} bg-black/30 border ${colors.border}`}
        >
          {position}
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardRow({
  user,
  isCurrentUser,
}: {
  user: LeaderboardUser;
  isCurrentUser: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
        isCurrentUser
          ? "bg-purple-500/20 border border-purple-500/30"
          : "bg-white/5 hover:bg-white/10 border border-transparent"
      }`}
    >
      {/* Rank */}
      <div className="w-12 text-center">
        {user.rank <= 3 ? (
          <Medal
            className={`w-6 h-6 mx-auto ${
              user.rank === 1
                ? "text-yellow-400"
                : user.rank === 2
                ? "text-slate-300"
                : "text-orange-400"
            }`}
          />
        ) : (
          <span className="text-white/50 font-bold">#{user.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="w-12 h-12 border-2 border-white/10">
        <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-white font-bold">
          {user.displayName?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium truncate">
            {user.displayName}
          </span>
          {isCurrentUser && (
            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
              YOU
            </Badge>
          )}
        </div>
        <p className="text-white/40 text-sm">@{user.username}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1 text-white/50">
          <Target className="w-4 h-4" />
          <span>{user.gamesPlayed}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50">
          <Flame className="w-4 h-4" />
          <span>{user.bestStreak}</span>
        </div>
      </div>

      {/* Rank Badge */}
      <RankBadge xp={user.campaignXp} size="sm" />

      {/* XP */}
      <div className="text-right min-w-[80px]">
        <div className="text-white font-bold">{formatXP(user.campaignXp)}</div>
        <div className="text-white/40 text-xs">XP</div>
      </div>
    </motion.div>
  );
}

function MyRankBar({
  user,
  rank,
}: {
  user: CurrentUser;
  rank: number;
}) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1, type: "spring" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-purple-500/30"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <span className="text-purple-400 font-bold">#{rank}</span>
            </div>
            <div>
              <p className="text-white font-medium">{user.displayName}</p>
              <p className="text-white/50 text-sm">Your Rank</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white font-bold">{formatXP(user.totalScore)}</p>
              <p className="text-white/50 text-xs">XP</p>
            </div>
            <RankBadge xp={user.totalScore} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        // Fetch current user
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/auth/login");
          return;
        }
        const userData = await userRes.json();
        setCurrentUser(userData.user);

        // Fetch leaderboard
        const lbRes = await fetch("/api/leaderboard?type=campaign&limit=50");
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboard(lbData.users || []);

          // Find current user's rank
          const userRank = lbData.users?.findIndex(
            (u: LeaderboardUser) => u.id === userData.user.id
          );
          if (userRank !== -1) {
            setCurrentUserRank(userRank + 1);
          } else {
            // User not in top 50, need to fetch their actual rank
            // For now, estimate based on XP
            const usersAbove = lbData.users?.filter(
              (u: LeaderboardUser) => u.campaignXp > userData.user.totalScore
            ).length;
            setCurrentUserRank(usersAbove + 1);
          }
        }
      } catch (error) {
        toast.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [router]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const showMyRankBar =
    currentUserRank && currentUserRank > 10 && currentUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="w-12 h-12 text-yellow-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pb-24">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Link href="/hub">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Leaderboard
            </h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
          >
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger
                value="global"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
              >
                <Globe className="w-4 h-4 mr-2" /> Global
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                disabled
              >
                <Users className="w-4 h-4 mr-2" /> Friends
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 text-[10px]">
                  Soon
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {leaderboard.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No Players Yet
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Be the first to climb the ranks! Start playing quizzes to earn XP
              and appear on the leaderboard.
            </p>
            <Link href="/hub">
              <Button className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Start Playing
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="mb-10">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-white/60 text-sm uppercase tracking-wider mb-6"
                >
                  Top Chemists
                </motion.h2>

                <div className="flex justify-center items-end gap-4 md:gap-8">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div className="order-1">
                      <PodiumCard user={top3[1]} position={2} />
                    </div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <div className="order-2">
                      <PodiumCard user={top3[0]} position={1} />
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div className="order-3">
                      <PodiumCard user={top3[2]} position={3} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Separator */}
            {rest.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <Separator className="flex-1 bg-white/10" />
                <span className="text-white/40 text-sm">
                  Rankings ({rest.length + 3} players)
                </span>
                <Separator className="flex-1 bg-white/10" />
              </div>
            )}

            {/* Rankings List */}
            <div className="space-y-2">
              <AnimatePresence>
                {rest.map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === currentUser?.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* My Rank Sticky Bar */}
      {showMyRankBar && currentUser && (
        <MyRankBar user={currentUser} rank={currentUserRank} />
      )}
    </div>
  );
}
