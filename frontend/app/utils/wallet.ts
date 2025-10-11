import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, arbitrum, mainnet, optimism, polygon } from 'wagmi/chains';
export const config = getDefaultConfig({
    appName: 'Realia',
    projectId: 'd9cc15dbf6c4647175c7b5452fee3810',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: false, // If your dApp uses server side rendering (SSR)
});