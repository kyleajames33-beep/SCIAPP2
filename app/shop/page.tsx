"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coins,
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  User,
  Palette,
  Zap,
  Check,
  Lock,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
  AVATARS,
  THEMES,
  POWERUPS,
  ShopItem,
  RARITY_COLORS,
  RARITY_GLOW,
} from "@/lib/shop-data";

type TabType = "avatars" | "themes" | "powerups";

interface UserData {
  id: string;
  username: string;
  displayName: string;
  totalCoins: number;
  ownedItems: string[];
}

function ShopCard({
  item,
  isOwned,
  canAfford,
  onBuy,
  isPurchasing,
  insufficientFunds,
}: {
  item: ShopItem;
  isOwned: boolean;
  canAfford: boolean;
  onBuy: () => void;
  isPurchasing: boolean;
  insufficientFunds: boolean;
}) {
  const [showShake, setShowShake] = useState(false);

  const handleClick = () => {
    if (isOwned) {
      toast.info(`${item.name} is already in your inventory!`);
      return;
    }
    if (!canAfford) {
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
      toast.error(
        `Insufficient funds! You need ${item.price} coins`,
        { icon: "💸" }
      );
      return;
    }
    onBuy();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={showShake ? "animate-shake" : ""}
    >
      <Card
        className={`
          relative overflow-hidden border-2 transition-all duration-300
          ${isOwned 
            ? "bg-green-500/10 border-green-500/30" 
            : `bg-gradient-to-br ${item.color} border-white/10 hover:border-white/30`
          }
          ${RARITY_GLOW[item.rarity]}
          ${!isOwned && canAfford ? "cursor-pointer" : ""}
        `}
      >
        {/* Rarity Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={`${RARITY_COLORS[item.rarity]} text-[10px] uppercase tracking-wider`}
          >
            {item.rarity}
          </Badge>
        </div>

        {/* Item Icon */}
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <motion.div
              whileHover={!isOwned ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
              transition={{ duration: 0.5 }}
              className={`
                w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4
                ${isOwned 
                  ? "bg-green-500/20" 
                  : "bg-white/10 backdrop-blur-sm"
                }
              `}
            >
              {isOwned ? (
                <Check className="w-10 h-10 text-green-400" />
              ) : (
                <span>{item.icon}</span>
              )}
            </motion.div>

            {/* Item Name */}
            <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>

            {/* Description */}
            <p className="text-white/50 text-sm mb-3 line-clamp-2">
              {item.description}
            </p>

            {/* Effect (for powerups) */}
            {item.effect && (
              <div className="mb-3 px-3 py-1 rounded-full bg-white/10 text-xs text-cyan-300">
                {item.effect}
              </div>
            )}

            {/* Price & Action */}
            <div className="w-full mt-auto pt-4 border-t border-white/10">
              {isOwned ? (
                <Button
                  variant="ghost"
                  className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  disabled
                >
                  <Check className="w-4 h-4 mr-2" /> Owned
                </Button>
              ) : (
                <Button
                  onClick={handleClick}
                  disabled={isPurchasing}
                  className={`
                    w-full transition-all
                    ${canAfford
                      ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                      : "bg-white/10 text-white/50 cursor-not-allowed"
                    }
                  `}
                >
                  {isPurchasing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      {item.price.toLocaleString()}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>

        {/* Hover Glow Effect */}
        {!isOwned && canAfford && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity"
            initial={false}
          />
        )}
      </Card>
    </motion.div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("avatars");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user) return;

    setPurchasingId(item.id);

    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await res.json();

      if (res.ok) {
        // Play sound effect (placeholder - browser notification)
        toast.success(`🎉 Cha-ching! Purchased ${item.name}!`, {
          description: `${data.remainingCoins.toLocaleString()} coins remaining`,
          icon: item.icon,
        });

        // Update local user data
        setUser((prev) =>
          prev
            ? {
                ...prev,
                totalCoins: data.remainingCoins,
                ownedItems: data.ownedItems,
              }
            : null
        );
      } else if (res.status === 402) {
        toast.error(
          `💸 Insufficient funds! Need ${data.required} coins`,
          {
            description: `You have ${data.current} coins (short by ${data.shortfall})`,
          }
        );
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch {
      toast.error("Network error - please try again");
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <ShoppingCart className="w-10 h-10 text-yellow-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const getItemsForTab = () => {
    switch (activeTab) {
      case "avatars":
        return AVATARS;
      case "themes":
        return THEMES;
      case "powerups":
        return POWERUPS;
      default:
        return [];
    }
  };

  const items = getItemsForTab();
  const ownedCount = user.ownedItems.length;
  const totalItems = AVATARS.length + THEMES.length + POWERUPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link href="/hub">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
              </Button>
            </Link>

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-yellow-400" />
              Chemistry Shop
            </h1>

            {/* Coin Balance */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Coins className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <span className="text-yellow-400 font-bold">
                {user.totalCoins.toLocaleString()}
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Shop Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Collection</span>
              <span className="text-white font-bold">
                {ownedCount}/{totalItems}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2 text-white/60">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm">Completion</span>
              <span className="text-white font-bold">
                {Math.round((ownedCount / totalItems) * 100)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
          >
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger
                value="avatars"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 px-6"
              >
                <User className="w-4 h-4 mr-2" /> Avatars
              </TabsTrigger>
              <TabsTrigger
                value="themes"
                className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 px-6"
              >
                <Palette className="w-4 h-4 mr-2" /> Themes
              </TabsTrigger>
              <TabsTrigger
                value="powerups"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 px-6"
              >
                <Zap className="w-4 h-4 mr-2" /> Power-ups
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Items Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ShopCard
                  item={item}
                  isOwned={user.ownedItems.includes(item.id)}
                  canAfford={user.totalCoins >= item.price}
                  onBuy={() => handlePurchase(item)}
                  isPurchasing={purchasingId === item.id}
                  insufficientFunds={user.totalCoins < item.price}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No items available
            </h3>
            <p className="text-white/50">
              Check back later for new items!
            </p>
          </div>
        )}
      </main>

      {/* CSS for shake animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
