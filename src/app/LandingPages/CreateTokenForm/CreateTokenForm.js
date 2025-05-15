// components/CreateTokenForm/CreateTokenForm.js
"use client";
import React, { useState, useEffect } from "react";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useNetwork } from "../../context/networkContext";

const CreateTokenForm = ({ onNext }) => {
  const { tokenData, updateTokenData } = useTokenCreation();
  const { isEvm, isSolana } = useNetwork();
  const [isFormValid, setIsFormValid] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateTokenData({ [name]: value });
  };

  const handleToggle = (name) => {
    updateTokenData({ [name]: !tokenData[name] });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateTokenData({ logo: file });
    }
  };

  return (
    <div className="min-h-screen text-white font-[Archivo] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-[#0A0A0A] p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Create your token</h2>
        <p className="text-gray-400 mb-6">Setup your token here</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm">Token name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g Salamanda"
              value={tokenData.name}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Symbol</label>
            <input
              name="symbol"
              type="text"
              placeholder="e.g Sal"
              value={tokenData.symbol}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Decimals</label>
            <input
              name="decimals"
              type="text"
              placeholder={isEvm() ? "e.g 18" : "e.g 9"}
              value={tokenData.decimals}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Supply</label>
            <input
              name="supply"
              type="text"
              placeholder="How much of the token is minted?"
              value={tokenData.supply}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Description</label>
          <textarea
            name="description"
            placeholder="What should people know about the token?"
            value={tokenData.description}
            onChange={handleChange}
            className="w-full bg-[#1a1a1a] rounded-md px-4 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm">Token logo</label>
          <div className="flex items-center justify-center w-full h-32 bg-[#1a1a1a] border border-dashed border-gray-600 rounded-md text-sm text-gray-400">
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
                  <p>📄 Upload file here</p>
                  <p className="text-xs mt-1">Max file size: 5mb</p>
                </>
              )}
            </label>
          </div>
        </div>

        {isSolana() && (
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Revoke Freeze</p>
                <p className="text-sm text-gray-400">
                  Revoke Freeze allows you to create a liquidity pool
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Fee: 0.1 SOL</span>
                <input
                  type="checkbox"
                  checked={tokenData.revokeFreeze}
                  onChange={() => handleToggle("revokeFreeze")}
                  className="w-5 h-5 accent-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Revoke Mint</p>
                <p className="text-sm text-gray-400">
                  Mint Authority allows you to increase tokens supply
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Fee: 0.1 SOL</span>
                <input
                  type="checkbox"
                  checked={tokenData.revokeMint}
                  onChange={() => handleToggle("revokeMint")}
                  className="w-5 h-5 accent-green-500"
                />
              </div>
            </div>
          </div>
        )}

        <button
          disabled={!isFormValid}
          onClick={onNext}
          className={`w-full py-3 rounded-md mt-4 transition-colors duration-200 ${
            isFormValid
              ? "bg-[#2D0101] hover:bg-#2D0101] text-white cursor-pointer"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue to Distribution
        </button>

        <p className="text-sm text-gray-400 text-center mt-4">
          {isSolana() ? "Total fees: 0.3 SOL" : "Total fees: 0.0001 ETH"}
        </p>
      </div>
    </div>
  );
};

export default CreateTokenForm;
