// Pure step-state computation for the per-order progress stepper shown on
// the customer dashboard. Kept separate from order-stepper.tsx (the visual
// component) so the status -> step mapping can be reasoned about and tested
// on its own.
//
// Two flows exist, mirroring the two workflow rows on the admin dashboard
// (see app/[locale]/admin/page.tsx):
//  - shipping flow: a pre-declared item becomes a package, gets weighed and
//    quoted, gets paid, needs a commercial invoice, then ships.
//  - purchase-agency flow: a purchase request gets quoted, paid, bought and
//    warehoused (at which point it continues as a package, skipping the
//    shipping flow's own "quoted" step since shipping was already
//    collected up front), needs a commercial invoice, then ships.
//
// Each step's state reflects a completed MILESTONE, not the raw backend
// status directly -- e.g. packages.status === "quoted" means the quote step
// itself is done and the very next thing outstanding is payment, so the
// step that lights up as "the customer needs to act" is Payment, not Quote.

// "current-info" is like "current-action" (the customer's eye should land
// here) but nothing is actually pending on the customer -- e.g. we haven't
// started the commercial invoice yet, so it's on us, not them.
export type StepState = "done" | "current" | "current-action" | "current-info" | "upcoming" | "locked"

export type Step = {
  label: string
  state: StepState
}

// Six labels, in order, for each flow.
export type ShippingStepLabels = [string, string, string, string, string, string]
export type PurchaseStepLabels = [string, string, string, string, string, string]

function invoiceStageState(hasInvoice: boolean, invoiceStatus: string | null | undefined): {
  invoiceState: StepState
  shippedState: StepState
} {
  if (!hasInvoice) {
    // Admin hasn't started the commercial invoice yet -- this is on us, not
    // the customer, so it's informational rather than an action prompt.
    return { invoiceState: "current-info", shippedState: "upcoming" }
  }
  if (invoiceStatus === "draft" || invoiceStatus === "correction_required") {
    return { invoiceState: "current-action", shippedState: "upcoming" }
  }
  if (invoiceStatus === "customer_submitted") {
    return { invoiceState: "current", shippedState: "upcoming" }
  }
  // "complete" (or any other terminal status) -- invoice is out of the way,
  // shipping itself is the next thing waiting on the admin.
  return { invoiceState: "done", shippedState: "current" }
}

/**
 * Shipping-agency flow: Declaration Received -> Arrival Check -> Quote ->
 * Payment -> Customs Invoice -> Shipped.
 */
export function computeShippingSteps(
  labels: ShippingStepLabels,
  params: {
    hasPackage: boolean
    packageStatus?: string
    hasInvoice?: boolean
    invoiceStatus?: string | null
  }
): Step[] {
  const states: StepState[] = ["locked", "locked", "locked", "locked", "locked", "locked"]

  if (!params.hasPackage) {
    // Only a declaration exists so far -- everything past "received" is a
    // preview of the journey still to come, not yet reachable.
    states[0] = "current"
    return labels.map((label, i) => ({ label, state: states[i] }))
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
      const { invoiceState, shippedState } = invoiceStageState(
        Boolean(params.hasInvoice),
        params.invoiceStatus
      )
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

  for (let i = 1; i < states.length; i++) {
    if (states[i] === "locked") states[i] = "upcoming"
  }

  return labels.map((label, i) => ({ label, state: states[i] }))
}

/**
 * Purchase-agency flow: Request Received -> Quote Sent -> Payment ->
 * Paid/Awaiting Arrival -> Customs Invoice -> Shipped.
 *
 * Once a request is purchased it stops existing as a "request" on the
 * dashboard and continues as its linked package (source_purchase_request_id
 * set) -- pass linkedPackageStatus in that case instead of requestStatus.
 */
export function computePurchaseSteps(
  labels: PurchaseStepLabels,
  params: {
    requestStatus?: string
    linkedPackageStatus?: string
    hasInvoice?: boolean
    invoiceStatus?: string | null
  }
): Step[] {
  const states: StepState[] = ["done", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]

  if (params.linkedPackageStatus) {
    states[1] = "done"
    states[2] = "done"

    switch (params.linkedPackageStatus) {
      case "missing":
        states[3] = "current"
        break
      case "paid": {
        states[3] = "done"
        const { invoiceState, shippedState } = invoiceStageState(
          Boolean(params.hasInvoice),
          params.invoiceStatus
        )
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

    return labels.map((label, i) => ({ label, state: states[i] }))
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

  return labels.map((label, i) => ({ label, state: states[i] }))
}
