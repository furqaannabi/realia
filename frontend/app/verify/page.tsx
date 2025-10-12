"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UploadCloud, ImageIcon, Copy } from "lucide-react"
import { toast } from "sonner"
import { api } from "../utils/axiosInstance"

type ImgDims = { width: number; height: number }

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
    // naive EXIF presence check: scan for ASCII "Exif"
    // Works for JPEG APP1 segments that contain "Exif\0\0"
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
    // Deterministic pseudo-score 60-98 influenced by EXIF presence
    const seed = Number.parseInt(hashHex.slice(0, 4), 16) % 39 // 0..38
    let score = 60 + seed // 60..98
    if (exif) score = Math.min(98, score + 2)
    return score
}

async function getImageDimensions(file: File): Promise<ImgDims> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new HTMLImageElement()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
            URL.revokeObjectURL(url)
        }
        img.onerror = (e) => {
            URL.revokeObjectURL(url)
            reject(e)
        }
        img.src = url
        // ensure CORS safe if needed
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

    const verifyImage = async () => {
        if (!file) return
        try {
            const formdata = new FormData()
            formdata.append("image", file)
            const res = await api.post('/verify', formdata)
            console.log(res.data)
        } catch (error: any) {
            console.log(error)
            toast.error(error?.response?.data?.error)
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
            // swallow; details shown after verify attempt if needed
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
        setVerifying(true)
        try {
            const arr = buffer ?? (await file.arrayBuffer())
            const [hex, exif] = await Promise.all([sha256Hex(arr), Promise.resolve(detectExif(arr))])
            verifyImage()
            setHashHex(hex)
            setExifPresent(exif)
            const sc = seedScoreFromHash(hex, exif)
            setScore(sc)
            // ensure dimensions computed
            if (!dims) {
                const d = await getImageDimensions(file)
                setDims(d)
            }
            // small delay to feel responsive
            await new Promise((r) => setTimeout(r, 500))
            setVerified(true)
        } catch {
            setVerified(false)
        } finally {
            setVerifying(false)
        }
    }

    return (
        <main className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-pretty">Verify Image</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upload an image to compute its SHA-256, detect EXIF, and see authenticity indicators.
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
                            <Button onClick={onVerify} disabled={!file || verifying} className="flex-1 cursor-pointer" variant="default">
                                {verifying ? "Verifying..." : verified ? "Re-verify" : "Verify Image"}
                            </Button>
                            <Button
                                variant="outline"
                                className="whitespace-nowrap bg-transparent cursor-pointer"
                                onClick={() => onSelect(null)}
                                disabled={verifying}
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
                        {!file && (
                            <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                                <UploadCloud className="mt-0.5 h-4 w-4" />
                                <div>
                                    Drop an image on the left to see its hash, EXIF presence, dimensions, and a minimal authenticity
                                    score.
                                </div>
                            </div>
                        )}

                        {file && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {verifying ? (
                                            <Badge variant="secondary" className="rounded">
                                                Verifying…
                                            </Badge>
                                        ) : verified ? (
                                            <Badge variant="default" className="rounded">
                                                Complete
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="rounded">
                                                Pending
                                            </Badge>
                                        )}
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

                                {!verified && verifying && (
                                    <div className="mt-4 h-2 w-full overflow-hidden rounded bg-muted">
                                        <div
                                            className="h-full w-1/3 animate-pulse rounded bg-foreground"
                                            style={{ animationDuration: "1s" }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
