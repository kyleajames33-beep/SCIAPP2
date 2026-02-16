"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Sparkles,
  Check,
  X,
  ArrowLeft,
  Lock,
  Zap,
  Globe,
  Gamepad2,
  Shield,
  Star,
} from "lucide-react";
import { toast } from "sonner";

const PRO_FEATURES = [
  { icon: Gamepad2, text: "Unlock all 8 Chemistry Modules" },
  { icon: Shield, text: "Exclusive Boss Battles & Rewards" },
  { icon: Globe, text: "Global Leaderboard Access" },
  { icon: Zap, text: "Double XP on all quizzes" },
  { icon: Star, text: "Premium Avatar Customization" },
  { icon: Sparkles, text: "Ad-Free Experience" },
  { icon: Lock, text: "Early Access to New Content" },
  { icon: Crown, text: "Pro Badge on Profile" },
];

const FREE_FEATURES = [
  { text: "Module 1: Properties & Structure", available: true },
  { text: "Basic Avatar Customization", available: true },
  { text: "Standard XP Rates", available: true },
  { text: "Limited Shop Access", available: true },
  { text: "Modules 2-8 Content", available: false },
  { text: "Boss Battles", available: false },
  { text: "Global Leaderboards", available: false },
  { text: "Premium Themes", available: false },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reason = searchParams.get("reason");
  const attemptedPath = searchParams.get("attempted");

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserTier(data.user?.subscriptionTier || "free");
          
          // If user is already pro, show a message
          if (data.user?.subscriptionTier === "pro") {
            toast.success("You're already a Pro member!", {
              description: "You have access to all premium features.",
            });
          }
        }
      } catch {
        // Not logged in
      } finally {
        setIsLoading(false);
      }
    }

    checkUser();

    // Show toast if redirected from premium content
    if (reason === "premium_content" && attemptedPath) {
      toast.error("Premium Content Locked", {
        description: "Upgrade to Pro to access all chemistry modules!",
      });
    }
  }, [reason, attemptedPath]);

  const handleUpgrade = () => {
    toast.info("Coming Soon!", {
      description: "Pro subscriptions will be available soon. Stay tuned!",
      icon: "🚀",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link href="/hub">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              Upgrade to Pro
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">
              Limited Time: 30% Off Launch Pricing
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Pro Chemist</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Unlock the full ChemQuest experience with access to all 8 HSC Chemistry modules, 
            exclusive boss battles, and premium features.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 h-full">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <p className="text-white/50">Get started with Chemistry</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$0</span>
                    <span className="text-white/50">/month</span>
                  </div>
                </div>

                <Separator className="bg-white/10 mb-6" />

                <ul className="space-y-4">
                  {FREE_FEATURES.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      {feature.available ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-white/20 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.available ? "text-white/70" : "text-white/30"
                        }
                      >
                        {feature.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="w-full mt-8 border-white/20 text-white/60 hover:bg-white/5"
                  disabled={userTier === "free"}
                >
                  {userTier === "free" ? "Current Plan" : "Free Plan"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 px-4 py-1">
                <Crown className="w-3 h-3 mr-1" /> Most Popular
              </Badge>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-50" />

            <Card className="relative bg-gradient-to-b from-white/10 to-white/5 border-yellow-500/30 h-full">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    Pro Chemist
                  </h3>
                  <p className="text-white/50">Full Chemistry Mastery</p>
                  <div className="mt-4 flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                      $9.99
                    </span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-sm text-white/30 mt-1">
                    or $99.99/year (save 17%)
                  </p>
                </div>

                <Separator className="bg-yellow-500/20 mb-6" />

                <ul className="space-y-4">
                  {PRO_FEATURES.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-white font-medium">
                        {feature.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <Button
                  onClick={handleUpgrade}
                  className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold py-6 text-lg shadow-lg shadow-yellow-500/20"
                  disabled={userTier === "pro"}
                >
                  {userTier === "pro" ? (
                    <>
                      <Check className="w-5 h-5 mr-2" /> Already Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" /> Upgrade Now
                    </>
                  )}
                </Button>

                <p className="text-center text-white/30 text-xs mt-4">
                  30-day money-back guarantee • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-white/40 text-sm mb-4">
            Trusted by 10,000+ HSC Chemistry students
          </p>
          <div className="flex justify-center gap-8 text-white/20">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-sm">4.9/5 Rating</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold text-white text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "What happens to my progress if I cancel?",
                a: "Your progress is always saved! If you cancel, you'll keep access to free content and can resume where you left off if you resubscribe.",
              },
              {
                q: "Can I switch between monthly and yearly?",
                a: "Yes, you can change your billing cycle at any time. Changes take effect at the start of your next billing period.",
              },
              {
                q: "Is there a student discount?",
                a: "Yes! Students with a valid .edu email can get 50% off. Contact support after signing up.",
              },
            ].map((faq, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h4 className="text-white font-medium mb-2">{faq.q}</h4>
                  <p className="text-white/50 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
