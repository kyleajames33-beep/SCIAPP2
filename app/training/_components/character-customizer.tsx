'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, User, Zap, Sword, Hammer, Wand2 } from 'lucide-react';

export function CharacterCustomizer({ initialData, onSave }: any) {
  const [config, setConfig] = useState(initialData);

  const options = {
    body: [
      { id: 'athletic', label: 'Athletic', icon: User },
      { id: 'strong', label: 'Strong', icon: Zap },
    ],
    hair: [
      { id: 'blue', color: 'bg-blue-500' },
      { id: 'red', color: 'bg-red-500' },
      { id: 'purple', color: 'bg-purple-500' },
      { id: 'green', color: 'bg-green-500' },
    ],
    weapon: [
      { id: 'sword', icon: Sword },
      { id: 'hammer', icon: Hammer },
      { id: 'staff', icon: Wand2 },
    ]
  };

  // This generates the filename based on choices
  // For now, we use the animation sprites: player_strong_idle.png
  // In the future, this could be expanded to support multiple character bases
  const previewUrl = config.body === 'strong' 
    ? '/sprites/player_strong_idle.png'
    : '/sprites/player_strong_idle.png'; // Default to strong for now

  return (
    <div className="bg-slate-900 p-8 rounded-3xl border-4 border-indigo-500 shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tighter">CREATE YOUR HERO</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PREVIEW */}
        <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-center border-2 border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,#1e1b4b_0%,#020617_100%)] opacity-50" />
          <motion.img 
            key={previewUrl}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={previewUrl} 
            className="w-48 h-48 object-contain z-10 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
          />
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-indigo-300 uppercase mb-2 block">Body Type</label>
            <div className="flex gap-2">
              {options.body.map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setConfig({...config, body: opt.id})}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${config.body === opt.id ? 'border-indigo-400 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                >
                  <opt.icon className="w-5 h-5 mx-auto text-white" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-indigo-300 uppercase mb-2 block">Hair Color</label>
            <div className="flex gap-2 flex-wrap">
              {options.hair.map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setConfig({...config, hair: opt.id})}
                  className={`w-8 h-8 rounded-full border-2 ${opt.color} ${config.hair === opt.id ? 'border-white scale-125' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSave(config)}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all"
          >
            SAVE CHARACTER
          </button>
        </div>
      </div>
    </div>
  );
}
