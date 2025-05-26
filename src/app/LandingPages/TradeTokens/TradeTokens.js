"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SendTokens from "./SendTokens";
import bnb from "../../images/bnb.png";
import Image from "next/image";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

export default function TradeTokens() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  // Set initial tab based on URL parameter, default to "Swap"
  const [activeTab, setActiveTab] = useState(tabFromUrl || "Swap");

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
            {/* Price Section */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                <span className="flex">
                  When 1 &nbsp;{" "}
                  <span className="flex font-semibold text-white">
                    <Image src={bnb} width={24} alt="logo-coin" /> &nbsp; BNB
                  </span>
                  &nbsp; is worth
                </span>
                <button className="text-white">🌐</button>
              </div>
              <div className=" bg-[#141414]">
                <div className="flex justify-between items-center p-3">
                  <input
                    type="text"
                    placeholder="0"
                    className="bg-transparent text-2xl font-semibold w-1/2 outline-none text-white"
                  />
                  <span className="flex text-white text-[14px] font-[600]">
                    <Image src={bnb} width={24} alt="logo-coin" /> &nbsp; BNB
                  </span>
                </div>
                <div className="flex space-x-2 p-3">
                  <button className="bg-[#141414] border border-[#242424] px-3 py-1 rounded-md text-sm text-white">
                    Market
                  </button>
                  {["+1%", "+5%", "+10%"].map((p) => (
                    <button
                      key={p}
                      className="bg-[#141414] border border-[#242424] text-[#2E2E2E] text-sm px-3 py-1 rounded-md"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sell Section */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <span className="text-gray-400 text-sm">Sell</span>
              <div className="flex justify-between items-center mt-2">
                <input
                  type="number"
                  placeholder="0"
                  className="bg-transparent text-xl font-semibold w-1/2 outline-none text-white"
                />
                <button className="flex justify-between gap-2 items-center bg-[#141414] border border-[#242424] text-[#2E2E2E] text-white px-3 py-2 rounded-md text-[14px] font-[600]">
                  <span className="flex ">
                    <Image src={bnb} width={24} alt="logo-coin" /> &nbsp; BNB
                  </span>
                </button>
              </div>
              <span className="text-[14px] text-white">$0</span>
            </div>

            {/* Buy Section */}
            <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-xl p-4">
              <span className="text-gray-400 text-sm">Buy</span>
              <div className="flex justify-between items-center mt-2">
                <input
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-xl font-semibold w-1/2 outline-none text-white"
                />
                <button className="flex items-center bg-[#141414] border border-[#242424] text-[#2E2E2E] text-white px-3 py-2 rounded-md text-[14px] font-[600]">
                  Select token <MdOutlineKeyboardArrowDown size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">$0</span>
            </div>

            {/* Expiry Section */}
            <div className="flex items-center justify-between">
              <span className="w-1/4 text-sm text-gray-400">Expiry</span>
              <div className="flex space-x-2 mt-2">
                {["1 day", "1 week", "1 month", "1 year"].map((label) => (
                  <button
                    key={label}
                    className={`px-3 py-1 text-sm rounded-md border border-[#1C1C1C] ${
                      label === "1 day"
                        ? "bg-[#141414] border border-[#242424] text-white"
                        : "bg-[#141414] border border-[#242424] text-[#2E2E2E]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Connect Button */}
            <button className="w-full mt-4 py-3 rounded-md bg-gradient-to-r from-[#5F0202] to-[#2D0101] text-[#F3B0B0] font-semibold text-sm">
              Connect wallet
            </button>

            {/* Fee Info */}
            <p className="text-sm text-gray-500 text-center mt-4">
              Total fees: 0.3 SOL
            </p>
          </div>
        )}

        {activeTab === "Send" && (
          <div>
            <SendTokens />
          </div>
        )}

        {activeTab === "Buy" && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Buy functionality coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
