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
    VerificationResponseByAgent: ethers.id("VerificationResponseByAgent(address,uint256,bool)")
};
const iface = new ethers.Interface([
    "event VerificationRequested(address user,uint256 requestId)",
    "event VerificationResponseByAgent(address agent, uint256 requestId, bool verified)",
    "event ProcessedVerification(uint256 requestId)",
    "event Verified(address to, uint256 tokenId)"
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
    const REQUIRED = 2

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
        const [requests, processed, verified, agent] = await Promise.all([
            fetchLogs(EVENTS.VerificationRequested),
            fetchLogs(EVENTS.ProcessedVerification),
            fetchLogs(EVENTS.Verified),
            fetchLogs(EVENTS.VerificationResponseByAgent),
        ]);

        // Safely parse processed + verified IDs from data, not topics (since requestId is not indexed)
        const processedIds = new Set(
            processed
                .map((log: any) => {
                    try {
                        if (typeof log.data === "string" && log.data.startsWith("0x")) {
                            const hex = log.data.replace(/^0x/, '');
                            const requestId = BigInt('0x' + hex).toString();
                            return requestId;
                        }
                    } catch (err) {
                        return null;
                    }
                    return null;
                })
                .filter(Boolean)
        );

        const verifiedIds = new Set(
            verified
                .map((log: any) => {
                    try {
                        if (typeof log.data === "string" && log.data.startsWith("0x")) {
                            const to = `0x${log.topics[1].slice(-40)}`;
                            const tokenId = BigInt(log.data);
                            const decoded = { to, tokenId };
                            return (typeof decoded.tokenId === "bigint"
                                ? decoded.tokenId.toString()
                                : decoded.tokenId ?? decoded[2]);
                        }
                    } catch (err) {
                        return null;
                    }
                    return null;
                })
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
                        return null;
                    }

                    let decoded: any;

                    try {
                        const safeTopics = Array.isArray(log.topics) ? log.topics.map((t: any) => t ?? "0x") : [];
                        decoded = iface.decodeEventLog(
                            "VerificationRequested",
                            log.data,
                            safeTopics
                        );

                    } catch (err) {
                        return null;
                    }

                    let user = decoded.user ?? decoded[0];
                    let requestId = (typeof decoded.requestId === "bigint"
                        ? decoded.requestId.toString()
                        : decoded.requestId ?? decoded[1]
                    );

                    if (typeof requestId !== "string" && (typeof requestId === "number" || typeof requestId === "bigint")) {
                        requestId = requestId.toString();
                    }
                    if (!requestId) {
                        return null;
                    }

                    if (!processedIds.has(requestId)) {
                        return {
                            user,
                            requestId,
                            blockNumber: parseInt(log.blockNumber, 16),
                            txHash: log.transactionHash,
                        };
                    }
                    return null;
                } catch (err) {
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

export async function getResponseByAgent(requestId: any) {
    const response = await fetchLogs(EVENTS.VerificationResponseByAgent);

    const decoded = response.map((res: any) => {
        const topics = res.topics?.filter((topic: any) => topic != null) || [];

        if (res.data == null) {
            return null;
        }

        try {
            const decodedRes = iface.decodeEventLog(
                "VerificationResponseByAgent",
                res.data,
                topics
            );

            const agent = decodedRes.agent ?? decodedRes[0];
            const logRequestId = decodedRes.requestId ?? decodedRes[1];
            const verified = decodedRes.verified ?? decodedRes[2];

            const formattedRequestId =
                typeof logRequestId === 'bigint' ? logRequestId.toString() :
                    typeof logRequestId === 'number' ? String(logRequestId) :
                        logRequestId;

            return {
                agent: agent,
                requestId: formattedRequestId,
                verified: Boolean(verified),
                blockNumber: res.blockNumber ? parseInt(res.blockNumber, 16) : undefined,
                txHash: res.transactionHash
            };
        } catch (err) {
            return null;
        }
    }).filter((item: any) => !!item);

    if (requestId !== undefined && requestId !== null) {
        const requestIdStr = requestId.toString();
        return decoded.filter((entry: any) => entry.requestId === requestIdStr);
    }

    return decoded;
}

/**
 * Return the total count of "VerificationRequested" logs ever emitted (total requests onchain)
 * This is a simple numeric stat, not filtered for pending.
 */
export async function getVerificationRequestsCount(): Promise<number> {
    try {
        const logs = await fetchLogs(EVENTS.VerificationRequested);
        return Array.isArray(logs) ? logs.length : 0;
    } catch (error) {
        console.error("Failed to fetch verification request count", error);
        return 0;
    }
}