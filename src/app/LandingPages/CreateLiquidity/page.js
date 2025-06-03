import React from 'react'
import Header from '../Headers/Header'
import Footer from '../Footer/Footer'
import TrustedDev from '../TrustedDev/TrustedDev'
import LiquidityForm from '../LiquidityForm/LiquidityForm'
import localFont from "next/font/local";
import Benefits from '../Benefits/Benefits'

const archivo = localFont({
  src: "../../../fonts/Archivo/Archivo-VariableFont_wdth,wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const CreateLiquidity = () => {
  return (
    <div className={`${archivo.variable}`}>
        <Header/>
             <div className='mx-auto sm:px-2'>
              <h1 className="font-[Archivo] text-white font-[800] text-[56px] sm:text-2xl md:text-4xl lg:text-6xl sm:leading-[40px] lg:leading-[64px] text-center mx-auto w-full sm:w-[80%] md:w-[70%] lg:w-[40%] pt-10 pb-5">
                Create liquidity pool
              </h1>

             {/* <h1 className='font-[Archivo] text-white font-[800] text-[64px] leading-[64px] m-auto text-center w-[40%] pt-15 pb-5'>Create liquidity pool</h1> */}
             <LiquidityForm/>
             </div>
             

    </div>
  )
}

export default CreateLiquidity