'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { adminUpdateUserContactInfo } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Profile = {
  phone_number: string | null
  japan_postal_code: string | null
  japan_prefecture: string | null
  japan_city: string | null
  japan_address_line1: string | null
  japan_address_line2: string | null
}

export default function ContactInfoForm({
  userId,
  profile,
}: {
  userId: string
  profile: Profile
}) {
  const t = useTranslations('adminUserDetail')
  const tc = useTranslations('contactInfo')
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [japanPostalCode, setJapanPostalCode] = useState(profile.japan_postal_code ?? '')
  const [japanPrefecture, setJapanPrefecture] = useState(profile.japan_prefecture ?? '')
  const [japanCity, setJapanCity] = useState(profile.japan_city ?? '')
  const [japanAddressLine1, setJapanAddressLine1] = useState(profile.japan_address_line1 ?? '')
  const [japanAddressLine2, setJapanAddressLine2] = useState(profile.japan_address_line2 ?? '')

  function openEdit() {
    setPhoneNumber(profile.phone_number ?? '')
    setJapanPostalCode(profile.japan_postal_code ?? '')
    setJapanPrefecture(profile.japan_prefecture ?? '')
    setJapanCity(profile.japan_city ?? '')
    setJapanAddressLine1(profile.japan_address_line1 ?? '')
    setJapanAddressLine2(profile.japan_address_line2 ?? '')
    setError(null)
    setEditing(true)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await adminUpdateUserContactInfo(userId, {
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
        setNotice(t('contactInfoSaved'))
        setEditing(false)
      }
    })
  }

  const japanAddress = [
    profile.japan_postal_code ? `〒${profile.japan_postal_code}` : null,
    profile.japan_prefecture,
    profile.japan_city,
    profile.japan_address_line1,
    profile.japan_address_line2,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-primary">
            {t('contactInfoHeading')}
          </CardTitle>
          {!editing && (
            <Button type="button" variant="outline" size="sm" onClick={openEdit}>
              {t('edit')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notice && (
          <p className="mb-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">{notice}</p>
        )}

        {!editing ? (
          <div className="space-y-1 text-sm text-slate-700">
            <p>
              {tc('phoneNumber')}: {profile.phone_number || t('notSet')}
            </p>
            <p>
              {tc('japanAddressHeading')}: {japanAddress || t('notSet')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{tc('phoneNumber')}</Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tc('japanPostalCode')}</Label>
                <Input
                  type="text"
                  value={japanPostalCode}
                  onChange={(e) => setJapanPostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tc('japanPrefecture')}</Label>
                <Input
                  type="text"
                  value={japanPrefecture}
                  onChange={(e) => setJapanPrefecture(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tc('japanCity')}</Label>
              <Input type="text" value={japanCity} onChange={(e) => setJapanCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{tc('japanAddressLine1')}</Label>
              <Input
                type="text"
                value={japanAddressLine1}
                onChange={(e) => setJapanAddressLine1(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tc('japanAddressLine2')}</Label>
              <Input
                type="text"
                value={japanAddressLine2}
                onChange={(e) => setJapanAddressLine2(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
                {t('save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setEditing(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
