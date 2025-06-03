// components/TokenConfirmation/TokenConfirmation.js
"use client";
import React from "react";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useNetwork } from "../../context/networkContext";
import Header from "../Headers/Header";

// Solana devnet link: https://explorer.solana.com/address/$%7Bmint%7D?cluster=devnet
const TokenConfirmation = ({ onRestart }) => {
  const { createdToken } = useTokenCreation();
  const { selectedNetwork } = useNetwork();

  const viewOnExplorer = () => {
    if (!createdToken) return;

    let explorerUrl = "";
    if (selectedNetwork.type === "evm") {
      explorerUrl = `${selectedNetwork.blockExplorer}/token/${createdToken.address}`;
    } else {
      explorerUrl = `https://explorer.solana.com/address/${createdToken.address}`;
    }
    window.open(explorerUrl, "_blank");
  };

  const viewTxOnExplorer = () => {
    if (!createdToken || !createdToken.transactionHash) return;
    let explorerUrl = "";
    if (selectedNetwork.type === "evm") {
      explorerUrl = `${selectedNetwork.blockExplorer}/tx/${createdToken.transactionHash}`;
    } else {
      explorerUrl = `https://explorer.solana.com/tx/${createdToken.transactionHash}`;
    }
    window.open(explorerUrl, "_blank");
  };

  return (
    <div className="mx-auto">
    {/* <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"> */}
      <div className="flex flex-col items-center space-y-6 bg-[#0A0A0A] text-white rounded-2xl p-6 w-full max-w-md border border-[#1C1C1C] font-[Archivo]">
        <div className="bg-red-600 w-32 h-32 rounded-full flex items-center justify-center">
          <svg
            className="w-16 h-16 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Token created</h2>
          <p className="text-[#C7C3C3] text-[14px]">
            You have created your token successfully
          </p>
        </div>

        {createdToken && (
          <div className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#C7C3C3] text-[14px]">Name</p>
                <p className="font-medium text-white">{createdToken.name}</p>
              </div>
              <div>
                <p className="text-[#C7C3C3] text-[14px]">Symbol</p>
                <p className="font-medium text-white">{createdToken.symbol}</p>
              </div>
              <div>
                <p className="text-[#C7C3C3] text-[14px]">Supply</p>
                <p className="font-medium text-white">{createdToken.supply}</p>
              </div>
              <div>
                <p className="text-[#C7C3C3] text-[14px]">Decimals</p>
                <p className="font-medium text-white">{createdToken.decimals}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[#C7C3C3] text-[14px]">Address</p>
                <p className="font-medium truncate">{createdToken.address}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={viewTxOnExplorer}
          className="bg-red-900 hover:bg-red-800 px-6 py-3 rounded-md font-semibold text-white w-full max-w-md"
        >
          View transaction on explorer
        </button>

        <button
          onClick={viewOnExplorer}
          className="bg-red-900 hover:bg-red-800 px-6 py-3 rounded-md font-semibold text-white w-full max-w-md"
        >
          View token on explorer
        </button>

        <button
          onClick={onRestart}
          className="text-sm text-white hover:underline mt-2"
        >
          Create a new token
        </button>
      </div>
    {/* </div> */}
    </div>
  );
};

export default TokenConfirmation;
