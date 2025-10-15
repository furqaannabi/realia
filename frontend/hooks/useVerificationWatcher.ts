import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { ethers } from "ethers"
import { REALIA_ADDRESS } from "@/app/utils/config"


const BLOCKSCOUT_BASE = "https://arbitrum-sepolia.blockscout.com/api"
const VERIFY_EVENT_SIG = ethers.id("VerificationFinalized(address,uint256)")

export function useVerificationWatcher(timeoutMs = 0.2 * 60 * 1000) { // default 5 min timeout
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startWatcher = useCallback((verificationId: string) => {
    if (!verificationId) return

    setLoading(true)
    setIsVerified(false)
    setError(null)

    const url = `${BLOCKSCOUT_BASE}?module=logs&action=getLogs` +
      `&fromBlock=0&toBlock=latest` +
      `&address=${REALIA_ADDRESS}&topic0=${VERIFY_EVENT_SIG}`

    const startTime = Date.now()

    pollRef.current = setInterval(async () => {
      try {
        // Stop if timed out
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pollRef.current!)
          setLoading(false)
          setError("Verification timed out, no events found.")
          toast.error("⏱ Verification timed out, please try again.")
          return
        }

        const res = await fetch(url)
        const data = await res.json()
        console.log(data)
        if (data.status === "1" && data.result.length > 0) {
          for (const log of data.result) {
            const requestIdHex = log.topics[2]
            const id = parseInt(requestIdHex, 16).toString()
            if (id === verificationId.toString()) {
              clearInterval(pollRef.current!)
              setIsVerified(true)
              setLoading(false)
              toast.success("✅ Verification finalized on-chain!")
              console.log("Event details:", log)
              return
            }
          }
        }
      } catch (err) {
        console.error("Error polling Blockscout:", err)
        setError("Error polling verification events")
        setLoading(false)
      }
    }, 8000) // poll every 8s
  }, [timeoutMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  return { isVerified, loading, error, startWatcher }
}
