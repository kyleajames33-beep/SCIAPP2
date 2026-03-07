'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Map, Lock, CheckCircle, Star, ArrowLeft, Loader2,
  Beaker, Flame, Shield, Crown, Skull, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Campaign data - will be loaded from campaign.json in future
const WORLDS = [
  {
    id: 'module-1',
    name: 'Module 1: Properties & Structure of Matter',
    description: 'Atomic structure, periodic table, bonding, and intermolecular forces.',
    chambers: [
      { id: 'm1-c1', name: 'Atomic Structure', topic: 'atomic-structure', free: true },
      { id: 'm1-c2', name: 'Periodic Table Trends', topic: 'periodic-table', free: true },
      { id: 'm1-c3', name: 'Chemical Bonding', topic: 'bonding', free: true },
      { id: 'm1-c4', name: 'Intermolecular Forces', topic: 'intermolecular-forces', free: true },
    ],
    boss: { id: 'acid-baron', name: 'The Acid Baron' },
    free: true,
  },
  {
    id: 'module-2',
    name: 'Module 2: Introduction to Quantitative Chemistry',
    description: 'Moles, stoichiometry, concentrations, and gas laws.',
    chambers: [
      { id: 'm2-c1', name: 'The Mole Concept', topic: 'moles', free: false },
      { id: 'm2-c2', name: 'Stoichiometry', topic: 'stoichiometry', free: false },
      { id: 'm2-c3', name: 'Concentration & Dilution', topic: 'concentration', free: false },
      { id: 'm2-c4', name: 'Gas Laws', topic: 'gas-laws', free: false },
    ],
    boss: { id: 'mole-master', name: 'The Mole Master' },
    free: false,
  },
  {
    id: 'module-3',
    name: 'Module 3: Reactive Chemistry',
    description: 'Types of reactions, rates, and energy changes.',
    chambers: [
      { id: 'm3-c1', name: 'Types of Reactions', topic: 'reaction-types', free: false },
      { id: 'm3-c2', name: 'Reaction Rates', topic: 'rates', free: false },
      { id: 'm3-c3', name: 'Energy Changes', topic: 'thermochem', free: false },
    ],
    boss: { id: 'reaction-king', name: 'The Reaction King' },
    free: false,
  },
];

interface ProgressEntry {
  chamberId: string;
  completed: boolean;
  bestScore: number;
  xpEarned: number;
}

interface World {
  id: string;
  name: string;
  description: string;
  chambers: { id: string; name: string; topic: string; free: boolean }[];
  boss: { id: string; name: string };
  free: boolean;
}

interface BossCardProps {
  world: World;
  progress: ProgressEntry[];
  isWorldLocked: boolean;
  userTier: string;
}

