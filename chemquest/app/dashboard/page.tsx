'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, ArrowLeft, Loader2, Beaker, Atom, Leaf,
  Sparkles, Play, User, Swords
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Leaderboard } from './_components/leaderboard';

type Subject = 'all' | 'Chemistry' | 'Physics' | 'Biology';

interface ApiUser {
  id: string;
  username: string;
  displayName: string;
  prestigeLevel: number;
  lifetimeEarnings: number;
  totalScore: number;
  bestStreak: number;
  bodyType: string;
  hairColor: string;
  weaponType: string;
}

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  all: <Trophy className="w-4 h-4" />,
  Chemistry: <Beaker className="w-4 h-4" />,
  Physics: <Atom className="w-4 h-4" />,
  Biology: <Leaf className="w-4 h-4" />,
};

export default function DashboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<{ id: string; name: string; score: number; avatarConfig: { body: string; hair: string; weapon: string } }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard?type=global&limit=10');
        if (response.ok) {
          const data = await response.json();
          // Transform users to match LeaderboardEntry interface
          const transformed = data.users.map((user: ApiUser) => ({
            id: user.id,
            name: user.displayName,
            score: Number(user.lifetimeEarnings),
            avatarConfig: {
              body: user.bodyType || 'athletic',
              hair: user.hairColor || 'blue',
              weapon: user.weaponType || 'sword',
            },
          }));
          setEntries(transformed);
        } else {
          toast.error('Failed to load leaderboard');
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleSubjectFilter = (subject: Subject) => {
    setSelectedSubject(subject);
    // In a real implementation, you'd fetch subject-specific leaderboard
    // For now, we just show the same data
    toast.info(`${subject === 'all' ? 'Global' : subject} leaderboard coming soon!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white italic flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                DASHBOARD
              </h1>
              <p className="text-indigo-300">Your gaming hub</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/training/customize">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <Swords className="w-4 h-4 mr-2" />
                Customize Hero
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Link href="/training">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Play className="w-4 h-4 mr-2" />
                Play Now
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Subject Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 flex-wrap"
        >
          {(['all', 'Chemistry', 'Physics', 'Biology'] as Subject[]).map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectFilter(subject)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                selectedSubject === subject
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {SUBJECT_ICONS[subject]}
              {subject === 'all' ? 'Global' : subject}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Leaderboard entries={entries} />
        </motion.div>

        {/* Quick Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Link href="/leaderboard">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-all cursor-pointer group">
              <Trophy className="w-8 h-8 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Full Leaderboard</h3>
              <p className="text-white/50 text-sm">See top 50 players</p>
            </div>
          </Link>
          
          <Link href="/profile">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-all cursor-pointer group">
              <User className="w-8 h-8 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">My Progress</h3>
              <p className="text-white/50 text-sm">View your stats</p>
            </div>
          </Link>
          
          <Link href="/training">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-all cursor-pointer group">
              <Play className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Start Playing</h3>
              <p className="text-white/50 text-sm">Jump into a game</p>
            </div>
          </Link>

          <Link href="/training/customize">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-all cursor-pointer group">
              <Swords className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Customize Hero</h3>
              <p className="text-white/50 text-sm">Change your look</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
