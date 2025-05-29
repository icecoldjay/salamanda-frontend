import React from 'react'

const BuyTokens = () => {
  return (
    <div>
        <div className="max-w-md mx-auto bg-[#0A0A0A] rounded-2xl p-6 shadow-lg">
      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg">
          <p className="text-green-400 text-sm break-all">{success}</p>
        </div>
      )}

      <div className="mb-4 border border-[#1C1C1C] rounded-lg">
        <p className="text-gray-300 p-4 pb-2">You're sending</p>

        <div className="bg-[#141414] rounded-lg p-4 mb-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Amount</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
                setSuccess("");
              }}
              className="bg-transparent text-white text-right text-xl focus:outline-none w-32"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                  className="flex items-center bg-gray-700 rounded-full px-3 py-1 hover:bg-gray-600 transition-colors"
                  disabled={!availableTokens.length}
                >
                  <span className="text-white font-medium">
                    {selectedToken || "Select Token"}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-300 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isTokenDropdownOpen && availableTokens.length > 0 && (
                  <div className="absolute z-10 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
                    {availableTokens.map((token) => (
                      <div
                        key={token.symbol}
                        onClick={() => handleTokenSelect(token)}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-white font-medium">
                          {token.symbol}
                        </span>
                        {token.isNative && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-1 rounded">
                            Native
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Balance:</span>
              <span className="text-white">{tokenBalance}</span>
              <button
                onClick={handleMaxClick}
                className="ml-2 text-blue-400 hover:text-blue-300 text-sm"
                disabled={tokenBalance === "0"}
              >
                MAX
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-2">To</p>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => {
            setRecipientAddress(e.target.value);
            setError("");
            setSuccess("");
          }}
          className="w-full bg-[#141414] rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter wallet address"
        />
      </div>

      {/* Gas Estimate */}
      {gasEstimate && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Gas:</span>
            <span className="text-white">
              {gasEstimate.gasCostEth} {selectedNetwork.symbol}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={
          isSending ||
          !selectedToken ||
          !amount ||
          !recipientAddress ||
          !isServiceInitialized
        }
        className={`w-full py-3 rounded-md font-[600] text-[14px] leading-[20px] font-[Archivo] transition ${
          isSending ||
          !selectedToken ||
          !amount ||
          !recipientAddress ||
          !isServiceInitialized
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-[#2D0101] hover:bg-[#3a0101] text-[#F3B0B0]"
        }`}
      >
        {isSending ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Sending...
          </div>
        ) : (
          `Send ${selectedToken || "Token"}`
        )}
      </button>
    </div>
    </div>
  )
}

export default BuyTokens