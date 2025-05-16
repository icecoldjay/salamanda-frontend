"use client";
import { createContext, useContext, useState, useEffect } from "react";
import bnb from "../images/bnb.svg";
import eth from "../images/eth.svg";
import sol from "../images/sol.svg";
import polygon from "../images/polygon.svg";

export const NETWORKS = {
  BSC: {
    id: "bsc",
    name: "BNB Smart Chain",
    symbol: "BNB",
    chainId: 56,
    chainIdHex: "0x38",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://bscscan.com",
    type: "evm",
    icon: bnb,
  },
  ETHEREUM: {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    chainId: 1,
    chainIdHex: "0x1",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_ID",
    blockExplorer: "https://etherscan.io",
    type: "evm",
    icon: eth,
  },
  POLYGON: {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    chainId: 137,
    chainIdHex: "0x89",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    type: "evm",
    icon: polygon,
  },
  ARBITRUM: {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    chainId: 42161,
    chainIdHex: "0xa4b1",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    type: "evm",
    icon: eth,
  },
  BASE: {
    id: "base",
    name: "Base",
    symbol: "BASE",
    chainId: 8453,
    chainIdHex: "0x2105",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    type: "evm",
    icon: eth,
  },
  AVALANCHE: {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    chainId: 43114,
    chainIdHex: "0xA86A",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorer: "https://snowtrace.io",
    type: "evm",
    icon: eth,
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
  },
  SOLANA: {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    type: "solana",
    endpoint: "https://api.mainnet-beta.solana.com",
    icon: sol,
  },
};

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS.BSC);

  const isEvm = () => selectedNetwork.type === "evm";
  const isSolana = () => selectedNetwork.type === "solana";

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        setSelectedNetwork,
        isEvm,
        isSolana,
        networks: Object.values(NETWORKS),
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
