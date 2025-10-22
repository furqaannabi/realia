"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect, useCallback, useRef, useState } from 'react';
import getNonce from "@/app/utils/web3/web3";
import { signMessage } from '@wagmi/core';
import { config } from '@/app/utils/wallet';
import { api } from "@/app/utils/axiosInstance";
import useAuth from "@/app/store";
import { getCurrentUser } from "./Provider";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Globe } from "lucide-react";

export function WalletSidebarButton() {
  const { isDisconnected, isConnected, address } = useAccount();
  const { user, updateUser } = useAuth((state) => state)
  const disconnect = useDisconnect()

  // Prevent hydration error from SSR/CSR className mismatch by only rendering
  // connected-specific styles after mount
  const [mounted, setMounted] = useState(false);

  // Use a ref to track last connection status so we can catch disconnect events
  const wasConnected = useRef(isConnected);

  useEffect(() => {
    setMounted(true);
  }, []);

  const login = async () => {
    try {
      const nonce = await getNonce(address as `0x${string}`)

      const signature = await signMessage(config, { message: nonce })

      const res = await api.post('/auth/connect', {
        address,
        message: nonce,
        signature
      })

      toast.success("User Authenticated Successfully")
      return res.data;

    } catch (error: any) {
      console.log("Login error: ", error)
      toast.error(error?.response?.data.error)
    }
  }

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');

    } catch (e) {
      // optional: toast or log error
    }
    updateUser(null);
  }, [updateUser]);

  // Watch for disconnect (i.e. when user clicks the RainbowKit disconnect button)
  useEffect(() => {
    // if user was connected and now isn't, log out
    if (wasConnected.current && !isConnected) {
      handleLogout();
    }
    wasConnected.current = isConnected;
    // purposely not handling login here to avoid multiple triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, handleLogout]);

  useEffect(() => {
    const setUser = async () => {
      try {
        const user = await getCurrentUser()

        if (user) {
          updateUser(user)
        }
      } catch (error: any) {
        if (isConnected) {
          login()
        }
        toast.error(error?.response?.data?.error)
      }
    }
    setUser()
  }, [updateUser, isConnected])


  // Always apply same background on first render to avoid hydration errors.
  // After mount, swap to connected/disconnected bg if needed.
  const baseBgClass = "bg-primary/80 hover:bg-primary/90";
  const connectedBgClass = "bg-transparent";
  const wrapperBgClass = !mounted
    ? baseBgClass
    : (isConnected ? connectedBgClass : baseBgClass);

  return (
    <div className="w-full">
      <div className={`text-primary-foreground cursor-pointer rounded-md p-2 flex justify-center items-center overflow-hidden transition-colors duration-200 ${wrapperBgClass}`}>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openConnectModal,
            openChainModal,
            openAccountModal,
            mounted: kitMounted,
          }) => {
            const ready = kitMounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                })}
                className="flex w-full justify-center"
              >
                {(() => {
                  if (!connected) {
                    // 🟢 Show "Connect Wallet" button
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="w-full text-sm font-medium truncate"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    // ⚠️ Show unsupported network button
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="w-full text-sm font-medium truncate"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  // 🟣 Show account + disconnect
                  return (
                    <div className="flex items-center cursor-pointer gap-2 w-full">
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex flex-1 items-center cursor-pointer gap-2 truncate px-3 py-1.5 bg-white/90 hover:bg-white text-primary rounded-md shadow transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                        title={account.displayName}
                      >
                        <span className="truncate text-primary-foreground max-w-[100px]">{account.displayName}</span>
                        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-black" aria-hidden="true">
                          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 10.5L9 12.5L13 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={openChainModal}
                        type="button"
                        className={`flex items-center cursor-pointer gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all focus:outline-none border ${chain.unsupported ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"}`}
                        title={chain.unsupported ? "Wrong Network" : chain.name}
                      >
                        <span className="truncate max-w-[70px]"><Globe /></span>
                        {chain.unsupported && (
                          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-red-600" aria-hidden="true">
                            <path d="M10 4V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="10" cy="15" r="1" fill="currentColor" />
                            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
