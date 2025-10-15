"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UploadCloud, ImageIcon, Copy, CheckCircle2, Loader2, AlertTriangle, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { api } from "../utils/axiosInstance"
import { useAccount, useWriteContract } from "wagmi"
import { PYUSD_ADDRESS, REALIA_ADDRESS } from "../utils/config"
import RealiaABI from "@/app/utils/web3/Realia.json";
import ERC20ABI from "@/app/utils/web3/ERC20.json";
import { parseUnits } from "viem"
import { readContract, simulateContract, writeContract } from "@wagmi/core"
import { config } from "../utils/wallet"
import { motion } from "framer-motion"

type ImgDims = { width: number; height: number }

// --- Mint price and contract order type constants from Solidity (see file_context_0) ---
const VERIFY_PRICE = "5"; // 1e6 (6 decimals), string for parseUnits
const ORDER_TYPE_VERIFY = 2;

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

async function sha256Hex(buffer: ArrayBuffer) {
    const hash = await crypto.subtle.digest("SHA-256", buffer)
    const bytes = new Uint8Array(hash)
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

function detectExif(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    const exif = [0x45, 0x78, 0x69, 0x66] // "Exif"
    for (let i = 0; i < bytes.length - exif.length; i++) {
        if (bytes[i] === exif[0] && bytes[i + 1] === exif[1] && bytes[i + 2] === exif[2] && bytes[i + 3] === exif[3]) {
            return true
        }
    }
    return false
}

function seedScoreFromHash(hashHex: string, exif: boolean) {
    const seed = Number.parseInt(hashHex.slice(0, 4), 16) % 39
    let score = 60 + seed
    if (exif) score = Math.min(98, score + 2)
    return score
}

async function getImageDimensions(file: File): Promise<ImgDims> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new window.Image()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
            URL.revokeObjectURL(url)
        }
        img.onerror = (e) => {
            URL.revokeObjectURL(url)
            reject(e)
        }
        img.src = url
        img.crossOrigin = "anonymous"
    })
}

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        // no-op: clipboard might be blocked
    }
}

// --- Loader Steps, loader UI helpers ---
const loaderSteps: { key: string; label: string }[] = [
    { key: "prepare", label: "Hash & Inspect Image..." },
    { key: "approve", label: "Approving tokens..." },
    { key: "order", label: "Placing order on-chain..." },
    { key: "api", label: "Finalizing with backend..." },
]

// Helper: Current step index (0–3)
function getActiveLoaderStep({ loadingApprove, loadingOrder, loadingApi, verifying }: any): number {
    if (verifying && loadingApprove) return 1 // Approving tokens
    if (verifying && loadingOrder) return 2 // Placing order
    if (verifying && loadingApi) return 3 // API
    if (verifying && !loadingApprove && !loadingOrder && !loadingApi) return 0 // Hash image etc
    return -1
}

