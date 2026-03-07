'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Coins, Check } from 'lucide-react';

export default function ShopPage() {
  const [userCoins, setUserCoins] = useState(1200); // This will come from your DB
  const [ownedItems, setOwnedItems] = useState(['red', 'hammer']);

  const shopItems = [
    { id: 'green', label: 'Neon Green Hair', price: 500, type: 'hair', color: 'bg-green-500' },
    { id: 'gold_hammer', label: 'Golden Hammer', price: 2000, type: 'weapon', color: 'bg-yellow-500' },
    { id: 'shield', label: 'Safety Shield', price: 150, type: 'powerup', desc: 'Blocks 1 wrong answer' },
  ];

  const handlePurchase = (item: any) => {
    if (userCoins >= item.price && !ownedItems.includes(item.id)) {
      setUserCoins(userCoins - item.price);
      setOwnedItems([...ownedItems, item.id]);
      // Add API call here to update DB
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-white italic flex items-center gap-3">
            <ShoppingBag className="text-pink-500" /> THE LAB STORE
          </h1>
          <div className="bg-yellow-500/20 border-2 border-yellow-500 px-6 py-2 rounded-full flex items-center gap-2">
            <Coins className="text-yellow-500 w-6 h-6" />
            <span className="text-2xl font-black text-yellow-500">{userCoins}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shopItems.map((item) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={item.id}
              className="bg-slate-900 border-4 border-white/5 rounded-3xl p-6 flex flex-center items-center text-center"
            >
              <div className={`w-20 h-20 rounded-2xl mb-4 flex items-center justify-center ${item.color || 'bg-indigo-500/20'}`}>
                {/* You can put mini-icons or item sprites here */}
              </div>
              <h3 className="text-xl font-black text-white mb-1">{item.label}</h3>
              <p className="text-xs text-slate-400 mb-6">{item.desc || 'Cosmetic Upgrade'}</p>
              
              <button
                onClick={() => handlePurchase(item)}
                disabled={ownedItems.includes(item.id)}
                className={`w-full py-3 rounded-xl font-black transition-all ${
                  ownedItems.includes(item.id) 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_0_rgb(67,56,202)] active:shadow-none active:translate-y-1'
                }`}
              >
                {ownedItems.includes(item.id) ? 'OWNED' : `${item.price} COINS`}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
