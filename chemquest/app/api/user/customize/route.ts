import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// GET /api/user/customize - Get character customization
export async function GET() {
  try {
    // Get userId from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        bodyType: true,
        hairColor: true,
        weaponType: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return in the format expected by the customize page
    return NextResponse.json({
      body: user.bodyType || 'strong',
      hair: user.hairColor || 'red',
      weapon: user.weaponType || 'hammer',
    });
  } catch (error) {
    console.error('Failed to fetch character customization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character customization' },
      { status: 500 }
    );
  }
}

// POST /api/user/customize - Save character customization
export async function POST(req: NextRequest) {
  try {
    const { body, hair, weapon } = await req.json();

    // Get userId from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate inputs
    const validBodyTypes = ['athletic', 'strong', 'balanced'];
    const validHairColors = ['blue', 'red', 'purple', 'green', 'black'];
    const validWeapons = ['sword', 'hammer', 'staff'];

    if (body && !validBodyTypes.includes(body)) {
      return NextResponse.json(
        { error: 'Invalid body type' },
        { status: 400 }
      );
    }

    if (hair && !validHairColors.includes(hair)) {
      return NextResponse.json(
        { error: 'Invalid hair color' },
        { status: 400 }
      );
    }

    if (weapon && !validWeapons.includes(weapon)) {
      return NextResponse.json(
        { error: 'Invalid weapon type' },
        { status: 400 }
      );
    }

    // Update user (map short names to DB field names)
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body && { bodyType: body }),
        ...(hair && { hairColor: hair }),
        ...(weapon && { weaponType: weapon }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save character customization:', error);
    return NextResponse.json(
      { error: 'Failed to save character customization' },
      { status: 500 }
    );
  }
}
