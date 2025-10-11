"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletSidebarButton() {
  return (
    <div className="w-full">
      <div className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md p-2 flex justify-center items-center overflow-hidden transition-colors duration-200">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openConnectModal,
            openChainModal,
            openAccountModal,
            mounted,
          }) => {
            const ready = mounted;
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
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 truncate px-3 py-1.5 bg-white/90 hover:bg-white text-primary rounded-md shadow transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                        title={account.displayName}
                      >
                        <span className="truncate text-primary-foreground max-w-[100px]">{account.displayName}</span>
                        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-primary" aria-hidden="true">
                          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 10.5L9 12.5L13 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={openChainModal}
                        type="button"
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all focus:outline-none border ${chain.unsupported ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"}`}
                        title={chain.unsupported ? "Wrong Network" : chain.name}
                      >
                        <span className="truncate max-w-[70px]">{chain.name}</span>
                        {chain.unsupported && (
                          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-red-600" aria-hidden="true">
                            <path d="M10 4V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="10" cy="15" r="1" fill="currentColor"/>
                            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
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
