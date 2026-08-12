// Shared HTML template for customer-facing transactional emails (sent via
// lib/notifications.ts -> sendEmailNotification()). Renders the same
// navy/teal visual language as the customer dashboard (see
// app/[locale]/globals.css design tokens and
// app/[locale]/dashboard/order-stepper.tsx) so a customer's inbox and
// dashboard feel like the same product: a letterhead header, a polite
// business-toned body, an optional "package details" box, an optional
// arrow-and-circle progress stepper matching the dashboard's stepper, a
// dashboard CTA button, and a closing/footer.
//
// The step-state computation below intentionally mirrors
// app/[locale]/dashboard/order-progress.ts rather than importing it: this
// file must stay usable from any server action (including ones that run
// under RLS as the customer, not just admin actions) without coupling
// lib/ to app-router-specific modules. If the dashboard's step logic
// changes, mirror the change here too.

export type EmailStepState = "done" | "current" | "current-action" | "upcoming"

export type EmailStep = { label: string; state: EmailStepState }

// "\n" marks the natural two-line break used on the dashboard stepper's
// narrow labels -- rendered as <br> in the email.
const SHIPPING_LABELS = [
  "事前申告\n受付",
  "到着確認\n計量中",
  "お見積り",
  "お支払い\n完了",
  "通関書類\n作成",
  "発送完了",
] as const

const PURCHASE_LABELS = [
  "ご依頼\n受付",
  "お見積り\n送付",
  "お支払い",
  "お支払い完了\n入荷待ち",
  "通関書類\n作成",
  "発送完了",
] as const

function invoiceStageState(
  hasInvoice: boolean,
  invoiceStatus?: string | null
): { invoiceState: EmailStepState; shippedState: EmailStepState } {
  if (!hasInvoice || invoiceStatus === "draft" || invoiceStatus === "correction_required") {
    return { invoiceState: "current-action", shippedState: "upcoming" }
  }
  if (invoiceStatus === "customer_submitted") {
    return { invoiceState: "current", shippedState: "upcoming" }
  }
  return { invoiceState: "done", shippedState: "current" }
}

/** Shipping-agency flow steps, for the email stepper. Mirrors computeShippingSteps(). */
export function shippingEmailSteps(params: {
  hasPackage: boolean
  packageStatus?: string
  hasInvoice?: boolean
  invoiceStatus?: string | null
}): EmailStep[] {
  const states: EmailStepState[] = ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]

  if (!params.hasPackage) {
    states[0] = "current"
    return SHIPPING_LABELS.map((label, i) => ({ label, state: states[i] }))
  }

  states[0] = "done"

  switch (params.packageStatus) {
    case "missing":
      states[1] = "current"
      break
    case "quoted":
      states[1] = "done"
      states[2] = "done"
      states[3] = "current-action"
      break
    case "paid": {
      states[1] = "done"
      states[2] = "done"
      states[3] = "done"
      const { invoiceState, shippedState } = invoiceStageState(Boolean(params.hasInvoice), params.invoiceStatus)
      states[4] = invoiceState
      states[5] = shippedState
      break
    }
    case "shipped":
      states[1] = "done"
      states[2] = "done"
      states[3] = "done"
      states[4] = "done"
      states[5] = "done"
      break
    default:
      break
  }

  return SHIPPING_LABELS.map((label, i) => ({ label, state: states[i] }))
}

/** Purchase-agency flow steps, for the email stepper. Mirrors computePurchaseSteps(). */
export function purchaseEmailSteps(params: {
  requestStatus?: string
  linkedPackageStatus?: string
  hasInvoice?: boolean
  invoiceStatus?: string | null
}): EmailStep[] {
  const states: EmailStepState[] = ["done", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]

  if (params.linkedPackageStatus) {
    states[1] = "done"
    states[2] = "done"

    switch (params.linkedPackageStatus) {
      case "missing":
        states[3] = "current"
        break
      case "paid": {
        states[3] = "done"
        const { invoiceState, shippedState } = invoiceStageState(Boolean(params.hasInvoice), params.invoiceStatus)
        states[4] = invoiceState
        states[5] = shippedState
        break
      }
      case "shipped":
        states[3] = "done"
        states[4] = "done"
        states[5] = "done"
        break
      default:
        break
    }

    return PURCHASE_LABELS.map((label, i) => ({ label, state: states[i] }))
  }

  switch (params.requestStatus) {
    case "submitted":
      states[1] = "current"
      break
    case "quote_sent":
    case "awaiting_payment":
      states[1] = "done"
      states[2] = "current-action"
      break
    case "paid":
    case "purchasing":
      states[1] = "done"
      states[2] = "done"
      states[3] = "current"
      break
    default:
      break
  }

  return PURCHASE_LABELS.map((label, i) => ({ label, state: states[i] }))
}

