import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  let supabaseResponse = intlResponse ?? NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = intlResponse ?? NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const localePattern = `(?:/(?:ja|en))?`
  const protectedPathRegex = new RegExp(`^${localePattern}/(dashboard|admin)(?:/|$)`)
  const loginPathRegex = new RegExp(`^${localePattern}/login(?:/|$)`)

  const isProtected = protectedPathRegex.test(request.nextUrl.pathname)
  const isLoginPage = loginPathRegex.test(request.nextUrl.pathname)

  const localeMatch = request.nextUrl.pathname.match(/^\/(ja|en)(?:\/|$)/)
  const currentLocale = localeMatch ? localeMatch[1] : routing.defaultLocale

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = `/${currentLocale}/login`
    return NextResponse.redirect(url)
  }

  if (isLoginPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = `/${currentLocale}/dashboard`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
