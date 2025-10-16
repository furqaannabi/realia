import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { REALIA_ADDRESS } from "@/app/utils/config";
import RealiaABI from "@/app/utils/web3/Realia.json";
import { readContract, } from "@wagmi/core";
import { config } from "@/app/utils/wallet";

export function useVerificationWatcher(timeoutMs = 1 * 60 * 1000, pollInterval = 1000) {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWatcher = useCallback(async (verificationId: string | number) => {
    if (!verificationId) return;

    setLoading(true);
    setIsVerified(false);
    setError(null);
    setAttemptCount(0);

    const startTime = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pollRef.current!);
          setLoading(false);
          setError("Verification timed out, no events found.");
          toast.error("⏱ Verification timed out, please try again.");
          return;
        }

        // Read the VerificationRequest directly from the smart contract
        const vr: any = await readContract(config, {
          address: REALIA_ADDRESS,
          abi: RealiaABI.abi,
          functionName: "verificationRequests",
          args: [verificationId],
        });

        setAttemptCount((prev) => prev + 1); // triggers useEffect

        console.log(vr)
        // Check if request is finalized (depends on your struct)
        if (vr?.finalized) {
          clearInterval(pollRef.current!);
          setIsVerified(true);
          setLoading(false);
          toast.success("✅ Verification finalized on-chain!");
          console.log("VerificationRequest:", vr);
          return;
        }
        // else keep polling
      } catch (err) {
        console.error("Error reading verificationRequest:", err);
        setError("Error reading verification request");
        setLoading(false);
        clearInterval(pollRef.current!);
      }
    }, pollInterval);
  }, [timeoutMs, pollInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return { isVerified, loading, error, attemptCount, startWatcher };
}
