"use client";
import React, { useState, useEffect } from "react";
import { HiOutlineChevronLeft } from "react-icons/hi";
import { IoCopy } from "react-icons/io5";
import Warning from "../../images/Warning.png";
import { HiDownload } from "react-icons/hi";
import { IoMdInformationCircle } from "react-icons/io";
import SeedPhraseModal from "../SeedPhraseModal/SeedPhraseModal";
import Image from "next/image";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { downloadWalletInfo } from "../../../utils/evmWalletUtils";
import {
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { getMint } from "@solana/spl-token";
import { fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { parseUnits } from "ethers";
import { launchManagerAbi } from "../../../constants/launchManagerAbi"; // Import the ABI
import { LAUNCH_MANAGER_ADDRESSES } from "../../../constants/addresses";
import { useEvm } from "../../context/evmContext";
import { useSolana } from "../../context/solanaContext";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { base64 } from "@metaplex-foundation/umi/serializers";
import {
  Transaction,
  Connection,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

const GenerateWallets = ({ onBack, onNext, networkType }) => {
  const {
    tokenData,
    distributionData,
    setCreationError,
    setIsCreating,
    setCreatedToken,
  } = useTokenCreation();
  const {
    isConnected: isSolanaConnected,
    publicKey: solanaPublicKey,
    signTransaction,
    sendTransaction,
  } = useSolana();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const { isConnected: isEvmConnected, address: evmAddress } = useEvm();
  const [umi, setUmi] = useState(null);
  const [status, setStatus] = useState("");
  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    transactionStep: null,
    hash: null,
    message: "",
  });

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
  const chainId = useChainId();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const isWalletConnected =
    networkType === "solana" ? isSolanaConnected : isEvmConnected;
  const isProcessing =
    networkType === "solana" ? txStatus.loading : isPending || isConfirming;

  // Get actual wallets from context
  const wallets = distributionData.wallets || [];

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
  }, [networkType, isSolanaConnected, solanaPublicKey, signTransaction]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      // Extract token address from logs
      const tokenAddress = extractTokenAddressFromReceipt(receipt);

      setCreatedToken((prev) => ({
        ...prev,
        address: tokenAddress,
      }));

      // Go to confirmation after contract success
      onNext();
    }
  }, [isConfirmed, receipt]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error("Write contract error:", writeError);
      setCreationError(writeError.message || "Transaction failed");
      setIsCreating(false);
    }
  }, [writeError, setCreationError, setIsCreating]);

  const handleInstantLaunch = async () => {
    try {
      console.log("🚀 Starting instant launch...");
      setIsCreating(true);
      setCreationError(null);

      // Check EVM connection
      if (!isEvmConnected) {
        console.error("❌ EVM wallet not connected");
        throw new Error("Please connect your EVM wallet first");
      }
      console.log("✅ EVM wallet connected:", evmAddress);

      // Check chain ID
      if (!chainId || !LAUNCH_MANAGER_ADDRESSES[chainId]) {
        console.error("❌ Unsupported network. ChainId:", chainId);
        console.log("Available addresses:", LAUNCH_MANAGER_ADDRESSES);
        throw new Error("Unsupported network for token creation");
      }
      console.log("✅ Chain ID supported:", chainId);
      console.log("Launch Manager Address:", LAUNCH_MANAGER_ADDRESSES[chainId]);

      // Parse token data
      const decimals = parseInt(tokenData.decimals || "18");
      const parsedSupply = parseUnits(tokenData.supply, decimals);
      console.log("📊 Token Data:", {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals,
        supply: tokenData.supply,
        parsedSupply: parsedSupply.toString(),
      });

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

      console.log("💰 Distribution:", {
        liquidityPercentage,
        initialHoldersPercentage,
        liquidityAmount: liquidityAmount.toString(),
        initialHoldersAmount: initialHoldersAmount.toString(),
      });

      // Prepare initial holders
      let initialHolders = [];
      let initialAmounts = [];

      if (wallets.length > 0) {
        const amountPerWallet = initialHoldersAmount / BigInt(wallets.length);
        wallets.forEach((wallet) => {
          initialHolders.push(wallet.address);
          initialAmounts.push(amountPerWallet);
        });
      }

      console.log("👥 Initial Holders:", {
        count: initialHolders.length,
        addresses: initialHolders,
        amounts: initialAmounts.map((a) => a.toString()),
      });

      // Calculate fees and total value
      const ethAmount = distributionData.ethAmount;
      const launchFee = parseUnits("0.0001", 18);
      const creationFee = parseUnits("0.0001", 18);
      const ethAmountParsed = parseUnits(ethAmount, 18);
      const totalValue = launchFee + ethAmountParsed + creationFee;

      console.log("💸 Fee Calculation:", {
        ethAmount,
        launchFee: launchFee.toString(),
        creationFee: creationFee.toString(),
        ethAmountParsed: ethAmountParsed.toString(),
        totalValue: totalValue.toString(),
        totalValueEth: (Number(totalValue) / 1e18).toFixed(6) + " ETH",
      });

      // Prepare contract parameters
      const tokenParams = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: decimals,
        totalSupply: parsedSupply,
        initialHolders,
        initialAmounts,
        enableAntiBot: false,
      };

      const ethParams = {
        tokenAmount: liquidityAmount,
        ethAmount: ethAmountParsed,
        tokenAmountMin: (liquidityAmount * BigInt(95)) / BigInt(100),
        ethAmountMin: (ethAmountParsed * BigInt(95)) / BigInt(100),
        lockDuration: 86400 * 30,
      };

      console.log("📋 Contract Parameters:", {
        tokenParams: {
          ...tokenParams,
          totalSupply: tokenParams.totalSupply.toString(),
          initialAmounts: tokenParams.initialAmounts.map((a) => a.toString()),
        },
        ethParams: {
          ...ethParams,
          tokenAmount: ethParams.tokenAmount.toString(),
          ethAmount: ethParams.ethAmount.toString(),
          tokenAmountMin: ethParams.tokenAmountMin.toString(),
          ethAmountMin: ethParams.ethAmountMin.toString(),
        },
      });

      console.log("📞 Calling writeContract...");

      // The actual contract call
      const result = writeContract({
        address: LAUNCH_MANAGER_ADDRESSES[chainId],
        abi: launchManagerAbi,
        functionName: "instantLaunchWithEth",
        args: [tokenParams, ethParams],
        value: totalValue,
      });

      console.log("📞 WriteContract result:", result);
    } catch (error) {
      console.error("💥 Instant launch failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
      setCreationError(error.message);
      setIsCreating(false);
    }
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
        "https://api.salamanda.xyz/createTokenWithMetadata",
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

      const ethAmount = distributionData.ethAmount;

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
        const generatedWallets = distributionData.wallets || []; // Adjust based on your data structure

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
        "https://api.salamanda.xyz/bundleAllocationAndLP",
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

  const verifyTokenExists = async (
    mintAddress,
    maxRetries = 10,
    delayMs = 2000
  ) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Token verification attempt ${attempt}/${maxRetries} for mint: ${mintAddress}`
        );

        const MINT = new PublicKey(mintAddress);
        const connection = new Connection(clusterApiUrl("devnet")); // or "mainnet-beta" for mainnet

        // Try to get mint info to verify token exists
        const mintInfo = await getMint(connection, MINT);

        if (mintInfo) {
          console.log("Token verified successfully:", {
            mint: mintAddress,
            decimals: mintInfo.decimals,
            supply: mintInfo.supply.toString(),
          });

          // Also try to fetch metadata to ensure it's fully indexed
          try {
            const metadata = await fetchMetadataFromSeeds(umi, {
              mint: umiPublicKey(mintAddress),
            });
            console.log("Metadata verified:", {
              name: metadata.name,
              symbol: metadata.symbol,
            });
          } catch (metadataError) {
            console.warn(
              "Metadata not yet available, but mint exists:",
              metadataError
            );
            // Continue anyway as mint exists
          }

          return true;
        }
      } catch (error) {
        console.log(
          `Token verification attempt ${attempt} failed:`,
          error.message
        );

        if (attempt === maxRetries) {
          throw new Error(
            `Token not found after ${maxRetries} attempts: ${error.message}`
          );
        }

        // Wait before next attempt
        console.log(`Waiting ${delayMs}ms before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        // Increase delay for subsequent attempts (exponential backoff)
        delayMs = Math.min(delayMs * 1.2, 10000); // Cap at 10 seconds
      }
    }

    return false;
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
      setStatus("Creating token...");
      const tokenResult = await createTokenWithMetadata();
      if (!tokenResult || !tokenResult.mint) {
        throw new Error("Token creation failed");
      }

      console.log("Token created, mint address:", tokenResult.mint);

      // Step 2: Wait and verify token is properly indexed
      setStatus("Verifying token is indexed on-chain...");
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Waiting for token to be indexed...",
        transactionStep: "verifying-token",
      }));

      try {
        await verifyTokenExists(tokenResult.mint);
        setStatus("Token verified successfully!");
      } catch (verificationError) {
        console.error("Token verification failed:", verificationError);
        throw new Error(
          `Token verification failed: ${verificationError.message}`
        );
      }

      // Step 3: Execute bundle allocation and LP creation
      setStatus("Proceeding with bundle allocation and LP creation...");
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

      // Reset transaction status on error
      setTxStatus({
        loading: false,
        error: error.message || "Solana launch failed",
        success: false,
        transactionStep: null,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      });
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

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleDownloadWalletInfo = () => {
    if (wallets.length > 0) {
      downloadWalletInfo(wallets);
    }
  };

  const handleButtonClick = () => {
    if (networkType === "solana" && isSolanaConnected) {
      handleSolanaLaunch();
    } else if (networkType === "evm" && isEvmConnected) {
      handleInstantLaunch();
    } else {
      console.log("Please connect your wallet first");
    }
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <div>
      <div className="min-h-screen text-white font-[Archivo] flex items-center justify-center px-4 mt-6">
        <div className="w-full max-w-xl bg-[#0A0A0A] border border-[#1C1C1C] p-4 rounded-2xl shadow-lg">
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineChevronLeft size={16} />
            <button onClick={onBack} className="text-[14px] text-gray-400">
              Back
            </button>
          </div>

          {/* Header */}
          <div className="mb-4">
            <Image src={Warning} width={64} alt="warning" />
            <div className="flex items-center gap-2 text-[#F3B0B0]">
              <h2 className="text-[20px] font-semibold leading-[28px]">
                Your generated wallets
              </h2>
            </div>
            <p className="text-[14px] text-[#c7c3c3] mt-1">
              See the details of the wallets we have generated for you
            </p>
          </div>

          {/* Notice */}
          <div className="bg-[#1a0000] flex justify-between gap-2 border border-[#C50404] rounded-md p-4 mb-6">
            <IoMdInformationCircle size={20} style={{ color: "#EA5757" }} />
            <div>
              <p className="text-[#F3B0B0] text-sm font-semibold mb-1">
                Important notice
              </p>
              <p className="text-[#c7c3c3] text-sm">
                Please ensure you have securely saved all your wallet details
                before proceeding to the next step.
              </p>
            </div>
          </div>

          {/* Wallet List */}
          {wallets.length > 0 ? (
            wallets.map((wallet, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 mb-2"
              >
                <div className="text-[14px] text-white">
                  <span className="text-[#c7c3c3] text-[14px] font-[600]">
                    Wallet {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">
                      {truncateAddress(
                        networkType === "solana"
                          ? wallet.publicKey
                          : wallet.address
                      )}
                    </span>
                    <button
                      className={`text-gray-400 hover:text-white ${
                        copiedIndex === idx ? "text-green-400" : ""
                      }`}
                      title="Copy address"
                      onClick={() =>
                        copyToClipboard(
                          networkType === "solana"
                            ? wallet.publicKey
                            : wallet.address,
                          idx
                        )
                      }
                    >
                      <IoCopy />
                    </button>
                    {copiedIndex === idx && (
                      <span className="text-xs text-green-400">Copied!</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedWallet({
                      ...wallet,
                      name: `Wallet ${idx + 1}`,
                      seedPhrase: wallet.mnemonic
                        ? wallet.mnemonic.split(" ")
                        : [],
                    });
                    setIsModalOpen(true);
                  }}
                  className="bg-[#5F0202] hover:bg-[#7a0202] text-[#F3B0B0] text-[12px] font-[500] py-1.5 px-3 rounded-md border border-[#C50404]"
                >
                  Open seed phrase
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-[#c7c3c3] text-sm">
                No wallets generated yet.
              </p>
            </div>
          )}

          <SeedPhraseModal
            isOpen={isModalOpen}
            walletName={selectedWallet?.name}
            seedPhrase={isEvmConnected && selectedWallet?.seedPhrase}
            walletAddress={
              isEvmConnected
                ? selectedWallet?.address
                : selectedWallet?.publicKey
            }
            onClose={() => setIsModalOpen(false)}
          />

          {/* Download Info */}
          <div className="my-6">
            <button
              onClick={handleDownloadWalletInfo}
              disabled={wallets.length === 0}
              className={`w-1/2 flex items-center justify-left gap-4 font-[600] text-[14px] text-white border border-gray-700 rounded-md px-3 py-3 text-sm ${
                wallets.length > 0
                  ? "bg-[#141414] hover:bg-[#1a1a1a] cursor-pointer"
                  : "bg-gray-800 cursor-not-allowed opacity-50"
              }`}
            >
              <HiDownload size={20} />
              <span>Download wallet information</span>
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={handleButtonClick}
            disabled={
              wallets.length === 0 || isProcessing || !isWalletConnected
            }
            className={`w-full py-3 rounded-md font-semibold transition ${
              wallets.length > 0 && !isPending && !isConfirming
                ? "bg-[#2D0101] hover:bg-[#3a0101] text-[#F3B0B0] text-[14px] font-[600] leading-[20px] font-[Archivo]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isPending || isConfirming ? "Processing..." : "Launch Token"}
          </button>

          {/* Fee Info */}
          <p className="text-sm text-gray-500 text-center mt-4">
            Total fees: {networkType === "solana" ? "0.3 SOL" : "0.0001 ETH"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerateWallets;
