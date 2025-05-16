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
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState(null); // Track the network we're switching to
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTokenDropdownOpen(false);
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
    // This is now just for tracking network state, not automatic switching
    if (isEvmConnected && !isCorrectNetwork) {
      setSwitchFailCount(0); // Reset fail count when network changes
    }
  }, [isEvmConnected, isCorrectNetwork]);

  // Clear switching state if we've successfully switched to the target network
  useEffect(() => {
    if (isSwitchingNetwork && targetNetwork) {
      // Check if switch was successful
      if (
        (isEvmConnected && currentChainId === targetNetwork.chainId) ||
        !isEvmConnected
      ) {
        // Network switch was successful
        setIsSwitchingNetwork(false);
        setTargetNetwork(null);
      }

      // Always set a safety timeout to prevent infinite switching state
      const safetyTimeout = setTimeout(() => {
        if (isSwitchingNetwork) {
          console.log("Network switch timeout - forcing reset of switch state");
          setIsSwitchingNetwork(false);
          setSwitchFailCount((prev) => prev + 1);
        }
      }, 8000); // 8 seconds should be plenty for any network switch

      return () => clearTimeout(safetyTimeout);
    }
  }, [isEvmConnected, currentChainId, isSwitchingNetwork, targetNetwork]);

  const handleTokenSelect = async (network) => {
    // Cancel if switching is already in progress - but provide an escape hatch
    // if switching has been going on for over 5 seconds
    const now = Date.now();
    if (isSwitchingNetwork) {
      if (lastSwitchAttempt && now - lastSwitchAttempt > 5000) {
        // It's been too long - force cancel the previous switching attempt
        console.log("Canceling stuck network switch after timeout");
      } else {
        return; // Still within reasonable time frame, don't allow a new switch
      }
    }

    // Reset switch failure count when user manually selects a network
    setSwitchFailCount(0);
    setLastSwitchAttempt(now);

    // Show switching state immediately
    setIsSwitchingNetwork(true);
    setTargetNetwork(network);
    setIsTokenDropdownOpen(false);

    // Set the selected network (will trigger UI updates)
    setSelectedNetwork(network);

    // If connected to EVM, attempt to switch networks
    if (isEvmConnected) {
      try {
        // Add a timeout to the switch network promise
        const switchWithTimeout = Promise.race([
          switchNetwork(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Network switch timeout")), 7000);
          }),
        ]);

        await switchWithTimeout;
        // The effect will clear the switching state on success
      } catch (error) {
        console.error("Failed to switch network:", error);
        // Keep the target network visible but show failure indication
        setSwitchFailCount((prev) => prev + 1);

        // Clear switching state after a short delay for UX
        setTimeout(() => {
          setIsSwitchingNetwork(false);
        }, 1500);
      }
    } else {
      // For non-EVM or when not connected, clear switching state after a short delay
      // This gives users visual feedback that something is happening
      setTimeout(() => {
        setIsSwitchingNetwork(false);
        setTargetNetwork(null);
      }, 800);
    }
  };

  const handleWalletClick = () => {
    // Reset switch counting when connecting/disconnecting wallet
    setSwitchFailCount(0);
    setLastSwitchAttempt(null);

    if (isConnected) {
      if (isEvmConnected) disconnectEvmWallet();
      if (isSolanaConnected) disconnectSolana();
    } else {
      setIsWalletModalOpen(true);
    }
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

    // If we've failed switching multiple times, show a different message
    if (switchFailCount >= 3 && !isCorrectNetwork) {
      return (
        <div className="ml-2 min-w-20 h-5 flex items-center justify-center">
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
            Switch manually
          </span>
        </div>
      );
    }

    // Fixed-width container for network status badge
    return (
      <div className="ml-2 min-w-20 h-5 flex items-center justify-center">
        {isSwitchingNetwork ? (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded flex items-center">
            <AiOutlineLoading3Quarters className="animate-spin mr-1" />
            Switching
          </span>
        ) : !isCorrectNetwork ? (
          <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
            Wrong Network
          </span>
        ) : (
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
            {selectedNetwork.name}
          </span>
        )}
      </div>
    );
  };

  // Get network display based on current state
  const getNetworkDisplay = () => {
    if (isSwitchingNetwork && targetNetwork) {
      // Show loading state with target network
      return (
        <>
          <div className="flex items-center">
            <AiOutlineLoading3Quarters className="animate-spin mr-2 text-blue-400" />
            <span className="text-[14px] font-[400] text-blue-400">
              Switching...
            </span>
          </div>
        </>
      );
    }

    // Normal state - show selected network
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
    <div className="flex items-center justify-between text-white font-[Archivo] px-[100px] py-[25px]">
      <div className="flex items-center justify-between gap-12">
        <Image src={logo} width={250} alt="logo" priority />

        <ul className="flex gap-6 font-[400] text-[14px]">
          <Link href="/">
            <li className="hover:text-gray-300 transition-colors">
              Token launchpad
            </li>
          </Link>
          <Link href="/LandingPages/CreateLiquidity">
            <li className="hover:text-gray-300 transition-colors">
              Create liquidity
            </li>
          </Link>
        </ul>
      </div>

      <div className="flex gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
            className="flex gap-2 items-center w-[150px] px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"
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
            <div className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
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

        <button
          onClick={handleWalletClick}
          className={`font-[600] text-[14px] rounded-lg px-4 py-2 flex items-center cursor-pointer transition-all ${
            isConnected
              ? "bg-gray-800 hover:bg-gray-700 text-white"
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
            <div className="flex items-center">
              <span className="min-w-[90px] text-center">
                {truncatedAddress(getCurrentAddress())}
              </span>
              <div className="flex items-center ml-2 min-w-16 justify-center">
                {getWalletBadge()}
              </div>
              {getNetworkStatus()}
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