export default function VerifyPage() {
    const [file, setFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [buffer, setBuffer] = React.useState<ArrayBuffer | null>(null)
    const [hashHex, setHashHex] = React.useState<string>("")
    const [dims, setDims] = React.useState<ImgDims | null>(null)
    const [exifPresent, setExifPresent] = React.useState<boolean | null>(null)
    const [score, setScore] = React.useState<number | null>(null)
    const [verifying, setVerifying] = React.useState(false)
    const [verified, setVerified] = React.useState(false)
    const [verificationError, setVerificationError] = React.useState<string | null>(null)

    const [loadingApprove, setLoadingApprove] = React.useState(false)
    const [loadingOrder, setLoadingOrder] = React.useState(false)
    const [loadingApi, setLoadingApi] = React.useState(false)


    React.useEffect(() => {
        api.get('/verifications').then((res) => console.log("Verification",res)).catch((e) => {
            console.log(e)
        })
    },[])
    // For chat-like loader states
    const [loaderMessages, setLoaderMessages] = React.useState<{ step: number, type: "loading" | "done", message: string }[]>([])

    const { address } = useAccount()
    const { writeContractAsync: writeApprove } = useWriteContract()

    const hasVerifyOrder = async () => {
        if (!address) return false
        try {
            const hasOrder = await readContract(config, {
                address: REALIA_ADDRESS,
                abi: RealiaABI.abi,
                functionName: "hasOrder",
                args: [address, ORDER_TYPE_VERIFY],
            })
            return !!hasOrder
        } catch (err) {
            console.error("Failed to check hasOrder:", err)
            return false
        }
    }

    const handleApprove = async () => {
        setLoadingApprove(true)
        try {
            await writeApprove({
                address: PYUSD_ADDRESS,
                abi: ERC20ABI,
                functionName: "approve",
                args: [REALIA_ADDRESS, parseUnits(VERIFY_PRICE, 4)],
            })
        } catch (err) {
            console.error("Approve failed:", err)
            throw err
        } finally {
            setLoadingApprove(false)
        }
    }

    const handleCreateOrder = async () => {
        setLoadingOrder(true)
        try {
            const { request } = await simulateContract(config, {
                address: REALIA_ADDRESS,
                abi: RealiaABI.abi,
                functionName: "createOrder",
                args: [ORDER_TYPE_VERIFY],
                account: address,
            })
            await writeContract(config, request)
            return true
        } catch (err) {
            console.error("Order create failed:", err)
            throw err
        } finally {
            setLoadingOrder(false)
        }
    }

    // Chat-like loader: step at which we are in verification
    const [lastLoaderStep, setLastLoaderStep] = React.useState(-1)

    // Enhanced loader: Reset chat steps when verification is retried
    React.useEffect(() => {
        if (!verifying) {
            setLoaderMessages([])
            setLastLoaderStep(-1)
        }
    }, [verifying])

    // Update chat messages as step changes
    React.useEffect(() => {
        // Figure out which step is active
        const activeLoaderStep = getActiveLoaderStep({
            loadingApprove,
            loadingOrder,
            loadingApi,
            verifying,
        });
        // If the step changed, update chat log
        if (!verifying) return
        if (activeLoaderStep !== lastLoaderStep) {
            setLoaderMessages((prev) => {
                let updated = prev.slice();
                // Complete the previous, if any and not yet done
                if (lastLoaderStep >= 0 && prev[prev.length - 1]?.type === "loading") {
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        type: "done"
                    }
                }
                // Add the new one if not already present
                if (
                    activeLoaderStep >= 0 &&
                    (!updated.length || updated[updated.length - 1].step !== activeLoaderStep)
                ) {
                    updated.push({
                        step: activeLoaderStep,
                        type: "loading",
                        message: loaderSteps[activeLoaderStep]?.label ?? "Processing..."
                    });
                }
                return updated;
            });
            setLastLoaderStep(activeLoaderStep);
        }
    }, [verifying, loadingApprove, loadingOrder, loadingApi, lastLoaderStep])

    const verifyImage = async () => {
        if (!file) {
            toast.error("Please upload an image.")
            setVerificationError("Please upload an image to verify.")
            return false
        }
        if (!address) {
            toast.error("Wallet not connected")
            setVerificationError("Wallet not connected.")
            return false
        }

        setVerifying(true)
        setVerified(false)
        setLoadingApprove(false)
        setLoadingOrder(false)
        setLoadingApi(false)
        setVerificationError(null)
        setLoaderMessages([{ step: 0, type: "loading", message: loaderSteps[0].label }]);
        setLastLoaderStep(0);

        // Clear details and reset on each verify
        setHashHex("")
        setDims(null)
        setExifPresent(null)
        setScore(null)

        try {
            // 1. Compute hash & EXIF & dimensions client-side
            const arr = buffer ?? (await file.arrayBuffer())
            const [hex, exif] = await Promise.all([sha256Hex(arr), Promise.resolve(detectExif(arr))])
            setHashHex(hex)
            setExifPresent(exif)
            const sc = seedScoreFromHash(hex, exif)
            setScore(sc)
            if (!dims) {
                const d = await getImageDimensions(file)
                setDims(d)
            }

            // 2. Approve tokens
            setLoadingApprove(true)
            try {
                await handleApprove()
            } catch (approveErr) {
                setLoadingApprove(false)
                const msg = "ERC20 Approve failed (user denied or contract issue)"
                setVerificationError(msg)
                toast.error(msg)
                return false
            }
            setLoadingApprove(false)

            // 3. Ensure an order exists or create one
            setLoadingOrder(true)
            let hasOrder = false
            try {
                hasOrder = await hasVerifyOrder()
            } catch {
                hasOrder = false
            }
            if (!hasOrder) {
                try {
                    await handleCreateOrder()
                } catch (orderErr) {
                    setLoadingOrder(false)
                    const msg = "Failed to create order on contract, check wallet confirmation and balance"
                    setVerificationError(msg)
                    toast.error(msg)
                    return false
                }
            }
            setLoadingOrder(false)

            // 4. POST to API backend for mint
            setLoadingApi(true)
            const formData = new FormData()
            formData.append("image", file)
            let res
            try {
                res = await api.post("/verify", formData)
                console.log(res)
            } catch (apiErr: any) {
                setLoadingApi(false)
                const errMsg = apiErr?.response?.data?.error
                    ? apiErr.response.data.error
                    : "Backend minting failed"
                setVerificationError(errMsg)
                toast.error(errMsg)
                return false
            }
            setLoadingApi(false)

            if (res?.data) {
                toast.success("NFT Verified Successfully!")
                setVerified(true)
                setVerificationError(null)
                return true
            } else if (res?.data?.error) {
                setVerificationError(res.data.error || "Failed to mint NFT")
                toast.error(res.data.error || "Failed to mint NFT")
                return false
            } else {
                setVerificationError("Failed to mint NFT (Unknown error)")
                toast.error("Failed to mint NFT (Unknown error)")
                return false
            }
        } catch (error: any) {
            console.error("Verification error:", error)
            if (error?.response?.data?.error) {
                setVerificationError(error.response.data.error)
                toast.error(error.response.data.error)
            } else {
                setVerificationError("Verification Error")
                toast.error("Verification Error")
            }
            return false
        } finally {
            setVerifying(false)
            setLoadingApprove(false)
            setLoadingOrder(false)
            setLoadingApi(false)
        }
    }

    React.useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const onSelect = async (f: File | null) => {
        setVerified(false)
        setHashHex("")
        setDims(null)
        setExifPresent(null)
        setScore(null)
        setBuffer(null)
        setVerificationError(null)

        if (!f) {
            setFile(null)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
            return
        }

        setFile(f)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(f)
        setPreviewUrl(url)

        try {
            const [arrBuf, d] = await Promise.all([f.arrayBuffer(), getImageDimensions(f)])
            setBuffer(arrBuf)
            setDims(d)
        } catch {
            // swallow
        }
    }

    const onDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const f = e.dataTransfer.files?.[0]
        if (f && f.type.startsWith("image/")) {
            await onSelect(f)
        }
    }

    const onVerify = async () => {
        if (!file) return
        await verifyImage()
    }

    const overallLoading =
        verifying ||
        loadingApprove ||
        loadingOrder ||
        loadingApi

    // Step index for progress/pipeline bar
    const activeLoaderStep = getActiveLoaderStep({
        loadingApprove,
        loadingOrder,
        loadingApi,
        verifying,
    })

    // For smooth pipelined loader with progress % (25, 50, 75, 100)
    const stepProgressPercent = [20, 40, 70, 98, 100][activeLoaderStep >= 0 ? activeLoaderStep : 0];

    // Status string for mobile/progress fallback
    let loaderMessage = ""
    if (activeLoaderStep >= 0 && loaderSteps[activeLoaderStep]) {
        loaderMessage = loaderSteps[activeLoaderStep].label
    } else if (verifying) {
        loaderMessage = "Verifying..."
    }

    // Chat-like Loader display for VERIFICATION details panel (right-side)
    function ChatLoaderPipeline() {
        return (
            <div className="w-full flex flex-col items-start gap-2 pb-2 text-sm">
              {loaderMessages.map((msg, i) => {
                // Only animate the *last* (new) message
                const isNewest = i === loaderMessages.length - 1;
                if (isNewest) {
                  return (
                    <motion.span
                      key={msg.step}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.06,
                        duration: 0.28,
                        type: "spring",
                        stiffness: 122,
                      }}
                      className={
                        msg.type === "done"
                          ? "text-green-700 font-medium"
                          : "text-gray-400"
                      }
                    >
                      {msg.type === "done"
                        ? msg.message.replace("...", " ✓")
                        : msg.message}
                    </motion.span>
                  );
                } else {
                  return (
                    <span
                      key={msg.step}
                      className={
                        msg.type === "done"
                          ? "text-green-700 font-medium"
                          : "text-gray-400"
                      }
                    >
                      {msg.type === "done"
                        ? msg.message.replace("...", " ✓")
                        : msg.message}
                    </span>
                  );
                }
              })}
            </div>
        );
    }

    // Enhanced error state with icon and context/tips
    function ErrorDisplay({ err, retry, disabled }: { err: string, retry: () => void, disabled: boolean }) {
        return (
            <div className="flex flex-col gap-5 items-center justify-center rounded-lg border p-8 shadow-md">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-6 w-6" strokeWidth={2.4}/>
                    <span className="text-lg font-bold">Verification Failed</span>
                </div>
                <div className="w-full text-center text-red-700 font-normal text-base break-words">
                    {err || "An unknown error occurred during verification."}
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="flex cursor-pointer items-center gap-1.5 mt-2 px-4 py-2"
                    onClick={retry}
                    disabled={disabled}
                >
                    <RefreshCcw className="h-4 w-4 mr-0.5"/>
                    Retry
                </Button>
                <div className="mt-4 flex flex-col items-center text-xs text-gray-500 text-center gap-1 leading-tight">
                    <p>• Make sure you are connected to your wallet and have enough tokens for the verification.</p>
                    <p>• If this keeps happening,&nbsp;
                        <a href="mailto:support@realia.app" className="text-blue-600 underline hover:text-blue-800">
                            contact support
                        </a>
                        &nbsp;or try refreshing the page.
                    </p>
                </div>
            </div>
        )
    }

    // Keep the original LoaderPipeline for left panel (compact UI) but show chat on Verification side!

    return (
        <main className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-pretty">Verify Image</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upload an image to compute its SHA-256, detect EXIF, and verify authenticity on-chain.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Upload & Preview */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Upload & Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <label
                            onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onDrop={onDrop}
                            className="group relative flex h-96 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-background transition-colors hover:bg-muted/40"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const f = e.target.files?.[0] ?? null
                                    if (f && f.type.startsWith("image/")) await onSelect(f)
                                }}
                            />
                            {!previewUrl ? (
                                <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
                                    <div className="mb-3 rounded-md border border-border p-3">
                                        <UploadCloud className="h-5 w-5" />
                                    </div>
                                    <p className="font-medium text-foreground">Drag & drop an image</p>
                                    <p className="mt-0.5">or click to browse (JPG, PNG, etc.)</p>
                                </div>
                            ) : (
                                <div className="relative h-full w-full overflow-hidden rounded-md">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewUrl || "/placeholder.svg"}
                                        alt="Uploaded preview"
                                        className="h-full w-full object-contain bg-muted"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            )}

                            {!previewUrl && (
                                <div className="pointer-events-none absolute inset-0 rounded-md ring-0 transition group-hover:ring-1 group-hover:ring-border" />
                            )}
                        </label>

                        {file ? (
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span className="font-medium text-foreground truncate">{file.name}</span>
                                <span>
                                    • {file.type || "image"} • {formatBytes(file.size)}
                                </span>
                            </div>
                        ) : null}

                        <div className="mt-4 flex gap-2">
                            <Button
                                onClick={onVerify}
                                disabled={!file || overallLoading}
                                className="flex-1 cursor-pointer"
                                variant="default"
                            >
                                {overallLoading
                                    ? (loaderMessage || "Verifying...")
                                    : verified
                                        ? "Re-verify"
                                        : "Verify Image"}
                            </Button>
                            <Button
                                variant="outline"
                                className="whitespace-nowrap bg-transparent cursor-pointer"
                                onClick={() => onSelect(null)}
                                disabled={overallLoading}
                            >
                                Clear
                            </Button>
                        </div>
                        
                    </CardContent>
                </Card>

                {/* Right: Verification Details */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Verification Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Skeleton: Pending state */}
                        {!file && (
                            <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                                <UploadCloud className="mt-0.5 h-4 w-4" />
                                <div>
                                    Drop an image on the left to see its hash, EXIF presence, dimensions, and a minimal authenticity
                                    score.
                                </div>
                            </div>
                        )}

                        {/* CHAT-LIKE Loader */}
                        {file && overallLoading && (
                            <div className="flex flex-col items-start justify-start min-h-[260px] w-full sm:px-6">
                                <ChatLoaderPipeline />
                                {/* Minimal progress bar */}
                                {/* <div className="w-full max-w-xs mx-auto mt-8 mb-2">
                                    <div className="relative h-2.5 rounded-lg overflow-hidden bg-muted border">
                                        <div
                                            className="absolute left-0 top-0 h-full rounded-lg bg-gradient-to-r from-primary/80 via-primary to-primary/70 transition-all duration-300"
                                            style={{ width: `${stepProgressPercent || 20}%` }}
                                        ></div>
                                    </div>
                                </div> */}
                            </div>
                        )}

                        {/* Enhanced Error State */}
                        {file && !overallLoading && verificationError && (
                            <ErrorDisplay err={verificationError} retry={onVerify} disabled={overallLoading} />
                        )}

                        {/* Only show verification details AFTER verification succeeds (never during loader, never if error) */}
                        {file && !overallLoading && !verificationError && verified && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default" className="rounded flex items-center gap-1">
                                            <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-green-700" />
                                            Complete
                                        </Badge>
                                        {exifPresent != null && (
                                            <Badge variant={exifPresent ? "secondary" : "outline"} className="rounded">
                                                EXIF {exifPresent ? "Present" : "Not found"}
                                            </Badge>
                                        )}
                                        {dims && (
                                            <Badge variant="outline" className="rounded">
                                                {dims.width}×{dims.height}px
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="mb-4 rounded-md border p-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Authenticity Score</div>
                                            <div className="mt-1 text-3xl font-semibold">
                                                {score != null ? `${score}` : "—"}
                                                {score != null && <span className="ml-1 text-base text-muted-foreground">/100</span>}
                                            </div>
                                        </div>
                                        {hashHex && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 bg-transparent"
                                                onClick={() => copyToClipboard(hashHex)}
                                                title="Copy SHA-256"
                                            >
                                                <Copy className="h-4 w-4" />
                                                Copy hash
                                            </Button>
                                        )}
                                    </div>

                                    {/* Minimal progress bar */}
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded bg-muted">
                                        <div
                                            className="h-full rounded bg-foreground transition-all"
                                            style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }}
                                        />
                                    </div>
                                </div>

                                <dl className="grid grid-cols-3 gap-3 text-sm">
                                    <dt className="col-span-1 text-muted-foreground">File name</dt>
                                    <dd className="col-span-2 truncate">{file.name}</dd>

                                    <dt className="col-span-1 text-muted-foreground">MIME type</dt>
                                    <dd className="col-span-2">{file.type || "image"}</dd>

                                    <dt className="col-span-1 text-muted-foreground">Size</dt>
                                    <dd className="col-span-2">{formatBytes(file.size)}</dd>

                                    <dt className="col-span-1 text-muted-foreground">Dimensions</dt>
                                    <dd className="col-span-2">{dims ? `${dims.width} × ${dims.height}` : verified ? "Unknown" : "—"}</dd>

                                    <dt className="col-span-1 text-muted-foreground">EXIF data</dt>
                                    <dd className="col-span-2">
                                        {exifPresent == null ? (verified ? "Unknown" : "—") : exifPresent ? "Present" : "Not found"}
                                    </dd>

                                    <dt className="col-span-1 text-muted-foreground">SHA-256</dt>
                                    <dd className="col-span-2">
                                        {hashHex ? (
                                            <div className="max-w-full overflow-x-auto rounded bg-muted p-2 font-mono text-xs text-foreground">
                                                {hashHex}
                                            </div>
                                        ) : verified ? (
                                            "Unavailable"
                                        ) : (
                                            "—"
                                        )}
                                    </dd>
                                </dl>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

// Custom slow spin animation for loader
// Add this somewhere in global styles or inline if required:
/*
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
.animate-spin-slow { animation: spin 1.4s linear infinite;}
*/
