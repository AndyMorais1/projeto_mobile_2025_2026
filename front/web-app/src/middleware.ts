// middleware.ts (na raiz do projeto)
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DASHBOARD_PREFIX = "/dashboard";
const API_RECEIPTS_PREFIX = "/api/receipts";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // só executa para /dashboard/** e /api/receipts/**
  if (
    !pathname.startsWith(DASHBOARD_PREFIX) &&
    !pathname.startsWith(API_RECEIPTS_PREFIX)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  await supabase.auth.getSession();
  if (pathname.startsWith(API_RECEIPTS_PREFIX)) {
    return res;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const { data: adminRow } = await supabase
    .from("admin")
    .select("estado_utilizador")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow || adminRow.estado_utilizador !== "ativo") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "not_admin");
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

// 🚦 aplica na dashboard e na API de recibos
export const config = {
  matcher: ["/dashboard/:path*", "/api/receipts/:path*"],
};
