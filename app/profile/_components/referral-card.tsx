'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Gift, Copy, Check, Users } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { formatReferralCode } from '@/lib/referral'

export function ReferralCard() {
  const [referralCode, setReferralCode] = useState<string>('')
  const [referralCount, setReferralCount] = useState(0)
  const [hasUsedReferral, setHasUsedReferral] = useState(false)
  const [copied, setCopied] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/user/referral')
      if (response.ok) {
        const data = await response.json()
        setReferralCode(data.referralCode || '')
        setReferralCount(data.referralCount || 0)
        setHasUsedReferral(data.hasUsedReferral || false)
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Please enter a referral code')
      return
    }

    setIsRedeeming(true)

    try {
      const response = await fetch('/api/user/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: redeemCode }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`🎉 ${data.message} You received ${data.coinsEarned} coins and ${data.gemsEarned} gems!`)
        setHasUsedReferral(true)
        setRedeemCode('')
      } else {
        toast.error(data.error || 'Failed to redeem code')
      }
    } catch (error) {
      console.error('Redeem error:', error)
      toast.error('Failed to redeem code')
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Referral Program
        </CardTitle>
        <CardDescription className="text-purple-200">
          Invite friends and earn rewards together!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your Referral Code */}
        <div>
          <p className="text-sm text-purple-200 mb-2">Your Referral Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-900/50 border border-purple-500/30 rounded-lg p-3 font-mono text-2xl text-center text-yellow-400 tracking-widest">
              {referralCode ? formatReferralCode(referralCode) : 'LOADING...'}
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-purple-200">
            <Users className="w-4 h-4" />
            <span>{referralCount} {referralCount === 1 ? 'friend' : 'friends'} referred</span>
          </div>
        </div>

        {/* Redeem Code */}
        {!hasUsedReferral && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 border-t border-purple-500/20"
          >
            <p className="text-sm text-purple-200 mb-2">Have a Referral Code?</p>
            <div className="flex items-center gap-2">
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                maxLength={7}
                className="bg-gray-900/50 border-purple-500/30 text-white font-mono uppercase"
              />
              <Button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemCode.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
            <p className="text-xs text-purple-300 mt-2">
              Both you and your friend get 500 coins + 10 gems!
            </p>
          </motion.div>
        )}

        {hasUsedReferral && (
          <div className="pt-4 border-t border-purple-500/20">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              You've already redeemed a referral code
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
