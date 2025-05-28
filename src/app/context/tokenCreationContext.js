// contexts/tokenCreationContext.js
"use client";
import { createContext, useContext, useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { decodeEventLog } from "viem";
import { parseUnits } from "viem";
import {
  TOKEN_FACTORY_ADDRESSES,
  LIQUIDITY_MANAGER_ADDRESSES,
  LAUNCH_MANAGER_ADDRESSES,
} from "../../constants/addresses";
import { tokenFactoryAbi } from "../../constants/tokenFactoryAbi";
import { config } from "../providers";

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
    method: "generate",
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
      bundleLaunch: false,
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

  // Modified token creation function to work with wagmi v2
  const createToken = async (networkType, evmContext, writeContractAsync) => {
    setIsCreating(true);
    setCreationError(null);

    try {
      if (networkType === "solana") {
        const result = await createSolanaToken(tokenData);
        setCreatedToken(result);
        return result;
      } else {
        // EVM token creation logic
        if (!writeContractAsync) {
          throw new Error(
            "writeContractAsync function is required for EVM token creation"
          );
        }

        const result = await createEvmToken(
          tokenData,
          distributionData,
          evmContext,
          writeContractAsync
        );
        setCreatedToken(result);
        return result;
      }
    } catch (error) {
      console.error("Token creation failed:", error);
      setCreationError(error.message || "Failed to create token");
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const createSolanaToken = async (tokenData) => {
    console.log("Creating Solana token with data:", tokenData);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      address: "mock_solana_token_address",
      name: tokenData.name,
      symbol: tokenData.symbol,
      network: "solana",
    };
  };

  const createEvmToken = async (
    tokenData,
    distributionData,
    evmContext,
    writeContractAsync
  ) => {
    try {
      // Validation checks
      if (!evmContext?.isConnected || !evmContext?.address) {
        throw new Error("Please connect your wallet first");
      }

      if (!evmContext?.isCorrectNetwork) {
        throw new Error(
          "Please switch to the correct network to create a token"
        );
      }

      if (!tokenData.name || !tokenData.symbol || !tokenData.supply) {
        throw new Error(
          "Please fill all required fields (name, symbol, supply)"
        );
      }

      // Parse decimals and total supply
      const decimals = parseInt(tokenData.decimals || "18");
      const parsedSupply = parseUnits(tokenData.supply, decimals);

      // Calculate liquidity and initial holder amounts
      const liquidityPercentage =
        Number(distributionData.liquidityPercentage) / 100;
      const liquidityAmount =
        (BigInt(parsedSupply) * BigInt(Math.floor(liquidityPercentage * 100))) /
        BigInt(100);

      // Prepare holders and amounts arrays
      let initialHolders = [];
      let initialAmounts = [];

      // Add creator's address as the first holder with liquidity amount
      initialHolders.push(evmContext.address);
      initialAmounts.push(liquidityAmount);

      if (distributionData.method === "generate") {
        if (distributionData.wallets.length > 0) {
          const remainingSupply = BigInt(parsedSupply) - liquidityAmount;
          const amountPerWallet =
            remainingSupply / BigInt(distributionData.wallets.length);

          distributionData.wallets.forEach((wallet) => {
            initialHolders.push(wallet.address);
            initialAmounts.push(amountPerWallet);
          });
        }
      } else {
        const validWallets = distributionData.wallets.filter(
          (wallet) =>
            wallet.address &&
            wallet.address.startsWith("0x") &&
            wallet.address.length === 42
        );

        if (validWallets.length > 0) {
          validWallets.forEach((wallet) => {
            const percentage = Number(wallet.percentage) / 100;
            const amount =
              (BigInt(parsedSupply) * BigInt(Math.floor(percentage * 100))) /
              BigInt(100);
            initialHolders.push(wallet.address);
            initialAmounts.push(amount);
          });
        }
      }

      if (initialHolders.length > 10) {
        throw new Error("Maximum 10 initial holders allowed");
      }

      // Creation fee (0.0001 ETH)
      const creationFee = parseUnits("0.0001", 18);

      // Get contract addresses for current network
      const contractAddress =
        TOKEN_FACTORY_ADDRESSES?.[evmContext.currentChainId];
      const liquidityManagerAddress =
        LIQUIDITY_MANAGER_ADDRESSES?.[evmContext.currentChainId];
      const launchManagerAddress =
        LAUNCH_MANAGER_ADDRESSES?.[evmContext.currentChainId];

      if (!contractAddress) {
        throw new Error("Token factory not supported on this network");
      }

      // Execute contract call using writeContractAsync
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: tokenFactoryAbi,
        functionName: "createToken",
        args: [
          tokenData.name,
          tokenData.symbol,
          parsedSupply,
          initialHolders,
          initialAmounts,
          liquidityManagerAddress,
          launchManagerAddress,
          tokenData.bundleLaunch,
          evmContext.address,
        ],
        value: creationFee,
      });

      console.log("Transaction submitted:", txHash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
        chainId: evmContext.currentChainId,
      });

      console.log("Transaction confirmed:", receipt);

      // Extract token address from logs
      let tokenAddress = null;
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            // Decode the log using your ABI
            const decodedLog = decodeEventLog({
              abi: tokenFactoryAbi,
              data: log.data,
              topics: log.topics,
            });

            // Check if this is your TokenCreated event
            if (decodedLog.eventName === "TokenCreated") {
              tokenAddress = decodedLog.args.tokenAddress; // or whatever the parameter name is
              break;
            }
          } catch (error) {
            // Skip logs that don't match our ABI
            continue;
          }
        }
      }

      // If we couldn't extract from logs, try alternative methods
      if (!tokenAddress) {
        console.warn("Could not extract token address from transaction logs");
        // You might want to call a view function on the contract to get the latest created token
        // For now, we'll use a placeholder that indicates the address needs to be retrieved
        tokenAddress = "pending_address_extraction";
      }

      // Return complete token information
      return {
        address: tokenAddress,
        transactionHash: txHash,
        name: tokenData.name,
        symbol: tokenData.symbol,
        network: "evm",
        supply: tokenData.supply,
        decimals: tokenData.decimals,
        bundleLaunch: tokenData.bundleLaunch,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error) {
      console.error("Error creating EVM token:", error);
      throw new Error(error.message || "Failed to create EVM token");
    }
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
        createToken,
      }}
    >
      {children}
    </TokenCreationContext.Provider>
  );
}

export function useTokenCreation() {
  return useContext(TokenCreationContext);
}
