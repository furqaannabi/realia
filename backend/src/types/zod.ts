import { z } from 'zod';

export const createNonceSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
});

export const connectWalletSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    signature: z.string().min(1, 'Signature is required'),
    message: z.string().min(1, 'Message is required')
});

export const mintNFTSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters')
});

export const tokenIdParamSchema = z.object({
    tokenId: z.string().min(1, 'Token ID is required')
});

export const walletAddressParamSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
});
