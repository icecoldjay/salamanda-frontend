"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useNetwork } from "../../context/networkContext";
import { useEvm, EVM_WALLET_DOWNLOADS } from "../../context/evmContext";
import { useSolana, SOLANA_WALLETS } from "../../context/solanaContext";
import coinbase from "../../images/coinbase.svg";
import trustwallet from "../../images/trustwallet.svg";
import metamask from "../../images/metamask.svg";
import phantom from "../../images/phantom.svg";

const WalletModal = ({ isOpen, onClose }) => {
  const { isEvm, isSolana, selectedNetwork } = useNetwork();
  const {
    connectEvmWallet,
    supportedWallets: supportedEvmWallets,
    connectionError,
    networkError,
    isAttemptingConnection,
    switchNetwork,
    isConnected: isEvmConnected,
    currentChainId,
    isCorrectNetwork,
  } = useEvm();
  const {
    connectSolana,
    supportedWallets,
    isConnected: isSolanaConnected,
  } = useSolana();

  const [attemptedWallet, setAttemptedWallet] = useState(null);
  const [showNetworkSwitchPrompt, setShowNetworkSwitchPrompt] = useState(false);

  useEffect(() => {
    // Close modal if connected (for Solana) or connected to correct network (for EVM)
    if (isSolana() && isSolanaConnected) {
      onClose();
    } else if (isEvm() && isEvmConnected && isCorrectNetwork) {
      onClose();
    }
  }, [
    isSolanaConnected,
    isEvmConnected,
    isCorrectNetwork,
    isEvm,
    isSolana,
    onClose,
  ]);

  useEffect(() => {
    if (isEvmConnected && selectedNetwork && !isCorrectNetwork) {
      setShowNetworkSwitchPrompt(true);
    } else {
      setShowNetworkSwitchPrompt(false);
    }
  }, [isEvmConnected, isCorrectNetwork, selectedNetwork]);

  const handleNetworkSwitch = async () => {
    try {
      const success = await switchNetwork();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Network switch failed:", error);
    }
  };

  const evmWallets = [
    { id: "metaMask", name: "MetaMask", icon: metamask },
    {
      id: "trustWallet",
      name: "TrustWallet",
      icon: trustwallet,
    },
    {
      id: "coinbaseWallet",
      name: "Coinbase Wallet",
      icon: coinbase,
    },
  ];

  const solanaWallets = [
    {
      id: SOLANA_WALLETS.PHANTOM,
      name: "Phantom",
      icon: phantom,
    },
    {
      id: SOLANA_WALLETS.BACKPACK,
      name: "Backpack",
      icon: "/wallets/backpack.svg",
    },
  ];

  const handleConnect = async (walletId) => {
    if (isAttemptingConnection) return;
    setAttemptedWallet(walletId);

    if (
      (walletId === "trustWallet" || walletId === "coinbaseWallet") &&
      window.ethereum?.isMetaMask
    ) {
      const downloadUrl = EVM_WALLET_DOWNLOADS[walletId];
      window.open(downloadUrl, "_blank");
      return;
    }

    try {
      if (isEvm()) {
        await connectEvmWallet(walletId);
        // Don't close here - we'll let the effect handle it after network check
      } else if (isSolana()) {
        await connectSolana(walletId);
        // Effect will handle closing for Solana
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  if (!isOpen) return null;

  // Show network switch prompt if needed
  if (showNetworkSwitchPrompt && isEvmConnected) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-black rounded-lg p-6 w-full max-w-md border border-gray-800 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>

          <h2 className="text-white text-xl font-medium mb-4">
            Switch Network
          </h2>

          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Your wallet is connected to a different network. Switch to{" "}
              {selectedNetwork?.name} to continue.
            </p>

            {networkError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">
                <p>{networkError.message}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNetworkSwitch}
                disabled={isAttemptingConnection}
                className={`px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors ${
                  isAttemptingConnection ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isAttemptingConnection
                  ? "Switching..."
                  : `Switch to ${selectedNetwork?.name}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const walletsToDisplay = isEvm() ? evmWallets : solanaWallets;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-lg p-6 w-full max-w-md border border-gray-800 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h2 className="text-white text-xl font-medium mb-6">
          Connect {selectedNetwork?.name || "Wallet"}
        </h2>

        {connectionError && attemptedWallet && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">
            <p>{connectionError.message}</p>
            {connectionError.type === "installation" && (
              <button
                onClick={() =>
                  window.open(EVM_WALLET_DOWNLOADS[attemptedWallet], "_blank")
                }
                className="mt-2 bg-red-700 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
              >
                Install {attemptedWallet}
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {walletsToDisplay.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              disabled={isAttemptingConnection}
              className={`flex items-center w-full gap-4 p-3 rounded-md text-left transition-colors ${
                isAttemptingConnection
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              <Image
                src={wallet.icon}
                alt={wallet.name}
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-white">{wallet.name}</span>
              {isAttemptingConnection && attemptedWallet === wallet.id && (
                <span className="ml-auto text-xs text-gray-300">
                  Connecting...
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>By connecting, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
