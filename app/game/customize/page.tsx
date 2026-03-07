'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomizePage() {
  const router = useRouter();
  const [config, setConfig] = useState({
    body: 'strong',
    hair: 'red',
    weapon: 'hammer',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current user config on load
  useEffect(() => {
    fetch('/api/user/customize')
      .then(res => res.json())
      .then(data => setConfig(data));
  }, []);

  const options = {
    body: [
      { id: 'athletic', label: 'Athletic', desc: 'Fast & Agile' },
      { id: 'strong', label: 'Strong', desc: 'High Damage' },
      { id: 'balanced', label: 'Balanced', desc: 'All-Rounder' },
    ],
    hair: [
      { id: 'red', color: 'bg-red-500' },
      { id: 'blue', color: 'bg-blue-500' },
      { id: 'purple', color: 'bg-purple-500' },
      { id: 'green', color: 'bg-green-500' },
      { id: 'black', color: 'bg-slate-900' },
    ],
    weapon: [
      { id: 'sword', label: 'Sword' },
      { id: 'hammer', label: 'Hammer' },
      { id: 'staff', label: 'Staff' },
    ],
  };

  const previewUrl = `/sprites/player_${config.body}_${config.hair}_${config.weapon}_idle.png`;

  const handleSave = async () => {
    setIsSaving(true);
    await fetch('/api/user/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setIsSaving(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
      <div className="bg-slate-900 rounded-3xl border-4 border-indigo-500 shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-black text-white italic mb-2 text-center flex items-center justify-center gap-2">
          <Sparkles className="text-yellow-500" /> CREATE YOUR HERO
        </h1>
        <p className="text-indigo-300 text-center mb-8">Customize your character for battle</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* PREVIEW */}
          <div className="bg-slate-950 rounded-2xl p-8 flex items-center justify-center border-2 border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,#1e1b4b_0%,#020617_100%)] opacity-50" />
            <motion.img
              key={previewUrl}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              src={previewUrl}
              onError={(e) => { e.currentTarget.src = '/sprites/placeholder.png'; }}
              className="w-64 h-64 object-contain z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]"
              alt="Character Preview"
            />
          </div>

          {/* CONTROLS */}
          <div className="space-y-6">
            {/* BODY TYPE */}
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase mb-3 block">Body Type</label>
              <div className="grid grid-cols-3 gap-2">
                {options.body.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setConfig({ ...config, body: opt.id })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      config.body === opt.id
                        ? 'border-indigo-400 bg-indigo-500/20 scale-105'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-black text-white">{opt.label}</div>
                    <div className="text-[10px] text-indigo-300">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* HAIR COLOR */}
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase mb-3 block">Hair Color</label>
              <div className="flex gap-3 flex-wrap">
                {options.hair.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setConfig({ ...config, hair: opt.id })}
                    className={`w-12 h-12 rounded-full border-4 ${opt.color} transition-all ${
                      config.hair === opt.id ? 'border-white scale-125 shadow-lg' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* WEAPON */}
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase mb-3 block">Weapon</label>
              <div className="grid grid-cols-3 gap-2">
                {options.weapon.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setConfig({ ...config, weapon: opt.id })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      config.weapon === opt.id
                        ? 'border-indigo-400 bg-indigo-500/20 scale-105'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-black text-white">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'SAVING...' : 'SAVE CHARACTER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
