"use client"

import { useState, useEffect } from "react"
import { UploadCard } from "@/components/upload-card"
import { GradientButton } from "@/components/gradient-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { StepBadge } from "@/components/step-badge"

type MintInfo = {
  id: string
  imageHash: string
  ipfs: string
  timestamp: string
}

type Status = "idle" | "verifying" | "verified" | "minting" | "minted"

export default function MintPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [minted, setMinted] = useState<MintInfo | null>(null)
  const [verifyProgress, setVerifyProgress] = useState(0)

  useEffect(() => {
    // reset flow when a new image is selected
    setStatus("idle")
    setMinted(null)
    setVerifyProgress(0)
  }, [preview])

  const handlePrimary = async () => {
    if (!preview) return
    if (status === "idle") {
      setStatus("verifying")
      setVerifyProgress(10)
      const steps = [25, 45, 68, 85, 100]
      let i = 0
      const id = setInterval(() => {
        setVerifyProgress((prev) => Math.min(steps[i++] ?? 100, 100))
        if (i >= steps.length) {
          clearInterval(id)
          setStatus("verified")
        }
      }, 450)
      return
    }
    if (status === "verified") {
      setStatus("minting")
      await new Promise((r) => setTimeout(r, 1000))
      const now = new Date()
      setMinted({
        id: "#" + Math.random().toString(16).slice(2, 6).toUpperCase(),
        imageHash: "0x" + crypto.getRandomValues(new Uint32Array(2)).join("").slice(0, 12),
        ipfs: "ipfs://bafy..." + Math.random().toString(36).slice(2, 6),
        timestamp: now.toISOString().replace("T", " ").slice(0, 16),
      })
      setStatus("minted")
      return
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Mint Authenticity NFT</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify your image, then mint — no extra details required.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left: Large image preview / uploader */}
        <div className="md:col-span-3">
          <UploadCard preview={preview} onChange={setPreview} className="w-full" />
        </div>

        {/* Right: Steps, verification, CTA */}
        <div className="md:col-span-2 space-y-6">
          {/* Stepper */}
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <StepBadge
                  step={1}
                  label="Upload"
                  active={status === "idle" && !!preview}
                  done={!!preview && status !== "idle"}
                />
                <div className="h-px flex-1 mx-2 bg-border" />
                <StepBadge
                  step={2}
                  label="Verify"
                  active={status === "verifying"}
                  done={status === "verified" || status === "minting" || status === "minted"}
                />
                <div className="h-px flex-1 mx-2 bg-border" />
                <StepBadge step={3} label="Mint" active={status === "minting"} done={status === "minted"} />
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!preview && <div className="text-sm text-muted-foreground">Select an image to start verification.</div>}

              {preview && status === "idle" && (
                <div className="text-sm text-muted-foreground">Ready to verify authenticity.</div>
              )}

              {status === "verifying" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                    Running authenticity checks...
                  </div>
                  <Progress value={verifyProgress} />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded border border-border/50 p-2">Checking EXIF</div>
                    <div className="rounded border border-border/50 p-2">Hash similarity</div>
                    <div className="rounded border border-border/50 p-2">Signature</div>
                    <div className="rounded border border-border/50 p-2">Watermark</div>
                  </div>
                </div>
              )}

              {status === "verified" && (
                <div className="flex items-center justify-between">
                  <div className="text-sm">Verification passed. You can mint now.</div>
                  <Badge className="rounded-full">Score 92/100</Badge>
                </div>
              )}

              {minted && status === "minted" && (
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
            {status !== "minted" ? (
              <GradientButton
                disabled={!preview || status === "verifying" || status === "minting"}
                onClick={handlePrimary}
              >
                {status === "idle" && "Verify Image"}
                {status === "verifying" && "Verifying..."}
                {status === "verified" && "Mint Authenticity NFT"}
                {status === "minting" && "Minting..."}
              </GradientButton>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setVerifyProgress(0)
                  setPreview(null)
                }}
              >
                Start new mint
              </Button>
            )}

            {status !== "minted" && (
              <Button
                variant="ghost"
                onClick={() => {
                  setVerifyProgress(0)
                  setPreview(null)
                }}
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
