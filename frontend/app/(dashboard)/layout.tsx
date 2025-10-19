import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { MotionWrapper } from "@/components/motion-wrapper"
import { Suspense } from "react"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Suspense>
          <MotionWrapper>{children}</MotionWrapper>
        </Suspense>
      </main>
    </div>
  )
}
