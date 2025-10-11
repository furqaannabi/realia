"use client"

import { Badge } from "@/components/ui/badge"

export function StepBadge({
  step,
  label,
  active,
  done,
  className,
}: {
  step: number
  label: string
  active?: boolean
  done?: boolean
  className?: string
}) {
  const variant = done ? "secondary" : active ? "default" : "outline"
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Badge variant={variant as any} className="rounded-full">
        {step}
      </Badge>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
