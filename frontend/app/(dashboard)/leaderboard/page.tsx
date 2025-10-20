"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Trophy, Copy as CopyIcon, Check as CheckIcon } from "lucide-react"
import { GlassCard } from "@/components/card"
import { Badge } from "@/components/ui/badge"
import { readContract } from "@wagmi/core"

import RealiaFactoryAbi from "@/app/utils/web3/Realia.json"
import { zeroAddress } from "viem"
import { config } from "@/app/utils/wallet"
import { REALIA_ADDRESS } from "@/app/utils/config"

function formatAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Agent struct fields in Solidity: agentAddress, agent, verifiedCount, isStaked
type Agent = {
  agentAddress: string,
  agent: string,
  verifiedCount: bigint,
  isStaked: boolean,
}

async function getAllAgentAddresses() {
  // Read public array agentAddresses
  try {
    // First, get the number of agents
    const { result: lengthRaw }: any = await readContract(config, {
      address: REALIA_ADDRESS,
      abi: RealiaFactoryAbi.abi,
      functionName: "agentAddresses",
      args: [0], // call index 0 to check if not error (for error detection)
    }).catch(() => ({ result: undefined }))

    let length = 0
    if (typeof lengthRaw === "string" && lengthRaw === zeroAddress) {
      // no agents registered
      return []
    }
    // Brute-force read until a revert (when out-of-bounds)
    const addresses: string[] = []
    let idx = 0
    while (true) {
      try {
        const res = await readContract(config, {
          address: REALIA_ADDRESS,
          abi: RealiaFactoryAbi.abi,
          functionName: "agentAddresses",
          args: [idx],
        })
        if (typeof res === "string") {
          addresses.push(res)
        } else if (Array.isArray(res)) {
          addresses.push(res[0])
        }
        idx++
      } catch (err) {
        break
      }
    }
    return addresses
  } catch {
    return []
  }
}

async function getAgentStruct(address: string): Promise<Agent | null> {
  // Mapping agents(address) => Agent struct
  try {
    const res = await readContract(config, {
      address: REALIA_ADDRESS,
      abi: RealiaFactoryAbi.abi,
      functionName: "agents",
      args: [address],
    }) as [string, string, bigint, boolean]

    if (!res || !Array.isArray(res) || res.length < 4) return null
    return {
      agentAddress: res[0],
      agent: res[1],
      verifiedCount: res[2],
      isStaked: res[3],
    }
  } catch {
    return null
  }
}

function useLeaderboardAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchAgents() {
      setLoading(true)
      try {
        const addresses = await getAllAgentAddresses()
        if (!addresses.length) {
          setAgents([])
          setLoading(false)
          return
        }
        // Fetch all agents, they may be unregistered so filter out isStaked false
        const all = await Promise.all(addresses.map(a => getAgentStruct(a)))
        const filtered = all.filter((ag): ag is Agent => !!ag && ag.isStaked)
        setAgents(filtered)
      } catch {
        setAgents([])
      }
      setLoading(false)
    }
    fetchAgents()
    return () => { mounted = false }
  }, [])

  // Rank by verifiedCount descending
  const ranked = useMemo(() => {
    return [...agents]
      .sort((a, b) =>
        (b.verifiedCount ?? BigInt(0)) > (a.verifiedCount ?? BigInt(0))
          ? 1
          : (b.verifiedCount ?? BigInt(0)) < (a.verifiedCount ?? BigInt(0))
            ? -1
            : 0
      )
      .map((a, idx) => ({ ...a, rank: idx + 1 }))
  }, [agents])

  return { agents: ranked, loading }
}

// Click-to-copy cell for agent addresses
function CopyAddressCell({ address, formatted }: { address: string, formatted: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 850);
    } catch {
      // fallback or error, ignore here
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy agent address"
      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-white focus:outline-none transition"
      type="button"
      title={address}
      style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
    >
      <span>{formatted}</span>
      {copied ? <CheckIcon className="ml-1 w-4 h-4 text-green-400" /> : <CopyIcon className="ml-1 w-4 h-4 opacity-70" />}
    </button>
  );
}

export default function LeaderboardPage() {
  const { agents, loading } = useLeaderboardAgents()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="size-7" />
          <h1 className="text-3xl md:text-4xl font-bold">Agent Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">Top performing agents in the Realia network</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Agent Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name/Metadata
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Verifications
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No active agents found
                    </td>
                  </tr>
                ) : (
                  agents.map((agent, idx) => (
                    <motion.tr
                      key={agent.agent}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 + idx * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-lg">{agent.rank}</div>
                      </td>
                      <td className="px-6 py-4">
                        <CopyAddressCell address={agent.agent} formatted={formatAddress ? formatAddress(agent.agent) : agent.agent} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {agent.agentAddress ? agent.agentAddress : <span className="italic text-xs text-muted-foreground">Not set</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{agent.verifiedCount?.toString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Active
                        </Badge>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
