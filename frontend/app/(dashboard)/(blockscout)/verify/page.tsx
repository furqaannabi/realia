"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UploadCloud, ImageIcon, CheckCircle2, Loader2, AlertTriangle, RefreshCcw, Check, X } from "lucide-react"
import { toast } from "sonner"
import { api } from "../../../utils/axiosInstance"
import { useAccount, useWriteContract } from "wagmi"
import { PYUSD_ADDRESS, REALIA_ADDRESS } from "../../../utils/config"
import RealiaABI from "@/app/utils/web3/Realia.json"
import ERC20ABI from "@/app/utils/web3/ERC20.json"
import { parseUnits } from "viem"
import { readContract, simulateContract, writeContract } from "@wagmi/core"
import { config } from "../../../utils/wallet"
import { AnimatePresence, motion } from "framer-motion"
import { ethers } from 'ethers'
import { useVerificationWatcher } from "@/hooks/useVerificationWatcher"
import { useTransactionPopup, useNotification } from "@blockscout/app-sdk";
import { getResponseByAgent } from "@/app/utils/web3/blockscout"
import { useLeaderboardAgents } from "@/app/(dashboard)/leaderboard/page" // <-- Import Leaderboard hook

type ImgDims = { width: number; height: number }

// REMOVE THIS LINE: const TOTAL_AGENTS_EXPECTED = 3

const VERIFY_PRICE = "5";
const ORDER_TYPE_VERIFY = 2;

// Utility: convert chain id for blockscout useTxToast & related hooks
function mapBlockscoutChainId(chainId: number | string): string {
    if (chainId === 421614 || chainId === "421614") return "1500";
    return String(chainId);
}

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
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

const loaderSteps: { key: string; label: string }[] = [
    { key: "prepare", label: "Prepare image..." },
    { key: "approve", label: "Approving tokens..." },
    { key: "order", label: "Placing order on-chain..." },
    { key: "api", label: "Finalizing with backend..." },
    { key: "watcher", label: "Waiting for agent(s) response..." },
]

function getActiveLoaderStepExtended({
    loadingApprove,
    loadingOrder,
    loadingApi,
    verifying,
    watcherActive,
}: any): number {
    if (verifying && loadingApprove) return 1
    if (verifying && loadingOrder) return 2
    if (verifying && loadingApi) return 3
    if (watcherActive) return 4
    if (verifying && !loadingApprove && !loadingOrder && !loadingApi) return 0
    return -1
}

