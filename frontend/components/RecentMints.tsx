import { ImageIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Separator } from './ui/separator'
import { GlassCard } from './card'
import { AspectRatio } from './ui/aspect-ratio'
import { api } from '@/app/utils/axiosInstance'
import { toast } from 'sonner'
import Link from 'next/link'


// Helper to format owner (userId or address)
function shortOwner(userIdOrAddr: string) {
    if (!userIdOrAddr) return "Unknown";
    if (userIdOrAddr.startsWith("0x")) {
        return userIdOrAddr.slice(0, 6) + "..." + userIdOrAddr.slice(-4);
    }
    return userIdOrAddr.slice(0, 4) + "..." + userIdOrAddr.slice(-4);
}

// Helper to format ISO string to readable
function formatDate(dateStr: string) {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleString()
}

function RecentMints({ recentMints: initialRecentMints }: { recentMints?: any[] }) {
    const [recentMints, setRecentMints] = useState<any[]>(initialRecentMints || [])

    useEffect(() => {

        async function fetchNfts() {
            try {
                const res = await api.get('/nfts')
                console.log(res)
                // Data shape: { data: { nfts: [...] } }
                const nfts: any[] = res.data?.nfts || []

                // Adapt to card display structure
                setRecentMints(
                    nfts.map(nft => ({
                        id: nft.id,
                        tokenId: nft.tokenId,
                        image: nft.image?.s3Key
                            ? nft.image.s3Key.startsWith("http")
                                ? nft.image.s3Key
                                : "https://ipfs.io/ipfs/" + nft.image.ipfsCid
                            : "/placeholder.svg",
                        nftId: "#" + (nft.tokenId || nft.id?.slice(0,4)),
                        timestamp: formatDate(nft.createdAt || nft.image?.createdAt),
                        owner: shortOwner(nft.userId), // Or you can use real address if available
                        name: nft.name || nft.image?.metadata?.name || "",
                        description: nft.description || nft.image?.metadata?.description || "",
                    }))
                )
            } catch (error: any) {
                toast.error(error?.response?.data?.error || "Failed to fetch NFTs")
            }
        }
        fetchNfts()
    }, [])

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex gap-2 items-center">
                    <ImageIcon className="h-5 w-5 text-white/80" /> Recent Mints
                </h2>
                <span className="text-xs text-zinc-400">
                    Showing {recentMints.length}
                </span>
            </div>
            <Separator className="mb-2 bg-white/10" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentMints.map((item: any) => (
                    <div key={item.nftId || item.tokenId}>
                        <Link href={`/nft/${item.tokenId}`}>
                            <GlassCard className="p-0 overflow-hidden border-2 border-white/10 bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/80">
                                <div className="relative">
                                    <AspectRatio ratio={4 / 3}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.image || "/placeholder.svg"}
                                            alt={`NFT ${item.nftId || item.tokenId}`}
                                            className="absolute inset-0 h-full w-full object-cover bg-zinc-900"
                                        />
                                    </AspectRatio>
                                    {/* Removed the "Verified" badge */}
                                </div>
                                <div className="p-3 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-white/90">{item.nftId || item.tokenId}</div>
                                        <div className="text-xs text-zinc-400">{item.timestamp}</div>
                                    </div>
                                    {/* Show name and description */}
                                    {item.name && (
                                        <div className="text-sm font-semibold text-white/80 truncate">{item.name}</div>
                                    )}
                                    {item.description && (
                                        <div className="text-xs text-zinc-300/80 truncate">{item.description}</div>
                                    )}
                                    <div className="text-xs text-zinc-400 mt-1">
                                        Owner {item.owner}
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RecentMints