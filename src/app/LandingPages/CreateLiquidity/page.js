import React from 'react'
import Header from '../Headers/Header'
import Footer from '../Footer/Footer'
import TrustedDev from '../TrustedDev/TrustedDev'
import LiquidityForm from '../LiquidityForm/LiquidityForm'

const CreateLiquidity = () => {
  return (
    <div>
        <Header/>
             <div>
             <h1 className='font-[Archivo] text-white font-[800] text-[64px] leading-[64px] m-auto text-center w-[40%] pt-15 pb-5'>Create liquidity pool</h1>
             <LiquidityForm/>
             </div>
             <TrustedDev/>
             <Footer/>

    </div>
  )
}

export default CreateLiquidity