'use client'

import { Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function LoginForm() {
  const t = useTranslations('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const justConfirmed = searchParams.get('confirmed') === '1'
  const confirmError = searchParams.get('confirm_error') === '1'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--usj-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">{t('title')}</CardTitle>
          <CardDescription>Sign in to USAJUSHO</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {justConfirmed && (
              <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {t('emailConfirmed')}
              </p>
            )}
            {confirmError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t('emailConfirmError')}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t('email')}</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">{t('password')}</Label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t('submitting') : t('submit')}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              {t('noAccount')}{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                {t('signupLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
