"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import SendTokens from "./SendTokens";
import bnb from "../../images/bnb.png";
import Image from "next/image";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { useNetwork } from "../../context/networkContext";
import { TOKEN_SWAP_ADRESSES } from "../../../constants/addresses";
import { tokenSwapAbi } from "../../../constants/tokenSwapAbi";
import { NETWORK_TOKENS } from "../../../services/tokenService";

// ERC20 ABI for approval
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Transaction Modal Component
function SwapTransactionModal({
  isOpen,
  onClose,
  sellToken,
  buyToken,
  sellAmount,
  contractAddress,
  quoteData,
  slippage,
  onSwapComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0); // 0: checking, 1: approval, 2: swap, 3: complete
  const [approvalHash, setApprovalHash] = useState(null);
  const [swapHash, setSwapHash] = useState(null);
  const [error, setError] = useState(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const { address } = useAccount();

  // Check current allowance
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address:
      sellToken?.address !== "0x0000000000000000000000000000000000000000"
        ? sellToken?.address
        : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address, contractAddress],
    enabled: !!(
      sellToken &&
      sellToken.address !== "0x0000000000000000000000000000000000000000" &&
      address &&
      contractAddress &&
      isOpen
    ),
  });

  // Approval transaction
  const {
    writeContract: writeApproval,
    data: approvalTxHash,
    error: approvalError,
    isPending: approvalPending,
  } = useWriteContract();

  // Swap transaction
  const {
    writeContract: writeSwap,
    data: swapTxHash,
    error: swapError,
    isPending: swapPending,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: approvalConfirming, isSuccess: approvalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
    });

  // Wait for swap transaction
  const { isLoading: swapConfirming, isSuccess: swapConfirmed } =
    useWaitForTransactionReceipt({
      hash: swapTxHash,
    });

  // Check if approval is needed when modal opens
  useEffect(() => {
    if (isOpen && sellToken && sellAmount && allowanceData !== undefined) {
      const amountToApprove = parseUnits(sellAmount, sellToken.decimals);
      const needsApprovalCheck =
        sellToken.address !== "0x0000000000000000000000000000000000000000" &&
        allowanceData < amountToApprove;

      setNeedsApproval(needsApprovalCheck);
      setCurrentStep(needsApprovalCheck ? 1 : 2);
    }
  }, [isOpen, sellToken, sellAmount, allowanceData]);

  // Handle approval transaction
  const handleApproval = async () => {
    if (!sellToken || !sellAmount || !contractAddress) return;

    try {
      setError(null);
      const amountToApprove = parseUnits(sellAmount, sellToken.decimals);

      await writeApproval({
        address: sellToken.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, amountToApprove],
      });
    } catch (err) {
      setError(
        "Approval transaction failed: " + (err.shortMessage || err.message)
      );
    }
  };

  // Handle swap transaction
  const handleSwap = async () => {
    if (
      !sellToken ||
      !buyToken ||
      !sellAmount ||
      !contractAddress ||
      !quoteData
    )
      return;

    try {
      setError(null);
      const amountIn = parseUnits(sellAmount, sellToken.decimals);
      const minAmountOut = quoteData
        ? (quoteData[0] * BigInt(Math.floor((100 - slippage) * 100))) /
          BigInt(10000)
        : BigInt(0);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes

      await writeSwap({
        address: contractAddress,
        abi: tokenSwapAbi,
        functionName: "marketSwapExactTokensForTokens",
        args: [
          sellToken.address,
          buyToken.address,
          amountIn,
          minAmountOut,
          deadline,
        ],
      });
    } catch (err) {
      setError("Swap transaction failed: " + (err.shortMessage || err.message));
    }
  };

  // Update step based on transaction status
  useEffect(() => {
    if (approvalTxHash && !approvalHash) {
      setApprovalHash(approvalTxHash);
    }
  }, [approvalTxHash, approvalHash]);

  useEffect(() => {
    if (swapTxHash && !swapHash) {
      setSwapHash(swapTxHash);
    }
  }, [swapTxHash, swapHash]);

  useEffect(() => {
    if (approvalConfirmed && currentStep === 1) {
      // Approval confirmed, move to swap step
      setTimeout(() => {
        refetchAllowance();
        setCurrentStep(2);
      }, 1000);
    }
  }, [approvalConfirmed, currentStep, refetchAllowance]);

  useEffect(() => {
    if (swapConfirmed && currentStep === 2) {
      // Swap confirmed, move to complete step
      setCurrentStep(3);
      if (onSwapComplete) {
        onSwapComplete(swapTxHash);
      }
    }
  }, [swapConfirmed, currentStep, swapTxHash, onSwapComplete]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setApprovalHash(null);
      setSwapHash(null);
      setError(null);
      setNeedsApproval(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { title: "Checking Approval", description: "Verifying token allowance..." },
    { title: "Approve Token", description: "Approve spending of your tokens" },
    { title: "Execute Swap", description: "Complete the token swap" },
    { title: "Complete", description: "Transaction successful!" },
  ];

  const getCurrentStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Approve Token Spending",
          description: `Allow the contract to spend your ${sellToken?.symbol}`,
          action: handleApproval,
          actionText: approvalPending
            ? "Confirming..."
            : approvalConfirming
            ? "Processing..."
            : "Approve",
          isPending: approvalPending || approvalConfirming,
          txHash: approvalHash,
        };
      case 2:
        return {
          title: "Execute Swap",
          description: `Swap ${sellAmount} ${sellToken?.symbol} for ${buyToken?.symbol}`,
          action: handleSwap,
          actionText: swapPending
            ? "Confirming..."
            : swapConfirming
            ? "Processing..."
            : "Swap",
          isPending: swapPending || swapConfirming,
          txHash: swapHash,
        };
      case 3:
        return {
          title: "Swap Completed!",
          description: "Your tokens have been successfully swapped",
          txHash: swapHash,
        };
      default:
        return {
          title: "Preparing Transaction",
          description: "Setting up your swap...",
        };
    }
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0A0A0A] border border-[#1C1C1C] rounded-xl p-6 w-96 max-w-[90vw]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold text-lg">Swap Transaction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={currentStep === 1 || currentStep === 2}
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.slice(needsApproval ? 1 : 2).map((step, index) => {
              const stepIndex = needsApproval ? index + 1 : index + 2;
              const isActive = stepIndex === currentStep;
              const isCompleted = stepIndex < currentStep;

              return (
                <div key={stepIndex} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isActive
                        ? "bg-[#5F0202] text-white"
                        : "bg-[#1C1C1C] text-gray-400"
                    }`}
                  >
                    {isCompleted ? "✓" : stepIndex}
                  </div>
                  {index < steps.slice(needsApproval ? 1 : 2).length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        stepIndex < currentStep
                          ? "bg-green-600"
                          : "bg-[#1C1C1C]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="text-center mb-6">
          <h4 className="text-white font-medium mb-2">{stepInfo.title}</h4>
          <p className="text-gray-400 text-sm mb-4">{stepInfo.description}</p>

          {/* Transaction Details */}
          {(currentStep === 1 || currentStep === 2) && (
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">From:</span>
                <span className="text-white">
                  {sellAmount} {sellToken?.symbol}
                </span>
              </div>
              {currentStep === 2 && (
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">To (estimated):</span>
                  <span className="text-white">
                    {quoteData
                      ? formatUnits(quoteData[0], buyToken?.decimals || 18)
                      : "0"}{" "}
                    {buyToken?.symbol}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {stepInfo.action && (
            <button
              onClick={stepInfo.action}
              disabled={stepInfo.isPending}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                stepInfo.isPending
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#5F0202] to-[#2D0101] text-[#F3B0B0] hover:from-[#7F0303] hover:to-[#3D0202]"
              }`}
            >
              {stepInfo.actionText}
            </button>
          )}

          {/* Complete Step */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">✓</span>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-[#5F0202] to-[#2D0101] text-[#F3B0B0] rounded-lg font-medium hover:from-[#7F0303] hover:to-[#3D0202] transition-all"
              >
                Close
              </button>
            </div>
          )}

          {/* Transaction Hash */}
          {stepInfo.txHash && (
            <div className="mt-4 p-3 bg-[#0F0F0F] border border-[#1C1C1C] rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Transaction Hash:</p>
              <p className="text-green-400 text-xs font-mono break-all">
                {stepInfo.txHash}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Token Selector Modal Component
function TokenSelectorModal({
  isOpen,
  onClose,
  tokens,
  onSelectToken,
  selectedToken,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0A0A0A] border border-[#1C1C1C] rounded-xl p-4 w-80 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Select Token</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelectToken(token);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-[#141414] transition-colors ${
                selectedToken?.address === token.address
                  ? "bg-[#141414] border border-[#242424]"
                  : ""
              }`}
            >
              {token.icon && (
                <Image
                  src={token.icon}
                  width={24}
                  height={24}
                  alt={token.symbol}
                />
              )}
              <div className="flex-1 text-left">
                <div className="text-white font-medium">{token.symbol}</div>
                <div className="text-gray-400 text-sm">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TradeTokens() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const { selectedNetwork } = useNetwork();
  const { address, isConnected } = useAccount();

  // Set initial tab based on URL parameter, default to "Swap"
  const [activeTab, setActiveTab] = useState(tabFromUrl || "Swap");

  // Swap state
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellToken, setSellToken] = useState(null);
  const [buyToken, setBuyToken] = useState(null);
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState(""); // "sell" or "buy"
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [completedSwapHash, setCompletedSwapHash] = useState(null);
  const [isLimitOrder, setIsLimitOrder] = useState(false);

  // Get supported tokens for current network
  const supportedTokens = useMemo(() => {
    const networkData = NETWORK_TOKENS[selectedNetwork.chainId];
    if (!networkData) return [];

    const tokens = [];

    // Add native token first
    if (networkData.nativeToken) {
      tokens.push({
        address: "0x0000000000000000000000000000000000000000", // Native token placeholder address
        symbol: networkData.nativeToken.symbol,
        decimals: networkData.nativeToken.decimals,
        name: networkData.nativeToken.symbol,
        isNative: true,
        // icon: bnb, // Add icon if needed
      });
    }

    // Add other tokens
    if (networkData.tokens) {
      Object.values(networkData.tokens).forEach((token) => {
        tokens.push({
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          name: token.name,
          isNative: false,
          // icon: tokenIcon, // Add appropriate icon
        });
      });
    }

    return tokens;
  }, [selectedNetwork.chainId]);

  // Get contract address for current network
  const contractAddress = useMemo(() => {
    return TOKEN_SWAP_ADRESSES[selectedNetwork.chainId];
  }, [selectedNetwork.chainId]);

  // Set default tokens when network changes
  useEffect(() => {
    if (supportedTokens.length > 0) {
      // Find native token or default to first token
      const nativeToken = supportedTokens.find((token) => token.isNative);
      setSellToken(nativeToken || supportedTokens[0]);
      setBuyToken(null);
    }
  }, [supportedTokens]);

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Get quote from contract
  const { data: quoteData, refetch: refetchQuote } = useReadContract({
    address: contractAddress,
    abi: tokenSwapAbi,
    functionName: "getQuote",
    args:
      sellToken && buyToken && sellAmount
        ? [
            sellToken.address,
            buyToken.address,
            parseUnits(sellAmount, sellToken.decimals),
          ]
        : undefined,
    enabled: !!(
      contractAddress &&
      sellToken &&
      buyToken &&
      sellAmount &&
      parseFloat(sellAmount) > 0
    ),
  });

  // Update buy amount when quote data changes
  useEffect(() => {
    if (quoteData && buyToken) {
      const [amountOut] = quoteData;
      setBuyAmount(formatUnits(amountOut, buyToken.decimals));
    }
  }, [quoteData, buyToken]);

  // Handle swap button click - opens modal instead of direct transaction
  const handleSwap = async () => {
    if (
      !sellToken ||
      !buyToken ||
      !sellAmount ||
      !contractAddress ||
      !isConnected
    ) {
      return;
    }

    setIsSwapModalOpen(true);
  };

  // Handle swap completion
  const handleSwapComplete = (txHash) => {
    setCompletedSwapHash(txHash);
    // Reset form after successful swap
    setTimeout(() => {
      setSellAmount("");
      setBuyAmount("");
      setCompletedSwapHash(null);
    }, 3000);
  };

  // Handle token selection
  const handleTokenSelect = (token) => {
    if (tokenSelectorType === "sell") {
      setSellToken(token);
    } else if (tokenSelectorType === "buy") {
      setBuyToken(token);
    }
    // Refetch quote after token selection
    setTimeout(() => refetchQuote(), 100);
  };

  // Handle sell amount change
  const handleSellAmountChange = (value) => {
    setSellAmount(value);
    // Debounce quote refetch
    const timeoutId = setTimeout(() => {
      if (sellToken && buyToken && value) {
        refetchQuote();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  // Handle limit order buttons
  const handleLimitClick = () => {
    alert("Limit orders are unavailable presently");
  };

  // Handle flip tokens
  const handleFlipTokens = () => {
    const tempToken = sellToken;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount(buyAmount);
    setBuyAmount("");
  };

  const tabs = ["Swap", "Send", "Buy"];

  return (
    <div className="min-h-screen bg-black text-white font-[Archivo] flex items-center justify-center px-4 mt-4">
      <div className="w-full max-w-xl bg-[#0A0A0A] border border-[#1C1C1C] p-6 rounded-2xl shadow-lg">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#141414] border border-[#242424] text-white"
                  : "text-[#2E2E2E] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === "Swap" && (
          <div className="space-y-6">
            {/* Header with BNB worth and switch */}
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-400">
                <span>When 1 </span>
                <div className="w-4 h-4 bg-yellow-500 rounded-full mx-1"></div>
                <span>{sellToken?.symbol || "BNB"} is worth</span>
                <button className="ml-2 text-gray-400 hover:text-white">
                  <span className="text-xs">ⓘ</span>
                </button>
              </div>
              <button
                onClick={handleFlipTokens}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="4.5 4 16 16"
                  width="16px"
                  height="16px"
                >
                  <path
                    d="M12.5 20C8.0816 20 4.5 16.4184 4.5 12C4.5 7.5816 8.0816 4 12.5 4C16.9184 4 20.5 7.5816 20.5 12C20.5 16.4184 16.9184 20 12.5 20ZM8.5 9.6H10.1V12.8H11.7V9.6H13.3L10.9 6.8L8.5 9.6ZM16.5 14.4H14.9V11.2H13.3V14.4H11.7L14.1 17.2L16.5 14.4Z"
                    fill="#F2F2F2"
                    transform="matrix(0.9999999999999999, 0, 0, 0.9999999999999999, 0, -8.881784197001252e-16)"
                  />
                </svg>
              </button>
            </div>

            {/* Exchange Rate Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {quoteData && sellAmount && parseFloat(sellAmount) > 0
                  ? (
                      parseFloat(
                        formatUnits(quoteData[0], buyToken?.decimals || 18)
                      ) / parseFloat(sellAmount)
                    ).toFixed(6)
                  : "0"}
              </div>
              <div className="flex items-center justify-center text-xl text-white">
                <div className="w-6 h-6 bg-yellow-500 rounded-full mr-2"></div>
                <span>{buyToken?.symbol || "BNB"}</span>
              </div>
            </div>

            {/* Market/Limit Toggle */}
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-[#141414] border border-[#242424] text-white rounded-lg text-sm font-medium">
                Market
              </button>
              <button
                onClick={handleLimitClick}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
              >
                +1%
              </button>
              <button
                onClick={handleLimitClick}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
              >
                +5%
              </button>
              <button
                onClick={handleLimitClick}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
              >
                +10%
              </button>
            </div>

            {/* Sell Section */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <span className="text-gray-400 text-sm">Sell</span>
              <div className="flex justify-between items-center mt-2">
                <input
                  type="number"
                  placeholder="0"
                  value={sellAmount}
                  onChange={(e) => handleSellAmountChange(e.target.value)}
                  className="bg-transparent text-4xl font-bold w-1/2 outline-none text-white"
                />
                <button
                  onClick={() => {
                    setTokenSelectorType("sell");
                    setIsTokenSelectorOpen(true);
                  }}
                  className="flex justify-between gap-2 items-center bg-[#141414] border border-[#242424] text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  <span className="flex items-center">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full mr-2"></div>
                    {sellToken?.symbol || "BNB"}
                  </span>
                  <MdOutlineKeyboardArrowDown size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-400">
                {sellAmount && parseFloat(sellAmount) > 0
                  ? `$${(parseFloat(sellAmount) * 1).toFixed(2)}`
                  : "$0"}
              </span>
            </div>

            {/* Buy Section */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <span className="text-gray-400 text-sm">Buy</span>
              <div className="flex justify-between items-center mt-2">
                <input
                  type="text"
                  placeholder="0"
                  value={buyAmount}
                  readOnly
                  className="bg-transparent text-4xl font-bold w-1/2 outline-none text-white"
                />
                <button
                  onClick={() => {
                    setTokenSelectorType("buy");
                    setIsTokenSelectorOpen(true);
                  }}
                  className="flex items-center bg-[#141414] border border-[#242424] text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  {buyToken ? (
                    <span className="flex items-center">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full mr-2"></div>
                      {buyToken.symbol}
                    </span>
                  ) : (
                    "Select token"
                  )}
                  <MdOutlineKeyboardArrowDown size={16} className="ml-2" />
                </button>
              </div>
              <span className="text-sm text-gray-400">
                {buyAmount && parseFloat(buyAmount) > 0
                  ? `$${(parseFloat(buyAmount) * 1).toFixed(2)}`
                  : "$0"}
              </span>
            </div>

            {/* Slippage Settings */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">
                  Slippage Tolerance
                </span>
                <span className="text-white text-sm">{slippage}%</span>
              </div>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0, 2.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      slippage === value
                        ? "bg-[#141414] border border-[#242424] text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Connect Wallet Button */}
            <button
              onClick={handleSwap}
              disabled={!isConnected || !sellToken || !buyToken || !sellAmount}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                !isConnected
                  ? "bg-gradient-to-r from-[#5F0202] to-[#2D0101] text-[#F3B0B0] hover:from-[#7F0303] hover:to-[#3D0202]"
                  : !sellToken || !buyToken || !sellAmount
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#5F0202] to-[#2D0101] text-[#F3B0B0] hover:from-[#7F0303] hover:to-[#3D0202]"
              }`}
            >
              {!isConnected
                ? "Connect wallet"
                : !sellToken || !buyToken
                ? "Select tokens"
                : !sellAmount
                ? "Enter amount"
                : "Swap"}
            </button>

            {/* Transaction Success Message */}
            {completedSwapHash && (
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                <p className="text-green-400 text-sm font-medium">
                  Swap completed successfully!
                </p>
                <p className="text-green-400 text-xs font-mono mt-1 break-all">
                  {completedSwapHash}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send Tab Content */}
        {activeTab === "Send" && (
          <div className="mt-6">
            <SendTokens />
          </div>
        )}

        {/* Buy Tab Content */}
        {activeTab === "Buy" && (
          <div className="text-center py-12">
            <p className="text-gray-400">Buy functionality coming soon</p>
          </div>
        )}
      </div>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        isOpen={isTokenSelectorOpen}
        onClose={() => setIsTokenSelectorOpen(false)}
        tokens={supportedTokens}
        onSelectToken={handleTokenSelect}
        selectedToken={tokenSelectorType === "sell" ? sellToken : buyToken}
      />

      {/* Swap Transaction Modal */}
      <SwapTransactionModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        sellToken={sellToken}
        buyToken={buyToken}
        sellAmount={sellAmount}
        contractAddress={contractAddress}
        quoteData={quoteData}
        slippage={slippage}
        onSwapComplete={handleSwapComplete}
      />
    </div>
  );
}
