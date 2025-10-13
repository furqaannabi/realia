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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Mint Authenticity NFT</h1>
        <p className="text-sm text-muted-foreground mt-1">Mint your authenticity NFT instantly.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left: Large image preview / uploader */}
        <div className="md:col-span-3">
          <UploadCard onChange={setFile} className="w-full" />
        </div>

        {/* Right: Steps and CTA */}
        <div className="md:col-span-2 space-y-6">
          {/* Stepper */}
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <StepBadge
                  step={1}
                  label="Upload"
                  active={!!preview && !minted}
                  done={!!preview && Boolean(minted)}
                />
                <div className="h-px flex-1 mx-2 bg-border" />
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
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">Mint NFT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status && <div className="text-xs text-gray-500">{status}</div>}

              {!preview && (
                <div className="text-sm text-muted-foreground">
                  Select an image to mint your NFT.
                </div>
              )}

              {preview && !minted && (
                <div className="text-sm text-muted-foreground">
                  Ready to mint your authenticity NFT.
                </div>
              )}

              {minted && (
                <div className="space-y-3">
                  <div className="text-sm">Minted successfully on Testnet.</div>
                  <div className="grid gap-2 rounded border border-border/60 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">NFT ID</span>
                      <span>{minted.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Image Hash</span>
                      <span>{minted.imageHash}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">IPFS</span>
                      <span className="truncate">{minted.ipfs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Minted</span>
                      <span>{minted.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {!minted ? (
              <GradientButton
                disabled={!file || minting}
                onClick={handleMint}
              >
                {minting ? <Loader2 className="animate-spin" /> : "Mint Authenticity NFT"}
              </GradientButton>
            ) : (
              <Button
                variant="secondary"
                onClick={resetMint}
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
      </div>
    </div>
  )
}