export type EmailPackageDetails = {
  itemName?: string | null
  invoiceNumber?: string | null
  trackingNumber?: string | null
  weightKg?: number | null
  amountCaption?: string | null
  amountLabel?: string | null
  statusBadge?: string | null
}

export const DASHBOARD_URL = `${process.env.NEXT_PUBLIC_SITE_URL || "https://usajusho-app.vercel.app"}/ja/dashboard`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function detailRow(label: string, value: string, bold = false): string {
  return `<tr>
    <td style="padding:6px 0; width:130px; color:#5B6472; vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0; ${bold ? "font-weight:700; color:#1B2A4A;" : ""}">${value}</td>
  </tr>`
}

function renderDetailsHtml(details?: EmailPackageDetails): string {
  if (!details) return ""
  const rows: string[] = []
  if (details.itemName) rows.push(detailRow("商品名", escapeHtml(details.itemName), true))
  if (details.invoiceNumber) rows.push(detailRow("インボイス番号", escapeHtml(details.invoiceNumber)))
  if (details.trackingNumber) rows.push(detailRow("お問い合わせ番号", escapeHtml(details.trackingNumber)))
  if (details.weightKg != null) rows.push(detailRow("重量", `${details.weightKg} kg`))
  if (details.amountLabel) {
    rows.push(detailRow(details.amountCaption ?? "金額", escapeHtml(details.amountLabel), true))
  }
  if (details.statusBadge) {
    rows.push(`<tr>
      <td style="padding:6px 0; width:130px; color:#5B6472; vertical-align:top;">現在のステータス</td>
      <td style="padding:6px 0;">
        <span style="display:inline-block; background:#FEF3C7; color:#92400E; font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px;">${escapeHtml(details.statusBadge)}</span>
      </td>
    </tr>`)
  }
  if (!rows.length) return ""

  return `
  <tr><td style="padding:0 40px 28px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F6; border-radius:8px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px 0; font-size:12px; font-weight:700; letter-spacing:0.5px; color:#2E6E6A; text-transform:uppercase;">お荷物の詳細</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#1F2328;">
          ${rows.join("")}
        </table>
      </td></tr>
    </table>
  </td></tr>`
}

const STEP_DONE_COLOR = "#2E6E6A"
const STEP_ACTION_COLOR = "#D97706"
const STEP_ARROW_ACTIVE = "#2E6E6A"
const STEP_ARROW_MUTED = "#C7CDD6"

