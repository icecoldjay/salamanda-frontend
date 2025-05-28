"use client";
import { useState, useEffect } from "react";
import { useNetwork } from "../../context/networkContext";
import { useEvm } from "../../context/evmContext";
import { useSolana } from "../../context/solanaContext";
import Image from "next/image";
import TokenSelectorModal from "../TokenSelectorModal/TokenSelectorModal";
import coinLogo from "../../images/bnb.png";

// Default token images
// import bnb from "../../images/bnb.png";
// import eth from "../../images/eth.png";
// import sol from "../../images/sol.png";
// import usdc from "../../images/usdc.png";
// import usdt from "../../images/usdt.png";
// import dai from "../../images/dai.png";

export const CHAIN_TYPES = {
  EVM: "evm",
  SOLANA: "solana",
};

// Fee tier options for different chains
const FEE_TIERS = {
  [CHAIN_TYPES.EVM]: [
    { label: "0.05%", value: "500" },
    { label: "0.3%", value: "3000" },
    { label: "1%", value: "10000" },
  ],
  [CHAIN_TYPES.SOLANA]: [
    { label: "0.01%", value: "100" },
    { label: "0.05%", value: "500" },
    { label: "0.3%", value: "3000" },
  ],
};

// Default tokens for each chain
const DEFAULT_TOKENS = {
  [CHAIN_TYPES.EVM]: {
    baseToken: {
      name: "Ethereum",
      symbol: "ETH",
      icon: coinLogo,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    quoteToken: {
      name: "USD Coin",
      symbol: "USDC",
      icon: coinLogo,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
  },
  [CHAIN_TYPES.SOLANA]: {
    baseToken: {
      name: "Solana",
      symbol: "SOL",
      icon: coinLogo,
      address: "So11111111111111111111111111111111111111112",
    },
    quoteToken: {
      name: "USD Coin",
      symbol: "USDC",
      icon: coinLogo,
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
  },
};

export default function LiquidityForm() {
  const { selectedNetwork } = useNetwork();
  const { address: evmAddress, isConnected: isEvmConnected } = useEvm();
  const { publicKey: solanaAddress, isConnected: isSolanaConnected, signTransaction } =
    useSolana();

  // Get the active chain type based on selected network
  const activeChain = selectedNetwork.type;

  const [baseAmount, setBaseAmount] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [initialPrice, setInitialPrice] = useState("1.00");
  const [feeTier, setFeeTier] = useState(FEE_TIERS[activeChain][1].value);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [baseToken, setBaseToken] = useState(
    DEFAULT_TOKENS[activeChain].baseToken
  );
  const [quoteToken, setQuoteToken] = useState(
    DEFAULT_TOKENS[activeChain].quoteToken
  );
  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    hash: null,
  });

  // Reset form when chain changes
  useEffect(() => {
    setBaseToken(DEFAULT_TOKENS[activeChain].baseToken);
    setQuoteToken(DEFAULT_TOKENS[activeChain].quoteToken);
    setBaseAmount("");
    setQuoteAmount("");
    setInitialPrice("1.00");
    setFeeTier(FEE_TIERS[activeChain][1].value);
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      hash: null,
    });
  }, [activeChain]);

  // Auto-calculate quote amount when base amount changes
  useEffect(() => {
    if (baseAmount && initialPrice) {
      const calculatedQuote = (
        parseFloat(baseAmount) * parseFloat(initialPrice)
      ).toFixed(6);
      setQuoteAmount(calculatedQuote);
    }
  }, [baseAmount, initialPrice]);

  const handleBasePercentage = (percentage) => {
    // In a real app, this would calculate based on wallet balance
    const amount = (percentage / 100).toFixed(4);
    setBaseAmount(amount);
  };

  const handleQuotePercentage = (percentage) => {
    // In a real app, this would calculate based on wallet balance
    const amount = (percentage / 100).toFixed(4);
    setQuoteAmount(amount);
    if (initialPrice) {
      setBaseAmount((parseFloat(amount) / parseFloat(initialPrice)).toFixed(6));
    }
  };

  const validateInputs = () => {
    if (!isEvmConnected && !isSolanaConnected) {
      throw new Error("Please connect your wallet first");
    }

    if (!baseAmount || parseFloat(baseAmount) <= 0) {
      throw new Error("Please enter a positive base amount");
    }

    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      throw new Error("Please enter a positive quote amount");
    }

    if (baseToken.address === quoteToken.address) {
      throw new Error("Cannot create pool with identical tokens");
    }
  };

  const initializePool = async () => {
    try {
      setTxStatus({ loading: true, error: null, success: false, hash: null });
      validateInputs();

      // Simulate transaction - in a real app this would be different for EVM vs Solana
      const txData = {
        baseToken: baseToken.address,
        baseAmount,
        quoteToken: quoteToken.address,
        quoteAmount,
        initialPrice,
        feeTier,
        chain: activeChain,
        network: selectedNetwork.name,
      };
      console.log("Initializing pool with:", txData);

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate fake transaction hash
      const fakeHash = Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

      setTxStatus({
        loading: false,
        error: null,
        success: true,
        hash: fakeHash,
      });
    } catch (error) {
      console.error("Pool initialization failed:", error);
      setTxStatus({
        loading: false,
        error: error.message,
        success: false,
        hash: null,
      });
    }
  };




  const handleCreateAnother = () => {
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      hash: null,
    });
    setBaseAmount("");
    setQuoteAmount("");
  };

  if (txStatus.success) {
    return (
      <div className="max-w-md mx-auto bg-black font-[Archivo] text-white p-6 rounded-xl shadow-md space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            Pool Created Successfully!
          </h2>
          <p className="text-gray-400 mb-6">
            Your {baseToken.symbol}/{quoteToken.symbol} pool is now active on{" "}
            {selectedNetwork.name}
          </p>
        </div>

        <div className="bg-[#141414] rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Network:</span>
            <span>{selectedNetwork.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Token Pair:</span>
            <span>
              {baseToken.symbol}/{quoteToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Amounts:</span>
            <span>
              {baseAmount} {baseToken.symbol} + {quoteAmount}{" "}
              {quoteToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Initial Price:</span>
            <span>
              1 {baseToken.symbol} = {initialPrice} {quoteToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fee Tier:</span>
            <span>
              {FEE_TIERS[activeChain].find((f) => f.value === feeTier)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction:</span>
            <span className="text-blue-400">
              {txStatus.hash.substring(0, 6)}...
              {txStatus.hash.substring(txStatus.hash.length - 4)}
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleCreateAnother}
            className="w-full bg-red-900 hover:bg-red-800 text-white py-3 rounded"
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
    <div className="max-w-md mx-auto bg-black font-[Archivo] text-white p-3 rounded-xl shadow-md space-y-2">
      {/* Network Display */}
      <div className="flex items-center justify-between mb-2 p-2 bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg">
        <span className="text-sm text-gray-400">Network:</span>
        <div className="flex items-center gap-2">
          <Image
            src={selectedNetwork.icon}
            alt={selectedNetwork.name}
            width={20}
            height={20}
            className="w-5 h-5"
          />
          <span className="text-sm">{selectedNetwork.name}</span>
        </div>
      </div>

      {/* Base Token */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg space-y-2">
        <div className="flex justify-between items-center p-2">
          <span className="text-sm">Base token</span>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleBasePercentage(50)}
              className="bg-[#141414] text-[12px] px-2 py-1 rounded"
            >
              50%
            </button>
            <button
              onClick={() => handleBasePercentage(100)}
              className="bg-[#141414] text-[12px] px-2 py-1 rounded"
            >
              Max
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsBaseModalOpen(true)}
          className="flex items-center justify-between w-full bg-[#141414] rounded px-4 py-3"
        >
          <div className="flex items-center gap-2 bg-[#141414] px-4 py-2 rounded-lg border border-[#2E2E2E]">
            {baseToken.icon ? (
              <Image
                src={baseToken.icon}
                alt={baseToken.symbol}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">{baseToken.symbol}</span>
              </div>
            )}
            <span>{baseToken.symbol}</span>
          </div>
          <input
            type="text"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-right text-[24px] font-[600] w-1/2 focus:outline-none"
          />
        </button>
      </div>

      {/* Quote Token */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg space-y-2">
        <div className="flex justify-between items-center p-2">
          <span className="text-sm">Quote token</span>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleQuotePercentage(50)}
              className="bg-[#141414] text-[12px] px-2 py-1 rounded"
            >
              50%
            </button>
            <button
              onClick={() => handleQuotePercentage(100)}
              className="bg-[#141414] text-[12px] px-2 py-1 rounded"
            >
              Max
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsQuoteModalOpen(true)}
          className="flex items-center justify-between w-full bg-[#141414] rounded px-4 py-3"
        >
          <div className="flex items-center gap-2 bg-[#141414] px-4 py-2 rounded-lg border border-[#2E2E2E]">
            {quoteToken.icon ? (
              <Image
                src={quoteToken.icon}
                alt={quoteToken.symbol}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">{quoteToken.symbol}</span>
              </div>
            )}
            <span>{quoteToken.symbol}</span>
          </div>
          <input
            type="text"
            value={quoteAmount}
            onChange={(e) => setQuoteAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-right text-[24px] font-[600] w-1/2 focus:outline-none"
          />
        </button>
      </div>

      {/* Token Selection Modals */}
      <TokenSelectorModal
        isOpen={isBaseModalOpen}
        onClose={() => setIsBaseModalOpen(false)}
        onSelectToken={(token) => setBaseToken(token)}
        chainType={activeChain}
        currentToken={baseToken}
      />
      <TokenSelectorModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSelectToken={(token) => setQuoteToken(token)}
        chainType={activeChain}
        currentToken={quoteToken}
      />

      {/* Price Section */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg p-4 space-y-2">
        <label className="block text-sm mb-1">Initial Price</label>
        <div className="flex items-center bg-[#141414] rounded-lg px-4 py-2">
          <span className="text-gray-400">1 {baseToken.symbol} =</span>
          <input
            type="text"
            value={initialPrice}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) {
                setInitialPrice(e.target.value);
              }
            }}
            className="flex-1 bg-transparent text-white ml-2 focus:outline-none text-right"
          />
          <span className="text-gray-400 ml-2">{quoteToken.symbol}</span>
        </div>
      </div>

      {/* Fee Tier */}
      <div className="bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg p-4 space-y-2">
        <label className="block text-sm mb-1">Fee Tier</label>
        <select
          value={feeTier}
          onChange={(e) => setFeeTier(e.target.value)}
          className="w-full bg-[#141414] text-white px-4 py-2 rounded-lg focus:outline-none"
        >
          {FEE_TIERS[activeChain].map((tier) => (
            <option key={tier.value} value={tier.value}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <button
        onClick={initializePool}
        disabled={txStatus.loading || !baseAmount || !quoteAmount}
        className={`w-full ${txStatus.loading
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-red-900 hover:bg-red-800"
          } text-white py-3 rounded-lg mt-4 transition-colors`}
      >
        {txStatus.loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            Initializing...
          </span>
        ) : (
          "Initialize Liquidity Pool"
        )}
      </button>

      {/* Error Message */}
      {txStatus.error && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-900/20 rounded-lg">
          {txStatus.error}
        </div>
      )}

      {/* Wallet Connection Status */}
      {!(isEvmConnected || isSolanaConnected) && (
        <div className="text-yellow-500 text-sm mt-2 p-2 bg-yellow-900/20 rounded-lg">
          Connect your wallet to initialize a pool
        </div>
      )}
    </div>
  );
}
