"use client"
import '@rainbow-me/rainbowkit/styles.css';
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ImageIcon, Clock, Server, Wallet, Settings, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { WalletSidebarButton } from './WalletSidebarButton';

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/mint", label: "Mint NFT", icon: ImageIcon },
  { href: "/history", label: "Verification History", icon: Clock },
  { href: "/nodes", label: "Verifier Nodes", icon: Server },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("realia:sidebar:collapsed")
    if (saved) setCollapsed(saved === "1")
  }, [])
  useEffect(() => {
    localStorage.setItem("realia:sidebar:collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="relative hidden md:block border-r bg-sidebar/60 backdrop-blur-xl"
    >
      <div className="h-dvh sticky top-0 flex flex-col">

        <div className="p-4 flex items-center justify-between">
          {!collapsed &&
            <div className="w-[50px] h-[50px] bg-primary rounded-sm mt-4"></div>
          }

          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-xl bg-glass hover:bg-glass-strong transition"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <nav className="px-2 py-2 space-y-1 flex flex-col h-full">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "group relative flex items-center gap-3 rounded-sm px-3 py-2.5 transition mt-1",
                    "hover:bg-primary/10 focus-visible:outline-none",
                    active && "bg-gradient-to-r from-brand-start/20 to-brand-end/20 ring-1 ring-transparent",
                  )}
                >
                  {/* gradient active border */}
                  {active && <span className="absolute inset-0 rounded-sm p-[1px] bg-brand-gradient -z-10" />}
                  <item.icon className={cn("size-5 text-foreground/80", active && "text-black")} />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        className={`text-sm ${active ? "text-black" : "text-primary"}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            )
          })}
          <div className="mt-auto border-t-[1px] border-primary/40 pt-3 px-4">
            {collapsed ? (
              <>
                <button className="cursor-pointer hover:bg-primary/10 rounded-sm p-1 mb-3">
                  <Wallet />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-[15px] h-[15px] bg-primary rounded-[3px]"></div>
                  <p className="text-sm">Start here</p>
                </div>
                <WalletSidebarButton />
              </>
            )}
          </div>
        </nav>

        {/* Mobile bar (appear on small screens) */}
        <div className="md:hidden"></div>
      </div>
    </motion.aside>
  )
}
