"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
  DollarSign,
  Database,
  Bot,
  Scan,
} from "lucide-react";

import { useState } from "react";
import { Menu, X } from "lucide-react";
// ---
// Realia — Decentralized Image Authenticity Protocol
// Author: Furqaan Nabi
// Date: October 2025
// ---
function MobileNavBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 flex items-center justify-between max-w-7xl">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xl sm:text-3xl font-extrabold bg-gradient-to-tr from-cyan-200 via-blue-100 to-white bg-clip-text text-transparent drop-shadow">
          Realia
        </span>
        <span className="text-[10px] sm:text-xs px-2 py-1 font-semibold ml-2 tracking-widest rounded bg-cyan-600/25 text-cyan-200 border border-cyan-300/20">
          Decentralized Image Authenticity
        </span>
      </div>
      {/* Desktop navigation (sm and up) */}
      <nav className="hidden sm:flex gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-white items-center">
        <Link href="/dashboard" className="hover:text-cyan-200 transition">Dashboard</Link>
        <Link href="/verify" className="hover:text-cyan-200 transition">Verify</Link>
        <Link href="/guide" className="hover:text-cyan-200 transition">Guide</Link>
        <Link href="/leaderboard" className="hover:text-cyan-200 transition">Leaderboard</Link>
      </nav>
      {/* Mobile menu button */}
      <button
        className="sm:hidden p-2 rounded hover:bg-zinc-900/80 text-cyan-100 focus:outline-none transition"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center sm:hidden bg-zinc-950/80 backdrop-blur-md">
          {/* Now covers full page with a darker translucent overlay */}
          <nav className="relative flex flex-col gap-6 text-lg font-semibold text-cyan-100 z-10 bg-zinc-950/85 p-6 rounded-2xl shadow-2xl border border-cyan-300/10 backdrop-blur-lg">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:text-cyan-200 transition">Dashboard</Link>
            <Link href="/verify" onClick={() => setOpen(false)} className="hover:text-cyan-200 transition">Verify</Link>
            <Link href="/guide" onClick={() => setOpen(false)} className="hover:text-cyan-200 transition">Guide</Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)} className="hover:text-cyan-200 transition">Leaderboard</Link>
          </nav>
          <button
            className="absolute top-6 right-4 text-cyan-200 p-3 rounded-full hover:bg-zinc-900/70 z-20"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
      )}
    </div>
  );
}
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 relative">
      {/* Header */}
      <header className="w-full z-30">
        <MobileNavBar />
      </header>





      {/* HERO */}
      <section className="relative flex flex-col justify-center items-center min-h-[75vh] pt-8 pb-8 sm:pt-12 sm:pb-10">
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <div className="absolute top-[-18%] left-1/2 -translate-x-1/2 w-[98vw] h-[38vh] sm:w-[90vw] sm:h-[60vh] bg-gradient-to-br from-cyan-300/50 via-zinc-100/10 to-sky-300/60 rounded-2xl blur-3xl" />
        </div>
        <div className="relative z-10 w-full">
          <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
            <div className="text-center space-y-6 sm:space-y-9">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-zinc-800/70 to-cyan-800/40 rounded-full border border-cyan-300/10 text-xs font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                Real. AI. Tampered. Verifiable, on-chain.
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-50 via-cyan-200 to-white bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight drop-shadow">
                Decentralized Image Authenticity Protocol
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-zinc-200 font-light leading-relaxed max-w-xs xs:max-w-lg sm:max-w-2xl mx-auto">
                Realia verifies if an image is <span className="font-semibold text-cyan-200">real</span>, <span className="font-semibold text-emerald-200">AI-generated</span>, or <span className="font-semibold text-yellow-200">modified</span> — providing NFT-backed, on-chain proofs. Powered by <span className="font-semibold text-blue-200">PYUSD payments</span>, <span className="font-semibold text-cyan-100">Blockscout transparency</span>, and <span className="font-semibold text-fuchsia-200">Fetch.ai Agents</span>.
              </p>
              <div className="flex lg:flex-row flex-col xs:flex-row gap-3 sm:gap-4 justify-center w-full max-w-xs mx-auto sm:max-w-none">
                <Link href="/dashboard" className="flex-1">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-white via-sky-200 to-cyan-200 text-zinc-900 font-bold shadow hover:scale-105 hover:bg-sky-100/95 transition text-sm sm:text-base"
                  >
                    Try Realia Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/verify" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-cyan-300 text-cyan-200 hover:bg-cyan-900/30 hover:text-cyan-100 transition text-sm sm:text-base"
                  >
                    Verify Image
                  </Button>
                </Link>
                <Link href="/guide" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full flex items-center justify-center border-blue-200 text-blue-100 hover:bg-blue-900/30 hover:text-blue-50 transition text-sm sm:text-base"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Protocol Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-5xl">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10 bg-gradient-to-r from-cyan-100 via-white to-sky-300 bg-clip-text text-transparent">
          How It Works: ETHOnline 2025 Architecture
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 mb-4 sm:mb-6">
          {/* 1. Upload Image */}
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 space-y-2">
            <Scan className="h-8 w-8 text-cyan-200 mx-auto mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">1. Upload Image</h3>
            <p className="text-zinc-400 text-center text-sm">User uploads an image. Model checks if it passes authenticity threshold.</p>
          </div>
          {/* 2. Pay with PYUSD */}
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 space-y-2">
            <DollarSign className="h-8 w-8 text-yellow-300 mx-auto mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">2. Pay with PYUSD</h3>
            <p className="text-zinc-400 text-center text-sm">
              For minting/verification, user pays a small <span className="font-bold text-cyan-100">PYUSD</span> fee. Staking for verifier agents also in PYUSD.
            </p>
          </div>
          {/* 3. NFT Minting */}
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 space-y-2">
            <Layers className="h-8 w-8 text-blue-300 mx-auto mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">3. NFT Minted</h3>
            <p className="text-zinc-400 text-center text-sm">Authenticity NFT is minted and on-chain event emitted. Blockscout indexes proof.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {/* 4. Decentralized Verification */}
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 space-y-2">
            <Bot className="h-8 w-8 text-fuchsia-300 mx-auto mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">4. Decentralized AI Agents</h3>
            <p className="text-zinc-400 text-center text-sm">Fetch.ai agents fetch & check images, submit scores on-chain. Honest verifiers are rewarded in PYUSD.</p>
          </div>
          {/* 5. Public Proofs */}
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 space-y-2">
            <Database className="h-8 w-8 text-green-200 mx-auto mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">5. Transparent Proofs</h3>
            <p className="text-zinc-400 text-center text-sm">
              Blockscout dashboard shows all proofs, mints, and transactions for trustless public verification.
            </p>
          </div>
        </div>
      </section>

      {/* Key Tech Integrations */}
      <section className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-5xl">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10 bg-gradient-to-r from-cyan-100 via-white to-sky-300 bg-clip-text text-transparent">
          Protocol Upgrades for ETHOnline 2025
        </h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3">
            <DollarSign className="h-8 sm:h-10 w-8 sm:w-10 text-teal-200 mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-cyan-100 text-center">PYUSD Native Economy</h3>
            <ul className="text-zinc-400 text-center text-sm sm:text-base space-y-0.5 sm:space-y-1">
              <li>• Stable payments for minting/verification</li>
              <li>• Node staking & slashing in PYUSD</li>
              <li>• Cross-chain on ETH, Arbitrum L2</li>
              <li>• Instant, predictable rewards</li>
            </ul>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3">
            <Database className="h-8 sm:h-10 w-8 sm:w-10 text-blue-200 mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-blue-100 text-center">Blockscout Data Indexing</h3>
            <ul className="text-zinc-400 text-center text-sm sm:text-base space-y-0.5 sm:space-y-1">
              <li>• Explorer integration: real-time event & proof display</li>
              <li>• ERC721, verification, and token event APIs</li>
              <li>• Etherscan-compatible endpoints</li>
              <li>• No custom explorers needed</li>
            </ul>
          </div>
          <div className="bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3">
            <Bot className="h-8 sm:h-10 w-8 sm:w-10 text-fuchsia-200 mb-1" />
            <h3 className="text-base sm:text-lg font-semibold text-fuchsia-100 text-center">Fetch.ai Autonomous Agents</h3>
            <ul className="text-zinc-400 text-center text-sm sm:text-base space-y-0.5 sm:space-y-1">
              <li>• Decentralized AI-powered verification</li>
              <li>• PYUSD rewards for honest nodes</li>
              <li>• Agentverse cloud hosting</li>
              <li>• No dependency on central AI APIs</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 flex lg:flex-row flex-col xs:flex-row justify-center gap-3 sm:gap-4">
          <a href="https://blockscout.com" target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded border border-cyan-300/25 bg-cyan-900/30 text-cyan-100 hover:bg-cyan-800 hover:text-cyan-50 transition text-sm sm:text-base">
            <Database className="h-4 w-4" />
            Proofs on Blockscout
          </a>
          <a href="/guide" target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded border border-fuchsia-200/25 bg-fuchsia-900/30 text-fuchsia-100 hover:bg-fuchsia-800 hover:text-fuchsia-50 transition text-sm sm:text-base">
            <Bot className="h-4 w-4" />
            Deploy an Agent
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-4xl">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-8 sm:mb-12 bg-gradient-to-r from-cyan-100 via-sky-200 to-white bg-clip-text text-transparent text-center">
          Frequently Asked Questions
        </h2>
        <div className="max-w-full xs:max-w-2xl mx-auto space-y-2 sm:space-y-3">
          {/* FAQ Q1 */}
          <details className="group rounded-xl border border-cyan-700/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/60 shadow-sm transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-medium text-cyan-100 group-open:text-cyan-400 transition-colors">
              <span>What does Realia verify?</span>
              <span className="ml-2 transition-transform duration-300 group-open:rotate-90">
                <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </summary>
            <div className="px-4 sm:px-6 pt-1 pb-4 sm:pb-5 text-zinc-200/90 text-sm sm:text-base leading-relaxed border-t border-zinc-800 mt-2">
              Realia determines if an image is (1) real (photographic/original), (2) AI-generated, or (3) modified/tampered. All proofs are on-chain and NFT-backed.
            </div>
          </details>

          {/* FAQ Q2 */}
          <details className="group rounded-xl border border-cyan-700/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/60 shadow-sm transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-medium text-cyan-100 group-open:text-cyan-400 transition-colors">
              <span>How does the protocol prove authenticity?</span>
              <span className="ml-2 transition-transform duration-300 group-open:rotate-90">
                <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </summary>
            <div className="px-4 sm:px-6 pt-1 pb-4 sm:pb-5 text-zinc-200/90 text-sm sm:text-base leading-relaxed border-t border-zinc-800 mt-2">
              Upload triggers hybrid on-chain + Fetch.ai off-chain checks. AI agents compute embeddings, compare to reference, and submit scores on-chain. Result is finalized by consensus contract & published to Blockscout.
            </div>
          </details>

          {/* FAQ Q3 */}
          <details className="group rounded-xl border border-cyan-700/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/60 shadow-sm transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-medium text-cyan-100 group-open:text-cyan-400 transition-colors">
              <span>What's new for ETHOnline 2025?</span>
              <span className="ml-2 transition-transform duration-300 group-open:rotate-90">
                <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </summary>
            <div className="px-4 sm:px-6 pt-1 pb-4 sm:pb-5 text-zinc-200/90 text-sm sm:text-base leading-relaxed border-t border-zinc-800 mt-2">
              <ul className="pl-4 list-disc space-y-1">
                <li><span className="text-cyan-100 font-semibold">PYUSD</span>-based payments, staking, and rewards</li>
                <li>Blockscout dashboard indexing for NFT/proof transparency</li>
                <li>Verification via <span className="text-fuchsia-200 font-semibold">Fetch.ai</span> decentralized AI agents</li>
                <li>Easy cross-chain support on Ethereum L1 & Arbitrum</li>
              </ul>
            </div>
          </details>

          {/* FAQ Q4 */}
          <details className="group rounded-xl border border-cyan-700/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/60 shadow-sm transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-medium text-cyan-100 group-open:text-cyan-400 transition-colors">
              <span>How do verifiers work?</span>
              <span className="ml-2 transition-transform duration-300 group-open:rotate-90">
                <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </summary>
            <div className="px-4 sm:px-6 pt-1 pb-4 sm:pb-5 text-zinc-200/90 text-sm sm:text-base leading-relaxed border-t border-zinc-800 mt-2">
              Any agent (human or autonomous) that stakes the required PYUSD may register as a verifier, run the model, and earn PYUSD rewards for accurate verification. Dishonest nodes are slashed.
            </div>
          </details>

          {/* FAQ Q5 */}
          <details className="group rounded-xl border border-cyan-700/40 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/60 shadow-sm transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-medium text-cyan-100 group-open:text-cyan-400 transition-colors">
              <span>How do I run or deploy a Fetch.ai agent?</span>
              <span className="ml-2 transition-transform duration-300 group-open:rotate-90">
                <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </summary>
            <div className="px-4 sm:px-6 pt-1 pb-4 sm:pb-5 text-zinc-200/90 text-sm sm:text-base leading-relaxed border-t border-zinc-800 mt-2">
              Build and run agents using the uAgents SDK locally, or deploy persistently on <a href="https://agentverse.ai/" target="_blank" rel="noopener" className="text-fuchsia-200 underline hover:text-fuchsia-100">Agentverse</a> or Fetch Station. Agents listen for on-chain events, autonomously retrieve images, verify, and submit scores.
            </div>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-2 sm:px-4 py-8 sm:py-10 bg-zinc-900/90 border-t border-zinc-800 mt-auto">
        <div className="container mx-auto max-w-7xl px-2 sm:px-4">
          <div className="flex flex-col gap-6 sm:gap-10 md:flex-row items-center md:items-start justify-between">
            {/* Logo and tagline */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
              <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-tr from-cyan-200 via-blue-100 to-white bg-clip-text text-transparent drop-shadow">
                Realia
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-1 font-semibold tracking-widest rounded bg-cyan-600/25 text-cyan-200 border border-cyan-300/20 mb-1">
                Open, autonomous image proof protocol.
              </span>
              <span className="text-xs sm:text-sm text-zinc-400">
                &copy; {new Date().getFullYear()} Realia
              </span>
            </div>
            {/* Quick Links */}
            <div className="flex lg:flex-row flex-col xs:flex-row gap-5 sm:gap-7 text-zinc-200 text-sm sm:text-base items-start w-full sm:w-auto">
              <div className="flex flex-col gap-1 w-full">
                <span className="font-semibold text-cyan-200 mb-1">Explore</span>
                <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
                <Link href="/verify" className="hover:text-white transition">Verify</Link>
                <Link href="/guide" className="hover:text-white transition">Guide</Link>
                <Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link>
              </div>
              <div className="flex flex-col gap-1 xs:mt-0 w-full">
                <span className="font-semibold text-cyan-200 mb-1">Resources</span>
                <a href="https://docs.realia.xyz" target="_blank" rel="noopener" className="hover:text-white transition">Docs</a>
                <a href="https://github.com/furqaannabi/realia" target="_blank" rel="noopener" className="hover:text-white transition">GitHub</a>
                <a href="https://blockscout.com/" target="_blank" rel="noopener" className="hover:text-white transition">Blockscout</a>
                <a href="https://agentverse.ai/" target="_blank" rel="noopener" className="hover:text-white transition">Agentverse</a>
                <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
