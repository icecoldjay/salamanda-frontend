import { IoIosClose } from "react-icons/io";
import { useState } from "react";
import { IoIosSearch } from "react-icons/io";
import Image from "next/image";
import { useNetwork } from "../../context/networkContext";

// Token icons - you should add these to your images folder
import bnb from "../../images/bnb.png";
import eth from "../../images/eth.svg";
import sol from "../../images/sol.svg";
import usdc from "../../images/bnb.png";
import usdt from "../../images/bnb.png";
import dai from "../../images/bnb.png";

export const CHAIN_TYPES = {
  EVM: "evm",
  SOLANA: "solana",
};

// Token lists for different chains
const TOKEN_LISTS = {
  [CHAIN_TYPES.EVM]: [
    {
      name: "Ethereum",
      symbol: "ETH",
      icon: eth,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    {
      name: "BNB",
      symbol: "BNB",
      icon: bnb,
      address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      icon: usdc,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: usdt,
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
    {
      name: "Dai Stablecoin",
      symbol: "DAI",
      icon: dai,
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
  ],
  [CHAIN_TYPES.SOLANA]: [
    {
      name: "Solana",
      symbol: "SOL",
      icon: sol,
      address: "So11111111111111111111111111111111111111112",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      icon: usdc,
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
    {
      name: "Tether",
      symbol: "USDT",
      icon: usdt,
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    },
    {
      name: "Raydium",
      symbol: "RAY",
      icon: "",
      address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    },
    {
      name: "Bonk",
      symbol: "BONK",
      icon: "",
      address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    },
  ],
};

export default function TokenSelectorModal({
  isOpen,
  onClose,
  onSelectToken,
  chainType,
  currentToken,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedNetwork } = useNetwork();
  const activeChain = selectedNetwork.type;

  if (!isOpen) return null;

  // Filter tokens based on search term and current chain
  const filteredTokens = TOKEN_LISTS[chainType || activeChain].filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 font-[Archivo] flex justify-center items-center">
      <div className="bg-black rounded-xl w-full max-w-sm p-6 relative max-h-[80vh] flex flex-col">
        <button className="absolute top-4 right-4 text-white" onClick={onClose}>
          <IoIosClose size={24} />
        </button>

        <h2 className="text-white text-xl font-semibold mb-4">
          Select a token
        </h2>

        <div className="flex items-center bg-[#141414] mx-2 rounded-lg gap-1 px-3 mb-4">
          <IoIosSearch size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or symbol"
            className="w-full px-2 py-3 bg-[#141414] text-white rounded outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token) => (
              <button
                key={`${token.symbol}-${token.address}`}
                onClick={() => {
                  onSelectToken(token);
                  onClose();
                }}
                disabled={currentToken?.address === token.address}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-800 transition ${
                  currentToken?.address === token.address
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {token.icon ? (
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xs">{token.symbol}</span>
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{token.name}</div>
                  <div className="text-gray-400 text-sm">{token.symbol}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">
              No tokens found matching "{searchTerm}"
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-800 mt-4">
          <p className="text-sm text-gray-400">
            {chainType === CHAIN_TYPES.EVM ? "EVM" : "Solana"} tokens
          </p>
        </div>
      </div>
    </div>
  );
}
