import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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
 * TEMPORARY: Returns mock user data from JWT without database lookup
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

    // TEMPORARY: Return mock user data from JWT (no database lookup)
    return {
      id: payload.userId,
      username: payload.username,
      displayName: payload.displayName,
      email: null,
      role: payload.role,
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      bestStreak: 0,
      prestigeLevel: 0,
      lifetimeEarnings: 0,
      rank: 'Bronze',
      campaignXp: 0,
      subscriptionTier: 'free',
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
