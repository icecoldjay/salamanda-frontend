// components/TokenDistributionForm/TokenDistributionForm.js
"use client";
import React, { useState, useEffect } from "react";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useNetwork } from "../../context/networkContext";
import { useEvm } from "../../context/evmContext";
import { HiOutlineChevronLeft } from "react-icons/hi";
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
  const [isTyping, setIsTyping] = useState(false);

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

  // Set default method to "generate" when component mounts
  useEffect(() => {
    if (distributionData.method !== "generate") {
      handleMethodChange("generate");
    }
  }, []);

  useEffect(() => {
    if (isConfirmed && receipt) {
      // Extract token address from logs (implementation depends on your contract)
      const tokenAddress = extractTokenAddressFromReceipt(receipt);

      setCreatedToken((prev) => ({
        ...prev,
        address: tokenAddress,
      }));

      // For manual method, go directly to confirmation after contract success
      if (distributionData.method === "manual") {
        onNext();
      }
    }
  }, [isConfirmed, receipt, distributionData.method]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setCreationError(writeError.message);
      setIsCreating(false);
    }
  }, [writeError]);

  useEffect(() => {
    // Only generate wallets when method is "generate" and not during typing
    if (distributionData.method === "generate" && !isTyping) {
      const wallets = generateWallets(distributionData.walletCount);
      setGeneratedWallets(wallets);
      updateDistributionData({ wallets });
    }
  }, [distributionData.method, distributionData.walletCount, isTyping]);

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

  const handleNextStep = async () => {
    if (distributionData.method === "generate") {
      // For generate method, just go to next step (GenerateWallets component)
      onNext();
    } else {
      // For manual method, create token first, then go to confirmation
      await createToken();
    }
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

      // For Solana, we can directly go to next step since we have the result
      if (networkType === "solana") {
        setCreatedToken(result);
        onNext();
      }
      // For EVM, the useEffect will handle the next step after transaction confirmation
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
    <div className="min-h-screen text-white font-[Archivo]  flex items-center justify-center px-4 mt-6">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#1C1C1C] p-4 rounded-2xl shadow-lg">
        <div className="flex gap-2 items-center mb-4">
          <HiOutlineChevronLeft size={16} />
          <button onClick={onBack} className="text-[14px] text-gray-400">
            Back
          </button>
        </div>

        <h2 className="font-[Archivo] text-[24px] font-[600] leading-[32px] text-[#fff] mb-1">
          Token distribution
        </h2>
        <p className="font-[Archivo] text-[14px] font-[400] leading-[20px] text-[#c7c3c3] mb-6">
          How you want to distribute your token
        </p>

        <div className="mb-6">
          <div className="flex justify-between mb-1 font-[Archivo] text-[14px] font-[400] leading-[20px] text-[#c7c3c3]">
            <span>Liquidity pool</span>
            <span>Initial holders</span>
          </div>
          <div className="flex justify-between mb-2 font-[Archivo] text-[18px] font-[600] leading-[24px] text-[#fff]">
            <span>{distributionData.liquidityPercentage}%</span>
            <span>{100 - distributionData.liquidityPercentage}%</span>
          </div>
          <div className="relative w-full h-2">
            <div className="absolute inset-0 w-full h-full bg-[#190101] rounded-lg"></div>
            <input
              type="range"
              min={0}
              max={100}
              value={distributionData.liquidityPercentage}
              onChange={handleLiquidityChange}
              className="absolute inset-0 w-full h-full appearance-none bg-transparent opacity-100 cursor-pointer z-10"
            />
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #e11919;
                cursor: pointer;
                border: none;
                margin-top: -7px;
              }

              input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #e11919;
                cursor: pointer;
                border: none;
              }

              input[type="range"]::-webkit-slider-runnable-track {
                width: 100%;
                height: 2px;
                background: transparent;
                border-radius: 2px;
              }

              input[type="range"]::-moz-range-track {
                width: 100%;
                height: 2px;
                background: transparent;
                border-radius: 2px;
              }
            `}</style>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-[Archivo] text-[14px] font-[600] leading-[20px] text-[#fff] mb-2">
            Distribution method
          </p>
          <div className="flex gap-2">
            <button
              className={`w-1/2 py-2 rounded-md ${
                distributionData.method === "generate"
                  ? "bg-[#5F0202] text-[#F3B0B0] text-[12px] font-[500]"
                  : "bg-[#141414] text-[#c7c3c3] text-[12px] font-[500]"
              } font-medium border ${
                distributionData.method === "generate"
                  ? "border border-[#C50404]"
                  : "border-[#141414]"
              }`}
              onClick={() => handleMethodChange("generate")}
            >
              Generate wallet
            </button>
            <button
              className={`w-1/2 py-2 rounded-md ${
                distributionData.method === "manual"
                  ? "bg-[#5F0202] text-[#F3B0B0] text-[12px] font-[500]"
                  : "bg-[#141414] text-[#c7c3c3] text-[12px] font-[500]"
              } border ${
                distributionData.method === "manual"
                  ? "border border-[#C50404]"
                  : "border-[#141414]"
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
              <p className="font-[Archivo] text-[14px] font-[400] leading-[20px] text-[#c7c3c3] mb-2">
                Number of wallets
              </p>
              <input
                type="number"
                min="1"
                max="10"
                value={distributionData.walletCount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Set typing flag to prevent wallet generation
                  setIsTyping(true);

                  // Only update state if the value is valid
                  if (
                    value === "" ||
                    (!isNaN(value) && Number(value) >= 1 && Number(value) <= 10)
                  ) {
                    updateDistributionData({ walletCount: value });
                  }
                }}
                onBlur={(e) => {
                  // Final validation on blur
                  let value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) value = 1;
                  if (value > 10) value = 10;

                  // Update the value
                  updateDistributionData({ walletCount: value });

                  // Clear typing flag to allow wallet generation
                  setIsTyping(false);
                }}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm placeholder-gray-500"
              />
            </div>

            <div className="mb-6">
              <p className="font-[Archivo] text-[14px] font-[600] leading-[20px] text-[#fff] mb-2">
                Generated wallets preview
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span className="font-[Archivo] text-[12px] font-[400] leading-[20px] text-[#c7c3c3]">
                    Your wallet
                  </span>
                  <span className="font-[Archivo] text-[12px] font-[500] leading-[20px] text-[#fff]">
                    {distributionData.liquidityPercentage}%
                  </span>
                </li>
                {generatedWallets.map((wallet, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="font-[Archivo] text-[12px] font-[400] leading-[20px] text-[#c7c3c3]">
                      {wallet.address.substring(0, 6)}...
                      {wallet.address.substring(wallet.address.length - 4)}
                    </span>
                    <span className="font-[Archivo] text-[12px] font-[500] leading-[20px] text-[#fff]">
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
              <p className="text-sm font-medium text-white mb-2">
                Wallet addresses
              </p>
              <div className="flex flex-wrap gap-2">
                {distributionData.wallets.map((wallet, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-[#1a1a1a] text-white text-sm rounded-full px-4 py-1.5 max-w-[250px] truncate"
                  >
                    <span className="truncate mr-2">{wallet.address}</span>
                    {distributionData.wallets.length > 1 && (
                      <button
                        onClick={() => removeWallet(index)}
                        className="text-white hover:text-gray-400 ml-auto"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Separate wallets addresses with a comma
              </p>
            </div>
          </>
        )}

        <button
          onClick={handleNextStep}
          disabled={!isValid || isPending || isConfirming}
          className={`w-full py-3 rounded-md font-semibold transition ${
            isValid && !isPending && !isConfirming
              ? "bg-[#2D0101] hover:bg-[#2D0101] text-[#F3B0B0] font-[Archivo] text-[14px] font-[600] leading-[20px]"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isPending || isConfirming
            ? "Processing..."
            : distributionData.method === "generate"
            ? "Next"
            : "Create Token"}
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
