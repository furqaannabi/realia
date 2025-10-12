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
  const handleMint = async () => {
    if (!file) return
    console.log("minting")
    try {
      setMinting(true)
      const formdata = new FormData();
      formdata.append("image", file)
      formdata.append("name", "NFT#1")
      formdata.append("description", "NFT #1")

      const res = await api.post('/mint', formdata)

      console.log(res.data)
    } catch (error: any) {
      console.log(error)
      toast.error(error?.response?.data?.error)
      setMinting(false)
    } finally {
      setMinting(false)
    }
  }
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }, [])
  const resetMint = () => {
    setMinted(null)
    setFile(null)
    setPreview(null)
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
              {!preview && (
                <div className="text-sm text-muted-foreground">Select an image to mint your NFT.</div>
              )}

              {preview && !minted && (
                <div className="text-sm text-muted-foreground">Ready to mint your authenticity NFT.</div>
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
                disabled={!file && minting}
                onClick={handleMint}
              >
               {minting ? <Loader2 className="animate-spin"/> : "Mint Authenticity NFT" } 
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
