import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, arbitrum, arbitrumSepolia, mainnet, optimism, polygon } from 'wagmi/chains';
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  // coinbaseWallet, // Do not import Coinbase
  // braveWallet,    // Example: you may disable more wallets by removing from here
} from '@rainbow-me/rainbowkit/wallets';

export const config = getDefaultConfig({
  appName: 'Realia',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [arbitrumSepolia], // ONLY use arbitrum testnet
  ssr: false, // If your dApp uses server side rendering (SSR)
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        injectedWallet,
        // coinbaseWallet, // Disabled Coinbase wallet here
      ],
    },
  ],
});