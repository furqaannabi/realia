import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';
import { sessionMiddleware } from '../middleware/session';
import { uploadMedia, getAIOrOriginalUrl } from '../services/media';
import { mintNFT, hasOrder, OrderType } from '../services/blockchain';
import prisma from '../clients/prisma';
import { 
    createNonceSchema, 
    connectWalletSchema, 
    mintNFTSchema, 
    tokenIdParamSchema 
} from '../types/zod';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /mint
 * Mint a new NFT
 * @param req - The request object
 * @param res - The response object
 * @returns The NFT
 */
router.post('/mint', sessionMiddleware, upload.single('image') as any, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const validationResult = mintNFTSchema.safeParse(JSON.parse(req.body));
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues
            });
            return;
        }

        const { name, description } = validationResult.data;

        const isAI = await getAIOrOriginalUrl(req.file.buffer);
        if (isAI) {
            res.status(400).json({ error: 'Image is AI generated' });
            return;
        }

        const hasMintOrder = await hasOrder(req.user.walletAddress, OrderType.MINT);
        if (!hasMintOrder) {
            res.status(403).json({ error: 'User does not have a mint order' });
            return;
        }

        const metadata = {
            name,
            description,
            image: '',
        }

        const media = await uploadMedia(req.file, metadata);

        const tokenId = await mintNFT(req.user.walletAddress, `ipfs://${media.cid}`);

        if (!tokenId) {
            res.status(500).json({ error: 'Failed to mint NFT' });
            return;
        }

        const image = await prisma.image.create({
            data: {
                ipfsCid: media.cid,
                s3Key: media.key,
                metadataCid: media.cid,
                metadata: metadata as any
            }
        });

        const nft = await prisma.nFT.create({
            data: {
                tokenId,
                userId: req.user.id,
                imageId: image.id
            },
            include: {
                image: true
            }
        });

        res.status(201).json({ 
            success: true,
            nft,
            tokenId,
            ipfsUrl: `ipfs://${media.cid}`,
            imageUrl: media.key
        });

    } catch (error) {
        console.error('Mint error:', error);
        res.status(500).json({ error: 'Failed to mint NFT' });
    }
});

/**
 * GET /nfts
 * Get all NFTs for the authenticated user
 * @param req - The request object
 * @param res - The response object
 * @returns The NFTs
 */
router.get('user/nfts', sessionMiddleware, async (req: Request, res: Response) => {
    try {
        const nfts = await prisma.nFT.findMany({
            where: { userId: req.user.id },
            include: { image: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ nfts });
    } catch (error) {
        console.error('Get NFTs error:', error);
        res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
});

/**
 * GET /nfts/:tokenId
 * Get NFT by token ID
 * @param req - The request object
 * @param res - The response object
 * @returns The NFT
 */
router.get('/nfts/:tokenId', async (req: Request, res: Response) => {
    try {
        const validationResult = tokenIdParamSchema.safeParse(req.params);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues
            });
            return;
        }

        const { tokenId } = validationResult.data;

        const nft = await prisma.nFT.findUnique({
            where: { tokenId },
            include: { 
                image: true,
                user: {
                    select: {
                        walletAddress: true
                    }
                }
            }
        });

        if (!nft) {
            res.status(404).json({ error: 'NFT not found' });
            return;
        }

        res.json({ nft });
    } catch (error) {
        console.error('Get NFT error:', error);
        res.status(500).json({ error: 'Failed to fetch NFT' });
    }
});

/**
 * GET /nfts
 * Get all NFTs
 * @param req - The request object
 * @param res - The response object
 * @returns The NFTs
 */
router.get('/nfts', async (req: Request, res: Response) => {
    try {
        const nfts = await prisma.nFT.findMany({
            include: { image: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ nfts });
    } catch (error) {
        console.error('Get NFTs error:', error);
        res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
});

/**
 * POST /auth/nonce
 * Create a nonce for wallet authentication
 * @param req - The request object
 * @param res - The response object
 * @returns The nonce
 */
router.post('/auth/nonce', async (req: Request, res: Response) => {
    try {
        const validationResult = createNonceSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues
            });
            return;
        }

        const { address } = validationResult.data;
        let user = await prisma.user.findUnique({ where: { walletAddress: address } });
        if (!user) {
            user = await prisma.user.create({
                data: { walletAddress: address }
            });
        }
        const nonce = randomBytes(32).toString('hex');
        await prisma.nonce.create({
            data: {
                nonce,
                user: { connect: { id: user.id } }
            }
        });
        res.status(200).json({ nonce });
        return;
    } catch (error) {
        console.error('Failed to create nonce:', error);
        res.status(500).json({ error: 'Failed to create nonce' });
        return;
    }
});

/**
 * POST /auth/connect
 * Connect wallet and authenticate user
 * @param req - The request object
 * @param res - The response object
 * @returns The session
 */
router.post('/auth/connect', async (req: Request, res: Response) => {
    try {
        const validationResult = connectWalletSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues
            });
            return;
        }

        const { address, signature, message } = validationResult.data;
        const recoveredAddress = verifyMessage(message, signature);
        if (recoveredAddress !== address) {
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        const nonce = await prisma.nonce.findUnique({ where: { nonce: message } });
        if (!nonce) {
            res.status(400).json({ error: 'Invalid nonce' });
            return;
        }
        await prisma.nonce.delete({ where: { id: nonce.id } });
        const sessionId = randomBytes(32).toString('hex');
        await prisma.session.create({
            data: {
                user: { connect: { id: nonce.userId } },
                session: sessionId
            }
        });
        const token = jwt.sign({ sessionId }, process.env.JWT_SECRET!);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none',
            maxAge: 3600000,
        }).json({
            message: 'Authentication successful'
        });
        return;
    } catch (error) {
        console.error('Connect wallet error:', error);
        res.status(500).json({ error: 'Failed to connect wallet' });
        return;
    }
});

/**
 * POST /auth/logout
 * Logout user by clearing session
 * @param req - The request object
 * @param res - The response object
 * @returns The message
 */
router.post('/auth/logout', sessionMiddleware, async (req: Request, res: Response) => {
    try {
        const session = await prisma.session.findFirst({
            where: { userId: req.user.id }
        });

        if (session) {
            await prisma.session.delete({
                where: { id: session.id }
            });
        }

        res.clearCookie('token').json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

/**
 * GET /auth/me
 * Get current authenticated user
 * @param req - The request object
 * @param res - The response object
 * @returns The user
*/
router.get('/auth/me', sessionMiddleware, async (req: Request, res: Response) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;

