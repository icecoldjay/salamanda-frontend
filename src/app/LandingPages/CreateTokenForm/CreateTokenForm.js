// components/CreateTokenForm/CreateTokenForm.js
"use client";
import React, { useState, useEffect } from "react";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useNetwork } from "../../context/networkContext";
import { useSolana } from "../../context/solanaContext";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { base64 } from "@metaplex-foundation/umi/serializers";

const CreateTokenForm = ({ onNext, onCreateToken }) => {
  const { tokenData, updateTokenData } = useTokenCreation();
  const { isEvm, isSolana } = useNetwork();
  const [isFormValid, setIsFormValid] = useState(false);
  const { publicKey, isConnected, connectSolana, disconnectSolana, signTransaction } = useSolana();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [umi, setUmi] = useState(null);

  console.log(`evm ${isEvm()}, sol: ${isSolana()}`);

  useEffect(() => {
    const { name, symbol, decimals, supply, description } = tokenData;
    setIsFormValid(
      name.trim() !== "" &&
      symbol.trim() !== "" &&
      decimals.trim() !== "" &&
      supply.trim() !== "" &&
      description.trim() !== ""
    );
  }, [tokenData]);

  //useEffect for umi transaction
  useEffect(() => {
    if (!isSolana || !publicKey) {
      setUmi(null); // Clear umi if it's not Solana or wallet not connected
      return;
    }

    const umiInstance = createUmi("https://api.devnet.solana.com");
    umiInstance.use(walletAdapterIdentity({ publicKey, signTransaction }));
    setUmi(umiInstance);
  }, [isSolana, isConnected, publicKey, signTransaction]);


  //function to handle token creation
  const handleMint = async () => {
    if (!umi) {
      setStatus("Wallet not connected or UMI not initialized");
      return;
    }

    try {
      setLoading(true);
      setStatus("Requesting transaction from backend...");

      const response = await fetch("http://localhost:5000/createTokenWithMetadata", {
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
          recipientAddress: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get transaction from backend");
      }

      const { transactionForSign, mint } = await response.json();
      console.log(transactionForSign)
      if (!transactionForSign) {
        setStatus("No transaction returned from backend");
        setLoading(false);
        return;
      }

      // Deserialize the transaction using UMI
      const txBytes = base64.serialize(transactionForSign);
      const recoveredTx = umi.transactions.deserialize(txBytes);

      setStatus("Signing transaction with wallet...");
      // Sign transaction using umi.identity which uses wallet adapter signer
      const signedTx = await umi.identity.signTransaction(recoveredTx);

      setStatus("Sending transaction...");
      const signature = await umi.rpc.sendTransaction(signedTx);

      setTxSignature(signature);
      setStatus(`Transaction sent! Signature: ${signature}, mint: ${mint}`);
      alert(`mint Address: ${mint}`);
    } catch (error) {
      console.error("Transaction error:", error);
      setStatus(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    updateTokenData({ [name]: value });
  };

  const handleToggle = (name) => {
    updateTokenData({ [name]: !tokenData[name] });
    console.log(`Toggled ${name}: ${!tokenData[name]}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateTokenData({ logo: file });
    }
  };

  const handleButtonClick = () => {
    if (tokenData.bundleLaunch) {
      // Call token creation function directly
      if (onCreateToken) {
        onCreateToken();
      }
    } else {
      // Proceed to next step in stepper
      onNext();
    }
  };



  return (
    <div className="min-h-screen text-white font-[Archivo] flex items-center justify-center px-4 mt-6">
      <div className="w-full max-w-xl bg-[#0A0A0A] border border-[#1C1C1C] p-4 rounded-2xl shadow-lg">
        <h2 className="text-[24px] leading-[32px] font-[600] mb-1">
          Create your token
        </h2>
        <p className="mb-6 leading-[32px] font-[600] text-[14px] text-[#C7C3C3]">
          Setup your token here
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-[14px] text-[#C7C3C3]">
              Token name
            </label>
            <input
              name="name"
              type="text"
              placeholder="e.g Salamanda"
              value={tokenData.name}
              onChange={handleChange}
              className="w-full bg-[#141414] text-[#C7C3C3] placeholder-[#2E2E2E] rounded-md px-4 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-[14px] text-[#C7C3C3]">
              Symbol
            </label>
            <input
              name="symbol"
              type="text"
              placeholder="e.g Sal"
              value={tokenData.symbol}
              onChange={handleChange}
              className="w-full bg-[#141414] text-[#C7C3C3] placeholder-[#2E2E2E] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-[14px] text-[#C7C3C3]">
              Decimals
            </label>
            <input
              name="decimals"
              type="text"
              placeholder={isEvm() ? "e.g 18" : "e.g 9"}
              value={tokenData.decimals}
              onChange={handleChange}
              className="w-full bg-[#141414] text-[#C7C3C3] placeholder-[#2E2E2E] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-[14px] text-[#C7C3C3]">
              Supply
            </label>
            <input
              name="supply"
              type="text"
              placeholder="How much of the token is minted?"
              value={tokenData.supply}
              onChange={handleChange}
              className="w-full bg-[#141414] text-[#C7C3C3] placeholder-[#2E2E2E] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-[14px] text-[#C7C3C3]">
            Description
          </label>
          <textarea
            name="description"
            placeholder="What should people know about the token?"
            value={tokenData.description}
            onChange={handleChange}
            className="w-full bg-[#141414] text-[#C7C3C3] placeholder-[#2E2E2E] rounded-md px-4 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-[14px] text-[#C7C3C3]">
            Token logo
          </label>
          <div className="flex items-center justify-center w-full h-32 bg-[#141414] text-[#2E2E2E] border border-dashed border-gray-600 rounded-md text-sm text-gray-400">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="token-logo"
            />
            <label htmlFor="token-logo" className="text-center cursor-pointer">
              {tokenData.logo ? (
                <p>{tokenData.logo.name}</p>
              ) : (
                <>
                  <p className="text-[14px] leading-[20px] font-[500]">📄</p>
                  <p className="text-[14px] leading-[20px] font-[500]">
                    Upload file here
                  </p>
                  <p className="text-[12px] leading-[16px] text-[#2e2e2e] font-[400] mt-1">
                    Max file size: 5mb
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Bundle Launch Toggle - Always visible and independent of network */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] leading-[20px] font-[600]">
                Bundle Launch
              </p>
              <p className="text-[12px] leading-[16px] font-[400]">
                Skip distribution setup and create token directly
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tokenData.bundleLaunch || false}
                  onChange={() => handleToggle("bundleLaunch")}
                  value=""
                  className="sr-only peer"
                />
                <div className="relative w-12 h-6 bg-[#141414] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#141414] dark:peer-focus:ring-[#141414] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#0A0A0A] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#0A0A0A] after:border-[#0A0A0A] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00A885] dark:peer-checked:bg-[#00A885]"></div>
              </label>
            </div>
          </div>
        </div>

        {isSolana() && (
          <div className="mb-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] leading-[20px] font-[600]">
                  Revoke Freeze
                </p>
                <p className="text-[12px] leading-[16px] font-[400]">
                  Revoke Freeze allows you to create a liquidity pool
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tokenData.revokeFreeze}
                    onChange={() => handleToggle("revokeFreeze")}
                    value=""
                    className="sr-only peer"
                  />
                  <div className="relative w-12 h-6 bg-[#141414] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#141414] dark:peer-focus:ring-[#141414] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#0A0A0A] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#0A0A0A] after:border-[#0A0A0A] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00A885] dark:peer-checked:bg-[#00A885]"></div>
                </label>
                <span className="text-[12px] text-[#4A4A4A]">Fee: 0.1 SOL</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] leading-[20px] font-[600]">
                  Revoke Mint
                </p>
                <p className="text-[12px] leading-[16px] font-[400]">
                  Mint Authority allows you to increase tokens supply
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tokenData.revokeMint}
                    onChange={() => handleToggle("revokeMint")}
                    value=""
                    className="sr-only peer"
                  />
                  <div className="relative w-12 h-6 bg-[#141414] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#141414] dark:peer-focus:ring-[#141414] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#0A0A0A] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#0A0A0A] after:border-[#0A0A0A] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00A885] dark:peer-checked:bg-[#00A885]"></div>
                </label>
                <span className="text-[12px] text-[#4A4A4A]">Fee: 0.1 SOL</span>
              </div>
            </div>
          </div>
        )}

        <button
          disabled={!isFormValid}
          onClick={isSolana ? handleMint : handleButtonClick}
          className={`w - full py - 3 rounded - md mt - 4 transition - colors duration - 200 ${isFormValid
            ? "bg-[#2D0101] hover:bg-[#2D0101] text-white cursor-pointer"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
        >
          {tokenData.bundleLaunch ? "Create Token" : "Continue to Launch"}
        </button>

        <p className="text-sm text-gray-400 text-center mt-4">
          {isSolana() ? "Total fees: 0.3 SOL" : "Total fees: 0.0001 ETH"}
        </p>
      </div>
    </div>
  );
};

export default CreateTokenForm;
