// contexts/tokenCreationContext.js
"use client";
import { createContext, useContext, useState } from "react";

export const TokenCreationContext = createContext();

export function TokenCreationProvider({ children }) {
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    supply: "",
    description: "",
    logo: null,
    revokeFreeze: false,
    revokeMint: false,
  });

  const [distributionData, setDistributionData] = useState({
    method: "generate", // "generate" or "manual"
    liquidityPercentage: 70,
    walletCount: 3,
    wallets: [],
  });

  const [createdToken, setCreatedToken] = useState(null);
  const [creationError, setCreationError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const updateTokenData = (newData) => {
    setTokenData((prev) => ({ ...prev, ...newData }));
  };

  const updateDistributionData = (newData) => {
    setDistributionData((prev) => ({ ...prev, ...newData }));
  };

  const resetTokenCreation = () => {
    setTokenData({
      name: "",
      symbol: "",
      decimals: "",
      supply: "",
      description: "",
      logo: null,
      revokeFreeze: false,
      revokeMint: false,
    });
    setDistributionData({
      method: "generate",
      liquidityPercentage: 70,
      walletCount: 3,
      wallets: [],
    });
    setCreatedToken(null);
    setCreationError(null);
    setIsCreating(false);
  };

  return (
    <TokenCreationContext.Provider
      value={{
        tokenData,
        distributionData,
        createdToken,
        creationError,
        isCreating,
        updateTokenData,
        updateDistributionData,
        setCreatedToken,
        setCreationError,
        setIsCreating,
        resetTokenCreation,
      }}
    >
      {children}
    </TokenCreationContext.Provider>
  );
}

export function useTokenCreation() {
  return useContext(TokenCreationContext);
}
