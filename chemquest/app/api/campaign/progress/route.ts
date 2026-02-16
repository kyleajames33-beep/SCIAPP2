import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await prisma.campaignProgress.findMany({
      where: { userId: user.id },
      orderBy: { chamberId: 'asc' },
    });

    const bossAttempts = await prisma.bossAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      progress: progress.map((p) => ({
        chamberId: p.chamberId,
        worldId: p.worldId,
        completed: p.completed,
        bestScore: p.bestScore,
        xpEarned: p.xpEarned,
      })),
      bossAttempts: bossAttempts.map((b) => ({
        bossId: b.bossId,
        defeated: b.defeated,
        damageDealt: b.damageDealt,
      })),
    });
  } catch (error) {
    console.error('Campaign progress error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign progress' },
      { status: 500 }
    );
  }
}
