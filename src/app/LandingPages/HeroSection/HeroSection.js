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
        className="bg-cover bg-[rgba(10, 10, 10, 0.1)] bg-center min-h-screen px-4 sm:px-6 md:px-8 lg:mx-[100px]"
        style={{ backgroundImage: `url(${Blurlayer.src})` }}
      >
        <h1 className="font-[Archivo] text-white font-extrabold text-[56px] sm:text-3xl md:text-4xl lg:text-6xl sm:leading-[64px] lg:leading-tight text-center mx-auto w-full sm:w-[80%] md:w-[70%] lg:w-[50%] pt-10 pb-5">
          Create, Launch, and Scale Your Crypto Project
        </h1>
        <StepperForm/>
        
        <section className='text-white mt-10 md:mt-20'>
          <h1 className='text-[#fff] font-[800] text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[Archivo] w-full lg:w-[52%] mb-6'>
            Build the Future of DeFi with Salamanda
          </h1>
          <div className='flex flex-col lg:flex-row justify-between items-center gap-5 bg-[#331100] rounded-2xl p-4 sm:p-6 md:p-8'>
            <div className='w-full lg:w-1/2'>
              <h1 className='text-[#D44802] font-[800] text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-[Archivo] leading-tight'>
                Create Tokens & Liquidity Pools
              </h1>
              <p className='text-[#A23702] font-[600] text-base sm:text-lg md:text-[20px] font-[Archivo] leading-relaxed mt-4'>
                Launch your own token in minutes and pair it with instant liquidity—no coding needed.
              </p>
            </div>
            <div className='w-full lg:w-1/2 mt-6 lg:mt-0'>
              <Image src={Create} width={2550} alt='create-token-img' className='w-full h-auto'/>
            </div>
          </div>
        </section>

        <section className='flex flex-col lg:flex-row font-[Archivo] justify-between text-white gap-5 mt-10'>
          <div className='w-full lg:w-1/2 px-4 sm:px-6 md:px-8 py-6 md:py-8 bg-[#002920] rounded-2xl'>
            <div>
              <h1 className='font-[Archivo] text-[#00A885] font-[600] text-2xl sm:text-3xl md:text-[32px] leading-tight'>
                Distribute with Airdrops
              </h1>
              <p className='font-[Archivo] text-[#007059] font-[600] text-base sm:text-lg md:text-[20px] leading-relaxed mt-4'>
                Reward your community or grow your project with seamless, customizable airdrops.
              </p>
            </div>
            <div className='m-auto mt-6 md:mt-[49px]'>
              <Image src={airdrop} alt='airdrop' className='w-full h-auto'/>
            </div>
          </div>
          
          <div className='w-full lg:w-1/2 px-4 sm:px-6 md:px-8 py-6 md:py-8 bg-[#291F00] rounded-2xl mt-6 lg:mt-0'>
            <div>
              <h1 className='font-[Archivo] text-[#E5AF00] font-[600] text-2xl sm:text-3xl md:text-[32px] leading-tight'>
                Manage Your Wallet
              </h1>
              <p className='font-[Archivo] text-[#A37D00] font-[600] text-base sm:text-lg md:text-[20px] leading-relaxed mt-4'>
                A secure, multi-chain wallet to store, swap, and track all your assets in one place.
              </p>
            </div>
            <div className='m-auto mt-6'>
              <Image src={wallet} alt='wallet' className='w-full h-auto'/>
            </div>
          </div>
        </section>
        
        <TrustedDev/>
        <Footer/>
      </div>
    </div>
  );
};

export default HeroSection;
