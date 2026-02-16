import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getItemById } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get item details from shop data
    const item = getItemById(itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalCoins: true,
        ownedItems: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already owns this item
    if (currentUser.ownedItems.includes(itemId)) {
      return NextResponse.json(
        { error: "Item already owned" },
        { status: 409 }
      );
    }

    // Check if user has enough coins
    if (currentUser.totalCoins < item.price) {
      return NextResponse.json(
        {
          error: "Insufficient funds",
          required: item.price,
          current: currentUser.totalCoins,
          shortfall: item.price - currentUser.totalCoins,
        },
        { status: 402 }
      );
    }

    // Perform purchase: deduct coins and add to owned items
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalCoins: { decrement: item.price },
        ownedItems: { push: itemId },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Purchased ${item.name}!`,
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        icon: item.icon,
      },
      remainingCoins: updatedUser.totalCoins,
      ownedItems: updatedUser.ownedItems,
    });
  } catch (error) {
    console.error("Shop purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
