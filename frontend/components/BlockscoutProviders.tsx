"use client"

import { NotificationProvider, TransactionPopupProvider } from "@blockscout/app-sdk"



export default function BlockscoutProviders({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {

    return (
        <NotificationProvider>
            <TransactionPopupProvider>
                {children}
            </TransactionPopupProvider>
        </NotificationProvider>
    )
}