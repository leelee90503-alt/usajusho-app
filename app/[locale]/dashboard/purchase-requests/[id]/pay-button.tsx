"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { payPurchaseRequestWithCard } from "../actions"
import SquareCardPayment from "@/components/square-card-payment"

export default function PayButton({
  requestId,
  squareConfig,
  amountLabel,
}: {
  requestId: string
  squareConfig: { mode: "sandbox" | "production"; applicationId: string; locationId: string }
  amountLabel: string
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
      submitLabel={t("cardPaySubmit")}
      submittingLabel={t("cardPaySubmitting")}
      genericErrorLabel={t("cardPayError")}
      successLabel={t("cardPaySuccess")}
      onSuccess={() => router.refresh()}
    />
  )
}
