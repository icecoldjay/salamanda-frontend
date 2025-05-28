"use client";
import { createContext, useContext, useState, useEffect } from "react";
import bnb from "../images/bnb.svg";
import eth from "../images/eth.svg";
import sol from "../images/sol.svg";
import polygon from "../images/polygon.svg";

export const NETWORKS = {
  BSC_TESTNET: {
    id: "bsc-testnet",
    name: "BNB Smart Chain Testnet",
    symbol: "tBNB",
    chainId: 97,
    chainIdHex: "0x61",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    blockExplorer: "https://testnet.bscscan.com",
    type: "evm",
    icon: bnb,
  },
  SEPOLIA: {
    id: "sepolia",
    name: "Ethereum Sepolia",
    symbol: "SepoliaETH",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_ID",
    blockExplorer: "https://sepolia.etherscan.io",
    type: "evm",
    icon: eth,
  },
  POLYGON_AMOY: {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    symbol: "POL",
    chainId: 80002,
    chainIdHex: "0x13882",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    type: "evm",
    icon: polygon,
  },
  ARBITRUM_SEPOLIA: {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    chainId: 421614,
    chainIdHex: "0x66eee",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    type: "evm",
    icon: eth,
  },
  BASE_SEPOLIA: {
    id: "base-sepolia",
    name: "Base Sepolia",
    symbol: "ETH",
    chainId: 84532,
    chainIdHex: "0x14a34",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    type: "evm",
    icon: eth,
  },
  AVALANCHE_FUJI: {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    symbol: "AVAX",
    chainId: 43113,
    chainIdHex: "0xA869",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    blockExplorer: "https://testnet.snowtrace.io",
    type: "evm",
    icon: eth,
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
  },
  SOLANA_DEVNET: {
    id: "solana-devnet",
    name: "Solana Devnet",
    symbol: "SOL",
    type: "solana",
    endpoint: "https://api.devnet.solana.com",
    icon: sol,
  },
};

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS.BSC_TESTNET);

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
