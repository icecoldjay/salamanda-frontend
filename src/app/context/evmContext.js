"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { useNetwork } from "./networkContext";

export const EVM_WALLET_DOWNLOADS = {
  metaMask: "https://metamask.io/download/",
  coinbaseWallet: "https://www.coinbase.com/wallet/downloads",
  trustWallet: "https://trustwallet.com/browser-extension",
};

const WALLET_ID_MAPPING = {
  metaMask: "io.metamask",
  trustWallet: "injected",
  coinbaseWallet: "coinbaseWalletSDK",
};

const EvmContext = createContext({
  isConnected: false,
  address: undefined,
  balance: { value: 0n, formatted: "0" },
  selectedEvmWallet: null,
  connectEvmWallet: async () => {},
  disconnectEvmWallet: () => {},
  connectionError: null,
  networkError: null,
  supportedWallets: [],
  isAttemptingConnection: false,
  switchNetwork: async () => {},
  currentChainId: null,
  isCorrectNetwork: false,
});

export function EvmProvider({ children }) {
  const [selectedEvmWallet, setSelectedEvmWallet] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [attemptingConnection, setAttemptingConnection] = useState(false);

  const { selectedNetwork } = useNetwork();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const {
    connect,
    connectors,
    error: wagmiError,
    isPending: isConnectPending,
  } = useConnect({
    mutation: {
      onSuccess: (data) => {
        setSelectedEvmWallet(data.connector.id);
        setConnectionError(null);
        setAttemptingConnection(false);
      },
      onError: (error) => {
        setConnectionError({
          message: error.message,
          type: error.message.includes("wallet not installed")
            ? "installation"
            : "connection",
        });
        setAttemptingConnection(false);
      },
    },
  });

  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });

  const isCorrectNetwork = useMemo(() => {
    if (!selectedNetwork?.chainId || !chainId) return false;
    return (
      chainId ===
      (typeof selectedNetwork.chainId === "string"
        ? parseInt(selectedNetwork.chainId, 16)
        : selectedNetwork.chainId)
    );
  }, [chainId, selectedNetwork]);

  // In the EvmProvider component, update the switchToSelectedNetwork function:
  const switchToSelectedNetwork = useCallback(async () => {
    if (!selectedNetwork?.chainId || !switchChainAsync) return false;

    try {
      const targetChainId =
        typeof selectedNetwork.chainId === "string"
          ? parseInt(selectedNetwork.chainId, 16)
          : selectedNetwork.chainId;

      if (chainId === targetChainId) return true;

      await switchChainAsync({ chainId: targetChainId });
      return true;
    } catch (error) {
      console.error("Network switch failed:", error);
      setNetworkError({
        message: error.message,
        type: "network",
      });
      return false;
    }
  }, [selectedNetwork, switchChainAsync, chainId]);

  useEffect(() => {
    if (isConnected && selectedNetwork?.chainId && !isCorrectNetwork) {
      switchToSelectedNetwork();
    }
  }, [isConnected, selectedNetwork, isCorrectNetwork, switchToSelectedNetwork]);

  const connectEvmWallet = useCallback(
    async (walletId) => {
      if (attemptingConnection) return;

      setConnectionError(null);
      setNetworkError(null);
      setAttemptingConnection(true);

      try {
        const resolvedConnectorId = WALLET_ID_MAPPING[walletId] || walletId;
        const connector = connectors.find(
          (c) => c.id.toLowerCase() === resolvedConnectorId.toLowerCase()
        );

        if (!connector) {
          throw new Error(`Wallet connector not found: ${walletId}`);
        }

        if (
          (walletId === "trustWallet" || walletId === "coinbaseWallet") &&
          window.ethereum?.isMetaMask
        ) {
          throw {
            message: `${walletId} not detected. Please install it first.`,
            type: "installation",
          };
        }

        await connect({ connector });
      } catch (error) {
        setConnectionError({
          message: error.message,
          type: error.type || "connection",
          walletId,
        });
        setAttemptingConnection(false);
      }
    },
    [connect, connectors, attemptingConnection]
  );

  const disconnectEvmWallet = useCallback(() => {
    disconnect();
    setSelectedEvmWallet(null);
    setConnectionError(null);
    setNetworkError(null);
    setAttemptingConnection(false);
  }, [disconnect]);

  const supportedWallets = useMemo(() => {
    return Object.keys(WALLET_ID_MAPPING).filter((walletId) => {
      const connectorId = WALLET_ID_MAPPING[walletId];
      return connectors.some(
        (c) => c.id.toLowerCase() === connectorId.toLowerCase()
      );
    });
  }, [connectors]);

  return (
    <EvmContext.Provider
      value={{
        isConnected,
        address,
        balance: {
          value: balanceData?.value || 0n,
          formatted: balanceData?.formatted || "0",
        },
        selectedEvmWallet,
        connectEvmWallet,
        disconnectEvmWallet,
        connectionError,
        networkError,
        supportedWallets,
        isAttemptingConnection: attemptingConnection || isConnectPending,
        switchNetwork: switchToSelectedNetwork,
        currentChainId: chainId,
        isCorrectNetwork,
      }}
    >
      {children}
    </EvmContext.Provider>
  );
}

export function useEvm() {
  return useContext(EvmContext);
}
