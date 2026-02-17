'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Beaker, Play, Rocket, Shield, Sparkles, Users,
  Atom, Leaf, Microscope, Coins, Zap, Flame
} from 'lucide-react'
import Link from 'next/link'

const GAME_MODES = [
  {
    id: 'classic',
    name: 'Classic',
    description: '10 questions with 30 seconds each.',
    icon: <Play className="w-8 h-8" />,
    color: 'from-purple-500 to-blue-500',
    features: ['10 Questions', '30s Timer']
  },
  {
    id: 'rush',
    name: 'Rush',
    description: '20 questions, 15 seconds each. Speed matters!',
    icon: <Rocket className="w-8 h-8" />,
    color: 'from-orange-500 to-red-500',
    features: ['20 Questions', 'Speed Bonus']
  },
  {
    id: 'survival',
    name: 'Survival',
    description: 'You have 3 lives. How long can you survive?',
    icon: <Shield className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    features: ['3 Lives', 'Endless']
  }
]

const SUBJECTS = [
  { id: 'Chemistry', name: 'Chemistry', icon: <Beaker className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'Physics', name: 'Physics', icon: <Atom className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
  { id: 'Biology', name: 'Biology', icon: <Leaf className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
  { id: 'General Science', name: 'General Science', icon: <Microscope className="w-6 h-6" />, color: 'from-orange-500 to-amber-500' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl" />
              <Beaker className="w-24 h-24 text-white relative" />
              <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-2 -right-2" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            ChemQuest
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Master HSC Chemistry through play
          </p>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/training">
              <Button className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto font-bold">
                <Play className="w-5 h-5 mr-2" />
                Start Playing
              </Button>
            </Link>
            <Link href="/hub">
              <Button className="bg-purple-700 text-white hover:bg-purple-800 text-lg px-8 py-6 h-auto font-bold">
                <Rocket className="w-5 h-5 mr-2" />
                Game Hub
              </Button>
            </Link>
            <Link href="/campaign">
              <Button className="bg-pink-600 text-white hover:bg-pink-700 text-lg px-8 py-6 h-auto font-bold">
                <Shield className="w-5 h-5 mr-2" />
                Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Game Modes */}
        <div className="max-w-5xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Game Modes</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {GAME_MODES.map((mode) => (
              <Card key={mode.id} className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mx-auto mb-4`}>
                    {mode.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                  <p className="text-white/70 text-sm mb-4">{mode.description}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {mode.features.map((f, i) => (
                      <Badge key={i} className="bg-white/20 text-white">{f}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Subjects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SUBJECTS.map((s) => (
              <Card key={s.id} className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2`}>
                    {s.icon}
                  </div>
                  <p className="font-bold text-sm">{s.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/60 text-sm">
          <p>Built for Science Students 🧪</p>
        </div>
      </div>
    </div>
  )
}