// Format address for display
function formatShortAddress(addr?: string) {
    if (!addr || typeof addr !== "string") return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Agent response table/displays
function AgentResponsesTable({ responses, totalAgents }: { responses: any[], totalAgents: number }) {
    // Map agent-addresses for those responded, and count remaining
    const respondedAgents = responses.map(r => r.agent?.toLowerCase())
    const remainingCount = Math.max(0, totalAgents - responses.length)
    // Optionally: could support showing a placeholder for those not yet responded

    return (
        <div className="mt-5 w-full">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-zinc-50">Agent Responses</span>
                <Badge
                    className="bg-zinc-700/30 border-zinc-400/20 text-xs text-white ml-2"
                >
                    {`${responses.length} / ${totalAgents} responded`}
                </Badge>
                {remainingCount > 0 && (
                    <span className="text-zinc-400 text-xs ml-2">{remainingCount} agent{remainingCount > 1 ? "s" : ""} remaining...</span>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full rounded-xl bg-black/30 border border-zinc-700/20 text-xs shadow">
                    <thead>
                        <tr className="bg-zinc-800/70 text-zinc-200 uppercase text-xs">
                            <th className="py-2 px-2 border-b border-zinc-700 font-semibold">Agent</th>
                            <th className="py-2 px-2 border-b border-zinc-700 font-semibold">Block</th>
                            <th className="py-2 px-2 border-b border-zinc-700 font-semibold">Tx Hash</th>
                            <th className="py-2 px-2 border-b border-zinc-700 font-semibold">Response</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-zinc-400 py-5">No agent responses yet.</td>
                            </tr>
                        ) : (
                            responses.map((r, i) => (
                                <tr key={r.agent + "-" + r.blockNumber + "-" + i} className="hover:bg-zinc-900/40 border-b border-zinc-700/15">
                                    <td className="py-2 px-2 font-mono">{formatShortAddress(r.agent)}</td>
                                    <td className="py-2 px-2">{r.blockNumber}</td>
                                    <td className="py-2 px-2 font-mono">
                                        {r.txHash ?
                                            <a href={`https://arbitrum-sepolia.blockscout.com/tx/${r.txHash}`} className="underline text-blue-300" target="_blank" rel="noopener noreferrer">
                                                {`${r.txHash.slice(0, 10)}...${r.txHash.slice(-5)}`}
                                            </a> : "--"}
                                    </td>
                                    <td className="py-2 px-2">
                                        {r.verified === true
                                            ? <span className="inline-flex items-center gap-1 bg-green-700/10 px-2 py-0.5 rounded font-semibold text-green-300"><Check className="h-4 w-4" />Verified</span>
                                            : r.verified === false
                                                ? <span className="inline-flex items-center gap-1 bg-red-700/10 px-2 py-0.5 rounded font-semibold text-red-300"><X className="h-4 w-4" />Rejected</span>
                                                : <span className="inline-flex items-center gap-1 bg-yellow-700/10 px-2 py-0.5 rounded font-semibold text-yellow-200"><Loader2 className="h-4 w-4 animate-spin" />Pending</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function VerifyPage() {
    const [file, setFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [dims, setDims] = React.useState<ImgDims | null>(null)
    const [verifying, setVerifying] = React.useState(false)
    const [verified, setVerified] = React.useState(false)
    const [verificationError, setVerificationError] = React.useState<string | null>(null)

    const [loadingApprove, setLoadingApprove] = React.useState(false)
    const [loadingOrder, setLoadingOrder] = React.useState(false)
    const [loadingApi, setLoadingApi] = React.useState(false)

    const [verificationId, setVerificationId] = React.useState<string | null>(null)
    const { isVerified, loading: watcherLoading, error: watcherError, startWatcher, response } = useVerificationWatcher()
    const [watcherActive, setWatcherActive] = React.useState(false)

    // Use leaderboard agents for correct count
    const { agentsCount } = useLeaderboardAgents()

    // Blockscout app-sdk TransactionPopup
    const { openTxToast } = useNotification();

    // (for dev debug)
    React.useEffect(() => {
        const getAgentResponse = async () => {
            // console.log(await getResponseByAgent(1))
        }
        // api.get('/verifications').then((res) => console.log("Verification", res)).catch((e) => {
        //     console.log(e)
        // })
        // getAgentResponse()
    }, [])
    React.useEffect(() => {
        // console.log("debug", isVerified, watcherLoading, watcherError, response)
    }, [isVerified, watcherLoading, watcherError, response])

    const [loaderMessages, setLoaderMessages] = React.useState<
        { step: number, type: "loading" | "done", message: string }[]
    >([])

    const { address, chain } = useAccount()
    const { writeContractAsync: writeApprove } = useWriteContract()

    // Helper: check if current allowance is sufficient
    const hasSufficientAllowance = async () => {
        if (!address) return false;
        try {
            const allowance = await readContract(config, {
                address: PYUSD_ADDRESS,
                abi: ERC20ABI,
                functionName: "allowance",
                args: [address, REALIA_ADDRESS],
            });
            // parseUnits(VERIFY_PRICE, 4) matches token decimals (4 decimals)
            const required = parseUnits(VERIFY_PRICE, 4)
            // Both are bigint
            return (allowance as bigint) >= (required as bigint);
        } catch (err) {
            console.error("Failed to check allowance:", err)
            return false
        }
    }

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

    // Approve: now used only if not already allowed
    const handleApprove = async () => {
        setLoadingApprove(true)
        try {
            const txHash = await writeApprove({
                address: PYUSD_ADDRESS,
                abi: ERC20ABI,
                functionName: "approve",
                args: [REALIA_ADDRESS, parseUnits(VERIFY_PRICE, 4)],
            })
            if (txHash && chain?.id && address) {
                openTxToast(
                    mapBlockscoutChainId(chain.id),
                    txHash,
                );
            }
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
            const txHash = await writeContract(config, request)
            if (txHash && chain?.id && address) {
                openTxToast(
                    mapBlockscoutChainId(chain.id),
                    txHash,
                );
            }
        } catch (err) {
            console.error("Order create failed:", err)
            throw err
        } finally {
            setLoadingOrder(false)
        }
    }

    React.useEffect(() => {
        if (verificationId) {
            setWatcherActive(true)
        } else {
            setWatcherActive(false)
        }
    }, [verificationId])

    React.useEffect(() => {
        if (watcherActive && !watcherLoading) {
            setWatcherActive(false)
            if (isVerified) {
                setVerified(true)
            }
        }
        if (watcherError) {
            setVerificationError("Failed waiting for on-chain confirmation" + (watcherError ? `: ${watcherError}` : ""))
            setWatcherActive(false)
        }
    }, [watcherLoading, isVerified, watcherError])

    const [lastLoaderStep, setLastLoaderStep] = React.useState(-1)

    React.useEffect(() => {
        if (!verifying && !watcherActive) {
            setLoaderMessages([])
            setLastLoaderStep(-1)
        }
    }, [verifying, watcherActive])

    React.useEffect(() => {
        const activeLoaderStep = getActiveLoaderStepExtended({
            loadingApprove,
            loadingOrder,
            loadingApi,
            verifying,
            watcherActive
        });
        if (!(verifying || watcherActive)) return
        if (activeLoaderStep !== lastLoaderStep) {
            setLoaderMessages((prev) => {
                let updated = prev.slice();
                if (lastLoaderStep >= 0 && prev[prev.length - 1]?.type === "loading") {
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        type: "done"
                    }
                }
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
    }, [verifying, watcherActive, loadingApprove, loadingOrder, loadingApi, lastLoaderStep])

    // --- MAIN verification process ---
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

        setDims(null)

        try {
            if (!dims) {
                const d = await getImageDimensions(file)
                setDims(d)
            }

            // --- Only approve if allowance is insufficient
            setLoadingApprove(true)
            const sufficientAllowance = await hasSufficientAllowance()
            setLoadingApprove(false)
            if (!sufficientAllowance) {
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
            }

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

            setLoadingApi(true)
            const formData = new FormData()
            formData.append("image", file)
            let res
            try {
                res = await api.post("/verify", formData)

                const verificationId = res.data?.verificationId || res.data?.id
                if (verificationId) {
                    toast.success(`Verification request submitted (ID: ${verificationId})`)
                    setVerificationId(verificationId)
                    startWatcher(verificationId)
                }
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
            return true;
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
        setDims(null)
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
            const d = await getImageDimensions(f)
            setDims(d)
        } catch { }
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
        loadingApi ||
        watcherActive

    const activeLoaderStep = getActiveLoaderStepExtended({
        loadingApprove,
        loadingOrder,
        loadingApi,
        verifying,
        watcherActive,
    })

    const stepProgressPercent = [20, 40, 70, 93, 99, 100][activeLoaderStep >= 0 ? activeLoaderStep : 0];

    let loaderMessage = ""
    if (activeLoaderStep >= 0 && loaderSteps[activeLoaderStep]) {
        loaderMessage = loaderSteps[activeLoaderStep].label
    } else if (verifying) {
        loaderMessage = "Verifying..."
    } else if (watcherActive) {
        loaderMessage = "Waiting for agent(s) response..."
    }

    function ChatLoaderPipeline() {
        // Only show spinner/step text now, TransactionPopup is managed by blockscout sdk
        return (
            <div className="w-full flex flex-col items-start gap-2 pb-2 text-sm">
                <AnimatePresence mode="wait">
                    {loaderMessages.map((msg, i) => (
                        <span
                            key={msg.step}
                            className={`rounded-full px-3 py-1 mb-0.5 shadow ${msg.type === "done"
                                ? "bg-black text-white font-bold border border-white/10"
                                : "bg-zinc-900/80 text-zinc-300"
                                }`}
                        >
                            {msg.type === "done"
                                ? msg.message.replace("...", " ✓")
                                : msg.message}
                        </span>
                    ))}
                </AnimatePresence>
            </div>
        );
    }

    function ErrorDisplay({ err, retry, disabled }: { err: string, retry: () => void, disabled: boolean }) {
        return (
            <div
                className="relative flex flex-col bg-gradient-to-bl from-zinc-900/80 via-zinc-700/30 to-zinc-600/10 backdrop-blur gap-5 items-center justify-center rounded-xl border-2 border-white/10 p-8 shadow-2xl overflow-hidden"
            >
                <div
                    className="absolute left-3 top-3 opacity-20"
                >
                    <AlertTriangle className="h-14 w-14 text-black/60" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2 text-zinc-100 bg-zinc-800/80 px-4 py-2 rounded-lg shadow font-bold">
                    <AlertTriangle className="h-6 w-6 text-white/70" strokeWidth={2.2} />
                    <span className="text-lg font-bold">Verification Failed</span>
                </div>
                <div className="w-full text-center text-zinc-100 font-normal text-base break-words max-w-lg bg-zinc-900/40 rounded-md px-3 py-2 shadow">
                    {err || "An unknown error occurred during verification."}
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="flex cursor-pointer items-center gap-1.5 mt-2 px-4 py-2 transition hover:-translate-y-0.5 active:scale-95 bg-zinc-900/90 border-white/10 text-white font-semibold"
                    onClick={retry}
                    disabled={disabled}
                >
                    <RefreshCcw className="h-4 w-4 mr-0.5 animate-spin-slow" />
                    Retry
                </Button>
                <div className="mt-4 flex flex-col items-center text-xs text-zinc-300 text-center gap-1 leading-tight">
                    <p>• Ensure your wallet is connected & you have enough tokens.</p>
                    <p>• Still stuck?&nbsp;
                        <a href="mailto:support@realia.app" className="text-white underline hover:text-zinc-100 font-medium">
                            contact support
                        </a>
                        &nbsp;or refresh.
                    </p>
                </div>
            </div>
        )
    }

    // --- Upload+Preview Card ---
    return (
        <main className="min-h-[90vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
            <div
                className="mb-8"
            >
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pretty text-white drop-shadow-xl">
                    Image Verification
                </h1>
                <p className="mt-1 text-base text-zinc-300 max-w-2xl font-medium drop-shadow-sm">
                    Upload an image and verify authenticity on-chain. Secure, modern, decentralized.
                </p>
            </div>
            <div
                className="grid gap-8 lg:grid-cols-2"
            >
                {/* Upload + Preview CARD */}
                <Card className="relative border-2 border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black/90 backdrop-blur rounded-2xl shadow-xl shadow-black/20 overflow-hidden text-white">
                    <CardHeader className="pb-4 flex items-center gap-2 bg-gradient-to-r from-zinc-950/40 to-zinc-900/70 rounded-t-2xl shadow-inner">
                        <CardTitle className="font-bold text-lg tracking-wide flex items-center gap-2 text-white/95">
                            <UploadCloud className="w-5 h-5 text-white/60" />
                            Upload & Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <label
                            onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onDrop={onDrop}
                            className={`
                                group relative transition-colors flex h-80 md:h-96 w-full cursor-pointer items-center justify-center
                                rounded-xl border-2 border-dashed bg-gradient-to-br from-black/70 via-black/50 to-zinc-900/70 hover:border-white/30
                                focus-within:ring-2 focus-within:ring-white ring-offset-4
                                ${previewUrl ? "border-zinc-700/60" : ""}
                            `}
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
                                <div
                                    className="flex flex-col items-center text-center text-sm text-zinc-100/70"
                                >
                                    <div className="mb-3 rounded-xl border-2 border-zinc-800 bg-black/50 p-5 shadow-lg">
                                        <UploadCloud className="h-7 w-7 text-white/80" />
                                    </div>
                                    <span className="font-semibold text-white">Drag & drop an image</span>
                                    <span className="mt-1 text-zinc-200/60">or click to browse (JPG, PNG…)</span>
                                </div>
                            ) : (
                                <div
                                    className="relative h-full w-full overflow-hidden rounded-xl border border-zinc-800/80 shadow-xl"
                                    style={{
                                        background:
                                            "radial-gradient(ellipse 95% 80% at 55% 45%, #232324 90%, #18171d 100%, #08090a 121%)",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewUrl || "/placeholder.svg"}
                                        alt="Uploaded preview"
                                        className="h-full w-full object-contain bg-gradient-to-t from-black via-zinc-950 to-black rounded-xl"
                                        crossOrigin="anonymous"
                                    />
                                    <span className="absolute bottom-3 right-3 text-xs bg-zinc-900/60 rounded px-3 py-1 text-zinc-300/70 tracking-wide shadow-sm border border-zinc-700/40">
                                        Preview
                                    </span>
                                </div>
                            )}
                            {!previewUrl && (
                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-0 transition group-hover:ring-2 group-hover:ring-white/10" />
                            )}
                        </label>
                        {file ? (
                            <div
                                className="mt-5 flex items-center gap-2 px-1 py-1 text-xs text-zinc-300 bg-zinc-900/60 rounded-lg shadow-inner border border-white/10"
                            >
                                <ImageIcon className="h-4 w-4 text-zinc-400" />
                                <span className="font-medium truncate">{file.name}</span>
                                <span>
                                    &bull; {file.type || "image"} &bull; {formatBytes(file.size)}
                                </span>
                            </div>
                        ) : null}

                        <div className="mt-6 flex gap-3">
                            <Button
                                onClick={onVerify}
                                disabled={!file || overallLoading}
                                className="flex-1 cursor-pointer text-lg font-semibold rounded-xl py-3 shadow-lg bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white ring-1 ring-white/10 hover:scale-[1.035] transition active:scale-[.98] border border-white/10"
                                variant="default"
                            >
                                {overallLoading
                                    ? (<>
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin-slow" />
                                        {loaderMessage || "Verifying..."}
                                    </>)
                                    : verified
                                        ? "Re-verify"
                                        : "Verify Image"}
                            </Button>
                            <Button
                                variant="ghost"
                                className="whitespace-nowrap bg-zinc-900 border border-white/10 rounded-xl font-semibold text-white hover:bg-zinc-800 px-5 py-3 shadow"
                                onClick={() => onSelect(null)}
                                disabled={overallLoading}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative border-2 border-white/10 bg-gradient-to-br from-zinc-950/95 via-black/90 to-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden text-white">
                    <CardHeader className="pb-4 bg-gradient-to-r from-black/80 to-zinc-900/40 rounded-t-2xl shadow-inner">
                        <CardTitle className="font-bold text-lg tracking-wide flex items-center gap-3 text-white/95">
                            <CheckCircle2 className="h-5 w-5 text-white/60" />
                            Verification Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!file && (
                            <div
                                className="flex items-start gap-3 rounded-xl border-2 border-dashed border-white/10 p-6 mt-2 text-base text-zinc-300 bg-black/30 shadow-inner"
                            >
                                <UploadCloud className="mt-0.5 h-4 w-4 text-zinc-400" />
                                <div>
                                    Drop an image on the left to see its dimensions and verification status.
                                </div>
                            </div>
                        )}
                        <AnimatePresence>
                            {file && overallLoading && (
                                <div
                                    className="flex flex-col items-start justify-start min-h-[260px] w-full px-0 sm:px-6"
                                >
                                    <ChatLoaderPipeline />
                                    <div className="mt-4 w-full h-1 rounded-full bg-zinc-900 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-white via-zinc-200 to-zinc-400"
                                            style={{ width: `${stepProgressPercent}%` }}
                                        />
                                    </div>
                                    {/* Agent status table while loading */}
                                    <div className="w-full mt-8">
                                        <AgentResponsesTable
                                            responses={Array.isArray(response) ? response : []}
                                            totalAgents={agentsCount}
                                        />
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {file && !overallLoading && verificationError && (
                                <ErrorDisplay err={verificationError} retry={onVerify} disabled={overallLoading} />
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {file && !overallLoading && !verificationError && verified && (
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div
                                            className="flex items-center gap-2"
                                        >
                                            <Badge variant="default" className="rounded-lg px-2 py-1 bg-black/80 text-white font-bold flex items-center gap-1 border border-white/10 shadow">
                                                <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-white/80" />
                                                Complete
                                            </Badge>
                                            {dims && (
                                                <Badge variant="outline" className="rounded-lg px-2 py-1 border-white/15 text-white/80">{dims.width}×{dims.height}px</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Separator className="my-4 bg-white/10" />
                                    <div className="mb-4 rounded-xl border-2 border-white/10 bg-black/30 p-5 shadow">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="text-xs uppercase tracking-wide text-zinc-400">Result</div>
                                                <div className="mt-1 text-2xl font-bold flex items-end text-white">
                                                    <span>Verified on-chain</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* --- Display agent AI responses on success too --- */}
                                    {(Array.isArray(response) && response.length > 0) && (
                                        <div className="my-6">
                                            <AgentResponsesTable
                                                responses={response}
                                                totalAgents={agentsCount}
                                            />
                                        </div>
                                    )}

                                    
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}


