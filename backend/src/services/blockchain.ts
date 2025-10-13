import { realia_contract } from "../web3/config";

export enum OrderType {
    MINT = 0,
    VERIFY = 1
}

/**
 * Mint an NFT
 * @param to - The address to mint the NFT to
 * @param uri - The URI of the NFT
 * @returns The token ID of the minted NFT
 */
export const mintNFT = async (to: string, uri: string): Promise<string | null> => {
    try {
        const tx = await realia_contract.mint(to, uri);
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
            try {
              const parsed = realia_contract.interface.parseLog(log);
              if (parsed && parsed.name === "Minted") {
                return parsed.args[1].toString();
              }
            } catch (error) {
                console.error(error);
                throw error;
            }
            }

        return null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Verify has order
 * @param user - The address of the user to verify
 * @param orderType - The type of order to verify
 * @returns The token ID of the verified NFT
 */
export const hasOrder = async (user: string, orderType: OrderType): Promise<boolean> => {
    try {
        const hasOrder = await realia_contract.hasOrder(user, orderType);
        return hasOrder;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Request verification
 * @param user - The address of the user to request verification
 * @param uri - The URI of the NFT
 * @returns The token ID of the verified NFT
 */
export const requestVerification = async (user: string, uri: string): Promise<string | null> => {
    try {
        const tx = await realia_contract.requestVerification(user, uri);
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
            try {
                const parsed = realia_contract.interface.parseLog(log);
                if (parsed && parsed.name === "VerificationRequested") {
                    return parsed.args[1].toString();
                }
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
        return null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};