'use client'

import { Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MailCheck } from 'lucide-react'
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

function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword')
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Supabase's resetPasswordForEmail() succeeds even for an unregistered
  // email (it doesn't reveal whether the account exists), so always show
  // the same "check your email" screen rather than a per-address result.
  const [submitted, setSubmitted] = useState(false)

  const resetError = searchParams.get('reset_error') === '1'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--usj-surface)] px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MailCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-bold text-primary">
              {t('checkEmailTitle')}
            </CardTitle>
            <CardDescription>{t('checkEmailDescription', { email })}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">{t('goToLogin')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--usj-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {resetError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t('resetError')}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="forgot-password-email">{t('email')}</Label>
              <Input
                id="forgot-password-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('backToLogin')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
