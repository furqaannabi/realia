
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Sidebar } from "@/components/sidebar"
import { MotionWrapper } from "@/components/motion-wrapper"
import "./globals.css"
import { Suspense } from "react"
import Provider from "@/components/Provider"

import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Realia",
  description: "Realia",
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Provider>
          <div className="flex min-h-dvh w-full bg-background">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <Suspense>
                <MotionWrapper>{children}</MotionWrapper>
              </Suspense>
            </main>
          </div>
          <Toaster />
        </Provider>
        {/* Analytics component removed */}
      </body>
    </html>
  )
}
