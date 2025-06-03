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
import Benefits from '../Benefits/Benefits';

const HeroSection = () => {
  return (
    <div className=''>
      <div
        className=" bg-center min-h-screen px-4 sm:px-6 md:px-8 lg:mx-[90px] flex flex-col"
          style={{
          backgroundImage: `url(${Blurlayer.src})`,
          backgroundSize: 'contain', // optional alternative to 'cover'
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="font-[Archivo] text-white font-extrabold text-[56px] sm:text-3xl md:text-4xl lg:text-6xl sm:leading-[64px] lg:leading-tight text-center mx-auto w-full sm:w-[80%] md:w-[70%] lg:w-[50%] pt-10 pb-5">
          Create, Launch, and Scale Your Crypto Project
        </h1>
        <StepperForm/>
        
        <Benefits/>
      </div>
        <TrustedDev/>
        <Footer/>
    </div>
  );
};

export default HeroSection;
