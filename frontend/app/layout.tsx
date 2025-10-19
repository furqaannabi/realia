
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
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
          
            {children}
            <Toaster />

        </Provider>
      </body>
    </html>
  )
}
