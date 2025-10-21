"use client"

import { GlassCard } from "@/components/card"
import { AnimatePresence } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, TimerIcon, ExternalLink } from "lucide-react"
import RecentMints from "@/components/RecentMints"
import { useEffect, useState } from "react"
import { getPendingVerifications, getVerificationProgress } from "../../utils/web3/blockscout"
import { api } from "../../utils/axiosInstance"
import { toast } from "sonner"

// --- Skeleton loader components for dashboard cards ---
function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-700/50 rounded ${className}`} />
  );
}
function CardSkeleton() {
  return (
    <GlassCard className="col-span-2 p-0 overflow-hidden h-full">
      <div className="relative h-full">
        <AspectRatio ratio={16 / 9} className="h-full">
          <SkeletonBox className="absolute inset-0 w-full h-full min-h-full" />
        </AspectRatio>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-5 md:px-7 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-zinc-900/60 via-zinc-900/5 to-transparent rounded-b-xl">
          <div className="space-y-1 w-48">
            <SkeletonBox className="h-3 w-20 mb-2" />
            <SkeletonBox className="h-6 w-24 mb-2" />
            <SkeletonBox className="h-3 w-36 mb-2" />
            <SkeletonBox className="h-3 w-40" />
          </div>
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </GlassCard>
  )
}
function StatsSkeleton() {
  return (
    <GlassCard className="bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/90 border-2 border-white/10">
      <div className="mb-2 flex items-center justify-between">
        <SkeletonBox className="h-6 w-44" />
      </div>
      <Separator className="mb-3 bg-white/10" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col gap-2"
          >
            <SkeletonBox className="h-2 w-20 mb-1" />
            <SkeletonBox className="h-5 w-16 mb-1" />
            <SkeletonBox className="h-2 w-16" />
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
function QueueSkeleton() {
  return (
    <GlassCard className="bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/90 border-2 border-white/10">
      <div className="flex items-center justify-between mb-2">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-4 w-10" />
      </div>
      <Separator className="mb-3 bg-white/10" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 bg-white/5 rounded-lg px-3 py-2 border border-white/10 shadow"
          >
            <SkeletonBox className="h-4 w-4 mt-1" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <SkeletonBox className="h-4 w-24 rounded" />
                <SkeletonBox className="h-3 w-20 rounded" />
              </div>
              <SkeletonBox className="h-3 w-28 mb-1" />
              <div className="flex items-center gap-2 mt-1 text-xs">
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-3 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
// -----------------------------------------------------

const BLOCKSCOUT_BASE_URL = "https://arbitrum-realia.cloud.blockscout.com"

// Keep static network stats, but the pending verifications stat will be updated
const baseStats = [
  { label: "Authentic Images", value: "12,438", delta: "+3.1% this week" },
  { label: "Verification Requests", value: "3,209", delta: "+1.8% this week" },
  { label: "Verifier Agents", value: "72", delta: "stable" },
]

const recentMints = [
  {
    image: "/urban-street-photo-night.jpg",
    nftId: "#A1F3",
    timestamp: "2025-10-08 14:22",
    owner: "0x8f9a...b12c",
    status: "Verified",
  },
  {
    image: "/portrait-studio.png",
    nftId: "#A1ED",
    timestamp: "2025-10-08 11:03",
    owner: "0x71d3...5af0",
    status: "Verified",
  },
  {
    image: "/wildlife-photography-eagle.jpg",
    nftId: "#A1E8",
    timestamp: "2025-10-07 19:44",
    owner: "0xcc00...129a",
    status: "Verified",
  },
  {
    image: "/architecture-minimal-facade.jpg",
    nftId: "#A1D9",
    timestamp: "2025-10-07 07:31",
    owner: "0x3f44...7e20",
    status: "Verified",
  },
  {
    image: "/landscape-mountains-sunrise.jpg",
    nftId: "#A1C2",
    timestamp: "2025-10-06 16:10",
    owner: "0x8888...abcd",
    status: "Verified",
  },
  {
    image: "/macro-flower-dew-drops.jpg",
    nftId: "#A1B7",
    timestamp: "2025-10-06 09:55",
    owner: "0x1234...ef90",
    status: "Verified",
  },
]

// Utility to shorten addresses like 0x1234...abcd
function shortAddress(addr: string) {
  if (!addr || !addr.startsWith("0x") || addr.length < 10) return addr
  return addr.slice(0, 6) + "..." + addr.slice(-4)
}

export default function DashboardPage() {
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [featuredNft, setFeaturedNft] = useState<any>(null)
  const [nftLoading, setNftLoading] = useState(true)
  const [nfts, setNfts] = useState<any[]>([]) // <-- Hold all fetched NFTs
  // Aggregate totals for pending verifications progress
  const pendingSummary = pendingVerifications.reduce(
    (acc, p) => {
      if (typeof p.completed === "number" && typeof p.totalRequired === "number") {
        acc.completed += p.completed;
        acc.totalRequired += p.totalRequired;
      }
      return acc;
    },
    { completed: 0, totalRequired: 0 }
  );

  // Used to update stats with real pending count and completed progress.
  const stats = [
    ...baseStats,
    {
      label: "Pending Verifications",
      value: pendingLoading
        ? <Loader2 className="h-4 w-4 animate-spin inline text-yellow-400" />
        : (
            <span className="flex items-center gap-2">
              <span className="font-semibold text-yellow-300 text-lg">
                {pendingVerifications.length.toLocaleString()}
              </span>
              {pendingSummary.totalRequired > 0 && (
                <span className="text-xs bg-yellow-900/30 text-yellow-200 font-mono px-2 py-0.5 rounded ml-1 flex items-center gap-1 border border-yellow-800/30">
                  <span className="font-bold">{pendingSummary.completed}</span>
                  <span className="opacity-50">/</span>
                  <span className="font-bold">{pendingSummary.totalRequired}</span>
                  <span className="ml-1 text-yellow-300 not-italic font-normal">✓</span>
                </span>
              )}
            </span>
          ),
      delta: pendingLoading
        ? ""
        : (pendingVerifications.length > 0 ? "+On-chain" : "No pendings"),
    },
  ];

  useEffect(() => {
    const getVerificationPending = async () => {
      setPendingLoading(true)
      try {
        const res = await getPendingVerifications()
        if (Array.isArray(res)) {
          const results = await Promise.all(
            res.map(async (req) => {
              const progress = await getVerificationProgress(req.requestId);
              return { ...req, ...progress };
            })
          );
          setPendingVerifications(results)
        } else {
          setPendingVerifications([])
        }
      } finally {
        setPendingLoading(false)
      }
    }
    getVerificationPending()
  }, [])

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

  useEffect(() => {
    async function fetchNfts() {
      setNftLoading(true)
      try {
        const res = await api.get('/nfts')
        const nftsFetched: any[] = res.data?.nfts || []
        setNfts(nftsFetched)
        setFeaturedNft(
          nftsFetched[0]
            ? {
                id: nftsFetched[0].id,
                tokenId: nftsFetched[0].tokenId,
                image: nftsFetched[0].image?.s3Key
                  ? nftsFetched[0].image.s3Key.startsWith("http")
                    ? nftsFetched[0].image.s3Key
                    : "https://ipfs.io/ipfs/" + nftsFetched[0].image.ipfsCid
                  : "/placeholder.svg",
                nftId: "#" + (nftsFetched[0].tokenId || nftsFetched[0].id?.slice(0, 4)),
                timestamp: formatDate(nftsFetched[0].createdAt || nftsFetched[0].image?.createdAt),
                owner: shortOwner(nftsFetched[0].userId),
                name: nftsFetched[0].name || nftsFetched[0].image?.metadata?.name || "",
                description: nftsFetched[0].description || nftsFetched[0].image?.metadata?.description || "",
              }
            : null
        )
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to fetch NFTs")
        setNfts([])
        setFeaturedNft(null)
      } finally {
        setNftLoading(false)
      }
    }
    fetchNfts()
  }, [])

  function renderVerificationProgress(p: any) {
    const completed = typeof p.completed === "number" ? p.completed : 0
    const total = typeof p.totalRequired === "number" ? p.totalRequired : 0
    const percent =
      total > 0 ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : 0

    return (
      <div className="flex items-center gap-2 mt-1 text-xs w-full">
        <span className="text-zinc-400">Progress:</span>
        <span className="relative w-24 h-3 flex items-center mr-1">
          <span
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${percent}%`,
              background:
                percent === 100
                  ? "linear-gradient(90deg,#22c55e,#bde1b6)"
                  : "linear-gradient(90deg,#fbbf24,#fde68a)",
              transition: "width 0.4s cubic-bezier(0.22,0.51,0.36,1)"
            }}
          />
          <span
            className="relative flex-1 block h-full bg-zinc-800/60 rounded-full border border-zinc-700/60"
          />
        </span>
        <span
          className={
            "font-mono px-1 rounded " +
            (percent === 100
              ? "bg-green-600/20 text-green-300 font-bold"
              : "bg-yellow-700/40 text-yellow-200 font-semibold")
          }
        >
          {completed}
          <span className="opacity-60">/</span>
          {total}
        </span>
        <span className="ml-1 text-[11px] text-zinc-400">{percent}%</span>
      </div>
    )
  }

  // If there are no nfts fetched (zero state from API), show empty dashboard message for featured NFT and for recents.
  const isNftEmpty = !nftLoading && (Array.isArray(nfts) && nfts.length === 0);

  return (
    <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
          Track authenticity verifications and the pulse of the Realia network.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Featured NFT, handle 0-nft state */}
        {nftLoading ? (
          <CardSkeleton />
        ) : isNftEmpty ? (
          <GlassCard className="col-span-2 p-0 overflow-hidden h-full flex items-center justify-center min-h-[300px]">
            <div className="w-full text-center flex flex-col items-center justify-center py-10">
              
              <div className="text-xl font-semibold text-white mb-1">No NFTs found</div>
              <div className="text-zinc-400">There are no NFTs on the network yet. New mints will appear here!</div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="col-span-2 p-0 overflow-hidden h-full">
            <div className="relative h-full">
              <AspectRatio ratio={16 / 9} className="h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredNft?.image || "/placeholder.svg"}
                  alt={`Featured NFT ${featuredNft?.nftId || ""}`}
                  className="absolute inset-0 w-full h-full min-h-full object-cover object-[00%_10%]"
                  style={{ height: "120%", width: "100%" }}
                />
              </AspectRatio>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-4 py-5 md:px-7 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-zinc-900/60 via-zinc-900/5 to-transparent rounded-b-xl">
                <div className="space-y-1">
                  <div className="text-xs text-white/70">Featured Mint</div>
                  <div className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">{featuredNft?.nftId}</div>
                  <div className="text-xs text-white/80">
                    Owner {featuredNft?.owner} • Minted {featuredNft?.timestamp}
                  </div>
                  {featuredNft?.description && (
                    <div className="text-xs text-zinc-300 line-clamp-2 mt-1">
                      {featuredNft.description}
                    </div>
                  )}
                </div>
                {featuredNft?.name && (
                  <Badge variant="default" className="bg-brand/90 text-white font-semibold shadow-lg">
                    {featuredNft.name}
                  </Badge>
                )}
              </div>
            </div>
          </GlassCard>
        )}
        {/* Side panel with stats and queue */}
        <div className="flex flex-col gap-8">
          {nftLoading ? (
            <StatsSkeleton />
          ) : (
            <GlassCard className="bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/90 border-2 border-white/10">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-bold tracking-wide text-white/90 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand" /> Network Overview
                </h2>
              </div>
              <Separator className="mb-3 bg-white/10" />
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col"
                  >
                    <div className="text-[11px] uppercase tracking-wide text-zinc-400">{s.label}</div>
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    {s.delta && <div className="text-[11px] text-zinc-300/80">{s.delta}</div>}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {nftLoading ? (
            <QueueSkeleton />
          ) : (
            <GlassCard className="bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/90 border-2 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold tracking-wide text-white/90 flex items-center gap-2">
                  <TimerIcon className="h-4 w-4 text-orange-400" /> Verification Queue
                </h2>
                <span className="text-xs text-zinc-400">
                  {pendingLoading ? "..." : pendingVerifications.length} in queue
                </span>
              </div>
              <Separator className="mb-3 bg-white/10" />
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {pendingLoading ? (
                    <div className="text-sm text-zinc-400 text-center py-3 flex justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin text-yellow-400" />
                      Loading pending verifications...
                    </div>
                  ) : pendingVerifications.length === 0 ? (
                    <div className="text-sm text-zinc-400 text-center py-3">
                      No pending verifications at the moment!
                    </div>
                  ) : (
                    pendingVerifications
                      .slice(-3).reverse()

                      .map((p, i) => (
                        <div
                          key={p.txHash}
                          className="flex items-start gap-4 bg-white/5 rounded-lg px-3 py-2 border border-white/10 shadow hover:shadow-lg transition-all group"
                        >
                          <div className="mt-1">
                            <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 shadow">
                                Pending Verification
                              </span>
                              <span className="hidden sm:inline text-xs text-zinc-400">
                                (Request ID: <span className="font-semibold text-zinc-200">{p.requestId}</span>)
                              </span>
                            </div>
                            <div className="text-xs text-zinc-300 truncate">
                              <span className="font-medium text-zinc-200">User:</span> {shortAddress(p.user)}
                              <span className="mx-2 text-zinc-500">|</span>
                              <span className="font-medium text-zinc-200">Block:</span> {p.blockNumber}
                            </div>
                            {/* Highlighted Progress Bar */}
                            {renderVerificationProgress(p)}
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <span className="text-zinc-400">TX:</span>
                              <a
                                href={`${BLOCKSCOUT_BASE_URL}/tx/${p.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand hover:underline font-mono bg-brand/10 rounded px-1"
                              >
                                {p.txHash.slice(0, 8) + "..." + p.txHash.slice(-6)}
                              </a>
                              <a
                                href={`${BLOCKSCOUT_BASE_URL}/tx/${p.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-xs text-zinc-500 hover:text-brand/90 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition"
                                title="View on Blockscout"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="sr-only">View on Blockscout</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
      {/* Recent Mints */}
      {nftLoading ? (
        <div className="mt-8">
          <GlassCard className="p-0">
            <div className="p-4">
              <SkeletonBox className="h-4 w-32 mb-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <SkeletonBox className="h-16 w-16 rounded-lg flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <SkeletonBox className="h-3 w-20" />
                      <SkeletonBox className="h-3 w-16" />
                      <SkeletonBox className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      ) : isNftEmpty ? (
        <div className="mt-8">
          <GlassCard className="p-0 flex items-center justify-center min-h-[160px]">
            <div className="w-full text-center flex flex-col items-center justify-center py-6">
              <div className="text-base font-semibold text-white mb-1">No mints found</div>
              <div className="text-zinc-400 text-sm">Once new NFTs are minted, they’ll appear here.</div>
            </div>
          </GlassCard>
        </div>
      ) : (
        <RecentMints recentMints={recentMints} />
      )}
    </main>
  )
}
