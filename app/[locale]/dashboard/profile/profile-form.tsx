'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateContactInfo } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Profile = {
  full_name: string | null
  email: string
  phone_number: string | null
  japan_postal_code: string | null
  japan_prefecture: string | null
  japan_city: string | null
  japan_address_line1: string | null
  japan_address_line2: string | null
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations('profileForm')
  const tc = useTranslations('contactInfo')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [japanPostalCode, setJapanPostalCode] = useState(profile.japan_postal_code ?? '')
  const [japanPrefecture, setJapanPrefecture] = useState(profile.japan_prefecture ?? '')
  const [japanCity, setJapanCity] = useState(profile.japan_city ?? '')
  const [japanAddressLine1, setJapanAddressLine1] = useState(profile.japan_address_line1 ?? '')
  const [japanAddressLine2, setJapanAddressLine2] = useState(profile.japan_address_line2 ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateContactInfo({
        phone_number: phoneNumber,
        japan_postal_code: japanPostalCode,
        japan_prefecture: japanPrefecture,
        japan_city: japanCity,
        japan_address_line1: japanAddressLine1,
        japan_address_line2: japanAddressLine2,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t('nameLabel')}</Label>
        <p className="text-sm text-slate-700">{profile.full_name || '—'}</p>
      </div>

      <div className="space-y-1.5">
        <Label>{t('emailLabel')}</Label>
        <p className="text-sm text-slate-700">{profile.email}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-phone">{tc('phoneNumber')}</Label>
        <Input
          id="profile-phone"
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
          <Label htmlFor="profile-postal-code">{tc('japanPostalCode')}</Label>
          <Input
            id="profile-postal-code"
            type="text"
            autoComplete="postal-code"
            required
            value={japanPostalCode}
            onChange={(e) => setJapanPostalCode(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-prefecture">{tc('japanPrefecture')}</Label>
          <Input
            id="profile-prefecture"
            type="text"
            autoComplete="address-level1"
            required
            value={japanPrefecture}
            onChange={(e) => setJapanPrefecture(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-city">{tc('japanCity')}</Label>
        <Input
          id="profile-city"
          type="text"
          autoComplete="address-level2"
          required
          value={japanCity}
          onChange={(e) => setJapanCity(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-address-1">{tc('japanAddressLine1')}</Label>
        <Input
          id="profile-address-1"
          type="text"
          autoComplete="address-line1"
          required
          value={japanAddressLine1}
          onChange={(e) => setJapanAddressLine1(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-address-2">{tc('japanAddressLine2')}</Label>
        <Input
          id="profile-address-2"
          type="text"
          autoComplete="address-line2"
          value={japanAddressLine2}
          onChange={(e) => setJapanAddressLine2(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">{t('saveSuccess')}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
