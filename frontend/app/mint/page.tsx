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
import { signMessage, simulateContract, writeContract } from "@wagmi/core"
import { config } from "../utils/wallet"
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
  const [status, setStatus] = useState<string>("");

  const { address } = useAccount();
  const { writeContractAsync: writeApprove } = useWriteContract();

  // --- step 1: Approve PYUSD spend ---
  const handleApprove = async () => {
    try {
      setStatus("Approving PYUSD...");
      const tx = await writeApprove({
        address: PYUSD_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [REALIA_ADDRESS, parseUnits("1", 6)], // MINT_PRICE = 1e6 (6 decimals)
      });
      setStatus(`Approved! Tx: ${tx}`);
    } catch (err) {
      console.error(err);
      setStatus("Approval failed ❌");
    }
  };

  const handleCreateOrder = async () => {
    try {
      setStatus("Creating order...");
      const { request } = await simulateContract(config, {
        address: REALIA_ADDRESS,
        abi: RealiaABI.abi,
        functionName: "createOrder",
        args: [0],
        account: address,
      });
      const tx = await writeContract(config, request);

      setStatus(`Order created! Tx: ${tx}`);

    } catch (err) {
      console.error(err);
      setStatus("Order creation failed ❌");
    }
  };

  const handleMint = async () => {
    if (!file) {
      toast.error("Please upload an image.");
      return;
    }
    let message: string;
    let signature: string;
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setMinting(true);

    try {
      // Gather form values
      // You should get name/description from UI input fields. Here, it's hardcoded for demonstration.
      const name = "NFT Title";
      const description = "NFT Description";

      // Generate message & sign with user's wallet
      message = `I am signing this message to verify my ownership of this wallet and approve minting my NFT on MyProject.\nTimestamp: ${Date.now()}`;
      signature = await signMessage(config, { message });

      // Approve PYUSD spend and create order before minting
      await handleApprove();
      await handleCreateOrder();

      // Compose form data for backend
      const dataToSend = {
        name,
        description,
        message,
        signature
      };

      const formData = new FormData();
      formData.append("image", file);
      formData.append("data", JSON.stringify(dataToSend));

      // POST to backend /mint
      const res = await api.post('/mint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data && res.data.success) {
        setMinted(res.data);
        toast.success("NFT Minted Successfully!");
      } else if (res?.data?.error) {
        toast.error(res.data.error || "Failed to mint NFT");
      } else {
        toast.error("Failed to mint NFT (Unknown error)");
      }

    } catch (error: any) {
      console.error("Mint error:", error);
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to mint NFT");
      }
    } finally {
      setMinting(false);
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
