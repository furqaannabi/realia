"use client"

import { GlassCard } from "@/components/card"
import { motion, AnimatePresence } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, TimerIcon, ImageIcon } from "lucide-react"

const stats = [
  { label: "Authentic Images", value: "12,438", delta: "+3.1% this week" },
  { label: "Verification Requests", value: "3,209", delta: "+1.8% this week" },
  { label: "Verifier Nodes", value: "72", delta: "stable" },
  { label: "Pending Verifications", value: "19", delta: "-0.6% today" },
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

const queue = [
  { image: "/city-alley-noir.jpg", note: "Low-light capture", eta: "1m" },
  { image: "/product-shot-glass.jpg", note: "Reflection check", eta: "2m" },
  { image: "/drone-beach-topdown.jpg", note: "Perspective analysis", eta: "3m" },
]

export default function DashboardPage() {
  const featured = recentMints[0]

  return (
    <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, type: "spring", stiffness: 170 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
          Track authenticity verifications and the pulse of the Realia network.
        </p>
      </motion.div>
      <motion.div
        className="grid gap-8 lg:grid-cols-3"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09, duration: 0.4 }}
      >
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
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.07 }}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="text-[11px] uppercase tracking-wide text-zinc-400">{s.label}</div>
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-[11px] text-zinc-300/80">{s.delta}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/90 border-2 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold tracking-wide text-white/90 flex items-center gap-2">
                <TimerIcon className="h-4 w-4 text-orange-400" /> Verification Queue
              </h2>
              <span className="text-xs text-zinc-400">{queue.length} in queue</span>
            </div>
            <Separator className="mb-3 bg-white/10" />
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {queue.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-zinc-400 text-center py-3"
                  >
                    No pending images at the moment!
                  </motion.div>
                ) : (
                  queue.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: i * 0.06 + 0.13 }}
                      className="flex items-center gap-3"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-md shadow ring-1 ring-white/10">
                        <img src={q.image || "/placeholder.svg"} alt="Pending" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white/90 font-semibold flex items-center gap-1">
                          <Loader2 className="h-3 w-3 inline-block animate-spinner text-yellow-400 mr-1" />
                          Pending verification
                        </div>
                        <div className="truncate text-xs text-zinc-400">{q.note}</div>
                      </div>
                      <div className="text-xs text-zinc-300">{q.eta}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </motion.div>
      {/* Recent Mints */}
      <motion.div
        className="space-y-4 mt-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex gap-2 items-center">
            <ImageIcon className="h-5 w-5 text-sky-400/80" /> Recent Mints
          </h2>
          <span className="text-xs text-zinc-400">
            Showing {recentMints.length}
          </span>
        </div>
        <Separator className="mb-2 bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentMints.map((item, idx) => (
            <motion.div
              key={item.nftId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * idx + 0.25 }}
            >
              <GlassCard className="p-0 overflow-hidden border-2 border-white/10 bg-gradient-to-br from-black/85 via-zinc-900/60 to-black/80">
                <div className="relative">
                  <AspectRatio ratio={4 / 3}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={`NFT ${item.nftId}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute left-2 top-2">
                    <Badge variant="outline" className="bg-black/40 text-white backdrop-blur-sm border-white/10 font-bold py-1 px-2">{item.status}</Badge>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white/90">{item.nftId}</div>
                    <div className="text-xs text-zinc-400">{item.timestamp}</div>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Owner {item.owner}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  )
}
