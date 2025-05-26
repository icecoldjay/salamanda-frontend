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
    bundleLaunch: false,
  });

  const [distributionData, setDistributionData] = useState({
    method: "generate", // "generate" or "manual"
    liquidityPercentage: 70,
    walletCount: 0,
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
      bundleLaunch: false, // Added this missing property
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

  // Token creation function
  const createToken = async (networkType) => {
    setIsCreating(true);
    setCreationError(null);

    try {
      // Here you would implement your actual token creation logic
      // This is a placeholder that you can replace with your actual implementation

      if (networkType === "solana") {
        // Solana token creation logic
        const result = await createSolanaToken(tokenData);
        setCreatedToken(result);
      } else {
        // EVM token creation logic
        const result = await createEvmToken(tokenData);
        setCreatedToken(result);
      }

      return createdToken;
    } catch (error) {
      console.error("Token creation failed:", error);
      setCreationError(error.message || "Failed to create token");
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Placeholder functions - replace with your actual implementation
  const createSolanaToken = async (tokenData) => {
    // Implement your Solana token creation logic here
    // This could involve calling your backend API or using web3 libraries
    console.log("Creating Solana token with data:", tokenData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return mock token data - replace with actual response
    return {
      address: "mock_solana_token_address",
      name: tokenData.name,
      symbol: tokenData.symbol,
      network: "solana",
    };
  };

  const createEvmToken = async (tokenData) => {
    // Implement your EVM token creation logic here
    console.log("Creating EVM token with data:", tokenData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return mock token data - replace with actual response
    return {
      address: "mock_evm_token_address",
      name: tokenData.name,
      symbol: tokenData.symbol,
      network: "evm",
    };
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
        createToken, // Added this new function
      }}
    >
      {children}
    </TokenCreationContext.Provider>
  );
}

export function useTokenCreation() {
  return useContext(TokenCreationContext);
}
