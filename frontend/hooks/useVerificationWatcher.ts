import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

// Dynamically import to avoid circular imports in Next.js projects
let getResponseByAgent: any;
try {
  // @ts-ignore
  getResponseByAgent = require("@/app/utils/web3/blockscout").getResponseByAgent;
} catch(e) {}

export function useVerificationWatcher(timeoutMs = 1 * 60 * 1000, pollInterval = 1000) {
  const [response, setResponse] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWatcher = useCallback(async (verificationId: string | number) => {
    if (!verificationId) return;
    console.log("Watcher Started for ID :", verificationId)
    setLoading(true);
    setIsVerified(false);
    setError(null);
    setAttemptCount(0);
    setResponse([])

    const startTime = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pollRef.current!);
          setLoading(false);
          setError("Verification timed out, no agent response.");
          toast.error("⏱ Verification timed out, please try again.");
          return;
        }

        // Use getResponseByAgent(requestId) to fetch off-chain responses
        if (!getResponseByAgent) {
          setError("Watcher not available");
          setLoading(false);
          clearInterval(pollRef.current!);
          return;
        }

        const res = await getResponseByAgent(verificationId);

        console.log("Response By agent",res)
        setAttemptCount((prev) => prev + 1);

        if (res && Array.isArray(res) && res.length > 0) {
          setResponse(res);
          clearInterval(pollRef.current!);
          setLoading(false);

          // If any agent has verified=true, consider as verified.
          const anyVerified = res.some((r: any) => r.verified);
          setIsVerified(anyVerified);

          if (anyVerified) {
            toast.success("✅ Verification finalized by agent(s)!");
          } else {
            toast.info("⏳ Verification agent(s) responded, but not verified yet.");
          }

          return;
        }
        // keep polling otherwise
      } catch (err) {
        console.error("Error querying agent response:", err);
        setError("Error querying agent response");
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

  return { isVerified, loading, error, attemptCount, response, startWatcher };
}
