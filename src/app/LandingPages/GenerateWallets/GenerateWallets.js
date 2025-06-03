"use client";
import React, { useState } from "react";
import { HiOutlineChevronLeft } from "react-icons/hi";
import { IoCopy } from "react-icons/io5";
import Warning from "../../images/Warning.png";
import { HiDownload } from "react-icons/hi";
import { IoMdInformationCircle } from "react-icons/io";
import SeedPhraseModal from "../SeedPhraseModal/SeedPhraseModal";
import Image from "next/image";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { downloadWalletInfo } from "../../../utils/evmWalletUtils";

const GenerateWallets = ({ onBack, onNext, networkType }) => {
  const { distributionData } = useTokenCreation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Get actual wallets from context
  const wallets = distributionData.wallets || [];

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
                      {truncateAddress(wallet.address)}
                    </span>
                    <button
                      className={`text-gray-400 hover:text-white ${
                        copiedIndex === idx ? "text-green-400" : ""
                      }`}
                      title="Copy address"
                      onClick={() => copyToClipboard(wallet.address, idx)}
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
            seedPhrase={selectedWallet?.seedPhrase}
            walletAddress={selectedWallet?.address}
            onClose={() => setIsModalOpen(false)}
          />

          {/* Download Info */}
          <div className="my-6">
            <button
              onClick={handleDownloadWalletInfo}
              disabled={wallets.length === 0}
              className={`sm:w-full lg:w-1/2  flex items-center justify-left gap-4 font-[600] text-[14px] text-white border border-gray-700 rounded-md px-3 py-3 text-sm ${
                wallets.length > 0
                  ? "bg-[#141414] hover:bg-[#1a1a1a] cursor-pointer"
                  : "bg-gray-800 cursor-not-allowed opacity-50"
              }`}
            >
              <HiDownload size={20} />
              <span className="">Download wallet information</span>
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="w-full py-3 rounded-md bg-[#2D0101] hover:bg-[#3a0101] text-[#F3B0B0] text-[14px] font-[600] leading-[20px] font-[Archivo] transition"
          >
            Next
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