function BossCard({ world, progress, isWorldLocked, userTier }: BossCardProps) {
  const router = useRouter();
  
  // Check if all chambers in this world are completed
  const allChambersCompleted = world.chambers.every((chamber) => {
    // If chamber is free or user is pro, check if completed
    const chamberProgress = progress.find((p) => p.chamberId === chamber.id);
    return chamberProgress?.completed === true;
  });
  
  // Count completed chambers
  const completedCount = world.chambers.filter((chamber) => {
    const chamberProgress = progress.find((p) => p.chamberId === chamber.id);
    return chamberProgress?.completed === true;
  }).length;
  
  const totalChambers = world.chambers.length;
  const isUnlocked = !isWorldLocked && allChambersCompleted;
  
  const handleClick = () => {
    if (isUnlocked) {
      router.push(`/campaign/boss/${world.boss.id}`);
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-300
        ${isUnlocked 
          ? 'border-red-500/50 bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 cursor-pointer hover:scale-[1.02] hover:border-red-400/70' 
          : isWorldLocked
            ? 'border-yellow-500/30 bg-yellow-950/20 opacity-60'
            : 'border-gray-600/50 bg-gray-900/50 opacity-80'
        }
      `}
    >
      {/* Animated glow effect for unlocked boss */}
      {isUnlocked && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 animate-pulse" />
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-red-600/0 via-red-500/30 to-red-600/0 rounded-xl blur-xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}
      
      <div className="relative p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Boss Icon */}
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center border-2
            ${isUnlocked 
              ? 'bg-red-500/20 border-red-400 shadow-lg shadow-red-500/30' 
              : 'bg-gray-700/50 border-gray-600'
            }
          `}>
            {isUnlocked ? (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Skull className="w-7 h-7 text-red-400" />
              </motion.div>
            ) : (
              <Lock className="w-6 h-6 text-gray-500" />
            )}
          </div>
          
          {/* Boss Info */}
          <div>
            <h3 className={`
              font-bold text-lg
              ${isUnlocked ? 'text-white' : 'text-gray-400'}
            `}>
              {world.boss.name}
            </h3>
            <p className="text-sm text-white/50">
              {isUnlocked ? (
                <span className="text-red-300 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Click to Challenge!
                </span>
              ) : isWorldLocked ? (
                <span className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-yellow-500" /> Pro Required
                </span>
              ) : (
                <span>
                  Complete all chambers ({completedCount}/{totalChambers})
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Right side badge/indicator */}
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
                <Skull className="w-3 h-3 mr-1" /> BOSS BATTLE
              </Badge>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </>
          ) : isWorldLocked ? (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              <Crown className="w-3 h-3 mr-1" /> Locked
            </Badge>
          ) : (
            <Badge className="bg-gray-600/30 text-gray-400 border-gray-600/50">
              <Lock className="w-3 h-3 mr-1" /> Locked
            </Badge>
          )}
        </div>
      </div>
      
      {/* Progress bar for locked but available bosses */}
      {!isUnlocked && !isWorldLocked && (
        <div className="px-4 pb-4">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalChambers) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [userTier, setUserTier] = useState('free');

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { router.push('/auth/login'); return; }
        const meData = await meRes.json();
        setUserTier(meData.user?.subscriptionTier || 'free');

        const progRes = await fetch('/api/campaign/progress');
        if (progRes.ok) {
          const progData = await progRes.json();
          setProgress(progData.progress || []);
        }
      } catch {
        toast.error('Failed to load campaign data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const getChamberProgress = (chamberId: string) =>
    progress.find((p) => p.chamberId === chamberId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/hub">
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Map className="w-8 h-8 text-amber-400" /> Campaign Mode
            </h1>
            <p className="text-white/60">Progress through HSC Chemistry modules</p>
          </div>
        </div>

        {/* Worlds */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {WORLDS.map((world, wi) => {
            const isLocked = !world.free && userTier === 'free';
            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wi * 0.1 }}
              >
                <Card className={`bg-white/5 border-white/10 ${isLocked ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {world.name}
                          {isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
                          {!isLocked && world.free && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Free</Badge>
                          )}
                          {!world.free && (
                            <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                              <Crown className="w-3 h-3 mr-1" /> PRO
                            </Badge>
                          )}
                        </h2>
                        <p className="text-white/60 text-sm mt-1">{world.description}</p>
                      </div>
                    </div>

                    {/* Chambers */}
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      {world.chambers.map((chamber) => {
                        const prog = getChamberProgress(chamber.id);
                        const chamberLocked = !chamber.free && userTier === 'free';
                        return (
                          <div
                            key={chamber.id}
                            onClick={() => !chamberLocked && router.push(`/training/${world.id}/${chamber.id}`)}
                            className={`p-3 rounded-lg border ${
                              prog?.completed
                                ? 'bg-green-500/10 border-green-500/30'
                                : chamberLocked
                                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 border-white/20 hover:bg-white/10 cursor-pointer'
                            } transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {prog?.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : chamberLocked ? (
                                  <Lock className="w-5 h-5 text-yellow-500/50" />
                                ) : (
                                  <Beaker className="w-5 h-5 text-cyan-400" />
                                )}
                                <span className="text-white font-medium text-sm">{chamber.name}</span>
                              </div>
                              {prog?.bestScore ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-300 text-xs">{prog.bestScore}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Boss Card */}
                    <BossCard
                      world={world}
                      progress={progress}
                      isWorldLocked={isLocked}
                      userTier={userTier}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade CTA for free users */}
        {userTier === 'free' && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-400/30">
              <CardContent className="p-6 text-center">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Unlock All Modules</h3>
                <p className="text-white/60 mb-4">
                  Upgrade to Pro to access Modules 2-8, all boss battles, and premium features.
                </p>
                <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
