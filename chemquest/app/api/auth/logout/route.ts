export const dynamic = 'force-dynamic';

// Helper to create JSON response (avoiding NextResponse due to Next.js 14 bug)
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST() {
  console.log('[API LOGOUT] Logout request received');
  
  try {
    console.log('[API LOGOUT] Clearing session cookies');
    
    // Create response that clears cookies
    const response = json({ success: true });
    
    // Clear Supabase auth cookies by setting max-age to 0
    response.headers.append('Set-Cookie', `sb-access-token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    response.headers.append('Set-Cookie', `sb-refresh-token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    
    // Also clear legacy cookie during migration
    response.headers.append('Set-Cookie', `chemquest-auth=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    console.log('[API LOGOUT] Logout successful');
    return response;
  } catch (error) {
    console.error('[API LOGOUT] Error:', error);
    return json(
      { error: 'Logout failed' },
      500
    );
  }
}