function circleHtml(step: EmailStep, index: number): string {
  if (step.state === "done") {
    return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px; height:28px; border-radius:50%; background:${STEP_DONE_COLOR}; color:#fff; font:700 12px/28px sans-serif; text-align:center;">&#10003;</td></tr></table>`
  }
  if (step.state === "current-action") {
    return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px; height:28px; border-radius:50%; background:${STEP_ACTION_COLOR}; color:#fff; font:700 13px/28px sans-serif; text-align:center;">!</td></tr></table>`
  }
  if (step.state === "current") {
    return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:28px; height:28px; border-radius:50%; background:${STEP_DONE_COLOR}; color:#fff; font:700 12px/28px sans-serif; text-align:center;">${index + 1}</td></tr></table>`
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:26px; height:26px; border-radius:50%; background:#FFFFFF; border:2px solid #D9DEE5; color:#A6ADB8; font:700 11px/24px sans-serif; text-align:center;">${index + 1}</td></tr></table>`
}

function labelStyle(step: EmailStep): string {
  if (step.state === "current-action") return "font-weight:700; color:#92400E;"
  if (step.state === "upcoming") return "color:#A6ADB8;"
  return "color:#5B6472;"
}

export function renderStepperHtml(steps?: EmailStep[]): string {
  if (!steps || !steps.length) return ""

  const circleCells = steps
    .map((step, i) => {
      const circle = `<td align="center" width="13%" style="font-size:0;">${circleHtml(step, i)}</td>`
      if (i === steps.length - 1) return circle
      const arrowColor = step.state === "done" ? STEP_ARROW_ACTIVE : STEP_ARROW_MUTED
      const arrow = `<td align="center" width="6%" style="vertical-align:middle;"><span style="font-size:16px; font-weight:700; color:${arrowColor};">&#8594;</span></td>`
      return circle + arrow
    })
    .join("")

  const labelCells = steps
    .map((step, i) => {
      const labelHtml = escapeHtml(step.label).replace(/\n/g, "<br>")
      const cell = `<td align="center" style="padding-top:8px; font-size:10px; line-height:1.4; ${labelStyle(step)}">${labelHtml}</td>`
      return i === steps.length - 1 ? cell : cell + `<td></td>`
    })
    .join("")

  return `
  <tr><td style="padding:0 40px 32px 40px;">
    <p style="margin:0 0 16px 0; font-size:12px; font-weight:700; letter-spacing:0.5px; color:#2E6E6A; text-transform:uppercase;">配送の進捗状況</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${circleCells}</tr>
      <tr>${labelCells}</tr>
    </table>
  </td></tr>`
}

export type CustomerEmailParams = {
  recipientName?: string | null
  bodyParagraphs: string[]
  details?: EmailPackageDetails
  steps?: EmailStep[]
  ctaLabel?: string
  ctaUrl?: string | null
}

/** Renders the full HTML envelope for a customer-facing transactional email. */
export function renderCustomerEmailHtml(params: CustomerEmailParams): string {
  const greeting = params.recipientName ? `${escapeHtml(params.recipientName)} 様` : "USAJUSHOをご利用のお客様"
  const dateLabel = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })

  const bodyHtml = params.bodyParagraphs
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0; font-size:14px; line-height:1.9; color:#1F2328;">${escapeHtml(p)}</p>`)
    .join("")

  const detailsHtml = renderDetailsHtml(params.details)
  const stepperHtml = renderStepperHtml(params.steps)

  const ctaHtml = params.ctaUrl
    ? `
  <tr><td style="padding:0 40px 32px 40px;" align="center">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#2E6E6A; border-radius:6px;">
      <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block; padding:14px 40px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none;">${escapeHtml(params.ctaLabel ?? "ダッシュボードで確認する")}</a>
    </td></tr></table>
  </td></tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>USAJUSHO</title></head>
<body style="margin:0; padding:0; background:#F2F4F6; font-family:'Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F6; padding:32px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <tr><td style="background:#1B2A4A; padding:28px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:20px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">USAJUSHO</td>
      <td align="right" style="font-size:12px; color:#B9C2D0;">米国 ➜ 日本 転送サービス</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px; background:#2E6E6A; line-height:4px; font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:40px 40px 8px 40px;">
    <p style="margin:0 0 4px 0; font-size:12px; color:#8A93A3; text-align:right;">${dateLabel}</p>
    <p style="margin:0 0 20px 0; font-size:15px; color:#1F2328;">${greeting}</p>
    ${bodyHtml}
  </td></tr>
  ${detailsHtml}
  ${stepperHtml}
  ${ctaHtml}
  <tr><td style="padding:0 40px 32px 40px; border-top:1px solid #EDEFF2;">
    <p style="margin:24px 0 16px 0; font-size:14px; line-height:1.9; color:#1F2328;">
      ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。今後ともUSAJUSHOをよろしくお願いいたします。
    </p>
    <p style="margin:16px 0 0 0; font-size:13px; color:#5B6472; line-height:1.7;">
      USAJUSHO サポートチーム<br>Email：info@usajusho.com
    </p>
  </td></tr>
  <tr><td style="background:#F2F4F6; padding:20px 40px; text-align:center;">
    <p style="margin:0; font-size:11px; color:#8A93A3;">本メールは USAJUSHO のシステムより自動送信されております。</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`
}
