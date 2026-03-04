import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chemquest-secret-key-change-in-production'
);

const COOKIE_NAME = 'chemquest-auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/hub', '/campaign', '/battle', '/training', '/shop', '/profile', '/dashboard'];

// Routes that should redirect to hub if already authenticated
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

// Premium campaign worlds (modules 2-8) that require 'pro' subscription
const PREMIUM_WORLD_PATTERNS = [
  /^\/campaign\/module-[2-8]/,  // /campaign/module-2 through /campaign/module-8
  /^\/campaign\/2/,             // /campaign/2 through /campaign/8 (alternative URLs)
  /^\/campaign\/3/,
  /^\/campaign\/4/,
  /^\/campaign\/5/,
  /^\/campaign\/6/,
  /^\/campaign\/7/,
  /^\/campaign\/8/,
];

// Decode JWT payload without verification (for extracting subscription tier)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Check if the path is a premium campaign route
function isPremiumCampaignRoute(pathname: string): boolean {
  return PREMIUM_WORLD_PATTERNS.some(pattern => pattern.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Check if the current path matches any protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  let isValidToken = false;
  let subscriptionTier = 'free';
  let payload: Record<string, unknown> | null = null;

  if (token) {
    try {
      // Verify token first
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
      
      // Extract subscription tier from token payload
      payload = decodeJwtPayload(token);
      subscriptionTier = (payload?.subscriptionTier as string) || 'free';
    } catch {
      // Token invalid/expired — treated as unauthenticated
      isValidToken = false;
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check subscription gating for premium campaign content
  if (isValidToken && isPremiumCampaignRoute(pathname)) {
    // Free users trying to access premium worlds (2-8) → redirect to pricing
    if (subscriptionTier === 'free') {
      const pricingUrl = new URL('/pricing', request.url);
      pricingUrl.searchParams.set('reason', 'premium_content');
      pricingUrl.searchParams.set('attempted', pathname);
      return NextResponse.redirect(pricingUrl);
    }
  }

  // Redirect authenticated users away from auth pages to hub
  if (isAuthRoute && isValidToken) {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hub/:path*',
    '/campaign/:path*',
    '/battle/:path*',
    '/training/:path*',
    '/shop/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/auth/:path*',
    '/pricing/:path*',
  ],
};
