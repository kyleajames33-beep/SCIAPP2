import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || ''

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-me`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    }
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
