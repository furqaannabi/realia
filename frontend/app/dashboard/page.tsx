"use client"

import { GlassCard } from "@/components/card"
import { AnimatePresence } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, TimerIcon, ExternalLink } from "lucide-react"
import RecentMints from "@/components/RecentMints"
import { useEffect, useState } from "react"
import { getPendingVerifications } from "../utils/web3/blockscout"

const BLOCKSCOUT_BASE_URL = "https://arbitrum-sepolia.blockscout.com"

// Keep static network stats, but the pending verifications stat will be updated
const baseStats = [
  { label: "Authentic Images", value: "12,438", delta: "+3.1% this week" },
  { label: "Verification Requests", value: "3,209", delta: "+1.8% this week" },
  { label: "Verifier Nodes", value: "72", delta: "stable" },
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
  const featured = recentMints[0]
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)

  // Used to update stats with real pending count.
  const stats = [
    ...baseStats,
    {
      label: "Pending Verifications",
      value: pendingLoading
        ? <Loader2 className="h-4 w-4 animate-spin inline text-yellow-400" />
        : pendingVerifications.length.toLocaleString(),
      delta: pendingLoading
        ? ""
        : (pendingVerifications.length > 0 ? "+On-chain" : "No pendings"),
    },
  ]

  useEffect(() => {
    const getVerificationPending = async () => {
      setPendingLoading(true)
      try {
        const res = await getPendingVerifications()
        setPendingVerifications(Array.isArray(res) ? res : [])
      } finally {
        setPendingLoading(false)
      }
    }
    getVerificationPending()
  }, [])

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
        {/* Main Featured NFT */}
        <GlassCard className="col-span-2 p-0 overflow-hidden">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.image || "/placeholder.svg"}
                alt={`Featured NFT ${featured.nftId}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AspectRatio>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 py-5 md:px-7 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-zinc-900/60 via-zinc-900/5 to-transparent rounded-b-xl">
              <div className="space-y-1">
                <div className="text-xs text-white/70">Featured Mint</div>
                <div className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">{featured.nftId}</div>
                <div className="text-xs text-white/80">
                  Owner {featured.owner} • Minted {featured.timestamp}
                </div>
              </div>
              <Badge variant="default" className="bg-brand/90 text-white font-semibold shadow-lg">{featured.status}</Badge>
            </div>
          </div>
        </GlassCard>
        {/* Side panel with stats and queue */}
        <div className="flex flex-col gap-8">
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
                    .slice(0, 3)
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
        </div>
      </div>
      {/* Recent Mints */}
      <RecentMints recentMints={recentMints} />
    </main>
  )
}
