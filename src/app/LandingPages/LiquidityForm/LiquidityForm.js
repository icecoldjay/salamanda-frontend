"use client";
import { useState, useEffect } from "react";
import { useNetwork } from "../../context/networkContext";
import { useEvm } from "../../context/evmContext";
import { useSolana } from "../../context/solanaContext";
import { fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
const umi = createUmi('https://api.devnet.solana.com');
import { Buffer } from "buffer";
import { getAccount, getMint, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import Image from "next/image";
import { ethers, toBigInt } from "ethers";
import coinLogo from "../../images/bnb.png";
import { RPC_URLS } from "../../../constants/rpcUrls";
import { liquidityManagerAbi } from "../../../constants/liquidityManagerAbi";
import { LIQUIDITY_MANAGER_ADDRESSES } from "../../../constants/addresses";
import { Transaction, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const CHAIN_TYPES = {
  EVM: "evm",
  SOLANA: "solana",
};

// Token ABI for fetching token details and balance
const tokenAbi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
];

export default function LiquidityForm() {
  const { selectedNetwork } = useNetwork();
  const { address: evmAddress, isConnected: isEvmConnected } = useEvm();
  const { publicKey, isConnected, signTransaction, sendTransaction } =
    useSolana();

  console.log(isConnected);
  // Wagmi hooks for contract interaction
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: txReceipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: evmAddress,
    enabled: isEvmConnected,
  });

  // Get the active chain type based on selected network
  const activeChain = selectedNetwork.type;
  const isWalletConnected =
    activeChain === CHAIN_TYPES.EVM ? isEvmConnected : isConnected;

  console.log("Wallet Debug:", {
    activeChain,
    isEvmConnected,
    isConnected,
    isWalletConnected,
    evmAddress,
    publicKey: publicKey,
    selectedNetworkType: selectedNetwork.type,
  });

  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("5");
  const [lockDuration, setLockDuration] = useState("0");
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  const [tokenDetails, setTokenDetails] = useState({
    decimals: 18,
    symbol: "",
    name: "",
    balance: "0",
    loaded: false,
    loading: false,
  });

  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    hash: null,
    message: "",
    pairAddress: null,
    liquidityAmount: null,
    transactionStep: null,
  });

  // Reset form when chain changes
  useEffect(() => {
    setTokenAddress("");
    setTokenAmount("");
    setEthAmount("");
    setSlippageTolerance("5");
    setLockDuration("0");
    setTokenDetails({
      decimals: 18,
      symbol: "",
      name: "",
      balance: "0",
      loaded: false,
      loading: false,
    });
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      hash: null,
      message: "",
      pairAddress: null,
      liquidityAmount: null,
      transactionStep: null,
    });
    resetWrite();
  }, [activeChain, resetWrite]);

  // Handle transaction status updates
  useEffect(() => {
    if (isPending) {
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Transaction pending...",
        transactionStep: "pending",
      }));
    }

    if (isConfirming) {
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Confirming transaction...",
        transactionStep: "confirming",
        hash: txHash,
      }));
    }

    if (isConfirmed && txReceipt) {
      setTxStatus((prev) => ({
        ...prev,
        loading: false,
        success: true,
        message: "Liquidity added successfully!",
        transactionStep: "confirmed",
        hash: txHash,
        // You might want to extract these from transaction logs
        pairAddress:
          "0x" +
          Array(40)
            .fill(0)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join(""),
        liquidityAmount: "1000.000000",
      }));
    }

    if (writeError) {
      setTxStatus((prev) => ({
        ...prev,
        loading: false,
        error: writeError.message || "Transaction failed",
        transactionStep: null,
      }));
    }
  }, [isPending, isConfirming, isConfirmed, txReceipt, txHash, writeError]);

  // Fetch token details when address changes
  useEffect(() => {
    if (tokenAddress && ethers.isAddress(tokenAddress) && isEvmConnected) {
      fetchTokenDetails(tokenAddress);
    } else {
      setTokenDetails({
        decimals: 181,
        symbol: "",
        name: "",
        balance: "0",
        loaded: false,
        loading: false,
      });
    }
  }, [tokenAddress, isEvmConnected, evmAddress]);

  //solana fetch token details
  useEffect(() => {
    if (activeChain === CHAIN_TYPES.SOLANA && isConnected) {
      getTokenBalanceSpl(tokenAddress, publicKey);
    } else {
      setTokenDetails({
        decimals: 9,
        symbol: "",
        name: "",
        balance: "0",
        loaded: false,
        loading: false,
      });
    }
  }, [isConnected, tokenAddress, publicKey]);


  //solana process

  // get ATA


  const getTokenBalanceSpl = async (mintaddress, mypublicKey) => {
    try {
      const WALLET = new PublicKey(mypublicKey) // e.g., E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk
      const MINT = new PublicKey(mintaddress);    // e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

      const [address] = PublicKey.findProgramAddressSync(
        [WALLET.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tokenAccount = address;
      const connection = new Connection(clusterApiUrl('devnet'));

      const info = await getAccount(connection, tokenAccount);
      const amount = Number(info.amount);
      const mint = await getMint(connection, info.mint);
      const balance = amount / (10 ** mint.decimals);
      //console.log('Balance:', balance, "mint:", info);

      const metadata = await fetchMetadataFromSeeds(umi, {
        mint: umiPublicKey(mintaddress),
      });

      console.log(metadata.name);   // MyToken
      console.log(metadata.symbol); // MTK
      console.log(balance)

      setTokenDetails({
        decimals: Number(mint.decimals),
        symbol: metadata.symbol,
        name: metadata.name,
        balance: balance,
        loaded: true,
        loading: false,
      });
      setTxStatus((prev) => ({
        ...prev,
        error: null,
      }));
      return { balance, name: metadata.name, symbol: metadata.symbol };

    } catch (error) {
      console.log(error);
      setTokenDetails({
        decimals: 18,
        symbol: "TOKEN",
        name: "Unknown Token",
        balance: "0",
        loaded: true,
        loading: false,
      });
      setTxStatus((prev) => ({
        ...prev,
        error: `Could not fetch token details: ${error.message}`,
      }));
    }
  }


  const fetchTokenDetails = async (address) => {
    try {
      setTokenDetails((prev) => ({ ...prev, loading: true, loaded: false }));

      // Get RPC URL for current network
      const rpcUrl = RPC_URLS[selectedNetwork.chainId];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.ready;

      const tokenContract = new ethers.Contract(address, tokenAbi, provider);

      // Check if contract exists
      const code = await provider.getCode(address);
      if (code === "0x") {
        throw new Error("No contract found at this address");
      }

      const [decimals, symbol, name, balance] = await Promise.all([
        tokenContract.decimals().catch(() => 18),
        tokenContract.symbol().catch(() => "TOKEN"),
        tokenContract.name().catch(() => "Unknown Token"),
        tokenContract.balanceOf(evmAddress).catch(() => 0n),
      ]);

      setTokenDetails({
        decimals: Number(decimals),
        symbol: symbol,
        name: name,
        balance: ethers.formatUnits(balance, decimals),
        loaded: true,
        loading: false,
      });

      console.log("Token details loaded:", {
        decimals,
        symbol,
        name,
        balance: balance.toString(),
      });
    } catch (error) {
      console.error("Error fetching token details:", error);
      setTokenDetails({
        decimals: 18,
        symbol: "TOKEN",
        name: "Unknown Token",
        balance: "0",
        loaded: true,
        loading: false,
      });
      setTxStatus((prev) => ({
        ...prev,
        error: `Could not fetch token details: ${error.message}`,
      }));
    }
  };

  // Remove percentage handlers - inputs are for exact amounts only

  const validateInputs = () => {
    if (!isEvmConnected) {
      throw new Error("Please connect your wallet first");
    }

    if (!tokenAddress) {
      throw new Error("Please enter a token address");
    }

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    if (!tokenDetails.loaded) {
      throw new Error("Token details are still loading");
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      throw new Error("Please enter a positive token amount");
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      throw new Error("Please enter a positive ETH amount");
    }

    if (
      parseFloat(slippageTolerance) < 0 ||
      parseFloat(slippageTolerance) > 100
    ) {
      throw new Error("Slippage tolerance must be between 0 and 100");
    }

    if (parseFloat(lockDuration) < 0) {
      throw new Error("Lock duration cannot be negative");
    }

    // Check if user has enough balance
    if (parseFloat(tokenAmount) > parseFloat(tokenDetails.balance)) {
      throw new Error(
        `Insufficient token balance. Available: ${tokenDetails.balance} ${tokenDetails.symbol}`
      );
    }

    if (
      ethBalance &&
      parseFloat(ethAmount) > parseFloat(ethers.formatEther(ethBalance.value))
    ) {
      throw new Error(
        `Insufficient ETH balance. Available: ${ethers.formatEther(
          ethBalance.value
        )} ETH`
      );
    }
  };

  const addLiquidity = async () => {
    try {
      // Reset error status
      setTxStatus((prev) => ({
        ...prev,
        error: null,
        message: "Validating inputs...",
        transactionStep: null,
        success: false,
      }));

      // Validate all inputs
      validateInputs();

      // Calculate min amounts based on slippage tolerance
      const slippagePercent = parseFloat(slippageTolerance) || 5;
      const slippageFactor = (100 - slippagePercent) / 100;

      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Preparing to add liquidity...",
        transactionStep: "preparing",
      }));

      // ETH + Token liquidity
      const tokenAmountBig = ethers.parseUnits(
        tokenAmount,
        tokenDetails.decimals
      );
      const ethAmountBig = ethers.parseEther(ethAmount);

      // Calculate min amounts
      const tokenAmountMin =
        (tokenAmountBig * toBigInt(Math.floor(slippageFactor * 100))) / 100n;
      const ethAmountMin =
        (ethAmountBig * toBigInt(Math.floor(slippageFactor * 100))) / 100n;

      // Lock duration in seconds (0 = no lock)
      const lockDurationSeconds = Math.floor(parseFloat(lockDuration) * 86400); // days to seconds

      console.log("Adding ETH liquidity with params:", {
        token: tokenAddress,
        tokenAmount: tokenAmountBig.toString(),
        tokenAmountMin: tokenAmountMin.toString(),
        ethAmount: ethAmountBig.toString(),
        ethAmountMin: ethAmountMin.toString(),
        lockDuration: lockDurationSeconds,
      });

      // Call the addLiquidityETH function
      await writeContract({
        address: LIQUIDITY_MANAGER_ADDRESSES[selectedNetwork.chainId],
        abi: liquidityManagerAbi,
        functionName: "addLiquidityETH",
        args: [
          tokenAddress, // token address
          tokenAmountBig, // token amount
          tokenAmountMin, // min token amount
          ethAmountMin, // min ETH amount
          lockDurationSeconds, // lock duration in seconds
        ],
        value: ethAmountBig, // ETH value to send
      });
    } catch (err) {
      console.error("Error creating liquidity position:", err);
      setTxStatus({
        loading: false,
        error: err.message || "Failed to create position",
        success: false,
        transactionStep: null,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      });
    }
  };

  const intializePoolSolana = async () => {
    if (!publicKey) {
      setStatus("Connect your wallet first");
      return;
    }

    try {
      //setLoading(true);
      setTxStatus((prev) => ({
        ...prev,
        loading: true,
        message: "Preparing to add liquidity...",
        transactionStep: "preparing",
      }));

      const res = await fetch("http://localhost:5000/createPool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: tokenAddress,
          poolAllocation: [tokenAmount, ethAmount],
          owner: publicKey,
        }),
      });

      const { instruct, extInfo } = await res.json();
      console.log("Transaction instruction:", instruct);
      console.log("Extended info:", extInfo);

      if (!instruct) {
        setStatus("No transaction returned");
        setTxStatus((prev) => ({
          ...prev,
          loading: false,
          message: "error",
          transactionStep: null
        }));
        return;
      }

      const recoveredTx = Transaction.from(Buffer.from(instruct, "base64"));

      setStatus("Sending...");
      const signature = await sendTransaction(recoveredTx);

      if (!signature) {
        if (!instruct) {
          setStatus("No transaction returned");
          setTxStatus((prev) => ({
            ...prev,
            loading: false,
            message: "error, processing transaction",
            transactionStep: null
          }));
          return;
        }
      }
      //modal confirmation
      setTxStatus({
        loading: false,
        error: null,
        success: true,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      });


      setStatus(`Transaction sent! Signature: ${signature}`);
      console.log("extinfo", extInfo);
    } catch (error) {
      console.error(error);
      setTxStatus({
        loading: false,
        error: error.message || "Failed to create position",
        success: false,
        transactionStep: null,
        pairAddress: null,
        liquidityAmount: null,
        hash: null,
        message: "",
      })
    }
  };

  // 3. Create a unified handler function (add this around line 200, before validateInputs)
  const handleAddLiquidity = () => {
    if (activeChain === CHAIN_TYPES.SOLANA && isConnected) {
      intializePoolSolana();
    } else if (activeChain === CHAIN_TYPES.EVM && isEvmConnected) {
      addLiquidity();
    }
  };

  const handleCreateAnother = () => {
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      hash: null,
      message: "",
      pairAddress: null,
      liquidityAmount: null,
      transactionStep: null,
    });
    setTokenAddress("");
    setTokenAmount("");
    setEthAmount("");
    resetWrite();
  };

  if (txStatus.success) {
    return (
      <div className="max-w-md bg-black mx-auto font-[Archivo] text-white p-6 rounded-xl shadow-md space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            Pool Created Successfully!
          </h2>
          <p className="text-gray-400 mb-6">
            Your {tokenDetails.symbol}/ETH pool is now active on{" "}
            {selectedNetwork.name}
          </p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Network:</span>
            <span>{selectedNetwork.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Token Pair:</span>
            <span>{tokenDetails.symbol}/ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Amounts:</span>
            <span>
              {tokenAmount} {tokenDetails.symbol} + {ethAmount} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Lock Duration:</span>
            <span>
              {lockDuration === "0" ? "No lock" : `${lockDuration} days`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Slippage:</span>
            <span>{slippageTolerance}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C7C3C3]">Transaction:</span>
            <a
              href={`${selectedNetwork.blockExplorer}/tx/${txStatus.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              {txStatus.hash.substring(0, 6)}...
              {txStatus.hash.substring(txStatus.hash.length - 4)}
            </a>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleCreateAnother}
            className="w-full bg-[#2D0101] hover:bg-red-800 text-white py-3 rounded"
          >
            Create Another Pool
          </button>
          <button className="w-full bg-[#141414] hover:bg-[#1a1a1a] text-white py-3 rounded border border-[#2E2E2E]">
            View Pool Analytics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-[#0a0a0a] border border-[#1c1c1c] font-[Archivo] text-white sm:p-6 p-3 rounded-xl shadow-md space-y-2">
      {/* Network Display */}
      <div className="flex items-center justify-between mb-3 p-2 bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg">
        <span className="text-[14px] text-[#C7C3C3]">Network:</span>
        <div className="flex items-center gap-2">
          <Image
            src={selectedNetwork.icon}
            alt={selectedNetwork.name}
            width={20}
            height={20}
            className="w-5 h-5"
          />
          <span className="text-[14px]">{selectedNetwork.name}</span>
        </div>
      </div>

      {/* Token Address Input */}
      <div className="space-y-4">
        <label className="block text-[14px] text-[#C7C3C3] mb-1">Token Address</label>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-[#141414] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#c7c3c3]"
        />
        {tokenDetails.loading && (
          <p className="text-yellow-500 text-[14px]">Loading token details...</p>
        )}
        {tokenDetails.loaded && tokenDetails.symbol && (
          <div className="space-y-1">
            <p className="text-green-500 text-sm">
              {tokenDetails.name} ({tokenDetails.symbol}) -{" "}
              {tokenDetails.decimals} decimals
            </p>
            <p className="text-gray-400 text-xs">
              Balance: {parseFloat(tokenDetails.balance).toFixed(6)}{" "}
              {tokenDetails.symbol}
            </p>
          </div>
        )}
      </div>

      {/* Token Amount */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg space-y-2">
        <div className="flex justify-between items-center p-2">
          <span className="text-[14px] text-[#C7C3C3]">
            {tokenDetails.symbol || "Token"} amount
          </span>
        </div>
        <div className="flex items-center justify-between w-full bg-[#141414] rounded px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-[14px] text-[#C7C3C3]">
                {tokenDetails.symbol ? tokenDetails.symbol[0] : "T"}
              </span>
            </div>
            <span className="text-[14px]">{tokenDetails.symbol || "TOKEN"}</span>
          </div>
          <input
            type="text"
            value={tokenAmount}
            onChange={(e) => {
              if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) {
                setTokenAmount(e.target.value);
              }
            }}
            placeholder="0.00"
            className="bg-transparent text-right text-[24px] font-[600] w-1/2 focus:outline-none"
          />
        </div>
      </div>

      {/* ETH Amount */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg space-y-2">
        <div className="flex justify-between items-center p-2">
          <span className="text-[14px] text-[#C7C3C3]">{selectedNetwork.name} amount</span>
        </div>
        <div className="flex items-center justify-between w-full bg-[#141414] rounded px-4 py-3">
          <div className="flex items-center gap-2">
            <Image
              src={selectedNetwork.icon}
              alt={selectedNetwork.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-[14px]">{selectedNetwork.name}</span>
          </div>
          <input
            type="text"
            value={ethAmount}
            onChange={(e) => {
              if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) {
                setEthAmount(e.target.value);
              }
            }}
            placeholder="0.00"
            className="bg-transparent text-right text-[24px] font-[600] w-1/2 focus:outline-none"
          />
        </div>
        {ethBalance && (
          <p className="text-[14px] text-[#C7C3C3] px-2 pb-2">
            Balance:{" "}
            {parseFloat(ethers.formatEther(ethBalance.value)).toFixed(6)} ETH
          </p>
        )}
      </div>

      {/* Slippage Tolerance */}
      <div className="p-2 space-y-2">
        <label className="block text-[14px] text-[#C7C3C3] mb-1">Slippage Tolerance (%)</label>
        <input
          type="text"
          value={slippageTolerance}
          onChange={(e) => {
            if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) {
              setSlippageTolerance(e.target.value);
            }
          }}
          className="w-full bg-[#141414] text-white px-4 py-2 rounded-lg focus:outline-none"
        />
      </div>

      {/* Lock Duration */}
      <div className=" rounded-lg p-2 space-y-2">
        <label className="block text-[14px] text-[#C7C3C3] mb-1">
          Lock Duration (days, 0 = no lock)
        </label>
        <input
          type="text"
          value={lockDuration}
          onChange={(e) => {
            if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) {
              setLockDuration(e.target.value);
            }
          }}
          className="w-full bg-[#141414] text-white px-4 py-2 rounded-lg focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleAddLiquidity}
        disabled={
          txStatus.loading || !tokenAmount || !ethAmount || !isWalletConnected //
        }
        className={`w-full ${txStatus.loading || !tokenAmount || !ethAmount || !isWalletConnected
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-[#2D0101] hover:bg-[#2D0101]"
          } text-white py-3 rounded-lg mt-4 transition-colors`}
      >
        {txStatus.loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            {txStatus.message || "Adding Liquidity..."}
          </span>
        ) : (
          "Add Liquidity"
        )}
      </button>

      {/* Error Message */}
      {txStatus.error && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-900/20 rounded-lg">
          {txStatus.error}
        </div>
      )}

      {/* Wallet Connection Status */}
      {!isWalletConnected && (
        <div className="text-yellow-500 text-sm mt-2 p-2 bg-yellow-900/20 rounded-lg">
          Connect your {activeChain === CHAIN_TYPES.EVM ? "EVM" : "Solana"}{" "}
          wallet to add liquidity
        </div>
      )}
    </div>
  );
}
