import React from 'react'
import Header from '../Headers/Header'
import Footer from '../Footer/Footer'
import TrustedDev from '../TrustedDev/TrustedDev'
import LiquidityForm from '../LiquidityForm/LiquidityForm'
// import SwapPage from './TradeTokens'
import TradeTokens from './TradeTokens'

const TradeTokenPage = () => {
  return (
    <div>
        <Header/>
             <div>
             <TradeTokens/>
             </div>
             <TrustedDev/>
             <Footer/>

    </div>
  )
}

export default TradeTokenPage