'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Lock, CheckCircle, Skull, Flame, Crown,
  Atom, FlaskConical, Zap, Loader2, ChevronRight, ShoppingBag, Coins,
} from 'lucide-react';
import { getRank, getRankProgress, getNextRank } from '@/lib/ranks';
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';

// Module → QuestionSet mapping
const WORLD_TO_SET_ID: Record<string, string> = {
  'module-1': 'qs-m1',
  'module-2': 'qs-m2',
  'module-3': 'qs-m3',
};

// Chamber → Boss mapping - each chamber is now a boss battle!
const CHAMBER_TO_BOSS: Record<string, string> = {
  'm1-c1': 'atomic-structure-boss',     // Atomic Structure → The Atom Guardian
  'm1-c2': 'periodic-table-boss',      // Periodic Table → The Element Master  
  'm1-c3': 'chemical-bonding-boss',    // Chemical Bonding → The Bond Breaker
  'm1-c4': 'imf-boss',                 // IMF → The Force Controller
  'm2-c1': 'mole-concept-boss',        // The Mole → The Mole Whisperer
  'm2-c2': 'stoichiometry-boss',       // Stoichiometry → The Equation Master
  'm2-c3': 'concentration-boss',       // Concentration → The Solution Sage
  'm2-c4': 'gas-laws-boss',            // Gas Laws → The Pressure King
  'm3-c1': 'reaction-types-boss',      // Reaction Types → The Reaction Wizard
  'm3-c2': 'reaction-rates-boss',      // Reaction Rates → The Speed Demon
  'm3-c3': 'energy-changes-boss',      // Energy Changes → The Thermal Titan
};

// Per-module theme (boss themeColor + a contrasting icon)
const MODULE_THEME: Record<string, { color: string; dimColor: string; icon: React.ReactNode; bg: string }> = {
  'module-1': {
    color: '#10b981',
    dimColor: '#10b98133',
    bg: 'linear-gradient(135deg, #10b98118 0%, #0d1117 60%)',
    icon: <Atom className="w-6 h-6" />,
  },
  'module-2': {
    color: '#3b82f6',
    dimColor: '#3b82f633',
    bg: 'linear-gradient(135deg, #3b82f618 0%, #0d1117 60%)',
    icon: <FlaskConical className="w-6 h-6" />,
  },
  'module-3': {
    color: '#ef4444',
    dimColor: '#ef444433',
    bg: 'linear-gradient(135deg, #ef444418 0%, #0d1117 60%)',
    icon: <Zap className="w-6 h-6" />,
  },
};

const WORLDS = [
  {
    id: 'module-1',
    name: 'Module 1',
    subtitle: 'Properties & Structure of Matter',
    description: 'Atomic structure, periodic table, bonding, intermolecular forces.',
    chambers: [
      { id: 'm1-c1', name: 'Atomic Structure', free: true },
      { id: 'm1-c2', name: 'Periodic Table', free: true },
      { id: 'm1-c3', name: 'Chemical Bonding', free: true },
      { id: 'm1-c4', name: 'IMF', free: true },
    ],
    boss: { id: 'acid-baron', name: 'Acid Baron' },
    free: true,
  },
  {
    id: 'module-2',
    name: 'Module 2',
    subtitle: 'Introduction to Quantitative Chemistry',
    description: 'Moles, stoichiometry, concentrations, and gas laws.',
    chambers: [
      { id: 'm2-c1', name: 'The Mole', free: true },
      { id: 'm2-c2', name: 'Stoichiometry', free: true },
      { id: 'm2-c3', name: 'Concentration', free: true },
      { id: 'm2-c4', name: 'Gas Laws', free: true },
    ],
    boss: { id: 'mole-master', name: 'Mole Master' },
    free: true,
  },
  {
    id: 'module-3',
    name: 'Module 3',
    subtitle: 'Reactive Chemistry',
    description: 'Types of reactions, rates, and energy changes.',
    chambers: [
      { id: 'm3-c1', name: 'Reaction Types', free: true },
      { id: 'm3-c2', name: 'Reaction Rates', free: true },
      { id: 'm3-c3', name: 'Energy Changes', free: true },
    ],
    boss: { id: 'reaction-king', name: 'Reaction King' },
    free: true,
  },
];

interface ProgressEntry {
  chamberId: string;
  completed: boolean;
  bestScore: number;
  xpEarned: number;
}

