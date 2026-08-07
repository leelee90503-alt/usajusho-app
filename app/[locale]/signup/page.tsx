'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
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

export default function SignupPage() {
  const t = useTranslations('signup')
  const tc = useTranslations('contactInfo')
  const supabase = createClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [japanPostalCode, setJapanPostalCode] = useState('')
  const [japanPrefecture, setJapanPrefecture] = useState('')
  const [japanCity, setJapanCity] = useState('')
  const [japanAddressLine1, setJapanAddressLine1] = useState('')
  const [japanAddressLine2, setJapanAddressLine2] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Once signUp() succeeds, Supabase requires email confirmation before a
  // session exists - there is no dashboard to send the user to yet, so we
  // show a "check your email" screen here instead of navigating away.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone_number: phoneNumber,
          japan_postal_code: japanPostalCode,
          japan_prefecture: japanPrefecture,
          japan_city: japanCity,
          japan_address_line1: japanAddressLine1,
          japan_address_line2: japanAddressLine2,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmittedEmail(email)
    setLoading(false)
  }

  if (submittedEmail) {
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
            <CardDescription>
              {t('checkEmailDescription', { email: submittedEmail })}
            </CardDescription>
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
          <CardDescription>Create your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-firstname">{t('firstName')}</Label>
                <Input
                  id="signup-firstname"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-lastname">{t('lastName')}</Label>
                <Input
                  id="signup-lastname"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email">{t('email')}</Label>
              <Input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-phone">{tc('phoneNumber')}</Label>
              <Input
                id="signup-phone"
                type="tel"
                autoComplete="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">{tc('japanAddressHeading')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-postal-code">{tc('japanPostalCode')}</Label>
                <Input
                  id="signup-postal-code"
                  type="text"
                  autoComplete="postal-code"
                  required
                  value={japanPostalCode}
                  onChange={(e) => setJapanPostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-prefecture">{tc('japanPrefecture')}</Label>
                <Input
                  id="signup-prefecture"
                  type="text"
                  autoComplete="address-level1"
                  required
                  value={japanPrefecture}
                  onChange={(e) => setJapanPrefecture(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-city">{tc('japanCity')}</Label>
              <Input
                id="signup-city"
                type="text"
                autoComplete="address-level2"
                required
                value={japanCity}
                onChange={(e) => setJapanCity(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-address-1">{tc('japanAddressLine1')}</Label>
              <Input
                id="signup-address-1"
                type="text"
                autoComplete="address-line1"
                required
                value={japanAddressLine1}
                onChange={(e) => setJapanAddressLine1(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-address-2">{tc('japanAddressLine2')}</Label>
              <Input
                id="signup-address-2"
                type="text"
                autoComplete="address-line2"
                value={japanAddressLine2}
                onChange={(e) => setJapanAddressLine2(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 border-t border-border pt-4">
              <Label htmlFor="signup-password">{t('password')}</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm-password">{t('confirmPassword')}</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {t('hasAccount')}{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('loginLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
