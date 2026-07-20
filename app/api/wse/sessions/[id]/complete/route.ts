import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeSession } from "@/lib/wse/completeSession";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const result = await completeSession(supabase, params.id, user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
