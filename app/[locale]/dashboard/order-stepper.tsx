import { Check, AlertCircle } from "lucide-react"
import type { Step } from "./order-progress"

const NODE_CLASS: Record<Step["state"], string> = {
  done: "bg-accent text-white",
  current: "bg-accent text-white step-node-pulse-current",
  "current-action": "bg-amber-500 text-white step-node-pulse-action",
  "current-info": "bg-amber-500 text-white step-node-pulse-action",
  upcoming: "border-2 border-slate-300 bg-white text-slate-400",
  locked: "border-2 border-dashed border-slate-300 bg-[var(--usj-surface)] text-slate-300",
}

const LABEL_CLASS: Record<Step["state"], string> = {
  done: "text-slate-700",
  current: "text-primary font-semibold",
  "current-action": "text-primary font-semibold",
  "current-info": "text-primary font-semibold",
  upcoming: "text-muted-foreground",
  locked: "text-slate-300",
}

export default function OrderStepper({
  steps,
  actionLabel,
  infoLabel,
}: {
  steps: Step[]
  actionLabel?: string
  infoLabel?: string
}) {
  return (
    <div className="mt-4 flex overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const previousDone = index > 0 && steps[index - 1].state === "done"
        return (
          <div key={index} className="relative flex min-w-[68px] flex-1 flex-col items-center">
            {index > 0 && (
              <div
                className={`absolute top-[15px] right-1/2 h-0.5 w-full ${
                  previousDone ? "bg-accent" : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${NODE_CLASS[step.state]}`}
            >
              {step.state === "done" ? (
                <Check className="h-4 w-4" />
              ) : step.state === "current-action" || step.state === "current-info" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <p className={`mt-2 max-w-[76px] text-center text-[10px] leading-tight ${LABEL_CLASS[step.state]}`}>
              {step.label}
            </p>
            {step.state === "current-action" && actionLabel && (
              <span className="mt-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                {actionLabel}
              </span>
            )}
            {step.state === "current-info" && infoLabel && (
              <span className="mt-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                {infoLabel}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
