"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  sepolia,
  polygonAmoy,
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  bscTestnet,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { EvmProvider } from "../app/context/evmContext";
import { NetworkProvider } from "../app/context/networkContext";
import { SolanaProvider } from "../app/context/solanaContext";
import { TokenCreationProvider } from "../app/context/tokenCreationContext";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [
    sepolia,
    polygonAmoy,
    arbitrumSepolia,
    avalancheFuji,
    baseSepolia,
    bscTestnet,
  ],
  connectors: [injected(), coinbaseWallet({ appName: "Salamanda" })],
  transports: {
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [arbitrumSepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
  },
});

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <EvmProvider>
            <SolanaProvider>
              <TokenCreationProvider>{children}</TokenCreationProvider>
            </SolanaProvider>
          </EvmProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
