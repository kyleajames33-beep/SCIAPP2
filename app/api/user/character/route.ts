import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse as json } from "next/server";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return json.json({ error: "Unauthorized" }, { status: 401 });

  const { characterChoice } = await req.json();
  if (!["electron", "proton", "neutron"].includes(characterChoice)) {
    return json.json({ error: "Invalid character" }, { status: 400 });
  }

  await db.from("User").update({ characterChoice }).eq("id", user.id);
  return json.json({ ok: true });
}