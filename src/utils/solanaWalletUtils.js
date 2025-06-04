// File: useSolanaWallets.ts (or inline in a component)

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Generate a single wallet
 */
function generateWallet() {
  const keypair = Keypair.generate();
  const privateKey = bs58.encode(keypair.secretKey);

  return {
    publicKey: keypair.publicKey.toString(),
    privateKey,
  };
}

/**
 * Generate multiple wallets
 * @param count Number of wallets to generate
 */
export function generateMultipleSolanaWallets(count) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const newWallet = generateWallet();
    wallets.push(newWallet);
  }

  return wallets;
}
