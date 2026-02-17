import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chemquest-secret-key-change-in-production'
);

const COOKIE_NAME = 'chemquest-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  totalCoins: number;
  totalScore: number;
  gamesPlayed: number;
  bestStreak: number;
  prestigeLevel: number;
  lifetimeEarnings: number;
  rank: string;
  campaignXp: number;
  subscriptionTier: string;
  currentRank: string;
  totalXP: number;
}

export interface JWTPayload {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a signed JWT token for a user
 */
export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Set the auth cookie with JWT token
 */
export async function setAuthCookie(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current session user from the auth cookie
 * Returns null if not authenticated
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        totalCoins: true,
        totalScore: true,
        gamesPlayed: true,
        bestStreak: true,
        prestigeLevel: true,
        lifetimeEarnings: true,
        rank: true,
        campaignXp: true,
        subscriptionTier: true,
        currentRank: true,
        totalXP: true,
      },
    });

    if (!user) return null;
    
    // Convert BigInt to number for JSON serialization
    return {
      ...user,
      lifetimeEarnings: Number(user.lifetimeEarnings),
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (middleware helper)
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Check if user has required role
 */
export async function requireRole(roles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
