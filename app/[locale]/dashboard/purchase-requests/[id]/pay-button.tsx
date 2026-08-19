"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { payPurchaseRequestWithCard } from "../actions"
import SquareCardPayment from "@/components/square-card-payment"
import type { BillingContact } from "@/lib/square"

export default function PayButton({
  requestId,
  squareConfig,
  amountLabel,
  amount,
  billingContact,
}: {
  requestId: string
  squareConfig: { mode: "sandbox" | "production"; applicationId: string; locationId: string }
  amountLabel: string
  amount: string
  billingContact?: BillingContact
}) {
  const t = useTranslations("purchaseRequests")
  const router = useRouter()

  return (
    <SquareCardPayment
      mode={squareConfig.mode}
      applicationId={squareConfig.applicationId}
      locationId={squareConfig.locationId}
      action={(sourceId) => payPurchaseRequestWithCard(requestId, sourceId)}
      triggerLabel={t("payButton")}
      dialogTitle={t("cardPayDialogTitle")}
      amountLabel={amountLabel}
      amount={amount}
      billingContact={billingContact}
      postalCodeHint={t("cardPayPostalCodeHint")}
      submitLabel={t("cardPaySubmit")}
      submittingLabel={t("cardPaySubmitting")}
      genericErrorLabel={t("cardPayError")}
      successLabel={t("cardPaySuccess")}
      onSuccess={() => router.refresh()}
    />
  )
}
