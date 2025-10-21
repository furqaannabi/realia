import BlockscoutProviders from "@/components/BlockscoutProviders"
import type React from "react"


export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <BlockscoutProviders>
            {children}
        </BlockscoutProviders>
    )
}
