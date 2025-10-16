"use client"

import { useEffect, useState } from "react"
import { UploadCard } from "@/components/upload-card"
import { GradientButton } from "@/components/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StepBadge } from "@/components/step-badge"
import { toast } from "sonner"
import { api } from "../utils/axiosInstance"
import { Loader2 } from "lucide-react"
import { useAccount, useWriteContract } from "wagmi"
import { PYUSD_ADDRESS, REALIA_ADDRESS } from "../utils/config"
import { erc20Abi, parseUnits } from "viem"
import RealiaABI from "@/app/utils/web3/Realia.json";
import ERC20ABI from "@/app/utils/web3/ERC20.json";
import { signMessage, simulateContract, writeContract, readContract } from "@wagmi/core"
import { config } from "../utils/wallet"
import { motion, AnimatePresence } from "framer-motion"

// --- Mint price and contract order type constants from Solidity (see file_context_0) ---
const MINT_PRICE = "1"; // 1e6 (6 decimals), string for parseUnits
const ORDER_TYPE_MINT = 1;

type MintInfo = {
  id: string
  imageHash: string
  ipfs: string
  timestamp: string
}

export default function MintPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [minted, setMinted] = useState<MintInfo | null>(null)
  const [minting, setMinting] = useState(false)
  const [status, setStatus] = useState<string>("")

  const { address } = useAccount()
  const { writeContractAsync: writeApprove } = useWriteContract()

  // Returns a number, not boolean. Used by 'hasOrder' below.
  const hasMintOrder = async () => {
    if (!address) return false
    try {
      const hasOrder = await readContract(config, {
        address: REALIA_ADDRESS,
        abi: RealiaABI.abi,
        functionName: "hasOrder",
        args: [address, ORDER_TYPE_MINT],
      })
      // Solidity returns a boolean
      return !!hasOrder
    } catch (err) {
      console.error("Failed to check hasOrder:", err)
      return false
    }
  }

  // Approve full price to contract
  const handleApprove = async () => {
    try {
      setStatus("Approving PYUSD for mint...")
      await writeApprove({
        address: PYUSD_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [REALIA_ADDRESS, parseUnits(MINT_PRICE, 6)], // 6 decimals for PYUSD
      })
      setStatus("Approve succeeded.")
    } catch (err) {
      console.error("Approve failed:", err)
      setStatus("Approval failed ❌")
      throw err
    }
  }

  // Use writeContract directly: For createOrder.
  const handleCreateOrder = async () => {
    try {
      setStatus("Creating order in contract...")
      const { request } = await simulateContract(config, {
        address: REALIA_ADDRESS,
        abi: RealiaABI.abi,
        functionName: "createOrder",
        args: [ORDER_TYPE_MINT],
        account: address,
      })
      await writeContract(config, request)
      setStatus("Order creation tx sent.")
      return true
    } catch (err) {
      console.error("Order create failed:", err)
      setStatus("Order creation failed ❌")
      throw err
    }
  }

  const handleMint = async () => {
    if (!file) {
      toast.error("Please upload an image.")
      return
    }
    if (!address) {
      toast.error("Wallet not connected")
      return
    }

    setMinting(true)
    setStatus("")
    let message: string
    let signature: string

    try {
      // Dummy values; normally get from form fields
      const name = "NFT Title"
      const description = "NFT Description"

      // 1. Sign
      message = `I am signing this message to verify my ownership of this wallet and approve minting my NFT on MyProject.\nTimestamp: ${Date.now()}`
      signature = await signMessage(config, { message })

      // 2. Approve tokens (ERC20.allowance is not checked here, just attempt always)
      try {
        await handleApprove()
      } catch (approveErr) {
        toast.error("ERC20 Approve failed (user denied or contract issue)")
        return
      }

      // 3. Ensure there's an order of OrderType.MINT; if not, create one
      let hasOrder = false
      try {
        hasOrder = await hasMintOrder()
      } catch {
        hasOrder = false
      }
      if (!hasOrder) {
        try {
          await handleCreateOrder()
        } catch (orderErr) {
          toast.error("Failed to create order on contract, check wallet confirmation and balance")
          return
        }
      } else {
        setStatus("Order already present, proceeding to mint...")
      }

      // 4. Prepare backend call
      const dataToSend = {
        name,
        description,
        message,
        signature,
      }

      const formData = new FormData()
      formData.append("image", file)
      formData.append("data", JSON.stringify(dataToSend))

      // 5. POST to backend (likely triggers contract mint from backend as owner)
      let res
      try {
        res = await api.post("/mint", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      } catch (apiErr: any) {
        setStatus("Backend minting failed")
        console.error("API POST error:", apiErr)
        toast.error(
          apiErr?.response?.data?.error
            ? apiErr.response.data.error
            : "Backend minting failed"
        )
        return
      }

      if (res?.data && res.data.success) {
        setMinted(res.data)
        toast.success("NFT Minted Successfully!")
      } else if (res?.data?.error) {
        toast.error(res.data.error || "Failed to mint NFT")
      } else {
        toast.error("Failed to mint NFT (Unknown error)")
      }
    } catch (error: any) {
      // This catches general logic/signature failures
      console.error("Mint error:", error)
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error("Failed to mint NFT")
      }
    } finally {
      setMinting(false)
    }
  }

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }, [file])

  const resetMint = () => {
    setMinted(null)
    setFile(null)
    setPreview(null)
    setStatus("")
  }

  return (
    <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, type: "spring", stiffness: 170 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
          Mint Authenticity NFT
        </h1>
        <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
          Mint your authenticity NFT instantly on-chain. Secure, modern, decentralized.
        </p>
      </motion.div>
      <motion.div
        className="grid gap-8 lg:grid-cols-2"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11, duration: 0.4 }}
      >
        {/* Upload + Preview CARD (left) */}
        <Card className="relative border-2 border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black/90 backdrop-blur rounded-2xl shadow-xl shadow-black/20 overflow-hidden text-white">
          <CardHeader className="pb-4 flex items-center gap-2 bg-gradient-to-r from-zinc-950/40 to-zinc-900/70 rounded-t-2xl shadow-inner">
            <CardTitle className="font-bold text-lg tracking-wide flex items-center gap-2 text-white/95">
              {/* Icon space */}
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="text-white/60"><rect width="20" height="20" rx="3" fill="currentColor" fillOpacity={0.24} /></svg>
              Upload & Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadCard onChange={setFile} className="w-full" />

            {preview && (
              <div className="mt-6 flex flex-col items-center">
                {/* Image preview could be shown here if desired */}
                <div className="text-sm text-zinc-400">Image selected for mint</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mint Steps + Status (right) */}
        <div className="flex flex-col gap-8">
          {/* Stepper */}
          <Card className="bg-card/60 backdrop-blur border-2 border-white/10 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <StepBadge
                  step={1}
                  label="Upload"
                  active={!!preview && !minted}
                  done={!!preview && Boolean(minted)}
                />
                <div className="h-px flex-1 mx-2 bg-white/15" />
                <StepBadge
                  step={2}
                  label="Mint"
                  active={!!preview && !minted}
                  done={Boolean(minted)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mint status */}
          <Card className="bg-card/60 backdrop-blur border-2 border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white/90">Mint NFT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status && <div className="text-xs text-zinc-400 font-medium">{status}</div>}
              {!preview && (
                <div className="text-sm text-zinc-400">
                  Select an image to mint your NFT.
                </div>
              )}
              {preview && !minted && (
                <div className="text-sm text-zinc-400">
                  Ready to mint your authenticity NFT. 
                </div>
              )}
              <AnimatePresence>
                {minted && (
                  <motion.div
                    key="mint-result"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
                    className="space-y-3"
                  >
                    <Badge variant="default" className="rounded-lg px-2 py-1 bg-black/80 text-white font-bold flex items-center gap-1 border border-white/10 shadow w-fit">
                      <svg width={14} height={14} fill="none" viewBox="0 0 24 24" className="inline-block mr-1 text-white/80"><path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Minted!
                    </Badge>
                    <div className="grid gap-2 rounded border border-white/20 bg-black/30 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">NFT ID</span>
                        <span className="text-white/90">{minted.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Image Hash</span>
                        <span className="text-white/90">{minted.imageHash}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">IPFS</span>
                        <span className="truncate text-white/90">{minted.ipfs}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Minted at</span>
                        <span className="text-white/90">{minted.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {!minted ? (
              <GradientButton
                disabled={!file || minting}
                onClick={handleMint}
                className="px-6 py-2 font-semibold text-lg"
              >
                {minting ? <Loader2 className="animate-spin" /> : "Mint Authenticity NFT"}
              </GradientButton>
            ) : (
              <Button
                variant="secondary"
                onClick={resetMint}
                className="px-4 py-2"
              >
                Start new mint
              </Button>
            )}
            {!minted && (
              <Button
                variant="ghost"
                onClick={resetMint}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  )
}
