import { ethers } from "ethers";
import { REALIA_ADDRESS } from "../config";
import { readContract } from "@wagmi/core";

const BLOCKSCOUT_BASE = "https://arbitrum-sepolia.blockscout.com/api";
import RealiaFactoryABI from './Realia.json'
import { config } from "../wallet";
// Event signature hashes
const EVENTS = {
    VerificationRequested: ethers.id("VerificationRequested(address,uint256)"),
    ProcessedVerification: ethers.id("ProcessedVerification(uint256)"),
    Verified: ethers.id("Verified(address,uint256)"),
};
const iface = new ethers.Interface([
    "event VerificationRequested(address user,uint256 requestId)",
]);

async function fetchLogs(eventSig: string) {
    const url = `${BLOCKSCOUT_BASE}?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${REALIA_ADDRESS}&topic0=${eventSig}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.result || [];
}

function parseHex(hex: string) {
    if (!hex) return null;
    try {
        return BigInt(hex).toString();
    } catch {
        return null;
    }
}

export async function getVerificationResponses(requestId: string) {
    try {
      let responses: any[] = []
      let index = 0
  
      while (true) {
        try {
          const response = await readContract(config, {
            address: REALIA_ADDRESS,
            abi: RealiaFactoryABI.abi,
            functionName: 'verificationResponses',
            args: [BigInt(requestId), BigInt(index)],
          })
          responses.push(response)
          index++
        } catch (err: any) {
          // When index is out of range, we’ll get an error → stop
          break
        }
      }
  
      return responses
    } catch (error) {
      console.error('Error reading verificationResponses:', error)
      return []
    }
  }

  export async function getVerificationProgress(requestId: string) {
    const REQUIRED = 5
  
    const responses = await getVerificationResponses(requestId)
    const completed = responses.length
  
    return {
      completed,
      totalRequired: REQUIRED,
      progressText: `${completed}/${REQUIRED} verified`,
      responses
    }
  }
  

export async function getPendingVerifications() {
    try {
        const [requests, processed, verified] = await Promise.all([
            fetchLogs(EVENTS.VerificationRequested),
            fetchLogs(EVENTS.ProcessedVerification),
            fetchLogs(EVENTS.Verified),
        ]);

        // Safely parse processed + verified IDs
        const processedIds = new Set(
            processed
                .map((log: any) => parseHex(log?.topics?.[1]) || null)
                .filter(Boolean)
        );

        const verifiedIds = new Set(
            verified
                .map((log: any) => parseHex(log?.topics?.[2]) || null)
                .filter(Boolean)
        );

        // Decode requests and filter pending ones (get the id/user from data, ignore topics[1])
        const pending = requests
            .filter(
                (log: any) =>
                    log &&
                    typeof log.data === "string" &&
                    log.data.startsWith("0x") &&
                    Array.isArray(log.topics)
            )
            .map((log: any) => {

                try {
                    if (
                        !Array.isArray(log.topics) ||
                        log.topics.length !== 4 ||
                        log.topics[0] == null
                    ) {
                        // Still check for topics[0] to ensure it's the correct event
                        console.warn("Log skipped due to invalid topics", log);
                        return null;
                    }

                    let decoded: any;

                    try {
                        // Prevent invalid BytesLike value (null) in topics
                        // ethers.js throws if any topics element is null (INVALID_ARGUMENT)
                        const safeTopics = Array.isArray(log.topics) ? log.topics.map((t: any) => t ?? "0x") : [];
                        decoded = iface.decodeEventLog(
                            "VerificationRequested",
                            log.data,
                            safeTopics
                        );

                    } catch (err) {
                        // Decoding error (bad data)
                        console.error("Failed to decode VerificationRequested log:", { log, err });
                        return null;
                    }

                    // Get user and requestId from decoded values, not from topics
                    let user = decoded.user ?? decoded[0];
                    let requestId = (typeof decoded.requestId === "bigint"
                        ? decoded.requestId.toString()
                        : decoded.requestId ?? decoded[1]
                    );



                    // Convert non-string requestId to string if needed
                    if (typeof requestId !== "string" && (typeof requestId === "number" || typeof requestId === "bigint")) {
                        requestId = requestId.toString();
                    }
                    if (!requestId) {
                        console.warn("No requestId in decoded log", decoded, log);
                        return null;
                    }

                    if (!processedIds.has(requestId) && !verifiedIds.has(requestId)) {
                        return {
                            user,
                            requestId,
                            blockNumber: parseInt(log.blockNumber, 16),
                            txHash: log.transactionHash,
                        };
                    }
                    return null;
                } catch (err) {
                    // Catch-all for bad event logs
                    console.warn("Skipping invalid VerificationRequested log:", err);
                    return null;
                }
            })
            .filter(Boolean);

        return pending;
    } catch (error) {
        console.error("Error fetching pending verifications:", error);
        return [];
    }
}