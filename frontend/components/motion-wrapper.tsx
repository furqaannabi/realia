"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import type { PropsWithChildren } from "react"

export function MotionWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="min-h-dvh"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
