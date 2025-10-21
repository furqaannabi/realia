"use client"
import '@rainbow-me/rainbowkit/styles.css';
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ImageIcon, Wallet, ChevronLeft, ChevronRight, Lock, Trophy, Menu, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { WalletSidebarButton } from './WalletSidebarButton';

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/mint", label: "Mint NFT", icon: ImageIcon },
  { href: "/verify", label: "Verify Image", icon: Lock },
  { href: "/leaderboard", label: "Agent Leaderboard", icon: Trophy },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("realia:sidebar:collapsed")
    if (saved) setCollapsed(saved === "1")
  }, [])
  useEffect(() => {
    localStorage.setItem("realia:sidebar:collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  // Nav content for reuse (mobile/desktop)
  const NavContent = ({ collapsed, onNavigate }: { collapsed: boolean, onNavigate?: () => void }) => (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href} className="block" onClick={onNavigate}>
            <div
              className={cn(
                "group relative flex items-center gap-2 rounded-[6px] px-2 py-2 transition-all",
                "hover:bg-white/7 focus-visible:outline-none text-xs font-medium",
                active
                  ? "bg-white/10 text-white border border-white"
                  : "text-white/70 border border-transparent"
              )}
              style={{
                boxShadow: "none",
              }}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded transition-all",
                  active
                    ? "text-white"
                    : "text-white/60 group-hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4", active ? "" : "opacity-90")} />
              </span>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className={cn(
                      "transition-all duration-200 select-none whitespace-nowrap",
                      active ? "font-semibold" : ""
                    )}
                    style={{ fontSize: "12px", lineHeight: "17px" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        )
      })}
      <div className="mt-auto border-t border-white/10 pt-3 px-1">
        {collapsed ? (
          <div className="flex flex-col items-center">
            <button className="cursor-pointer hover:bg-white/10 rounded-lg p-2 mb-2 transition">
              <Wallet className="text-white w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <WalletSidebarButton />
            <div className="mt-2 text-[11px] text-white/60 space-y-1 px-1 font-normal">
              <Link href="/guide" className="block hover:text-white transition hover:underline" onClick={onNavigate}>
                Protocol Guide
              </Link>
              <Link href="/privacy" className="block hover:text-white transition hover:underline" onClick={onNavigate}>
                Privacy Policy
              </Link>
            </div>
            <div className="mt-3 mb-1 text-[10px] text-white/40 px-1 font-mono tracking-widest uppercase">
              proofs by <span className="font-black text-white">Realia</span>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Mobile sidebar overlay (slide from right instead of left)
  const MobileSidebar = () => (
    <div className="fixed inset-0 z-50 flex flex-row-reverse">
      {/* Scrim */}
      <button
        className="flex-1 absolute top-0 left-0 h-full bg-black/60 backdrop-blur-sm w-full"
        tabIndex={-1}
        aria-label="Close sidebar overlay"
        onClick={() => setMobileOpen(false)}
      />
      {/* Sidebar drawer */}
      <motion.aside
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        exit={{ x: 250 }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-60 max-w-[85vw] h-full bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col"
        style={{ right: 0 }}
      >
        <div className="p-3 flex items-center justify-between border-b border-white/10">
          <Link href="/dashboard" tabIndex={-1} onClick={() => setMobileOpen(false)}>
            <div className="mt-1 select-none flex items-center gap-2">
              <span className="flex items-center justify-center rounded-md bg-white/5 w-6 h-6 shadow-sm">
                <ImageIcon className="w-4 h-4 text-white/80" />
              </span>
              <span className="text-[15px] font-bold text-white block tracking-tight">
                Realia
              </span>
            </div>
          </Link>
          <button
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-xl border border-white/10 bg-zinc-800/70 hover:bg-zinc-900 focus-visible:outline-none transition"
            title="Close"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>
        <nav className="px-2 py-3 space-y-1 flex flex-col h-full">
          <NavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </nav>
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-zinc-900/10 to-transparent" />
      </motion.aside>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 58 : 200 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative hidden md:block border-r border-white/8 bg-black/90 backdrop-blur-xl shadow-xl z-30"
        style={{ minHeight: "100dvh" }}
      >
        <div className="h-dvh sticky top-0 flex flex-col">

          {/* Brand/Header */}
          <div className="p-3 flex items-center justify-between border-b border-white/10">
            {!collapsed && (
              <Link href="/dashboard" tabIndex={-1}>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 select-none flex items-center gap-2"
                >
                  <span className="flex items-center justify-center rounded-md bg-white/5 w-6 h-6 shadow-sm">
                    <ImageIcon className="w-4 h-4 text-white/80" />
                  </span>
                  <span className="text-[15px] font-bold text-white block tracking-tight">
                    Realia
                  </span>
                </motion.div>
              </Link>
            )}
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((c) => !c)}
              className="p-1.5 rounded-xl border border-white/10 bg-zinc-800/70 hover:bg-zinc-900 focus-visible:outline-none transition"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-white/80" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-white/80" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-2 py-3 space-y-1 flex flex-col h-full">
            <NavContent collapsed={collapsed} />
          </nav>

          {/* Subtle fade at bottom */}
          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-zinc-900/10 to-transparent" />
        </div>
      </motion.aside>

      {/* Mobile menu button (moved to right) */}
      <button
        className="fixed right-3 top-3 z-40 md:hidden p-2 rounded-xl text-white bg-zinc-900/70 border border-white/10 shadow-lg hover:bg-zinc-800 focus-visible:outline-none transition"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen(true)}
        type="button"
        style={{}}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>{mobileOpen && <MobileSidebar />}</AnimatePresence>
    </>
  )
}
