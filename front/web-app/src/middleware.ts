// middleware.ts (na raiz do projeto)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PREFIX = '/dashboard'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // só protege /dashboard/**
  if (!nextUrl.pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1) precisa estar autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const loginUrl = new URL('/login', req.url) // ajuste se teu login estiver noutro caminho
    loginUrl.searchParams.set('next', nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // 2) precisa ser admin ativo
  const { data: adminRow } = await supabase
    .from('admin')
    .select('estado_utilizador')
    .eq('id', user.id)
    .maybeSingle()

  if (!adminRow || adminRow.estado_utilizador !== 'ativo') {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', 'not_admin')
    return NextResponse.redirect(loginUrl)
  }

  return res
}

// aplica somente em /dashboard/**
export const config = {
  matcher: ['/dashboard/:path*'],
}
