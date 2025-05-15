import { ethers } from "ethers";

export function generateWallets(count = 4) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
    const wallet = ethers.Wallet.fromPhrase(mnemonic);

    wallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: mnemonic,
    });
  }

  return wallets;
}

export function formatWalletsForDownload(wallets) {
  let text = "IMPORTANT - KEEP THIS FILE SECURE AND PRIVATE\n\n";
  text += "WALLET INFORMATION FOR TOKEN DISTRIBUTION\n";
  text += "==========================================\n\n";

  wallets.forEach((wallet, index) => {
    text += `WALLET #${index + 1}\n`;
    text += `Address: ${wallet.address}\n`;
    text += `Private Key: ${wallet.privateKey}\n`;
    text += `Seed Phrase: ${wallet.mnemonic}\n`;
    text += "------------------------------------------\n\n";
  });

  text +=
    "WARNING: Anyone with access to the private keys or seed phrases will have full control of these wallets.\n";
  text += "Store this information securely and never share it with anyone.";

  return text;
}

export function downloadWalletInfo(wallets) {
  const text = formatWalletsForDownload(wallets);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "wallet_info_" + new Date().getTime() + ".txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
