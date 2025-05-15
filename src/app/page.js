import Image from "next/image";
import LandingPage from "./LandingPages/page";
import localFont from "next/font/local";

const archivo = localFont({
  src: "../fonts/Archivo/Archivo-VariableFont_wdth,wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export default function Home() {
  return (
    <div className={`${archivo.variable}`}>
      <LandingPage/>
    </div>
  );
}
