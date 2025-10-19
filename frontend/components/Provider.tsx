"use client"
import { api } from "@/app/utils/axiosInstance"
import { config } from "@/app/utils/wallet"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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