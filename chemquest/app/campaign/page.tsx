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
  Zap, Droplet, Atom, Microscope
} from 'lucide-react';
import { toast } from 'sonner';
import { MODULES, Module, Chamber } from '@/lib/modules';

// Icon mapping
const ICONS: Record<string, React.ReactNode> = {
  Beaker: <Beaker className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Droplet: <Droplet className="w-6 h-6" />,
  Atom: <Atom className="w-6 h-6" />,
  Microscope: <Microscope className="w-6 h-6" />,
  Skull: <Skull className="w-6 h-6" />,
};

interface ProgressEntry {
  chamberId: string;
  completed: boolean;
  bestScore: number;
  xpEarned: number;
}

interface ChamberCardProps {
  module: Module;
  chamber: Chamber;
  progress: ProgressEntry[];
  isLocked: boolean;
}

function ChamberCard({ module, chamber, progress, isLocked }: ChamberCardProps) {
  const router = useRouter();
  const chamberProgress = progress.find((p) => p.chamberId === chamber.id);
  const isCompleted = chamberProgress?.completed || false;
  
  const handleClick = () => {
    if (!isLocked) {
      router.push(`/training/${module.id}/${chamber.id}`);
    }
  };

  return (
    <motion.div
      className={!isLocked ? "cursor-pointer" : "cursor-not-allowed"}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <Card
        onClick={handleClick}
        className={`
          cursor-pointer transition-all duration-200
          ${isLocked 
            ? 'bg-gray-800/50 border-gray-700 opacity-60' 
            : isCompleted 
              ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${isLocked 
                ? 'bg-gray-700 text-gray-500' 
                : isCompleted 
                  ? 'bg-green-500/20 text-green-400' 
                  : `bg-gradient-to-br ${module.color} text-white`
              }
            `}>
              {isLocked ? <Lock className="w-5 h-5" /> : isCompleted ? <CheckCircle className="w-5 h-5" /> : ICONS[module.icon] || <Beaker className="w-5 h-5" />}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold truncate ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                {chamber.name}
              </h4>
              <p className="text-xs text-white/50 truncate">{chamber.description}</p>
            </div>
            
            {/* Status */}
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Star className="w-3 h-3 mr-1" /> Done
              </Badge>
            )}
            {isLocked && (
              <Badge className="bg-gray-700 text-gray-400">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ModuleCardProps {
  module: Module;
  progress: ProgressEntry[];
  userTier: string;
  currentRank?: string;
  moduleIndex: number;
}

function ModuleCard({ module, progress, userTier, currentRank, moduleIndex }: ModuleCardProps) {
  // Check if module is locked (requires pro for modules 2+)
  const isLocked = module.id > 1 && userTier === 'free';
  
  // Check if World 9 is rank locked
  const isRankLocked = module.id === 9 && currentRank ? 
    !['Gold', 'Platinum', 'Diamond'].includes(currentRank) : false;
  
  const totalChambers = module.chambers.length;
  const completedChambers = module.chambers.filter(c => 
    progress.find(p => p.chamberId === c.id)?.completed
  ).length;
  const progressPercent = totalChambers > 0 ? (completedChambers / totalChambers) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: moduleIndex * 0.1 }}
    >
      <Card className={`
        overflow-hidden
        ${isLocked || isRankLocked ? 'opacity-70' : ''}
      `}>
        {/* Header */}
        <div className={`
          p-4 bg-gradient-to-r ${module.color}
          ${isLocked || isRankLocked ? 'grayscale' : ''}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                {ICONS[module.icon] || <Beaker className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{module.name}</h3>
                <p className="text-xs text-white/80">{completedChambers}/{totalChambers} Chambers Complete</p>
              </div>
            </div>
            
            {isRankLocked && (
              <Badge className="bg-yellow-500/80 text-yellow-900 border-0">
                <Lock className="w-3 h-3 mr-1" /> Gold Rank Required
              </Badge>
            )}
            {isLocked && !isRankLocked && (
              <Badge className="bg-yellow-500/80 text-yellow-900 border-0">
                <Crown className="w-3 h-3 mr-1" /> Pro Required
              </Badge>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        {/* Chambers Grid */}
        <CardContent className="p-4">
          {isRankLocked ? (
            <div className="text-center py-8 text-white/60">
              <Skull className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">Unlocks at Gold Rank (1,500 XP)</p>
              <p className="text-sm mt-1">Complete quizzes to earn XP and rank up!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {module.chambers.map((chamber) => (
                <ChamberCard
                  key={chamber.id}
                  module={module}
                  chamber={chamber}
                  progress={progress}
                  isLocked={isLocked || isRankLocked}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [userTier, setUserTier] = useState('free');
  const [currentRank, setCurrentRank] = useState('Bronze');

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { router.push('/auth/login'); return; }
        const meData = await meRes.json();
        setUserTier(meData.user?.subscriptionTier || 'free');
        setCurrentRank(meData.user?.currentRank || 'Bronze');

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
            <p className="text-white/60">Progress through all 9 HSC Chemistry modules</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{MODULES.length}</div>
              <div className="text-sm text-white/60">Total Modules</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {progress.filter(p => p.completed).length}
              </div>
              <div className="text-sm text-white/60">Chambers Complete</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {progress.reduce((acc, p) => acc + p.xpEarned, 0).toLocaleString()}
              </div>
              <div className="text-sm text-white/60">XP Earned</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{currentRank}</div>
              <div className="text-sm text-white/60">Current Rank</div>
            </CardContent>
          </Card>
        </div>

        {/* All 9 Modules */}
        <div className="space-y-6 max-w-5xl mx-auto">
          {MODULES.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={progress}
              userTier={userTier}
              currentRank={currentRank}
              moduleIndex={index}
            />
          ))}
        </div>

        {/* Upgrade CTA for free users */}
        {userTier === 'free' && (
          <div className="max-w-5xl mx-auto mt-8">
            <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-400/30">
              <CardContent className="p-6 text-center">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Unlock All Modules</h3>
                <p className="text-white/60 mb-4">
                  Upgrade to Pro to access Modules 2-9 and all premium features.
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
