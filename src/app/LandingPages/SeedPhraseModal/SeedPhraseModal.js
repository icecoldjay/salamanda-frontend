import React, { useState } from "react";
import { IoMdInformationCircle } from "react-icons/io";
import { IoCopy } from "react-icons/io5";
import { useEvm } from "../../context/evmContext";

const SeedPhraseModal = ({
  isOpen,
  onClose,
  walletName,
  seedPhrase,
  walletAddress,
}) => {
  const [copiedSeedPhrase, setCopiedSeedPhrase] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { isConnected } = useEvm();

  if (!isOpen || !walletName || !seedPhrase) return null;

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "seedPhrase") {
        setCopiedSeedPhrase(true);
        setTimeout(() => setCopiedSeedPhrase(false), 2000);
      } else if (type === "address") {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleCopySeedPhrase = () => {
    if (Array.isArray(seedPhrase)) {
      copyToClipboard(seedPhrase.join(" "), "seedPhrase");
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      copyToClipboard(walletAddress, "address");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#0A0A0A] text-white rounded-2xl p-6 w-full max-w-md border border-[#1C1C1C] font-[Archivo]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-[20px] font-semibold leading-[28px]">
              {walletName}
            </h2>
            <p className="text-[14px] text-[#c7c3c3] mt-1">
              Your seed phrase provides full access to your wallet and funds.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-xl hover:text-gray-400"
          >
            &times;
          </button>
        </div>

        <div className="bg-[#1a0000] flex gap-3 items-start border border-[#C50404] rounded-md p-4 mb-4">
          <IoMdInformationCircle size={20} style={{ color: "#EA5757" }} />
          <div>
            <p className="text-[#F3B0B0] text-sm font-semibold mb-1">
              Important notice
            </p>
            <p className="text-[#c7c3c3] text-sm">
              Keep your tokens safe by copying your wallet addresses and the
              seed phrases. Your seed phrase is the only way to unlock your
              wallet. If it's lost, no one (not even us) can help recover it.
            </p>
          </div>
        </div>

        {/* Wallet Address Section */}
        {walletAddress && (
          <div className="mb-4">
            <p className="text-[#c7c3c3] text-sm mb-2">Wallet Address:</p>
            <div className="bg-[#141414] border border-[#1C1C1C] rounded-md p-3 flex items-center justify-between">
              <span className="font-mono text-sm text-white break-all">
                {walletAddress}
              </span>
              <button
                onClick={handleCopyAddress}
                className="ml-2 text-[#EA5757] hover:text-[#F3B0B0] flex-shrink-0"
                title="Copy address"
              >
                <IoCopy size={16} />
              </button>
            </div>
            {copiedAddress && (
              <p className="text-xs text-green-400 mt-1">Address copied!</p>
            )}
          </div>
        )}

        {/* Seed Phrase Grid */}
        <div className="mb-4">
          <p className="text-[#c7c3c3] text-sm mb-2">Seed Phrase:</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {Array.isArray(seedPhrase) &&
              seedPhrase.map((word, index) => (
                <div
                  key={index}
                  className="bg-[#141414] text-white rounded-md p-2 text-center border border-[#1C1C1C]"
                >
                  <span className="text-xs text-[#c7c3c3]">{index + 1}.</span>
                  <br />
                  <span className="font-medium">{word}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Copy Seed Phrase Button */}
        <button
          onClick={handleCopySeedPhrase}
          className="w-full flex items-center justify-center gap-3 py-2 bg-[#5F0202] hover:bg-[#7a0202] text-[#F3B0B0] rounded-md border border-[#C50404] text-sm font-semibold transition-colors"
        >
          <IoCopy size={20} style={{ color: "#EA5757" }} />
          <span>{copiedSeedPhrase ? "Copied!" : "Copy seed phrase"}</span>
        </button>

        {copiedSeedPhrase && (
          <p className="text-xs text-green-400 text-center mt-2">
            Seed phrase copied to clipboard!
          </p>
        )}
      </div>
    </div>
  );
};

export default SeedPhraseModal;
