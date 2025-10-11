import { cn } from "@/lib/utils"
import type { PropsWithChildren } from "react"

export function GlassCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-glass border border-white/10 backdrop-blur-xl p-4 md:p-5",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
