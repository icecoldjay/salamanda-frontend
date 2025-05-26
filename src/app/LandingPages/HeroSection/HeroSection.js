import React from 'react';
import Header from '../Headers/Header';
import Blurlayer from '../../images/Blurlayer.png'
import CreateTokenForm from '../CreateTokenForm/CreateTokenForm';
import Create from '../../images/create.png'
import Image from 'next/image';
import airdrop from '../../images/airdrop.png'
import wallet from '../../images/Wallet.png'
import TrustedDev from '../TrustedDev/TrustedDev';
import Footer from '../Footer/Footer';
import StepperForm from '../StepperForm/StepperForm';

const HeroSection = () => {
  return (
    <div>
    <div
      className="bg-cover bg-[rgba(10, 10, 10, 0.1)] bg-center h-screen mx-[100px]"
      style={{ backgroundImage: `url(${Blurlayer.src})` }}
    >
      <h1 className="font-[Archivo] text-white font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-center mx-auto w-[90%] sm:w-[80%] md:w-[70%] lg:w-[50%] pt-10 pb-5">
       Create, Launch, and Scale Your Crypto Project
     </h1>
     {/* <h1 className='font-[Archivo] text-white font-[800] text-[64px] leading-[64px] m-auto text-center w-[40%] pt-15 pb-5'>Create, Launch, and Scale Your Crypto Project</h1> */}
      {/* <CreateTokenForm/> */}
      <StepperForm/>
      <section className='text-white mt-30'>
        <h1 className='text-[#fff] font-[800] text-[64px] font-[Archivo] w-[52%]'>Build the Future of DeFi with Salamanda</h1>
        <div className='flex justify-between items-center gap-5 bg-[#331100] rounded-2xl p-8'>
            <div>
                <h1 className='text-[#D44802] font-[800] text-[56px] font-[Archivo] leading-[64px]'>Create Tokens & Liquidity Pools</h1>
                <p className='text-[#A23702] font-[600] text-[20px] font-[Archivo] leading-[24px]'>Launch your own token in minutes and pair it with instant liquidity—no coding needed.</p>
            </div>
            <div>
                <Image src={Create} width={2550} alt='create-token-img'/>
            </div>
        </div>
      </section>

      <section className='flex font-[Archivo] justify-between text-white gap-5 mt-10'>
        <div className=' px-8 py-8 m-auto bg-[#002920] rounded-2xl  '>
            <div>
                <h1 className='font-[Archivo] text-[#00A885] font-[600] text-[32px] leading-[40px]'>Distribute with Airdrops</h1>
                <p className='font-[Archivo] text-[#007059] font-[600] text-[20px] leading-[24px]'>Reward your community or grow your project with seamless, customizable airdrops.</p>
            </div>
            <div className='m-auto mt-[49px]'><Image src={airdrop} alt='airdrop'/></div>
        </div>
        <div className='px-8 py-8 m-auto bg-[#291F00] rounded-2xl '>
            <div className='h-[100px]'>
                <h1 className='font-[Archivo] text-[#E5AF00] font-[600] text-[32px] leading-[40px]'>Manage Your Wallet</h1>
                <p className='font-[Archivo] text-[#A37D00] font-[600] text-[20px] leading-[24px]'>A secure, multi-chain wallet to store, swap, and track all your assets in one place.</p>
            </div>
            <div className='m-auto'><Image src={wallet} alt='airdrop'/></div>
        </div>
        
      </section>
      
        <TrustedDev/>
        <Footer/>
    </div>
    
    </div>
  );
};

export default HeroSection;
