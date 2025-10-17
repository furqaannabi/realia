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
import { AnimatePresence } from "framer-motion"

const MINT_PRICE = "1";
const ORDER_TYPE_MINT = 1;

type NFT = {
  id: string
}
type MintInfo = {
  nftId: string,
  imageHash: string
  ipfs: string
  timestamp: string
  imageUrl: string
  tokenId: string
  metadataCid: string
  name?: string
  description?: string
}

export default function MintPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [minted, setMinted] = useState<MintInfo | null>(null)
  const [minting, setMinting] = useState(false)
  const [status, setStatus] = useState<string>("")

  const [nftName, setNftName] = useState<string>("")
  const [nftDescription, setNftDescription] = useState<string>("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { address } = useAccount()
  const { writeContractAsync: writeApprove } = useWriteContract()

  const hasMintOrder = async () => {
    if (!address) return false
    try {
      const hasOrder = await readContract(config, {
        address: REALIA_ADDRESS,
        abi: RealiaABI.abi,
        functionName: "hasOrder",
        args: [address, ORDER_TYPE_MINT],
      })
      return !!hasOrder
    } catch (err) {
      console.error("Failed to check hasOrder:", err)
      return false
    }
  }

  const handleApprove = async () => {
    try {
      setStatus("Approving PYUSD for mint...")
      await writeApprove({
        address: PYUSD_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [REALIA_ADDRESS, parseUnits(MINT_PRICE, 6)],
      })
      setStatus("Approve succeeded.")
    } catch (err) {
      console.error("Approve failed:", err)
      setStatus("Approval failed ❌")
      throw err
    }
  }

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
    if (!nftName.trim()) {
      toast.error("Please provide an NFT name.")
      return
    }
    if (!nftDescription.trim()) {
      toast.error("Please provide an NFT description.")
      return
    }

    setMinting(true)
    setStatus("")
    let message: string
    let signature: string

    try {
      const name = nftName
      const description = nftDescription

      message = `I am signing this message to verify my ownership of this wallet and approve minting my NFT on MyProject.\nTimestamp: ${Date.now()}`
      signature = await signMessage(config, { message })

      try {
        await handleApprove()
      } catch (approveErr) {
        toast.error("ERC20 Approve failed (user denied or contract issue)")
        return
      }

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

      const dataToSend = {
        name,
        description,
        message,
        signature,
      }

      const formData = new FormData()
      formData.append("image", file)
      formData.append("data", JSON.stringify(dataToSend))

      let res
      try {
        res = await api.post("/mint", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })

        console.log("Mint Details: ", res)
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
        const data = res.data
        setMinted({
          nftId: data.nft?.id ?? "",
          imageHash: data.nft?.image?.ipfsCid ?? "",
          ipfs: data.nft?.image?.ipfsCid
            ? `ipfs://${data.nft.image.ipfsCid}`
            : (data.ipfsUrl ?? ""),
          timestamp: data.nft?.createdAt || data.nft?.image?.createdAt || "",
          imageUrl: data.imageUrl ?? "",
          tokenId: data.tokenId ?? data.nft?.tokenId ?? "",
          metadataCid: data.nft?.image.metadataCid ?? "",
          name: name,
          description: description,
        })
        toast.success("NFT Minted Successfully!")
      } else if (res?.data?.error) {
        toast.error(res.data.error || "Failed to mint NFT")
      } else {
        toast.error("Failed to mint NFT (Unknown error)")
      }
    } catch (error: any) {
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

  // Clipboard copy utility
  const handleCopy = async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(value)
      toast.success(`${label ? label + " " : ""}Copied!`)
      setTimeout(() => {
        setCopiedField(null)
      }, 1200)
    } catch (err) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const resetMint = () => {
    setMinted(null)
    setFile(null)
    setPreview(null)
    setStatus("")
    setNftName("")
    setNftDescription("")
  }

  // New: Clear All handler for full reset, in case you want future customizations
  const clearAll = () => {
    resetMint()
    // Any other clearing logic could go here
  }

  return (
    <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
          Mint Authenticity NFT
        </h1>
        <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
          Mint your authenticity NFT instantly on-chain. Secure, modern, decentralized.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upload + Preview CARD (left) */}
        <Card className="relative border-2 border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black/90 backdrop-blur rounded-2xl shadow-xl shadow-black/20 overflow-hidden text-white">
          <CardHeader className="pb-4 flex items-center gap-2 bg-gradient-to-r from-zinc-950/40 to-zinc-900/70 rounded-t-2xl shadow-inner">
            <CardTitle className="font-bold text-lg tracking-wide flex items-center gap-2 text-white/95">
              {/* Icon space */}
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="text-white/60"><rect width="20" height="20" rx="3" fill="currentColor" fillOpacity={0.24} /></svg>
              Upload & Preview
            </CardTitle>
            {/* Add Clear All Button at top right of upload step card */}
            {(file || preview || nftName || nftDescription) && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 z-10 px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition"
                onClick={clearAll}
                type="button"
                aria-label="Clear all uploaded and form data"
              >
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <UploadCard
              onChange={setFile}
              value={file}
              className="w-full"
            />

            {preview && (
              <div className="mt-6 flex flex-col items-center">
                <div className="text-sm text-zinc-400">Image selected for mint</div>
                <img
                  src={preview}
                  alt="NFT Preview"
                  className="mt-2 rounded-lg object-contain max-h-40 border border-white/10 bg-black/50"
                />
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

          {/* Mint Name and Description Form */}
          <Card className="bg-card/60 backdrop-blur border-2 border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white/90">NFT Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!minted ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={e => {
                    e.preventDefault()
                    if (!minted) handleMint()
                  }}
                  autoComplete="off"
                >
                  <div>
                    <label htmlFor="nft-name" className="block text-sm font-medium text-zinc-300 mb-1">NFT Name</label>
                    <input
                      id="nft-name"
                      type="text"
                      required
                      maxLength={80}
                      value={nftName}
                      onChange={e => setNftName(e.target.value)}
                      placeholder="e.g. Certificate of Authenticity"
                      className="w-full px-3 py-2 rounded-md border border-white/10 bg-zinc-950/80 text-white shadow focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="nft-description" className="block text-sm font-medium text-zinc-300 mb-1">NFT Description</label>
                    <textarea
                      id="nft-description"
                      required
                      rows={3}
                      maxLength={300}
                      value={nftDescription}
                      onChange={e => setNftDescription(e.target.value)}
                      placeholder="e.g. Digital proof of authenticity for your collectible."
                      className="w-full px-3 py-2 rounded-md border border-white/10 bg-zinc-950/80 text-white shadow focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <GradientButton
                    type="submit"
                    disabled={!file || !nftName.trim() || !nftDescription.trim() || minting}
                    className="px-6 py-2 font-semibold text-lg flex justify-center items-center"
                  >
                    {minting ? <Loader2 className="animate-spin" /> : "Mint Authenticity NFT"}
                  </GradientButton>
                  {/* Add Clear All button in the form for even easier access */}
                  {(file || nftName || nftDescription || preview) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={clearAll}
                    >
                      Clear All
                    </Button>
                  )}
                </form>
              ) : (
                // Only show the name and description, not the form
                <div className="mt-2 space-y-2 text-base font-medium text-white/90 bg-black/30 rounded-lg p-4 border border-white/10 break-words w-full">
                  <div className="flex flex-col mb-2">
                    <span className="font-semibold text-zinc-400">NFT Name:</span>
                    <span
                      className="break-words text-white/95 cursor-pointer hover:bg-white/10 px-1 rounded transition"
                      title="Click to copy NFT Name"
                      onClick={() => minted.name && handleCopy(minted.name, "NFT Name")}
                      style={{ userSelect: "all" }}
                    >
                      {minted.name}
                      {copiedField === minted.name && (
                        <span className="ml-2 text-primary text-xs font-semibold">Copied!</span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-400">NFT Description:</span>
                    <span
                      className="break-words text-white/95 cursor-pointer hover:bg-white/10 px-1 rounded transition"
                      title="Click to copy NFT Description"
                      onClick={() => minted.description && handleCopy(minted.description, "NFT Description")}
                      style={{ userSelect: "all" }}
                    >
                      {minted.description}
                      {copiedField === minted.description && (
                        <span className="ml-2 text-primary text-xs font-semibold">Copied!</span>
                      )}
                    </span>
                  </div>
               </div>
              )}
            </CardContent>
          </Card>

          {/* Mint Status / Result */}
          <Card className="bg-card/60 backdrop-blur border-2 border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white/90">Mint Status</CardTitle>
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
                  <div
                    key="mint-result"
                    className="space-y-3"
                  >
                    <Badge variant="default" className="rounded-lg px-2 py-1 bg-black/80 text-white font-bold flex items-center gap-1 border border-white/10 shadow w-fit">
                      <svg width={14} height={14} fill="none" viewBox="0 0 24 24" className="inline-block mr-1 text-white/80"><path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Minted!
                    </Badge>
                    <div className="overflow-x-auto">
                      <div className="grid gap-2 rounded border border-white/20 bg-black/30 p-3 text-sm min-w-[320px] max-w-full overflow-auto">
                        <MintedRow
                          label="NFT Name"
                          value={minted.name}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="Description"
                          value={minted.description}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="NFT ID"
                          value={minted.nftId}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="Image Hash (IPFS CID)"
                          value={minted.imageHash}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-zinc-400">Image</span>
                          <span className="text-white/90 text-right truncate max-w-[220px] md:max-w-[300px]" title={minted.imageUrl}>
                            {minted.imageUrl ? (
                              <a
                                href={minted.imageUrl.startsWith("http") ? minted.imageUrl : `https://realiabucket.s3.amazonaws.com/${minted.imageUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline truncate"
                                title={minted.imageUrl}
                                onClick={e => {
                                  e.stopPropagation();
                                }}
                              >
                                {minted.imageUrl.split("/").pop()}
                              </a>
                            ) : (
                              "-"
                            )}
                            {minted.imageUrl && (
                              <button
                                type="button"
                                aria-label="Copy Image URL"
                                className="ml-2 text-xs text-primary hover:underline"
                                tabIndex={0}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCopy(minted.imageUrl, "Image URL");
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, margin: 0 }}
                              >Copy</button>
                            )}
                            {copiedField === minted.imageUrl && (
                              <span className="ml-2 text-primary text-xs font-semibold">Copied!</span>
                            )}
                          </span>
                        </div>
                        <MintedRow
                          label="IPFS URI"
                          value={minted.ipfs}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="Token ID"
                          value={minted.tokenId}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="Metadata CID"
                          value={minted.metadataCid}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                        <MintedRow
                          label="Minted at"
                          value={minted.timestamp ? new Date(minted.timestamp).toLocaleString() : ""}
                          copiedField={copiedField}
                          onCopy={handleCopy}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {minted && (
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
            {/* Add a dedicated Clear All button for ALL uploaded & form data */}
            {(file || preview || nftName || nftDescription) && (
              <Button
                variant="destructive"
                onClick={clearAll}
                className="px-4 py-2"
                type="button"
                aria-label="Clear all uploaded file and form"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// Row component to handle copy for minted detail fields
function MintedRow({
  label,
  value,
  copiedField,
  onCopy,
}: {
  label: string
  value?: string
  copiedField: string | null
  onCopy: (value: string, label?: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-400">{label}</span>
      <span
        className={`text-white/90 text-right truncate max-w-[220px] md:max-w-[300px] cursor-pointer hover:bg-white/10 px-1 rounded transition`}
        title={value}
        onClick={() => value && onCopy(value, label)}
        style={{ userSelect: "all" }}
        tabIndex={0}
        onKeyDown={e => {
          if ((e.key === "Enter" || e.key === " ") && value) {
            e.preventDefault();
            onCopy(value, label);
          }
        }}
      >
        {value || "-"}
        {copiedField === value && (
          <span className="ml-2 text-primary text-xs font-semibold">Copied!</span>
        )}
      </span>
    </div>
  );
}
