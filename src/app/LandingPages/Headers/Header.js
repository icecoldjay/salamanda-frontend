"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import logo from "../../images/logo.png";
import bnbLogo from "../../images/bnb.svg";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import WalletModal from "../WalletModal/WalletModal";
import { useNetwork, NETWORKS } from "../../context/networkContext";
import { useEvm } from "../../context/evmContext";
import { useSolana } from "../../context/solanaContext";

const Header = () => {
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [isTradeDropdownOpen, setIsTradeDropdownOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState(null);

  // Separate refs for each dropdown
  const tokenDropdownRef = useRef(null);
  const tradeDropdownRef = useRef(null);

  const { selectedNetwork, setSelectedNetwork, networks } = useNetwork();
  const {
    isConnected: isEvmConnected,
    address,
    disconnectEvmWallet,
    currentChainId,
    isAttemptingConnection,
    switchNetwork,
  } = useEvm();
  const {
    isConnected: isSolanaConnected,
    publicKey,
    connectedWallet,
    disconnectSolana,
  } = useSolana();

  const isConnected = isEvmConnected || isSolanaConnected;
  const isCorrectNetwork = isEvmConnected
    ? currentChainId === selectedNetwork.chainId
    : true;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check token dropdown
      if (
        tokenDropdownRef.current &&
        !tokenDropdownRef.current.contains(event.target)
      ) {
        setIsTokenDropdownOpen(false);
      }
      // Check trade dropdown
      if (
        tradeDropdownRef.current &&
        !tradeDropdownRef.current.contains(event.target)
      ) {
        setIsTradeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track last network switch attempt to prevent looping
  const [lastSwitchAttempt, setLastSwitchAttempt] = useState(null);
  const [switchFailCount, setSwitchFailCount] = useState(0);

  // Handle network switching
  useEffect(() => {
    if (isEvmConnected && !isCorrectNetwork) {
      setSwitchFailCount(0);
    }
  }, [isEvmConnected, isCorrectNetwork]);

  // Clear switching state if we've successfully switched to the target network
  useEffect(() => {
    if (isSwitchingNetwork && targetNetwork) {
      if (
        (isEvmConnected && currentChainId === targetNetwork.chainId) ||
        !isEvmConnected
      ) {
        setIsSwitchingNetwork(false);
        setTargetNetwork(null);
      }

      const safetyTimeout = setTimeout(() => {
        if (isSwitchingNetwork) {
          console.log("Network switch timeout - forcing reset of switch state");
          setIsSwitchingNetwork(false);
          setSwitchFailCount((prev) => prev + 1);
        }
      }, 8000);

      return () => clearTimeout(safetyTimeout);
    }
  }, [isEvmConnected, currentChainId, isSwitchingNetwork, targetNetwork]);

  const handleTokenSelect = async (network) => {
    const now = Date.now();
    if (isSwitchingNetwork) {
      if (lastSwitchAttempt && now - lastSwitchAttempt > 5000) {
        console.log("Canceling stuck network switch after timeout");
      } else {
        return;
      }
    }

    setSwitchFailCount(0);
    setLastSwitchAttempt(now);
    setIsSwitchingNetwork(true);
    setTargetNetwork(network);
    setIsTokenDropdownOpen(false);
    setSelectedNetwork(network);

    if (isEvmConnected) {
      try {
        const switchWithTimeout = Promise.race([
          switchNetwork(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Network switch timeout")), 7000);
          }),
        ]);

        await switchWithTimeout;
      } catch (error) {
        console.error("Failed to switch network:", error);
        setSwitchFailCount((prev) => prev + 1);
        setTimeout(() => {
          setIsSwitchingNetwork(false);
        }, 1500);
      }
    } else {
      setTimeout(() => {
        setIsSwitchingNetwork(false);
        setTargetNetwork(null);
      }, 800);
    }
  };

  const handleWalletClick = () => {
    setSwitchFailCount(0);
    setLastSwitchAttempt(null);

    if (isConnected) {
      if (isEvmConnected) disconnectEvmWallet();
      if (isSolanaConnected) disconnectSolana();
    } else {
      setIsWalletModalOpen(true);
    }
  };

  // Handle trade dropdown link clicks
  const handleTradeDropdownClick = () => {
    setIsTradeDropdownOpen(false);
  };

  const truncatedAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getCurrentAddress = () => {
    if (isEvmConnected) return address;
    if (isSolanaConnected) return publicKey?.toString();
    return null;
  };

  const getWalletBadge = () => {
    if (isEvmConnected) {
      return (
        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
          EVM
        </span>
      );
    }
    if (isSolanaConnected && connectedWallet) {
      return (
        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded capitalize">
          {connectedWallet}
        </span>
      );
    }
    return null;
  };

  const getNetworkStatus = () => {
    if (!isEvmConnected) return null;

    if (switchFailCount >= 3 && !isCorrectNetwork) {
      return (
        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded whitespace-nowrap">
          Switch manually
        </span>
      );
    }

    if (isSwitchingNetwork) {
      return (
        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded flex items-center whitespace-nowrap">
          <AiOutlineLoading3Quarters className="animate-spin w-3 h-3 mr-1" />
          Switching
        </span>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded whitespace-nowrap">
          Wrong Network
        </span>
      );
    }

    return (
      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
        {selectedNetwork.name}
      </span>
    );
  };

  const getNetworkDisplay = () => {
    if (isSwitchingNetwork && targetNetwork) {
      return (
        <>
          <AiOutlineLoading3Quarters className="animate-spin w-5 h-5 text-blue-400" />
          <span className="text-[14px] font-[400] text-blue-400">
            Switching...
          </span>
        </>
      );
    }

    return (
      <>
        <Image
          src={selectedNetwork.icon || bnbLogo}
          width={24}
          height={24}
          alt={`${selectedNetwork.symbol} logo`}
          className="w-6 h-6"
        />
        <span className="text-[14px] font-[400]">{selectedNetwork.symbol}</span>
      </>
    );
  };

  return (
    <div className="flex items-center justify-between text-white font-[Archivo] px-[100px] py-[25px] min-h-[80px]">
      {/* Left section - Logo */}
      <div className="flex-shrink-0">
        <Image src={logo} width={250} alt="logo" priority />
      </div>

      {/* Center section - Navigation */}
      <div className="flex-1 flex justify-center">
        <ul className="flex gap-6 font-[400] text-[14px] items-center">
          <Link href="/">
            <li className="hover:text-gray-300 transition-colors whitespace-nowrap">
              Token launchpad
            </li>
          </Link>
          <Link href="/LandingPages/CreateLiquidity">
            <li className="hover:text-gray-300 transition-colors whitespace-nowrap">
              Create liquidity
            </li>
          </Link>

          <div className="relative" ref={tradeDropdownRef}>
            <button
              onClick={() => setIsTradeDropdownOpen(!isTradeDropdownOpen)}
              className="flex items-center gap-2 hover:text-gray-300 transition-colors whitespace-nowrap"
            >
              <span>Trade Tokens</span>
              <IoIosArrowDown
                className={`transition-transform ${
                  isTradeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isTradeDropdownOpen && (
              <div className="absolute z-20 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <Link href="/LandingPages/TradeTokens?tab=Swap">
                  <div className="px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer">
                    Swap
                  </div>
                </Link>
                <Link href="/LandingPages/TradeTokens?tab=Send">
                  <div className="px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer">
                    Send
                  </div>
                </Link>
                <Link href="/LandingPages/BuyTokens">
                  <div className="px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer">
                    Buy
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link href="/LandingPages/CreateLiquidity">
            <li className="hover:text-gray-300 transition-colors whitespace-nowrap">
              Tokens Presale
            </li>
          </Link>
          <Link href="/LandingPages/CreateLiquidity">
            <li className="hover:text-gray-300 transition-colors whitespace-nowrap">
              Airdrops
            </li>
          </Link>
        </ul>
      </div>

      {/* Right section - Network selector and wallet */}
      <div className="flex gap-3 items-center flex-shrink-0">
        {/* Network Selector */}
        <div className="relative" ref={tokenDropdownRef}>
          <button
            onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
            className="flex gap-2 items-center w-[140px] px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"
            disabled={isAttemptingConnection || isSwitchingNetwork}
          >
            {getNetworkDisplay()}
            <IoIosArrowDown
              className={`transition-transform ml-auto ${
                isTokenDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isTokenDropdownOpen && (
            <div className="absolute z-20 mt-2 right-0 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {networks.map((network) => (
                <div
                  key={network.id}
                  onClick={() => handleTokenSelect(network)}
                  className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedNetwork.id === network.id ? "bg-gray-800" : ""
                  }`}
                >
                  <Image
                    src={network.icon || "/networks/default.svg"}
                    width={24}
                    height={24}
                    alt={`${network.symbol} logo`}
                    className="w-6 h-6 mr-2"
                  />
                  <span className="text-[14px]">{network.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Button */}
        <button
          onClick={handleWalletClick}
          className={`font-[600] text-[14px] rounded-lg px-4 py-2 flex items-center cursor-pointer transition-all whitespace-nowrap ${
            isConnected
              ? "bg-gray-800 hover:bg-gray-700 text-white min-w-[160px]"
              : "bg-red-900 hover:bg-red-800 text-red-200"
          } ${
            isAttemptingConnection ||
            (isSwitchingNetwork && switchFailCount < 3)
              ? "opacity-70 cursor-not-allowed"
              : ""
          }`}
          disabled={
            isAttemptingConnection ||
            (isSwitchingNetwork && switchFailCount < 3)
          }
        >
          {isConnected ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-300">
                  {truncatedAddress(getCurrentAddress())}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  {getWalletBadge()}
                  {getNetworkStatus()}
                </div>
              </div>
            </div>
          ) : (
            "Connect wallet"
          )}
        </button>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};

export default Header;
