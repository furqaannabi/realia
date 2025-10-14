"use client"
import useAuth from "@/app/store"
import { api } from "@/app/utils/axiosInstance"
import { config } from "@/app/utils/wallet"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"
import { WagmiProvider } from "wagmi"

const queryClient = new QueryClient()

export async function getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data.user;
}

export default function Provider({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // const { updateUser } = useAuth((state) => state)
    // useEffect(() => {
    //     const setUser = async () => {
    //         const user = await getCurrentUser()

    //         if (user) {
    //             updateUser(user)
    //         }
    //     }
    //     setUser()
    // }, [])
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}