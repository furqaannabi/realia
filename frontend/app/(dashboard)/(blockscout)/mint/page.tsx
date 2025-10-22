"use client"

import { useEffect, useState, useRef } from "react"
import { UploadCard } from "@/components/upload-card"
import { GradientButton } from "@/components/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StepBadge } from "@/components/step-badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useAccount, useWriteContract } from "wagmi"
import { PYUSD_ADDRESS, REALIA_ADDRESS } from "../../../utils/config"
import { parseUnits } from "viem"
import RealiaABI from "@/app/utils/web3/Realia.json";
import ERC20ABI from "@/app/utils/web3/ERC20.json";
import { signMessage, simulateContract, writeContract, readContract } from "@wagmi/core"
import { config } from "../../../utils/wallet"
import { AnimatePresence } from "framer-motion"

// Monochrome Loader Modal, in theme (black & white only)
function LoaderModal({
  open,
  message
}: {
  open: boolean,
  message?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center transition-all duration-200">
      <div className="relative bg-gradient-to-br from-black via-zinc-900/95 to-zinc-950/90 border border-white/15 rounded-2xl px-9 py-8 shadow-2xl text-white w-[350px] max-w-xs animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <div className="relative mb-6">
            <span className="absolute inset-0 animate-[spin_1s_linear_infinite] opacity-80">
              {/* Monochrome ring SVG */}
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  stroke="url(#mono-g1)"
                  strokeWidth="6"
                  strokeDasharray="41 120"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="mono-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop stopColor="#FFF" />
                    <stop offset="1" stopColor="#333" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="relative z-10 flex items-center justify-center w-[60px] h-[60px]">
              {/* Loader2 is already themed (uses text-current); keep it white */}
              <Loader2 className="animate-spin text-white opacity-90" size={34} />
            </span>
          </div>
          <div className="font-bold text-2xl tracking-wide bg-gradient-to-r from-white via-zinc-400 to-white bg-clip-text text-transparent drop-shadow mb-2">
            Minting NFT
          </div>
          {message && (
            <div className="text-sm rounded-lg px-2 py-2 bg-zinc-900/80 border border-white/10 text-zinc-100 text-center leading-relaxed whitespace-pre-line shadow-inner min-h-[46px] transition font-mono">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MINT_PRICE = "1";
const ORDER_TYPE_MINT = 1;

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
  const [loaderOpen, setLoaderOpen] = useState(false)
  const [loaderMessage, setLoaderMessage] = useState<string>("")
  const [nftName, setNftName] = useState<string>("")
  const [nftDescription, setNftDescription] = useState<string>("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { address } = useAccount()
  const { writeContractAsync: writeApprove } = useWriteContract()

  const eventSourceRef = useRef<EventSource | null>(null)

  const resetLoader = () => {
    setLoaderMessage("")
    setLoaderOpen(false)
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

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
      return false
    }
  }

  // Returns boolean if allowance >= price (6 decimals)
  const hasSufficientAllowance = async () => {
    if (!address) return false
    try {
      const allowance = await readContract(config, {
        address: PYUSD_ADDRESS,
        abi: ERC20ABI,
        functionName: "allowance",
        args: [address, REALIA_ADDRESS],
      }) as bigint
      // allowance and amount are BigInt
      return allowance >= parseUnits(MINT_PRICE, 6)
    } catch (err) {
      return false
    }
  }

  const handleApprove = async () => {
    setLoaderMessage("Requesting ERC20 approval...")
    try {
      await writeApprove({
        address: PYUSD_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [REALIA_ADDRESS, parseUnits(MINT_PRICE, 6)],
      })
      setLoaderMessage("ERC20 approval succeeded.")
    } catch (err) {
      setLoaderMessage("Approval failed ❌")
      throw err
    }
  }

  const handleCreateOrder = async () => {
    setLoaderMessage("Creating order in contract...")
    try {
      const { request } = await simulateContract(config, {
        address: REALIA_ADDRESS,
        abi: RealiaABI.abi,
        functionName: "createOrder",
        args: [ORDER_TYPE_MINT],
        account: address,
      })
      await writeContract(config, request)
      setLoaderMessage("Order created.")
      return true
    } catch (err) {
      console.log(err)
      setLoaderMessage("Order creation failed ❌")
      throw err
    }
  }

  // Main Mint Handler
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
    setLoaderOpen(true)
    setLoaderMessage("Waiting for wallet signature...")

    let message: string
    let signature: string

    try {
      const name = nftName
      const description = nftDescription

      // Step 0: User signature
      message = `I am signing this message to verify my ownership of this wallet and approve minting my NFT on MyProject.\nTimestamp: ${Date.now()}`
      signature = await signMessage(config, { message })
      setLoaderMessage("Signature verified.")

      // Step 1: Approve ERC20 only if needed
      let needsApproval = true
      try {
        setLoaderMessage("Checking PYUSD allowance...")
        needsApproval = !(await hasSufficientAllowance())
      } catch (err) {
        needsApproval = true
      }
      if (needsApproval) {
        try {
          setLoaderMessage("Approving PYUSD for mint...")
          await handleApprove()
          setLoaderMessage("PYUSD approved.")
        } catch (approveErr) {
          setLoaderMessage("ERC20 Approve failed")
          toast.error("ERC20 Approve failed (user denied or contract issue)")
          setMinting(false)
          setLoaderOpen(false)
          return
        }
      } else {
        setLoaderMessage("Allowance sufficient, skipping approval step.")
      }

      // Step 2: Check/Prepare Mint Order
      let hasOrder = false
      try {
        hasOrder = await hasMintOrder()
      } catch {
        hasOrder = false
      }
      if (!hasOrder) {
        try {
          setLoaderMessage("Creating order in contract...")
          await handleCreateOrder()
          setLoaderMessage("Order created.")
        } catch (orderErr) {
          setLoaderMessage("Failed to create order on contract")
          toast.error("Failed to create order on contract, check wallet confirmation and balance")
          setMinting(false)
          setLoaderOpen(false)
          return
        }
      } else {
        setLoaderMessage("Order already present, proceeding to mint...")
      }

      // Step 3: Minting on backend with simple event parsing (line-by-line)
      const dataToSend = {
        name,
        description,
        message,
        signature,
      }

      const formData = new FormData()
      formData.append("image", file)
      formData.append("data", JSON.stringify(dataToSend))

      let response: Response | null = null
      let reader: ReadableStreamDefaultReader<any> | null = null

      try {
        response = await fetch("https://realia.furqaannabi.com/api/mint", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!response.body) throw new Error("No SSE stream from backend")

        const decoder = new TextDecoder();
        reader = response.body.getReader();
        let resultJson: any = null
        setLoaderMessage("Minting started...")

        let ssePartial = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          ssePartial += chunk;
          // Split lines, parse each for "data: ...", these hold JSON event from server
          const lines = ssePartial.split('\n');
          // keep incomplete last line for next round
          ssePartial = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.slice(6);
                const data = JSON.parse(dataStr);
                if (data.message) setLoaderMessage(data.message);
                if (data.success) resultJson = data;
                if (data.error) {
                  console.log(data.error)
                  setLoaderMessage(data.error || data.message || "Mint failed");
                  // Only show toast once per backend critical error
                  if (resultJson == null) toast.error(data.error || data.message || "Mint failed");
                  throw new Error(data.error || data.message || "Mint failed");
                }
              } catch (err) {
                // Only toast if error has NOT already been handled
                // Try parse and show toast if it's the only place it'd show up
                try {
                  const tryParse = JSON.parse(line.slice(6));
                  if (tryParse && tryParse.error) {
                    // Don't show here: avoids duplicate toasts for same backend error
                  }
                } catch {}
                // Ignore parse error, continue
              }
            }
          }
        }

        // Try to parse any last event
        if (!resultJson && ssePartial) {
          if (ssePartial.startsWith('data: ')) {
            try {
              const dataStr = ssePartial.slice(6);
              const data = JSON.parse(dataStr);
              if (data.success) resultJson = data;
              if (data.error) {
                toast.error(data.error)
              };

            } catch{}
          }
        }

        if (resultJson && resultJson.success) {
          setLoaderMessage("Finalize...")
          setTimeout(() => {
            setMinted({
              nftId: resultJson.nft?.id ?? "",
              imageHash: resultJson.nft?.image?.ipfsCid ?? "",
              ipfs: resultJson.nft?.image?.ipfsCid
                ? `ipfs://${resultJson.nft.image.ipfsCid}`
                : (resultJson.ipfsUrl ?? ""),
              timestamp: resultJson.nft?.createdAt || resultJson.nft?.image?.createdAt || "",
              imageUrl: resultJson.imageUrl ?? "",
              tokenId: resultJson.tokenId ?? resultJson.nft?.tokenId ?? "",
              metadataCid: resultJson.nft?.image.metadataCid ?? "",
              name: name,
              description: description,
            })
            resetLoader()
            toast.success("NFT Minted Successfully!")
          }, 900)
        } else {
          setLoaderMessage("Failed to mint NFT: unknown error")
          setLoaderOpen(false)
        }
      } catch (apiErr: any) {
        console.log(apiErr)
        setLoaderMessage("Backend minting failed")
        if (apiErr?.message) toast.error(apiErr.message)
        else toast.error("Backend minting failed")
        setLoaderOpen(false)
        setMinting(false)
        return
      }

    } catch (error: any) {
      console.log(error)
      setLoaderMessage("Mint error")
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error("Failed to mint NFT")
      }
      setLoaderOpen(false)
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

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

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
    setNftName("")
    setNftDescription("")
    resetLoader()
  }

  const clearAll = () => {
    resetMint()
  }

  return (
    <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
      <LoaderModal
        open={loaderOpen || minting}
        message={loaderMessage}
      />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
          Mint Authenticity NFT
        </h1>
        <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
          Mint your authenticity NFT instantly on-chain. Secure, modern, decentralized.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="relative border-2 border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black/90 backdrop-blur rounded-2xl shadow-xl shadow-black/20 overflow-hidden text-white">
          <CardHeader className="pb-4 flex items-center gap-2 bg-gradient-to-r from-zinc-950/40 to-zinc-900/70 rounded-t-2xl shadow-inner">
            <CardTitle className="font-bold text-lg tracking-wide flex items-center gap-2 text-white/95">
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="text-white/60"><rect width="20" height="20" rx="3" fill="currentColor" fillOpacity={0.24} /></svg>
              Upload & Preview
            </CardTitle>
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
        <div className="flex flex-col gap-8">
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
          <Card className="bg-card/60 backdrop-blur border-2 border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white/90">Mint Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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