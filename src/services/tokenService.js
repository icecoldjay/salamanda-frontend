// tokenSendService.js
import { ethers } from "ethers";

// Network-specific token configurations
export const NETWORK_TOKENS = {
  // BSC (Chain ID: 56)
  56: {
    networkName: "BSC",
    nativeToken: {
      symbol: "BNB",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDT: {
        address: "0x55d398326f99059fF775485246999027B3197955",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
      },
      USDC: {
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        symbol: "USDC",
        decimals: 18,
        name: "USD Coin",
      },
      BUSD: {
        address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        symbol: "BUSD",
        decimals: 18,
        name: "Binance USD",
      },
    },
  },
  // Ethereum (Chain ID: 1)
  1: {
    networkName: "Ethereum",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDT: {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
      },
      USDC: {
        address: "0xA0b86a33E6411976c0c7385B9D16F1d78bB1b31A",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
      },
      DAI: {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
    },
  },
  // Sepolia Testnet (Chain ID: 11155111)
  11155111: {
    networkName: "Sepolia",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDC: {
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin (Testnet)",
      },
      USDT: {
        address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD (Testnet)",
      },
      DAI: {
        address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin (Testnet)",
      },
      LINK: {
        address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        symbol: "LINK",
        decimals: 18,
        name: "Chainlink Token (Testnet)",
      },
      WETH: {
        address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        symbol: "WETH",
        decimals: 18,
        name: "Wrapped Ether (Testnet)",
      },
    },
  },
  // Polygon (Chain ID: 137)
  137: {
    networkName: "Polygon",
    nativeToken: {
      symbol: "MATIC",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDT: {
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
      },
      USDC: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
      },
      DAI: {
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
    },
  },
  // Arbitrum (Chain ID: 42161)
  42161: {
    networkName: "Arbitrum",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDT: {
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
      },
      USDC: {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
      },
      ARB: {
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        symbol: "ARB",
        decimals: 18,
        name: "Arbitrum",
      },
    },
  },
  // Base (Chain ID: 8453)
  8453: {
    networkName: "Base",
    nativeToken: {
      symbol: "ETH",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDC: {
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
      },
      DAI: {
        address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
    },
  },
  // Avalanche (Chain ID: 43114)
  43114: {
    networkName: "Avalanche",
    nativeToken: {
      symbol: "AVAX",
      decimals: 18,
      isNative: true,
    },
    tokens: {
      USDT: {
        address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
      },
      USDC: {
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
      },
      DAI: {
        address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
    },
  },
};

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

class TokenSendService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.chainId = null;
  }

  // Initialize with wallet provider
  async initialize(provider, chainId) {
    try {
      this.provider = new ethers.BrowserProvider(provider);
      this.signer = await this.provider.getSigner();
      this.chainId = chainId;
      return { success: true };
    } catch (error) {
      console.error("Failed to initialize TokenSendService:", error);
      return { success: false, error: error.message };
    }
  }

  // Get supported tokens for current network
  getSupportedTokens() {
    const networkConfig = NETWORK_TOKENS[this.chainId];
    if (!networkConfig) {
      return { nativeToken: null, tokens: {} };
    }

    return {
      nativeToken: networkConfig.nativeToken,
      tokens: networkConfig.tokens,
    };
  }

  // Get token balance
  async getTokenBalance(tokenSymbol, userAddress) {
    try {
      const networkConfig = NETWORK_TOKENS[this.chainId];
      if (!networkConfig) {
        throw new Error(`Unsupported network with chain ID: ${this.chainId}`);
      }

      console.log(
        `Getting balance for ${tokenSymbol} on network ${networkConfig.networkName} (${this.chainId})`
      );

      // Handle native token
      if (tokenSymbol === networkConfig.nativeToken.symbol) {
        const balance = await this.provider.getBalance(userAddress);
        return {
          success: true,
          balance: ethers.formatEther(balance),
          decimals: 18,
        };
      }

      // Handle ERC20 tokens
      const tokenConfig = networkConfig.tokens[tokenSymbol];
      if (!tokenConfig) {
        throw new Error(
          `Token ${tokenSymbol} not supported on ${networkConfig.networkName} network`
        );
      }

      console.log(`Token config found:`, tokenConfig);

      // Verify the contract exists by checking if it has code
      //   const code = await this.provider.getCode(tokenConfig.address);
      //   if (code === "0x") {
      //     throw new Error(
      //       `No contract found at address ${tokenConfig.address} for token ${tokenSymbol}`
      //     );
      //   }

      const tokenContract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        this.provider
      );

      try {
        // Try to get the balance
        const balance = await tokenContract.balanceOf(userAddress);
        const formattedBalance = ethers.formatUnits(
          balance,
          tokenConfig.decimals
        );

        console.log(`Balance for ${tokenSymbol}: ${formattedBalance}`);

        return {
          success: true,
          balance: formattedBalance,
          decimals: tokenConfig.decimals,
        };
      } catch (contractError) {
        console.error(
          `Contract call failed for ${tokenSymbol}:`,
          contractError
        );

        // Try to get more info about the contract
        try {
          const symbol = await tokenContract.symbol();
          const decimals = await tokenContract.decimals();
          console.log(
            `Contract info - Symbol: ${symbol}, Decimals: ${decimals}`
          );
        } catch (infoError) {
          console.error("Failed to get contract info:", infoError);
        }

        throw new Error(
          `Failed to get balance for ${tokenSymbol}: ${contractError.message}`
        );
      }
    } catch (error) {
      console.error("Error getting token balance:", error);
      return { success: false, error: error.message };
    }
  }

  // Estimate gas for transaction
  async estimateGas(tokenSymbol, toAddress, amount) {
    try {
      const networkConfig = NETWORK_TOKENS[this.chainId];
      if (!networkConfig) {
        throw new Error("Unsupported network");
      }

      // Handle native token
      if (tokenSymbol === networkConfig.nativeToken.symbol) {
        const gasEstimate = await this.provider.estimateGas({
          to: toAddress,
          value: ethers.parseEther(amount.toString()),
        });

        const feeData = await this.provider.getFeeData();
        const gasCost = gasEstimate * feeData.gasPrice;

        return {
          success: true,
          gasEstimate: gasEstimate.toString(),
          gasCostEth: ethers.formatEther(gasCost),
          feeData,
        };
      }

      // Handle ERC20 tokens
      const tokenConfig = networkConfig.tokens[tokenSymbol];
      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not supported on this network`);
      }

      const tokenContract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        this.signer
      );

      const parsedAmount = ethers.parseUnits(
        amount.toString(),
        tokenConfig.decimals
      );
      const gasEstimate = await tokenContract.transfer.estimateGas(
        toAddress,
        parsedAmount
      );

      const feeData = await this.provider.getFeeData();
      const gasCost = gasEstimate * feeData.gasPrice;

      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasCostEth: ethers.formatEther(gasCost),
        feeData,
      };
    } catch (error) {
      console.error("Error estimating gas:", error);
      return { success: false, error: error.message };
    }
  }

  // Send native token (ETH, BNB, MATIC, etc.)
  async sendNativeToken(toAddress, amount) {
    try {
      if (!ethers.isAddress(toAddress)) {
        throw new Error("Invalid recipient address");
      }

      const value = ethers.parseEther(amount.toString());

      const transaction = {
        to: toAddress,
        value: value,
      };

      const tx = await this.signer.sendTransaction(transaction);

      return {
        success: true,
        txHash: tx.hash,
        transaction: tx,
      };
    } catch (error) {
      console.error("Error sending native token:", error);
      return { success: false, error: error.message };
    }
  }

  // Send ERC20 token
  async sendERC20Token(tokenSymbol, toAddress, amount) {
    try {
      if (!ethers.isAddress(toAddress)) {
        throw new Error("Invalid recipient address");
      }

      const networkConfig = NETWORK_TOKENS[this.chainId];
      const tokenConfig = networkConfig.tokens[tokenSymbol];

      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not supported on this network`);
      }

      const tokenContract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        this.signer
      );

      const parsedAmount = ethers.parseUnits(
        amount.toString(),
        tokenConfig.decimals
      );

      const tx = await tokenContract.transfer(toAddress, parsedAmount);

      return {
        success: true,
        txHash: tx.hash,
        transaction: tx,
      };
    } catch (error) {
      console.error("Error sending ERC20 token:", error);
      return { success: false, error: error.message };
    }
  }

  // Main send function that handles both native and ERC20 tokens
  async sendToken(tokenSymbol, toAddress, amount) {
    try {
      const networkConfig = NETWORK_TOKENS[this.chainId];
      if (!networkConfig) {
        throw new Error("Unsupported network");
      }

      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error("Invalid amount");
      }

      // Check if it's native token
      if (tokenSymbol === networkConfig.nativeToken.symbol) {
        return await this.sendNativeToken(toAddress, amount);
      } else {
        return await this.sendERC20Token(tokenSymbol, toAddress, amount);
      }
    } catch (error) {
      console.error("Error in sendToken:", error);
      return { success: false, error: error.message };
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        confirmations
      );
      return {
        success: true,
        receipt,
        confirmed: receipt.status === 1,
      };
    } catch (error) {
      console.error("Error waiting for transaction:", error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction status
  async getTransactionStatus(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        success: true,
        transaction: tx,
        receipt,
        status: receipt
          ? receipt.status === 1
            ? "confirmed"
            : "failed"
          : "pending",
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return { success: false, error: error.message };
    }
  }

  // Validate address
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Format token amount for display
  formatTokenAmount(amount, decimals = 18, precision = 6) {
    try {
      const num = parseFloat(amount);
      if (num === 0) return "0";

      // For very small amounts, show more precision
      if (num < 0.000001) {
        return num.toExponential(2);
      }

      // For normal amounts, limit decimal places
      return num.toFixed(Math.min(precision, decimals));
    } catch (error) {
      return "0";
    }
  }
}

