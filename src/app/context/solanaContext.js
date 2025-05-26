"use client";
import { createContext, useContext, useEffect, useState } from "react";

const SolanaContext = createContext();

export const SOLANA_WALLETS = {
  PHANTOM: "phantom",
  BACKPACK: "backpack",
  SOLFLARE: "solflare",
  GLOW: "glow",
  NIGHTLY: "nightly",
};

export function SolanaProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);

  const detectWallet = (walletName) => {
    switch (walletName) {
      case SOLANA_WALLETS.PHANTOM:
        return window.phantom?.solana;
      case SOLANA_WALLETS.BACKPACK:
        return window.backpack;
      case SOLANA_WALLETS.SOLFLARE:
        return window.solflare;
      case SOLANA_WALLETS.GLOW:
        return window.glow;
      case SOLANA_WALLETS.NIGHTLY:
        return window.nightly;
      default:
        return window.phantom?.solana || window.solana;
    }
  };

  const connectSolana = async (walletName) => {
    try {
      const wallet = detectWallet(walletName);

      if (!wallet) {
        // Redirect to wallet download page if not installed
        const downloadUrls = {
          [SOLANA_WALLETS.PHANTOM]: "https://phantom.com/download",
          [SOLANA_WALLETS.BACKPACK]: "https://backpack.app/download",
          [SOLANA_WALLETS.SOLFLARE]: "https://solflare.com/",
          [SOLANA_WALLETS.GLOW]: "https://glow.app/",
          [SOLANA_WALLETS.NIGHTLY]: "https://nightly.app/",
        };
        window.open(downloadUrls[walletName], "_blank");
        throw new Error(`${walletName} wallet not installed`);
      }

      // Standard Solana wallet interface
      if (wallet.connect) {
        const response = await wallet.connect();
        setPublicKey(response.publicKey.toString());
        setConnectedWallet(walletName);
        setIsConnected(true);
        return true;
      }

      // Some wallets might have different interfaces
      if (wallet.connect) {
        await wallet.connect();
        setPublicKey(wallet.publicKey.toString());
        setConnectedWallet(walletName);
        setIsConnected(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`${walletName} connection error:`, error);
      return false;
    }
  };

  const disconnectSolana = async () => {
    try {
      if (connectedWallet) {
        const wallet = detectWallet(connectedWallet);
        if (wallet?.disconnect) {
          await wallet.disconnect();
        }
      }
      setPublicKey(null);
      setIsConnected(false);
      setConnectedWallet(null);
    } catch (error) {
      console.error("Solana disconnection error:", error);
    }
  };

  // Existing useEffect for event listeners remains the same
  // ...

  return (
    <SolanaContext.Provider
      value={{
        isConnected,
        publicKey,
        connectedWallet,
        connectSolana,
        disconnectSolana,
        supportedWallets: Object.values(SOLANA_WALLETS),
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana() {
  return useContext(SolanaContext);
}
