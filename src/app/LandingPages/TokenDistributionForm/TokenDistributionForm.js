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
import { launchManagerAbi } from "../../../constants/launchManagerAbi"; // Import the ABI
import { LAUNCH_MANAGER_ADDRESSES } from "../../../constants/addresses";
import { generateMultipleSolanaWallets } from "../../../utils/solanaWalletUtils"; // Adjust path as needed
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { Transaction } from "@solana/web3.js";

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
  const {
    isConnected: isSolanaConnected,
    publicKey: solanaPublicKey,
    signTransaction,
  } = useSolana();

  const [status, setStatus] = useState("");
  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    pairAddress: null,
    liquidityAmount: null,
    hash: null,
    message: "",
    transactionStep: null,
  });

  const [wallets, setWallets] = useState([]);
  const [generatedWallets, setGeneratedWallets] = useState([]);
  const [isValid, setIsValid] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [ethAmount, setEthAmount] = useState(distributionData.ethAmount); // New state for ETH amount

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

  const isWalletConnected =
    networkType === "solana" ? isSolanaConnected : isEvmConnected;
  const chainId = useChainId();
  const [umi, setUmi] = useState(null);
  const [solanaGeneratedWallets, setSolanaGeneratedWallets] = useState([]);

  // Set default method to "generate" when component mounts
  useEffect(() => {
    if (distributionData.method !== "generate") {
      handleMethodChange("generate");
    }
  }, []);

  useEffect(() => {
    if (networkType === "solana" && isSolanaConnected && solanaPublicKey) {
      const umiInstance = createUmi("https://api.devnet.solana.com");
      umiInstance.use(
        walletAdapterIdentity({
          publicKey: solanaPublicKey,
          signTransaction: signTransaction,
        })
      );
      setUmi(umiInstance);
    } else {
      setUmi(null);
    }
  }, [networkType, isSolanaConnected, solanaPublicKey]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      // Extract token address from logs
      const tokenAddress = extractTokenAddressFromReceipt(receipt);

      setCreatedToken((prev) => ({
        ...prev,
        address: tokenAddress,
        name: tokenData.name,
        symbol: tokenData.symbol,
        supply: tokenData.supply,
        decimals: tokenData.decimals,
        network: chainId,
        transactionHash: hash,
      }));

      // Set isCreating to false after successful creation
      setIsCreating(false);

      // Go to confirmation after contract success
      onNext();
    }
  }, [isConfirmed, receipt, setCreatedToken, tokenData, chainId, hash, onNext]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setCreationError(writeError.message);
      setIsCreating(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (distributionData.method === "generate" && !isTyping) {
      if (networkType === "solana") {
        const wallets = generateMultipleSolanaWallets(
          distributionData.walletCount
        );
        setSolanaGeneratedWallets(wallets);
        updateDistributionData({ wallets });
      } else {
        const wallets = generateWallets(distributionData.walletCount);
        setGeneratedWallets(wallets);
        updateDistributionData({ wallets });
      }
    }
  }, [
    distributionData.method,
    distributionData.walletCount,
    isTyping,
    networkType,
  ]);

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
    const eventTopic =
      "0xd5f9bdf12adf29dab0248c349842c3822d53ae2bb4f36352f301630d018c8139";
    const eventLog = receipt.logs.find((log) => log.topics[0] === eventTopic);

    if (eventLog) {
      return `0x${eventLog.data.substring(26, 66)}`;
    }
    return null;
  };

  const createTokenWithMetadata = async () => {
    if (!umi) {
      setStatus("Wallet not connected or UMI not initialized");
      return null;
    }

    try {
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Creating token...",
        transactionStep: "creating-token",
      }));

      setStatus("Requesting token creation transaction from backend...");

      const response = await fetch(
        "http://localhost:5000/createTokenWithMetadata",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tokenData.name,
            symbol: tokenData.symbol,
            uri: "https://example.com/metadata.json",
            amount: tokenData.supply * 10 ** tokenData.decimals,
            decimals: tokenData.decimals,
            revokeMintAuthority: tokenData.revokeMint,
            revokeFreezeAuthority: tokenData.revokeFreeze,
            recipientAddress: solanaPublicKey.toString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get transaction from backend");
      }

      const { transactionForSign, mint } = await response.json();
      console.log("Token creation transaction:", transactionForSign);

      if (!transactionForSign) {
        setStatus("No transaction returned from backend");
        setTxStatus((prev) => ({
          ...prev,
          loading: false,
          message: "No transaction returned",
          transactionStep: null,
        }));
        return null;
      }

      // Deserialize the transaction using UMI
      const txBytes = base64.serialize(transactionForSign);
      const recoveredTx = umi.transactions.deserialize(txBytes);

      setStatus("Signing token creation transaction...");
      // Sign transaction using umi.identity which uses wallet adapter signer
      const signedTx = await umi.identity.signTransaction(recoveredTx);

      setStatus("Sending token creation transaction...");
      const signature = await umi.rpc.sendTransaction(signedTx);

      setStatus(`Token created! Signature: ${signature}, Mint: ${mint}`);
      console.log("Token creation successful:", { signature, mint });

      setTxStatus((prev) => ({
        ...prev,
        loading: false,
        message: "Token created successfully",
        transactionStep: "token-created",
        hash: signature,
      }));

      return { signature, mint };
    } catch (error) {
      console.error("Token creation error:", error);
      setStatus(`Token creation failed: ${error.message}`);
      setTxStatus({
        loading: false,
        error: error.message || "Failed to create token",
        success: false,
        transactionStep: null,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      });
      return null;
    }
  };

  // Function to execute bundle allocation and LP creation
  const executeBundleAllocationAndLP = async (mintAddress) => {
    if (!solanaPublicKey) {
      setStatus("Connect your wallet first");
      return null;
    }

    try {
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Preparing bundle allocation and liquidity pool...",
        transactionStep: "preparing-bundle",
      }));

      // Calculate percentages like in the EVM function
      const liquidityPercentage =
        Number(distributionData.liquidityPercentage) / 100;
      const initialHoldersPercentage =
        (100 - distributionData.liquidityPercentage) / 100;

      // Calculate total amounts (assuming you have totalSupply available)
      const totalSupply = parseFloat(tokenData.supply);
      const liquidityAmount = totalSupply * liquidityPercentage;
      const initialHoldersAmount = totalSupply * initialHoldersPercentage;

      // Calculate wallet allocation array
      let walletAllocation = [];
      let walletArray = [];

      if (distributionData.method === "manual") {
        const validWallets = distributionData.wallets.filter(
          (wallet) =>
            wallet.address &&
            wallet.address.length >= 32 && // Solana address validation
            wallet.address.length <= 44
        );

        if (validWallets.length === 0) {
          throw new Error("Please add at least one valid wallet address");
        }

        validWallets.forEach((wallet) => {
          const percentage = Number(wallet.percentage) / 100;
          const amount = initialHoldersAmount * percentage;
          walletArray.push(wallet.address);
          walletAllocation.push(amount);
        });
      } else if (distributionData.method === "generate") {
        // Handle generate distribution method
        const generatedWallets = distributionData.generatedWallets || []; // Adjust based on your data structure

        if (generatedWallets.length === 0) {
          throw new Error("No generated wallets found for distribution");
        }

        // Split evenly among generated wallets
        const amountPerWallet = initialHoldersAmount / generatedWallets.length;

        generatedWallets.forEach((walletAddress) => {
          walletArray.push(walletAddress);
          walletAllocation.push(amountPerWallet);
        });
      }

      // Pool allocation with token amount for liquidity
      const poolAllocation = [liquidityAmount, Number(ethAmount)]; // Assuming you have solAmount available

      const response = await fetch(
        "http://localhost:5000/bundleAllocationAndLP",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mintAddress: mintAddress,
            walletAllocation: walletAllocation,
            poolAllocation: poolAllocation,
            walletArray: walletArray,
            owner: solanaPublicKey,
          }),
        }
      );

      const { instruct, extInfo } = await response.json();
      console.log("Bundle transaction instruction:", instruct);
      console.log("Bundle extended info:", extInfo);

      if (!instruct) {
        setStatus("No bundle transaction returned");
        setTxStatus((prev) => ({
          ...prev,
          loading: false,
          message: "No bundle transaction returned",
          transactionStep: null,
        }));
        return null;
      }

      const recoveredTx = Transaction.from(Buffer.from(instruct, "base64"));
      setStatus("Signing bundle transaction...");

      const signature = await sendTransaction(recoveredTx);

      if (!signature) {
        setStatus("Bundle transaction failed");
        setTxStatus((prev) => ({
          ...prev,
          loading: false,
          message: "Bundle transaction failed",
          transactionStep: null,
        }));
        return null;
      }

      console.log("Bundle transaction signature:", signature);
      setTxStatus({
        loading: false,
        error: null,
        success: true,
        pairAddress: null,
        liquidityAmount: null,
        hash: signature.signature,
        message: "Bundle allocation and LP creation successful",
      });

      setStatus(`Bundle transaction sent! Signature: ${signature}`);
      console.log("Bundle extInfo:", extInfo);

      return { signature, extInfo };
    } catch (error) {
      console.error("Bundle transaction error:", error);
      setTxStatus({
        loading: false,
        error: error.message || "Failed to execute bundle",
        success: false,
        transactionStep: null,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      });
      return null;
    }
  };

  const handleSolanaLaunch = async () => {
    if (!solanaPublicKey || !umi) {
      setCreationError("Connect your Solana wallet first");
      return;
    }

    try {
      setIsCreating(true);
      setCreationError(null);

      // Step 1: Create token
      const tokenResult = await createTokenWithMetadata();
      if (!tokenResult || !tokenResult.mint) {
        throw new Error("Token creation failed");
      }

      // Wait for 5-10 seconds to allow proper indexing
      await new Promise((resolve) => setTimeout(resolve, 8000)); // 8 second delay

      // Step 2: Execute bundle allocation and LP creation
      const bundleResult = await executeBundleAllocationAndLP(tokenResult.mint);
      if (!bundleResult) {
        throw new Error("Bundle execution failed");
      }

      setCreatedToken({
        address: tokenResult.mint,
        name: tokenData.name,
        symbol: tokenData.symbol,
        supply: tokenData.supply,
        decimals: tokenData.decimals,
        network: "solana",
        transactionHash: tokenResult.signature,
      });

      setIsCreating(false);
      onNext();
    } catch (error) {
      console.error("Solana launch failed:", error);
      setCreationError(error.message);
      setIsCreating(false);
    }
  };

  const instantLaunchWithEth = async () => {
    try {
      setIsCreating(true);
      setCreationError(null);

      if (!isEvmConnected) {
        throw new Error("Please connect your EVM wallet first");
      }

      if (!chainId || !LAUNCH_MANAGER_ADDRESSES[chainId]) {
        throw new Error("Unsupported network for token creation");
      }

      // Store ETH amount in context for reference
      updateDistributionData({ ethAmount: ethAmount });

      const decimals = parseInt(tokenData.decimals || "18");
      const parsedSupply = parseUnits(tokenData.supply, decimals);

      // Calculate amounts
      const liquidityPercentage =
        Number(distributionData.liquidityPercentage) / 100;
      const initialHoldersPercentage =
        (100 - distributionData.liquidityPercentage) / 100;

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

      if (distributionData.method === "manual") {
        const validWallets = distributionData.wallets.filter(
          (wallet) =>
            wallet.address &&
            wallet.address.startsWith("0x") &&
            wallet.address.length === 42
        );

        if (validWallets.length === 0) {
          throw new Error("Please add at least one valid wallet address");
        }

        validWallets.forEach((wallet) => {
          const percentage = Number(wallet.percentage) / 100;
          const amount =
            (BigInt(initialHoldersAmount) *
              BigInt(Math.floor(percentage * 100))) /
            BigInt(100);
          initialHolders.push(wallet.address);
          initialAmounts.push(amount);
        });
      } else if (distributionData.method === "generate") {
        const generatedWallets = distributionData.wallets || []; // or however you access them

        if (generatedWallets.length === 0) {
          throw new Error("No generated wallets found for distribution");
        }

        // Split the initialHoldersAmount evenly among all generated wallets
        const amountPerWallet =
          BigInt(initialHoldersAmount) / BigInt(generatedWallets.length);

        generatedWallets.forEach((walletAddress) => {
          initialHolders.push(walletAddress);
          initialAmounts.push(amountPerWallet);
        });
      }

      const launchFee = parseUnits("0.0001", 18); // Launch manager fee
      const ethAmountParsed = parseUnits(ethAmount, 18);
      const creationFee = parseUnits("0.0001", 18);
      const totalValue = launchFee + ethAmountParsed + creationFee;

      // Token parameters
      const tokenParams = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: decimals,
        totalSupply: parsedSupply,
        initialHolders,
        initialAmounts,
        enableAntiBot: false,
      };

      // ETH pair parameters
      const ethParams = {
        tokenAmount: liquidityAmount,
        ethAmount: ethAmountParsed,
        tokenAmountMin: (liquidityAmount * BigInt(95)) / BigInt(100), // 5% slippage
        ethAmountMin: (ethAmountParsed * BigInt(95)) / BigInt(100), // 5% slippage
        lockDuration: 86400 * 30, // 30 days
      };

      writeContract({
        address: LAUNCH_MANAGER_ADDRESSES[chainId],
        abi: launchManagerAbi,
        functionName: "instantLaunchWithEth",
        args: [tokenParams, ethParams],
        value: totalValue,
      });
    } catch (error) {
      console.error("Instant launch failed:", error);
      setCreationError(error.message);
      setIsCreating(false);
    }
  };

  const handleNextStep = async () => {
    if (distributionData.method === "generate") {
      onNext(); // Go to GenerateWallets component
    } else {
      // Chain-specific launch logic
      if (networkType === "solana" && isSolanaConnected) {
        console.log("initiating launch");
        await handleSolanaLaunch();
      } else if (networkType === "evm" && isEvmConnected) {
        console.log("initiating launch");
        await instantLaunchWithEth();
      } else {
        console.log("Please connect your wallet first");
      }
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

        {/* ETH Amount Input */}
        <div className="mb-6">
          <p className="font-[Archivo] text-[14px] font-[400] leading-[20px] text-[#c7c3c3] mb-2">
            ETH Amount for Liquidity
          </p>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm placeholder-gray-500"
            placeholder="0.1"
          />
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
                  setIsTyping(true);

                  if (
                    value === "" ||
                    (!isNaN(value) && Number(value) >= 1 && Number(value) <= 10)
                  ) {
                    updateDistributionData({ walletCount: value });
                  }
                }}
                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) value = 1;
                  if (value > 10) value = 10;

                  updateDistributionData({ walletCount: value });
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
                {(networkType === "solana"
                  ? solanaGeneratedWallets
                  : generatedWallets
                ).map((wallet, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="font-[Archivo] text-[12px] font-[400] leading-[20px] text-[#c7c3c3]">
                      {networkType === "solana"
                        ? wallet.publicKey
                        : wallet.address}
                      {networkType === "solana"
                        ? `${wallet.publicKey.substring(
                            0,
                            6
                          )}...${wallet.publicKey.substring(
                            wallet.publicKey.length - 4
                          )}`
                        : `${wallet.address.substring(
                            0,
                            6
                          )}...${wallet.address.substring(
                            wallet.address.length - 4
                          )}`}
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

              {/* Individual wallet input fields */}
              <div className="space-y-3 mb-4">
                {distributionData.wallets.map((wallet, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={wallet.address}
                        onChange={(e) =>
                          handleWalletChange(index, "address", e.target.value)
                        }
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-4 py-2 text-sm placeholder-gray-500 text-white"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="%"
                        min="0"
                        max="100"
                        value={wallet.percentage}
                        onChange={(e) =>
                          handleWalletChange(
                            index,
                            "percentage",
                            e.target.value
                          )
                        }
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-2 py-2 text-sm placeholder-gray-500 text-white text-center"
                      />
                    </div>
                    {distributionData.wallets.length > 1 && (
                      <button
                        onClick={() => removeWallet(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Remove wallet"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add wallet button */}
              {distributionData.wallets.length < 10 && (
                <button
                  onClick={addWallet}
                  className="w-full py-2 border border-dashed border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-gray-400 transition-colors text-sm"
                >
                  + Add Wallet
                </button>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Enter wallet addresses and their percentage allocation. Total
                must equal 100%.
              </p>
            </div>
          </>
        )}

        <button
          onClick={handleNextStep}
          disabled={!isValid || isPending || isConfirming || !isWalletConnected}
          className={`w-full py-3 rounded-md font-semibold transition ${
            isValid && !isPending && !isConfirming && isWalletConnected
              ? "bg-[#2D0101] hover:bg-[#2D0101] text-[#F3B0B0] font-[Archivo] text-[14px] font-[600] leading-[20px]"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isPending || isConfirming
            ? "Processing..."
            : distributionData.method === "generate"
            ? "Next"
            : "Launch Token"}
        </button>

        <p className="text-sm text-gray-500 text-center mt-4">
          Total fees: {Number(ethAmount) + 0.0001} ETH
        </p>
      </div>
    </div>
  );
};

export default TokenDistributionForm;
