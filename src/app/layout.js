import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
import localFont from "next/font/local";
// import Benefits from '../Benefits/Benefits'
// import font from "../fonts/Archivo/Archivo-VariableFont_wdth,wght.ttf"

const archivo = localFont({
  src: "../fonts/Archivo/Archivo-VariableFont_wdth,wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata = {
  title: "Salamanda - Create, Launch, and Scale Your Crypto Project",
  description: "Launch your own token in minutes and pair it with instant liquidity—no coding needed.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${archivo.variable} antialiased min-h-screen bg-[#0F0F0F] text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
