import { api } from "./axiosInstance";

export default async function getNonce(address: `0x${string}`) {
    const res = await api.post('/auth/nonce', { address })
    return res.data.nonce;
}