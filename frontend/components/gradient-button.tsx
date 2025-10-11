"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

export function GradientButton({
  className,
  children,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" }) {
  if (variant === "outline") {
    return (
      <button
        {...props}
        className={cn(
          "relative rounded-xl px-4 py-2 text-sm transition",
          "bg-transparent border border-white/15 hover:bg-white/5",
          className,
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      {...props}
      className={cn(
        "rounded-xl px-4 py-2 text-sm text-background",
        "bg-brand-gradient shadow-[0_8px_24px_rgba(99,102,241,0.35)]",
        "transition focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
