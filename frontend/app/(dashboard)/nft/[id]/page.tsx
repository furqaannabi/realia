"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, ExternalLink, CheckCircle2, User2, Info, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { GlassCard } from "@/components/card";
import { api } from "@/app/utils/axiosInstance";
import { REALIA_NFT_ADDRESS } from "@/app/utils/config";

// Mainnet scroll site: https://blockscout.scroll.io, Sepolia: https://sepolia-blockscout.scroll.xyz
const BLOCKSCOUT_BASE_URL =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === "mainnet"
    ? "https://blockscout.scroll.io"
    : "https://arbitrum-realia.cloud.blockscout.com";

// Helper to truncate addresses
function shortAddress(addr: string | undefined, len = 6) {
  if (!addr) return "";
  return addr.slice(0, len) + "..." + addr.slice(-len);
}

function InfoRow({
  label,
  value,
  copyable,
  field,
  icon,
  copiedField,
  handleCopy,
}: {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  field?: string;
  icon?: React.ReactNode;
  copiedField?: string | null;
  handleCopy?: (v: string, l?: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group transition cursor-default">
      {icon && <span className="text-brand/80">{icon}</span>}
      <div className="flex-1">
        <div className="text-xs font-medium text-zinc-500 flex items-center gap-1">
          {label}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/90">
          <span className="break-all">{value}</span>
          {copyable && !!field && handleCopy && (
            <button
              type="button"
              className="ml-1 text-brand hover:text-white transition flex items-center gap-1"
              aria-label={`Copy ${label}`}
              onClick={() => handleCopy(String(field), label)}
            >
              <Copy className="inline-block w-4 h-4" />
              {copiedField === field && (
                <span className="text-xs ml-1 text-green-500">Copied!</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const nftId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const [loading, setLoading] = useState(true);
  const [nft, setNft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!nftId) return;
    setLoading(true);
    setError(null);

    api
      .get(`/nfts/${nftId}`)
      .then((res) => {
        if (!res || !res.data) throw new Error("NFT not found");
        setNft(res.data);
      })
      .catch((err) => {
        if (err?.response?.data?.error) setError(err.response.data.error);
        else setError(err.message || "Failed to load NFT");
      })
      .finally(() => setLoading(false));
  }, [nftId]);

  const handleCopy = async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(value);
      toast.success(`${label ? label + " " : ""}Copied!`);
      setTimeout(() => setCopiedField(null), 1200);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <main className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-background via-zinc-900 to-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-9 w-9 text-brand animate-spin" />
          <div className="text-lg font-semibold text-white/80">
            Loading NFT details...
          </div>
        </div>
      </main>
    );
  }

  if (error || !nft) {
    return (
      <main className="min-h-[90vh] flex flex-col items-center justify-center bg-gradient-to-br from-background via-zinc-900 to-black">
        <div className="text-2xl font-bold text-red-500 mb-2">
          NFT Not Found
        </div>
        <div className="text-zinc-400">
          {error || "No NFT found with that ID."}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          onClick={() => router.back()}
        >
          ← Back
        </Button>
      </main>
    );
  }

  const nftData = nft.nft || nft;
  console.log(nftData)
  const image =
    nftData?.imageUrl ||
    (nftData?.image?.s3Key && nftData?.image?.s3Key.startsWith("http")
      ? nftData.image.s3Key
      : nftData?.image?.ipfsCid
      ? `https://ipfs.io/ipfs/${nftData.image.ipfsCid}`
      : undefined);

  // For Blockscout: /address/0x123 or /token/0xTOKEN/instance/ID for detail.
  // Add extra "Minted NFT" link (for the minted tokenId/address on explorer)
  const explorerLinks = [
    nftData.tokenId && nftData.tokenAddress
      ? {
          label: "View on Blockscout",
          href: `${BLOCKSCOUT_BASE_URL}/token/${nftData.tokenAddress}/instance/${nftData.tokenId}`,
          icon: <ExternalLink className="h-3 w-3 inline" />,
          type: "blockscout",
        }
      : null,
    nftData.tokenAddress
      ? {
          label: "Token Contract",
          href: `${BLOCKSCOUT_BASE_URL}/address/${nftData.tokenAddress}`,
          icon: <ExternalLink className="h-3 w-3 inline" />,
          type: "token",
        }
      : null,
    nftData.user?.walletAddress
      ? {
          label: "Owner Wallet",
          href: `${BLOCKSCOUT_BASE_URL}/address/${nftData.user.walletAddress}`,
          icon: <ExternalLink className="h-3 w-3 inline" />,
          type: "wallet",
        }
      : null,
    
    // ---- Added: direct blockscout minted NFT explorer link (redundant with "View on Blockscout", but distinct label) ----
    nftData.tokenId 
      ? {
          label: "See Minted NFT in Explorer",
          href: `${BLOCKSCOUT_BASE_URL}/token/${REALIA_NFT_ADDRESS}/instance/${nftData.tokenId}`,
          icon: <ExternalLink className="h-3 w-3 inline" />,
          type: "mintednft",
        }
      : null,
    // ------------------------------------------------------------------
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: React.ReactNode;
    type: string;
  }[];

  const rows: Array<{
    label: string;
    value: React.ReactNode;
    copyable?: boolean;
    field?: string;
    icon?: React.ReactNode;
  }> = [
    {
      label: "NFT ID",
      value: (
        <span className="font-mono tracking-tight">{nftData.id}</span>
      ),
      copyable: true,
      field: nftData.id,
      icon: <Info className="w-4 h-4" />,
    },
    {
      label: "Token ID",
      value: nftData.tokenId ? (
        <span className="font-mono text-brand">{nftData.tokenId}</span>
      ) : (
        "-"
      ),
      copyable: !!nftData.tokenId,
      field: nftData.tokenId,
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      label: "IPFS",
      value: nftData.image?.ipfsCid ? (
        <a
          href={`https://ipfs.io/ipfs/${nftData.image.ipfsCid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline flex items-center gap-1"
        >
          {shortAddress(nftData.image.ipfsCid, 12)}
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      ) : (
        "-"
      ),
      copyable: !!nftData.image?.ipfsCid,
      field: nftData.image?.ipfsCid,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: "Metadata CID",
      value: nftData.image?.metadataCid ? (
        <a
          href={`https://ipfs.io/ipfs/${nftData.image.metadataCid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline flex items-center gap-1"
        >
          {shortAddress(nftData.image.metadataCid, 12)}
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      ) : (
        "-"
      ),
      copyable: !!nftData.image?.metadataCid,
      field: nftData.image?.metadataCid,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: "Owner",
      value: nftData.user?.walletAddress ? (
        <span className="font-mono text-white/90">
          {shortAddress(nftData.user.walletAddress, 9)}
        </span>
      ) : (
        "-"
      ),
      copyable: !!nftData.user?.walletAddress,
      field: nftData.user?.walletAddress,
      icon: <User2 className="w-4 h-4" />,
    },
    {
      label: "Created",
      value: nftData.createdAt
        ? new Date(nftData.createdAt).toLocaleString()
        : nftData.image?.createdAt
        ? new Date(nftData.image.createdAt).toLocaleString()
        : "-",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "Name",
      value: nftData.image?.metadata?.name || "-",
      copyable: !!nftData.name,
      field: nftData.name,
      icon: <Info className="w-4 h-4" />,
    },
    {
      label: "Description",
      value: nftData.image?.metadata?.description || "-",
      copyable: !!nftData.description,
      field: nftData.description,
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <main className="min-h-[100vh] p-4 pb-8 md:p-12 bg-gradient-to-br from-background via-zinc-900 to-black">
     <div className="flex mt-2 justify-start mb-3">
            <Button
              variant="ghost"
              className="font-semibold text-brand hover:underline transition py-2 px-4"
              onClick={() => router.push("/dashboard")}
            >
              ← Back to Dashboard
            </Button>
          </div>
     <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
        {/* IMAGE CARD */}
        <GlassCard className="md:w-[40%] w-full max-w-lg p-0 overflow-hidden flex flex-col items-center shadow-lg bg-gradient-to-br from-black/90 via-zinc-900/60 to-black/90 border-2 border-brand/30 backdrop-blur">
          <div className="relative w-full aspect-square flex items-center justify-center bg-black/80 group">
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={nftData.name || "NFT image"}
                  className="object-contain w-full h-full min-h-[320px] bg-black group-hover:scale-105 transition-transform duration-200"
                  style={{ borderRadius: "0.75rem 0.75rem 0 0" }}
                />
                <span className="absolute right-3 top-3 bg-brand/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                  #{nftData.tokenId || nftData.id}
                </span>
                {nftData.status && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 bg-zinc-800/80 text-xs text-white/90 px-3 py-1 rounded-full border border-brand/40 shadow">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="font-semibold">{nftData.status}</span>
                  </span>
                )}
              </>
            ) : (
              <div className="relative w-full h-[320px] flex flex-col items-center justify-center bg-black/60 rounded-t-xl border-b border-brand/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-zinc-500 text-7xl font-black drop-shadow-md mb-1 select-none">
                    ?
                  </div>
                  <div className="text-white/80 text-lg mt-2 font-semibold">
                    No Image Available
                  </div>
                  <div className="text-xs text-zinc-400 max-w-[80%] text-center">
                    This NFT does not have an image or the image failed to load. If you believe this is an error, please contact support.
                  </div>
                </div>
                <span className="absolute right-3 top-3 bg-brand/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                  #{nftData.tokenId || nftData.id}
                </span>
                {nftData.status && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 bg-zinc-800/80 text-xs text-white/90 px-3 py-1 rounded-full border border-brand/40 shadow">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="font-semibold">{nftData.status}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="w-full p-7 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight flex-1 truncate">
                  {nftData.image?.metadata?.name || "-"}
                </h2>
              </div>
              {nftData.image?.metadata?.description ? (
                <div className="text-zinc-200/95 text-sm italic mt-1">
                  {nftData.image?.metadata?.description}
                </div>
              ) : (
                <div className="text-zinc-400 text-xs italic mt-2">
                  No description provided for this NFT.
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {nftData.status && (
                <Badge variant="outline" className="text-green-400/80 border-green-400/30 font-semibold">
                  {nftData.status}
                </Badge>
              )}
              {/* Show a preview of file type if present */}
              {nftData.image?.mimetype && (
                <Badge variant="secondary" className="bg-zinc-800/60 border-zinc-700/40 text-white/90 font-normal text-xs">
                  {nftData.image.mimetype.toUpperCase()}
                </Badge>
              )}
              {/* Show a preview of image size if present */}
              {nftData.image?.size && (
                <Badge variant="secondary" className="bg-zinc-800/60 border-zinc-700/40 text-white/90 font-normal text-xs">
                  {(nftData.image.size / 1024).toFixed(1)} KB
                </Badge>
              )}
            </div>
            {/* Show upload info if available */}
            {(nftData.createdAt || nftData.image?.createdAt) && (
              <div className="text-zinc-400/80 mt-2 text-xs font-mono flex items-center gap-2">
                Uploaded:{" "}
                <span>
                  {nftData.createdAt
                    ? new Date(nftData.createdAt).toLocaleString()
                    : nftData.image?.createdAt
                    ? new Date(nftData.image.createdAt).toLocaleString()
                    : "-"}
                </span>
              </div>
            )}
            {/* If there are external metadata/IPFS links, show here as well */}
            <div className="flex flex-wrap gap-2 mt-2">
              {nftData.image?.ipfsCid && (
                <a
                  href={`https://ipfs.io/ipfs/${nftData.image.ipfsCid}`}
                  className="text-xs px-2 py-1 bg-zinc-900/70 text-brand font-semibold rounded hover:underline transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  View on IPFS
                </a>
              )}
              {nftData.image?.metadataCid && (
                <a
                  href={`https://ipfs.io/ipfs/${nftData.image.metadataCid}`}
                  className="text-xs px-2 py-1 bg-zinc-900/70 text-brand font-semibold rounded hover:underline transition"
                  target="_blank" rel="noopener noreferrer"
                >
                  Metadata
                </a>
              )}
            </div>
          </div>
        </GlassCard>
        {/* DETAILS */}
        <div className="flex-1 min-w-0 flex flex-col gap-7">
          <GlassCard className="bg-gradient-to-br from-black/90 via-zinc-900/60 to-black/95 border-2 border-brand/30 shadow-xl">
            <div className="flex flex-wrap items-center justify-between mb-6 pb-5 border-b border-brand/10 gap-y-3">
              <h2 className="text-2xl font-bold text-white pb-1">NFT Details</h2>
              <div className="flex items-center gap-2 flex-nowrap">
                {explorerLinks.map((l, idx) => (
                  <a
                    key={l.type + idx}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded bg-brand/80 hover:bg-brand/90 text-white text-sm transition font-medium shadow-sm`}
                  >
                    {l.icon}
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {rows.map((row) => (
                <InfoRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  copyable={row.copyable}
                  field={row.field}
                  icon={row.icon}
                  copiedField={copiedField}
                  handleCopy={handleCopy}
                />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