export default function CampaignPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [userTier, setUserTier] = useState('free');
  const [coins, setCoins] = useState<number | null>(null);
  const [campaignXp, setCampaignXp] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return; // wait for auth state to be determined
    
    async function load() {
      try {
        if (session?.user) {
          // User is logged in — fetch their data with auth token
          const meRes = await authFetch('/api/auth/me', session);
          const meData = await meRes.json();
          setUserTier(meData.user?.subscriptionTier || 'free');
          if (meData.user?.totalCoins != null) setCoins(meData.user.totalCoins);
          if (meData.user?.campaignXp != null) setCampaignXp(meData.user.campaignXp);
        } else {
          // Guest — use defaults
          setUserTier('free');
          setCoins(null);
          setCampaignXp(0);
        }

        const progRes = await authFetch('/api/campaign/progress', session);
        if (progRes.ok) {
          const progData = await progRes.json();
          setProgress(progData.progress || []);
        }
        
        // Show welcome toast if redirected from login
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const fromLogin = urlParams.get('from');
          if (fromLogin === 'login' && session?.user) {
            const name = session.user.user_metadata?.username ?? 'there';
            toast.success(`Welcome back, ${name}!`);
            router.replace('/campaign'); // remove the query param
          }
        }
      } catch {
        toast.error('Failed to load campaign data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, session]);

  const getChamberProgress = (chamberId: string) =>
    progress.find((p) => p.chamberId === chamberId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
        <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0d1117',
        backgroundImage: `radial-gradient(circle at 20% 50%, #10b98108 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, #3b82f608 0%, transparent 50%),
                          radial-gradient(circle at 50% 80%, #ef444408 0%, transparent 50%)`,
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5" style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">ChemQuest</h1>
              <p className="text-white/40 text-xs">Campaign · HSC Chemistry</p>
            </div>
            <div className="flex items-center gap-3">
              {coins !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  {coins.toLocaleString()}
                </div>
              )}
              <Link href="/shop">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm">
                  <ShoppingBag className="w-3.5 h-3.5" /> Shop
                </div>
              </Link>
              {userTier !== 'free' && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                  <Crown className="w-3 h-3 mr-1" /> Pro
                </Badge>
              )}
              
              {/* Auth state */}
              {session?.user ? (
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs hidden sm:block">
                    {session.user.user_metadata?.username ?? session.user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      router.push('/auth/login');
                    }}
                    className="text-white/30 hover:text-white text-xs transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* XP bar + rank */}
          {(() => {
            const rank = getRank(campaignXp);
            const nextRank = getNextRank(campaignXp);
            const progress = getRankProgress(campaignXp);
            return (
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: rank.color + '33', color: rank.color, border: `1px solid ${rank.color}50` }}
                >
                  {rank.symbol}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/60 text-xs font-medium">{rank.name}</span>
                    <span className="text-white/30 text-xs">
                      {nextRank ? `${campaignXp} / ${nextRank.minXp} XP → ${nextRank.name}` : `${campaignXp} XP · Max Rank`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: rank.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* World list */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {WORLDS.map((world, wi) => {
          const isLocked = !world.free && userTier === 'free';
          const theme = MODULE_THEME[world.id] ?? MODULE_THEME['module-1'];
          const setId = WORLD_TO_SET_ID[world.id];
          const bossHref = `/campaign/boss/${world.boss.id}${setId ? `?questionSetId=${setId}` : ''}`;

          const completedCount = world.chambers.filter(
            (c) => getChamberProgress(c.id)?.completed
          ).length;
          const allDone = completedCount === world.chambers.length;

          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.12 }}
            >
              <div
                className={`rounded-2xl border overflow-hidden ${isLocked ? 'opacity-50' : ''}`}
                style={{
                  background: theme.bg,
                  borderColor: `${theme.color}30`,
                }}
              >
                {/* Module header */}
                <div
                  className="px-5 py-4 flex items-center justify-between border-b"
                  style={{ borderColor: `${theme.color}20` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: theme.dimColor, color: theme.color }}
                    >
                      {isLocked ? <Lock className="w-5 h-5" /> : theme.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{world.name}</span>
                        {world.free ? (
                          <Badge className="text-xs py-0 px-1.5" style={{ background: `${theme.color}25`, color: theme.color, border: `1px solid ${theme.color}40` }}>
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/15 text-yellow-300 border-yellow-500/25 text-xs py-0 px-1.5">
                            <Crown className="w-2.5 h-2.5 mr-1" /> Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-0.5">{world.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/30 text-xs">{completedCount}/{world.chambers.length}</div>
                    <div className="text-white/20 text-xs">chambers</div>
                  </div>
                </div>

                {/* Chamber path */}
                <div className="px-5 py-5">
                  <div className="flex items-center gap-0 overflow-x-auto pb-1">
                    {world.chambers.map((chamber, ci) => {
                      const prog = getChamberProgress(chamber.id);
                      const completed = prog?.completed ?? false;
                      const chamberLocked = isLocked;

                      const node = (
                        <div key={chamber.id} className="flex items-center flex-shrink-0">
                          {/* Node */}
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                                completed
                                  ? 'shadow-lg'
                                  : chamberLocked
                                  ? 'opacity-40'
                                  : 'hover:scale-105'
                              }`}
                              style={{
                                background: completed
                                  ? theme.color
                                  : chamberLocked
                                  ? '#1a1a2e'
                                  : `${theme.color}15`,
                                borderColor: completed
                                  ? theme.color
                                  : chamberLocked
                                  ? '#ffffff20'
                                  : `${theme.color}50`,
                                boxShadow: completed ? `0 0 16px ${theme.color}60` : undefined,
                              }}
                            >
                              {completed ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : chamberLocked ? (
                                <Lock className="w-4 h-4 text-white/30" />
                              ) : (
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: theme.color }}
                                >
                                  {ci + 1}
                                </span>
                              )}
                            </div>
                            <span
                              className="text-xs text-center leading-tight max-w-[72px] font-medium"
                              style={{ color: completed ? '#ffffff90' : '#ffffff40' }}
                            >
                              {chamber.name}
                            </span>
                          </div>

                          {/* Connecting line to next node */}
                          {ci < world.chambers.length - 1 && (
                            <div
                              className="w-8 h-0.5 mx-1 flex-shrink-0 rounded-full"
                              style={{
                                background: completed
                                  ? `linear-gradient(90deg, ${theme.color}, ${theme.color}60)`
                                  : '#ffffff15',
                              }}
                            />
                          )}
                        </div>
                      );

                      // Link to chamber boss battle
                      const chamberBossId = CHAMBER_TO_BOSS[chamber.id];
                      if (!chamberBossId) {
                        console.error(`[Campaign] No boss mapping for chamber: ${chamber.id}`);
                      }
                      return chamberLocked || !chamberBossId ? (
                        <div key={chamber.id}>{node}</div>
                      ) : (
                        <Link key={chamber.id} href={`/campaign/boss/${chamberBossId}`} className="flex items-center">
                          {node}
                        </Link>
                      );
                    })}

                    {/* Arrow to boss */}
                    <div
                      className="w-8 h-0.5 mx-1 flex-shrink-0 rounded-full"
                      style={{ background: allDone && !isLocked ? `${theme.color}80` : '#ffffff10' }}
                    />

                    {/* Boss node */}
                    {isLocked || !allDone ? (
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div
                          className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center opacity-40"
                          style={{ borderColor: '#ef4444', background: '#1a0a0a' }}
                        >
                          <Skull className="w-6 h-6 text-red-500/50" />
                        </div>
                        <span className="text-xs text-white/25 font-medium max-w-[72px] text-center">
                          {world.boss.name}
                        </span>
                      </div>
                    ) : (
                      <Link href={bossHref} className="flex-shrink-0">
                        <motion.div
                          className="flex flex-col items-center gap-1.5"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div
                            className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                            style={{
                              background: '#2d0a0a',
                              borderColor: '#ef4444',
                              boxShadow: '0 0 20px #ef444460',
                            }}
                          >
                            <Skull className="w-7 h-7 text-red-400" />
                          </div>
                          <span className="text-xs text-red-400 font-bold max-w-[72px] text-center flex items-center gap-0.5">
                            <Flame className="w-3 h-3" /> {world.boss.name}
                          </span>
                        </motion.div>
                      </Link>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!isLocked && (
                    <div className="mt-4">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: theme.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedCount / world.chambers.length) * 100}%` }}
                          transition={{ duration: 1, delay: wi * 0.1 + 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick-start CTA for free module */}
                  {!isLocked && (
                    <div className="mt-4">
                      <Link href={bossHref}>
                        <button
                          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{
                            background: `${theme.color}20`,
                            color: theme.color,
                            border: `1px solid ${theme.color}40`,
                          }}
                        >
                          {allDone ? (
                            <>
                              <Skull className="w-4 h-4" /> Challenge the Boss
                            </>
                          ) : completedCount > 0 ? (
                            <>
                              Continue Module <ChevronRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Start Module <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Locked modules notice */}
        {userTier === 'free' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-yellow-500/20 p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #ffffff08, #ffffff04)' }}
          >
            <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-white font-bold mb-1">5 More Modules Locked</h3>
            <p className="text-white/40 text-sm">
              Modules 2–8 and all their boss battles unlock with Pro.
            </p>
            <div className="mt-3 text-yellow-500/60 text-xs font-medium">Coming soon</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