// Export singleton instance
export const tokenSendService = new TokenSendService();

// Utility functions for frontend integration
export const tokenUtils = {
  // Get all available tokens for a network
  getNetworkTokens: (chainId) => {
    const config = NETWORK_TOKENS[chainId];
    if (!config) return null;

    const allTokens = [
      { ...config.nativeToken, isNative: true },
      ...Object.values(config.tokens).map((token) => ({
        ...token,
        isNative: false,
      })),
    ];

    return allTokens;
  },

  // Format display name for token
  getTokenDisplayName: (tokenSymbol, chainId) => {
    const config = NETWORK_TOKENS[chainId];
    if (!config) return tokenSymbol;

    if (tokenSymbol === config.nativeToken.symbol) {
      return `${tokenSymbol} (Native)`;
    }

    const token = config.tokens[tokenSymbol];
    return token ? `${token.symbol} (${token.name})` : tokenSymbol;
  },

  // Check if token is supported on network
  isTokenSupported: (tokenSymbol, chainId) => {
    const config = NETWORK_TOKENS[chainId];
    if (!config) return false;

    return (
      tokenSymbol === config.nativeToken.symbol ||
      Object.keys(config.tokens).includes(tokenSymbol)
    );
  },

  // Get token icon/logo (you can extend this with actual icon URLs)
  getTokenIcon: (tokenSymbol, chainId) => {
    // This can be extended to return actual token icon URLs
    const iconMap = {
      BNB: "/icons/bnb.svg",
      ETH: "/icons/eth.svg",
      MATIC: "/icons/matic.svg",
      AVAX: "/icons/avax.svg",
      USDT: "/icons/usdt.svg",
      USDC: "/icons/usdc.svg",
      DAI: "/icons/dai.svg",
      BUSD: "/icons/busd.svg",
      ARB: "/icons/arb.svg",
    };

    return iconMap[tokenSymbol] || "/icons/default-token.svg";
  },
};
