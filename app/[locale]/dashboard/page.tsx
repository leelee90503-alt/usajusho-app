import { getTranslations, getLocale } from 'next-intl/server'
import { redirect, Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSquareClientConfig } from '@/lib/square'
import SignOutButton from './sign-out-button'
import PackageList from './package-list'
import PendingOrderList from './pending-order-list'
import NotificationBell from './notification-bell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Receipt, PackagePlus, ShoppingCart, UserRound } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/login', locale })
    return
  }

  const t = await getTranslations('dashboard')

  // getSquareClientConfig() throws until SQUARE_APPLICATION_ID_* is set -
  // degrade gracefully (pay buttons simply don't render their card form)
  // rather than 500ing the whole dashboard if it isn't configured yet.
  const squareConfig = await getSquareClientConfig().catch(() => null)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: shippingSettings } = await supabase
    .from('shipping_settings')
    .select('suite_number_enabled')
    .eq('id', 1)
    .single()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: declarations } = await supabase
    .from('package_declarations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: purchaseRequests } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // A declaration that has been matched, or a purchase request that has
  // been purchased, continues its lifecycle as a row in the packages
  // table -- it already shows up there, so excluding those statuses here
  // avoids listing the same order twice. Cancelled/refunded requests are
  // a closed dead end, not an order still in progress, so they are
  // excluded too.
  const pendingPackages = (packages ?? []).filter((pkg) => pkg.status !== 'shipped')
  const completedPackages = (packages ?? []).filter((pkg) => pkg.status === 'shipped')
  const pendingDeclarations = (declarations ?? []).filter((d) => d.status === 'pending')
  const pendingPurchaseRequests = (purchaseRequests ?? []).filter(
    (r) => !['purchased', 'cancelled', 'refunded'].includes(r.status)
  )

  const pendingOrderCount =
    pendingPackages.length + pendingDeclarations.length + pendingPurchaseRequests.length

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Additional charges (e.g. weight-adjustment fees) issued against the
  // user's packages -- only non-final statuses are worth showing on the
  // dashboard, since paid/cancelled/refunded ones don't need customer
  // action. Grouped by package_id so each package card can render its own.
  const { data: additionalChargesData } = await supabase
    .from('additional_charges')
    .select('id, package_id, reason, amount_cents, status')
    .eq('user_id', user.id)
    .in('status', ['pending', 'awaiting_payment'])
    .order('created_at', { ascending: false })

  type AdditionalCharge = {
    id: string
    package_id: string
    reason: string
    amount_cents: number
    status: string
  }

  const additionalChargesByPackageId: Record<string, AdditionalCharge[]> = {}
  for (const charge of (additionalChargesData ?? []) as AdditionalCharge[]) {
    const list = additionalChargesByPackageId[charge.package_id] ?? []
    list.push(charge)
    additionalChargesByPackageId[charge.package_id] = list
  }

  // Inspection photos the admin attached when the quote was issued (see
  // resolveMissingPackage() in app/[locale]/admin/packages/actions.ts) --
  // signed so the customer can view the private "package-photos" bucket.
  const packageIds = (packages ?? []).map((pkg) => pkg.id)
  const { data: packagePhotosData } =
    packageIds.length > 0
      ? await supabase
          .from('package_photos')
          .select('id, package_id, storage_path')
          .in('package_id', packageIds)
          .order('created_at', { ascending: true })
      : { data: [] as { id: string; package_id: string; storage_path: string }[] }

  const photosByPackageId: Record<string, { id: string; url: string }[]> = {}
  await Promise.all(
    (packagePhotosData ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from('package-photos')
        .createSignedUrl(photo.storage_path, 60 * 60)
      if (!signed?.signedUrl) return
      const list = photosByPackageId[photo.package_id] ?? []
      list.push({ id: photo.id, url: signed.signedUrl })
      photosByPackageId[photo.package_id] = list
    })
  )

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <UserRound className="h-4 w-4" />
            {t("profileLink")}
          </Link>
          <Link
            href="/dashboard/purchase-requests"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("purchaseRequestsLink")}
          </Link>
          <Link
            href="/dashboard/declarations"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <PackagePlus className="h-4 w-4" />
            {t("declarationsLink")}
          </Link>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Receipt className="h-4 w-4" />
            {t("invoicesLink")}
          </Link>
          <NotificationBell notifications={notifications ?? []} />
          <SignOutButton />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("welcome", { name: profile?.full_name || user.email })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>

        {profile && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" />
                {t('myAddress')} / Your US Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 text-sm text-slate-700">
              <p>{profile.full_name}</p>
              <p>{profile.us_address_line1}</p>
              {shippingSettings?.suite_number_enabled && (
                <p className="font-semibold">{profile.us_address_line2}</p>
              )}
              <p>
                {profile.us_city}, {profile.us_state} {profile.us_zip}
              </p>
              <p>United States</p>
              <p className="pt-3 text-xs text-muted-foreground">
                {t("addressNote")}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">
            {t("myPackages")}
          </h3>
          <Tabs defaultValue="pending" className="mt-3">
            <TabsList>
              <TabsTrigger value="pending">
                {t("tabPending")} ({pendingOrderCount})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {t("tabCompleted")} ({completedPackages.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <PendingOrderList
                packages={pendingPackages.map((pkg) => ({ kind: 'package' as const, ...pkg }))}
                declarations={pendingDeclarations.map((d) => ({ kind: 'declaration' as const, ...d }))}
                purchaseRequests={pendingPurchaseRequests.map((r) => ({ kind: 'purchaseRequest' as const, ...r }))}
                profile={profile ?? null}
                additionalCharges={additionalChargesByPackageId}
                photosByPackageId={photosByPackageId}
                squareConfig={squareConfig}
              />
            </TabsContent>
            <TabsContent value="completed">
              <PackageList
                packages={completedPackages}
                profile={profile ?? null}
                emptyVariant="completed"
                additionalCharges={additionalChargesByPackageId}
                photosByPackageId={photosByPackageId}
                squareConfig={squareConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
