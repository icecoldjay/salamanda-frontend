"use client"
import { useState } from 'react';

export default function SendTokens() {
  const [activeTab, setActiveTab] = useState('send');
  const [amount, setAmount] = useState('');

  return (
    <div className="max-w-md mx-auto bg-[#0A0A0A] rounded-2xl p-6 shadow-lg">
      {/* <h1 className="text-2xl font-bold text-white mb-6 ">Swap</h1> */}
      

      <div className="mb-4 border border-[#1C1C1C] rounded-lg">
        <p className="text-gray-300 align-left">You're sending</p>
        {/* <div className="h-px bg-gray-700 w-full mb-4"></div> */}
        
        <div className="bg-[#141414] rounded-lg p-4 mb-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">S0</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-white text-right text-xl focus:outline-none"
              placeholder="0"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">O</span>
              <div className="flex items-center bg-gray-700 rounded-full px-3 py-1">
                <span className="text-white font-medium">BNB</span>
                <svg className="w-5 h-5 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Balance:</span>
              <span className="text-white">0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-300 align-left mb-2">To</p>
        <input
          type="text"
          className="w-full bg-{#141414} rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter wallet address"
        />
      </div>

      <button className="w-full py-3 rounded-md bg-[#2D0101] hover:bg-[#3a0101] text-[#F3B0B0] text-[14px] font-[600] leading-[20px] font-[Archivo] transition">
        Connect wallet
      </button>
    </div>
  );
}