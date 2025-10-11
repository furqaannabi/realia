"use client"

import { GlassCard } from "@/components/card"
import { motion } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"

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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-pretty">Realia Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Authenticity at the speed of trust.</p>
      </div>

      {/* Top: Featured image + side panels */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Featured image panel */}
        <GlassCard className="p-0 overflow-hidden xl:col-span-2">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              <img
                src={featured.image || "/placeholder.svg"}
                alt={`Featured NFT ${featured.nftId}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AspectRatio>

            {/* Overlay gradient for legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Metadata overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-white/70">Featured Mint</div>
                  <div className="text-xl md:text-2xl font-semibold tracking-tight">{featured.nftId}</div>
                  <div className="text-xs text-white/80">
                    Owner {featured.owner} • Minted {featured.timestamp}
                  </div>
                </div>
                <Badge className="bg-brand/90 text-white">{featured.status}</Badge>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Side: compact stats + queue */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium">Network Overview</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-md border border-white/10 bg-black/10 p-3"
                >
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="text-lg font-semibold">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground">{s.delta}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium">Verification Queue</h2>
              <span className="text-xs text-muted-foreground">{queue.length} in queue</span>
            </div>
            <div className="flex flex-col gap-3">
              {queue.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 overflow-hidden rounded-md ring-1 ring-white/10">
                    <img src={q.image || "/placeholder.svg"} alt="Pending" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">Pending verification</div>
                    <div className="truncate text-xs text-muted-foreground">{q.note}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{q.eta}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Mints gallery with bigger images */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Mints</h2>
          <span className="text-xs text-muted-foreground">Showing {recentMints.length}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recentMints.map((item, idx) => (
            <motion.div
              key={item.nftId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * idx }}
            >
              <GlassCard className="p-0 overflow-hidden">
                <div className="relative">
                  <AspectRatio ratio={4 / 3}>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={`NFT ${item.nftId}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute left-2 top-2">
                    <Badge className="bg-black/50 text-white backdrop-blur-sm">{item.status}</Badge>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.nftId}</div>
                    <div className="text-xs text-muted-foreground">{item.timestamp}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Owner {item.owner}</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
