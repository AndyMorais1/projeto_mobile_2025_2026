// src/app/api/auth/set/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "missing tokens" }, { status: 400 });
  }

  // ✅ Next 15: cookies() é assíncrono
  // ✅ passe uma função que retorna o cookieStore atual
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
