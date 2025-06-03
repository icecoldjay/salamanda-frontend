import React from 'react'
import Header from './Headers/Header'
import HeroSection from './HeroSection/HeroSection'
import TrustedDev from './TrustedDev/TrustedDev'

const LandingPage = () => {
  return (
    <div className='bg-[#0f0f0f]'>
        <Header/>
        <HeroSection/>
        {/* <TrustedDev/> */}
    </div>
  )
}

export default LandingPage