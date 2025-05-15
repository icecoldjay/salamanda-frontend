// components/TokenDistributionForm/TokenDistributionForm.js
"use client";
import React, { useState, useEffect } from "react";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useNetwork } from "../../context/networkContext";
import { useEvm } from "../../context/evmContext";
import { useSolana } from "../../context/solanaContext";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import {
  generateWallets,
  downloadWalletInfo,
} from "../../../utils/evmWalletUtils";
import { parseUnits } from "ethers";

// Network-specific contract addresses (you'll replace these with your actual addresses)
const TOKEN_FACTORY_ADDRESSES = {
  11155111: "0x965Ad8Ec12C007ff451449054e365705e314D0B5", // Sepolia
  56: "0x...", // BSC
  1: "0x...", // Ethereum
  // Add more networks as needed
};

const LIQUIDITY_MANAGER_ADDRESSES = {
  11155111: "0xebc9642aD5A355D3D4183243A870F71d4fA9564E", // Sepolia
  // Add more networks as needed
};

const LAUNCH_MANAGER_ADDRESSES = {
  11155111: "0xB514d47F07E1c45520bB0f6656dE269c1a6FE142", // Sepolia
  // Add more networks as needed
};

const TokenDistributionForm = ({ onBack, onNext, networkType }) => {
  const {
    tokenData,
    distributionData,
    updateDistributionData,
    setIsCreating,
    setCreationError,
    setCreatedToken,
  } = useTokenCreation();
  const { isConnected: isEvmConnected, address: evmAddress } = useEvm();
  const { isConnected: isSolanaConnected, publicKey: solanaPublicKey } =
    useSolana();
  const [wallets, setWallets] = useState([]);
  const [generatedWallets, setGeneratedWallets] = useState([]);
  const [isValid, setIsValid] = useState(false);

  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const chainId = useChainId();

  useEffect(() => {
    if (isConfirmed && receipt) {
      // Extract token address from logs (implementation depends on your contract)
      const tokenAddress = extractTokenAddressFromReceipt(receipt);

      setCreatedToken((prev) => ({
        ...prev,
        address: tokenAddress,
      }));
    }
  }, [isConfirmed, receipt]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setCreationError(writeError.message);
      setIsCreating(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (distributionData.method === "generate") {
      const wallets = generateWallets(distributionData.walletCount);
      setGeneratedWallets(wallets);
      updateDistributionData({ wallets });
    }
  }, [distributionData.method, distributionData.walletCount]);

  useEffect(() => {
    if (distributionData.method === "manual") {
      const validWallets = distributionData.wallets.filter(
        (w) => w.address && w.percentage > 0
      );
      const totalPercentage = validWallets.reduce(
        (sum, w) => sum + Number(w.percentage),
        0
      );
      setIsValid(validWallets.length > 0 && totalPercentage === 100);
    } else {
      setIsValid(true);
    }
  }, [distributionData]);

  const handleLiquidityChange = (e) => {
    const newLiquidity = parseInt(e.target.value);
    updateDistributionData({
      liquidityPercentage: newLiquidity,
      initialHoldersPercentage: 100 - newLiquidity,
    });
  };

  const handleMethodChange = (method) => {
    updateDistributionData({ method });
  };

  const handleWalletCountChange = (e) => {
    const count = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
    updateDistributionData({ walletCount: count });
  };

  const handleWalletChange = (index, field, value) => {
    const updatedWallets = [...distributionData.wallets];
    updatedWallets[index][field] = value;
    updateDistributionData({ wallets: updatedWallets });
  };

  const addWallet = () => {
    if (distributionData.wallets.length < 10) {
      const newPercentage = Math.floor(
        100 / (distributionData.wallets.length + 1)
      );
      const updatedWallets = distributionData.wallets.map((w) => ({
        ...w,
        percentage: newPercentage.toString(),
      }));
      updatedWallets.push({
        address: "",
        percentage: newPercentage.toString(),
      });
      updateDistributionData({ wallets: updatedWallets });
    }
  };

  const removeWallet = (index) => {
    if (distributionData.wallets.length > 1) {
      const updatedWallets = distributionData.wallets.filter(
        (_, i) => i !== index
      );
      const newPercentage = Math.floor(100 / updatedWallets.length);
      const finalWallets = updatedWallets.map((w) => ({
        ...w,
        percentage: newPercentage.toString(),
      }));
      updateDistributionData({ wallets: finalWallets });
    }
  };

  const extractTokenAddressFromReceipt = (receipt) => {
    // Implement based on your contract's event emission
    // This is just an example - adjust to match your contract's events
    const eventTopic =
      "0xd5f9bdf12adf29dab0248c349842c3822d53ae2bb4f36352f301630d018c8139"; // TokenCreated event
    const eventLog = receipt.logs.find((log) => log.topics[0] === eventTopic);

    if (eventLog) {
      return `0x${eventLog.data.substring(26, 66)}`;
    }
    return null;
  };

  const createToken = async () => {
    try {
      setIsCreating(true);
      setCreationError(null);

      if (networkType === "evm" && !isEvmConnected) {
        throw new Error("Please connect your EVM wallet first");
      }

      if (networkType === "solana" && !isSolanaConnected) {
        throw new Error("Please connect your Solana wallet first");
      }

      // Prepare token creation data
      const creationData = {
        ...tokenData,
        ...distributionData,
        creatorAddress:
          networkType === "evm" ? evmAddress : solanaPublicKey.toString(),
      };

      // Call appropriate creation function based on network
      let result;
      if (networkType === "evm") {
        result = await createEvmToken(creationData);
      } else {
        result = await createSolanaToken(creationData);
      }

      setCreatedToken(result);
      onNext();
    } catch (error) {
      console.error("Token creation failed:", error);
      setCreationError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const createEvmToken = async (data) => {
    try {
      if (!chainId || !TOKEN_FACTORY_ADDRESSES[chainId]) {
        throw new Error("Unsupported network for token creation");
      }

      const decimals = parseInt(data.decimals || "18");
      const parsedSupply = parseUnits(data.supply, decimals);

      // Calculate liquidity and initial holder amounts
      const liquidityPercentage = Number(data.liquidityPercentage) / 100;
      const initialHoldersPercentage =
        Number(100 - data.liquidityPercentage) / 100;

      const liquidityAmount =
        (BigInt(parsedSupply) * BigInt(Math.floor(liquidityPercentage * 100))) /
        BigInt(100);
      const initialHoldersAmount =
        (BigInt(parsedSupply) *
          BigInt(Math.floor(initialHoldersPercentage * 100))) /
        BigInt(100);

      // Prepare holders and amounts arrays
      let initialHolders = [];
      let initialAmounts = [];

      // Add creator's address as the first holder
      initialHolders.push(evmAddress);
      initialAmounts.push(liquidityAmount);

      if (data.method === "generate") {
        // Use generated wallets
        if (generatedWallets.length > 0) {
          // Calculate amount per wallet
          const amountPerWallet =
            initialHoldersAmount / BigInt(generatedWallets.length);

          // Add generated wallets
          generatedWallets.forEach((wallet) => {
            initialHolders.push(wallet.address);
            initialAmounts.push(amountPerWallet);
          });
        }
      } else {
        // Use manually entered wallets
        const validWallets = data.wallets.filter(
          (wallet) =>
            wallet.address &&
            wallet.address.startsWith("0x") &&
            wallet.address.length === 42
        );

        if (validWallets.length === 0) {
          throw new Error("Please add at least one valid wallet address");
        }

        // Add manual wallets
        validWallets.forEach((wallet) => {
          const percentage = Number(wallet.percentage) / 100;
          const amount =
            (BigInt(initialHoldersAmount) *
              BigInt(Math.floor(percentage * 100))) /
            BigInt(100);

          initialHolders.push(wallet.address);
          initialAmounts.push(amount);
        });
      }

      if (initialHolders.length > 10) {
        throw new Error("Maximum 10 initial holders allowed");
      }

      // Creation fee (0.0001 ETH)
      const creationFee = parseUnits("0.0001", 18);

      // Get contract addresses for current network
      const contractAddress = TOKEN_FACTORY_ADDRESSES[chainId];
      const liquidityManagerAddress = LIQUIDITY_MANAGER_ADDRESSES[chainId];
      const launchManagerAddress = LAUNCH_MANAGER_ADDRESSES[chainId];

      // Execute contract call using Wagmi's writeContract
      writeContract({
        address: contractAddress,
        abi: tokenFactoryAbi,
        functionName: "createToken",
        args: [
          data.name,
          data.symbol,
          parsedSupply,
          initialHolders,
          initialAmounts,
          liquidityManagerAddress,
          launchManagerAddress,
        ],
        value: creationFee,
      });

      // Return preliminary data (address will be filled from receipt)
      return {
        txHash: hash,
        name: data.name,
        symbol: data.symbol,
        supply: data.supply,
        decimals: data.decimals,
        generatedWallets: data.method === "generate" ? generatedWallets : null,
        initialHolders,
        initialAmounts,
      };
    } catch (error) {
      console.error("EVM token creation failed:", error);
      throw error;
    }
  };

  const createSolanaToken = async (data) => {
    try {
      // First create metadata
      const formData = new FormData();
      formData.append("tokenName", data.name);
      formData.append("symbol", data.symbol);
      formData.append("file", data.logo);
      formData.append("decimals", data.decimals);
      formData.append("description", data.description);

      const metadataResponse = await fetch(
        "http://localhost:5000/addMetadata",
        {
          method: "POST",
          body: formData,
        }
      );

      const uriData = await metadataResponse.json();
      if (!uriData || !uriData.uri) {
        throw new Error("Failed to create token metadata");
      }

      // Then create token
      const decimals = parseInt(data.decimals || "9");
      const supply = BigInt(data.supply) * BigInt(10) ** BigInt(decimals);

      const tokenResponse = await fetch(
        "http://localhost:5000/createTokenWithMetadata",
        {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            symbol: data.symbol,
            decimals: data.decimals,
            amount: supply.toString(),
            tokenOwner: solanaPublicKey.toString(),
            uri: uriData.uri,
            revokeFreezeAuthority: data.revokeFreeze,
            revokeMintAuthority: data.revokeMint,
          }),
          headers: {
            "Content-type": "application/json",
          },
        }
      );

      const result = await tokenResponse.json();
      if (!result.tokenAddress) {
        throw new Error(result.error || "Failed to create token");
      }

      return {
        address: result.tokenAddress,
        txSignature: result.signature,
        name: data.name,
        symbol: data.symbol,
        supply: data.supply,
        decimals: data.decimals,
        metadataUri: uriData.uri,
        generatedWallets: data.method === "generate" ? generatedWallets : null,
      };
    } catch (error) {
      console.error("Solana token creation failed:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-[Archivo] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-[#0A0A0A] p-8 rounded-2xl shadow-lg">
        <button onClick={onBack} className="text-sm text-gray-400 mb-4">
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold mb-1">Token distribution</h2>
        <p className="text-gray-400 mb-6">
          How you want to distribute your token
        </p>

        <div className="mb-6">
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span>Liquidity pool</span>
            <span>Initial holders</span>
          </div>
          <div className="flex justify-between mb-2 font-semibold text-lg">
            <span>{distributionData.liquidityPercentage}%</span>
            <span>{100 - distributionData.liquidityPercentage}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={distributionData.liquidityPercentage}
            onChange={handleLiquidityChange}
            className="w-full accent-red-600"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Distribution method</p>
          <div className="flex gap-2">
            <button
              className={`w-1/2 py-2 rounded-md ${
                distributionData.method === "generate"
                  ? "bg-red-800 text-white"
                  : "bg-[#111] text-gray-400"
              } font-medium border ${
                distributionData.method === "generate"
                  ? "border-red-700"
                  : "border-gray-700"
              }`}
              onClick={() => handleMethodChange("generate")}
            >
              Generate wallet
            </button>
            <button
              className={`w-1/2 py-2 rounded-md ${
                distributionData.method === "manual"
                  ? "bg-red-800 text-white"
                  : "bg-[#111] text-gray-400"
              } border ${
                distributionData.method === "manual"
                  ? "border-red-700"
                  : "border-gray-700"
              }`}
              onClick={() => handleMethodChange("manual")}
            >
              Input wallet
            </button>
          </div>
        </div>

        {distributionData.method === "generate" ? (
          <>
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Number of wallets</p>
              <input
                type="number"
                min="1"
                max="10"
                value={distributionData.walletCount}
                onChange={handleWalletCountChange}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm placeholder-gray-500"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">
                Generated wallets preview
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>Your wallet</span>
                  <span>{distributionData.liquidityPercentage}%</span>
                </li>
                {wallets.map((wallet, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{wallet.address}</span>
                    <span>
                      {Math.floor(
                        (100 - distributionData.liquidityPercentage) /
                          distributionData.walletCount
                      )}
                      %
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Wallet addresses</p>
              {distributionData.wallets.map((wallet, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={wallet.address}
                    onChange={(e) =>
                      handleWalletChange(index, "address", e.target.value)
                    }
                    placeholder="Wallet address"
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wallet.percentage}
                    onChange={(e) =>
                      handleWalletChange(index, "percentage", e.target.value)
                    }
                    className="w-20 bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm"
                  />
                  <span className="text-sm">%</span>
                  {distributionData.wallets.length > 1 && (
                    <button
                      onClick={() => removeWallet(index)}
                      className="text-red-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {distributionData.wallets.length < 10 && (
                <button
                  onClick={addWallet}
                  className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                >
                  + Add another wallet
                </button>
              )}
            </div>
          </>
        )}

        <button
          onClick={createToken}
          disabled={!isValid}
          className={`w-full py-3 rounded-md font-semibold transition ${
            isValid
              ? "bg-red-800 hover:bg-red-700 text-white"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          Create Token
        </button>

        <p className="text-sm text-gray-500 text-center mt-4">
          {networkType === "solana"
            ? "Total fees: 0.3 SOL"
            : "Total fees: 0.0001 ETH"}
        </p>
      </div>
    </div>
  );
};

export default TokenDistributionForm;
