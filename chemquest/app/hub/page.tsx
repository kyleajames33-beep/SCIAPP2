'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Beaker, Swords, GraduationCap, ShoppingBag, User,
  Trophy, Map, Zap, Shield, Flame, LogOut, Loader2,
  Sparkles, Crown, Star,
} from 'lucide-react';
import { toast } from 'sonner';

// Rank progression based on campaignXp
const RANKS = [
  { name: 'Hydrogen', minXp: 0, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  { name: 'Helium', minXp: 100, color: 'text-blue-300', bg: 'bg-blue-500/20' },
  { name: 'Lithium', minXp: 300, color: 'text-red-300', bg: 'bg-red-500/20' },
  { name: 'Carbon', minXp: 600, color: 'text-gray-300', bg: 'bg-gray-600/20' },
  { name: 'Nitrogen', minXp: 1000, color: 'text-blue-400', bg: 'bg-blue-600/20' },
  { name: 'Oxygen', minXp: 1500, color: 'text-red-400', bg: 'bg-red-600/20' },
  { name: 'Sodium', minXp: 2500, color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
  { name: 'Iron', minXp: 4000, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { name: 'Gold', minXp: 6000, color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
  { name: 'Platinum', minXp: 10000, color: 'text-purple-300', bg: 'bg-purple-500/20' },
];

function getRank(xp: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r;
  }
  return rank;
}

interface HubUser {
  id: string;
  username: string;
  displayName: string;
  totalCoins: number;
  totalScore: number;
  gamesPlayed: number;
  rank: string;
  campaignXp: number;
  subscriptionTier: string;
}

const NAV_CARDS = [
  {
    id: 'campaign',
    title: 'Campaign',
    subtitle: 'Story Mode',
    description: 'Progress through HSC Chemistry modules, conquer chambers, and defeat bosses.',
    href: '/campaign',
    icon: <Map className="w-10 h-10" />,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-400/40',
    badge: 'Story',
    disabled: false,
  },
  {
    id: 'battle',
    title: 'Battle',
    subtitle: 'Multiplayer',
    description: 'Challenge friends in real-time quiz battles and boss raids.',
    href: '/battle',
    icon: <Swords className="w-10 h-10" />,
    gradient: 'from-red-500 to-pink-600',
    borderColor: 'border-red-400/40',
    badge: 'PvP',
    disabled: false,
  },
  {
    id: 'training',
    title: 'Training',
    subtitle: 'Practice Mode',
    description: 'Sharpen your skills with Classic, Rush, Survival, and Tower Climb modes.',
    href: '/training',
    icon: <GraduationCap className="w-10 h-10" />,
    gradient: 'from-blue-500 to-cyan-600',
    borderColor: 'border-blue-400/40',
    badge: 'Solo',
    disabled: false,
  },
  {
    id: 'shop',
    title: 'Lab Store',
    subtitle: 'Upgrades & Cosmetics',
    description: 'Spend coins on power-ups, character customization, and boosts.',
    href: '/shop',
    icon: <ShoppingBag className="w-10 h-10" />,
    gradient: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-400/40',
    badge: 'Store',
    disabled: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HubPage() {
  const router = useRouter();
  const [user, setUser] = useState<HubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const rank = getRank(user.campaignXp || 0);
  const nextRank = RANKS.find((r) => r.minXp > (user.campaignXp || 0));
  const xpProgress = nextRank
    ? ((user.campaignXp || 0) - rank.minXp) / (nextRank.minXp - rank.minXp)
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">ChemQuest</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
              <Flame className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-semibold text-sm">
                {(user.totalCoins || 0).toLocaleString()}
              </span>
            </div>

            {/* Rank Badge */}
            <div className={`flex items-center gap-1.5 ${rank.bg} border border-white/10 rounded-full px-3 py-1`}>
              <Star className="w-4 h-4" />
              <span className={`font-semibold text-sm ${rank.color}`}>{rank.name}</span>
            </div>

            {/* Profile */}
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                <User className="w-4 h-4 mr-1" />
                {user.displayName}
              </Button>
            </Link>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/50 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-2"
          >
            Welcome back, <span className="text-cyan-400">{user.displayName}</span>
          </motion.h1>
          <p className="text-white/60 text-lg">Choose your path</p>

          {/* XP Progress */}
          {nextRank && (
            <div className="max-w-md mx-auto mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>{rank.name}</span>
                <span>{nextRank.name} — {nextRank.minXp - (user.campaignXp || 0)} XP to go</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {NAV_CARDS.map((card) => (
            <motion.div key={card.id} variants={cardVariants}>
              <Link href={card.disabled ? '#' : card.href} className={card.disabled ? 'pointer-events-none' : ''}>
                <Card
                  className={`bg-white/5 backdrop-blur border ${card.borderColor} hover:bg-white/10 transition-all duration-300 cursor-pointer group overflow-hidden relative ${card.disabled ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <div className="text-white">{card.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-white">{card.title}</h3>
                          <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
                            {card.badge}
                          </Badge>
                        </div>
                        <p className="text-white/50 text-xs mb-2">{card.subtitle}</p>
                        <p className="text-white/70 text-sm">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Score', value: (user.totalScore || 0).toLocaleString(), icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
              { label: 'Games Played', value: user.gamesPlayed || 0, icon: <Zap className="w-5 h-5 text-blue-400" /> },
              { label: 'Campaign XP', value: (user.campaignXp || 0).toLocaleString(), icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
              { label: 'Subscription', value: (user.subscriptionTier || 'free').charAt(0).toUpperCase() + (user.subscriptionTier || 'free').slice(1), icon: <Crown className="w-5 h-5 text-cyan-400" /> },
            ].map((stat, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Link */}
        <div className="text-center mt-8">
          <Link href="/leaderboard">
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              View Global Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
