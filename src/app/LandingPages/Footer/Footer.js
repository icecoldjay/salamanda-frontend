"use client"
import { useEffect, useState } from "react";
import {
    FaTwitter,
    FaTelegramPlane,
    FaDiscord,
  } from "react-icons/fa";
  import Salweb from "../../images/Sal-web.png"
  import Salmobile from "../../images/Sal-mobile.png"
  
  export default function Footer() {
    const [bgImage, setBgImage] = useState(Salweb.src);

  useEffect(() => {
    const updateBackground = () => {
      if (window.innerWidth < 768) {
        setBgImage(Salmobile.src);
      } else {
        setBgImage(Salweb.src);
      }
    };

    updateBackground(); // Initial check
    window.addEventListener('resize', updateBackground); // Listen to window resize
    return () => window.removeEventListener('resize', updateBackground); // Cleanup
  }, []);

    return (
      <footer className=" text-white px-3 py-12 lg:px-30 font-[Archivo]" 
          // className="bg-cover bg-[rgba(10,10,10,0.1)] bg-center min-h-screen px-4 sm:px-6 md:px-8 lg:mx-[100px] flex flex-col"
          style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'contain', // optional alternative to 'cover'
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-2 lg:gap-x-[30px] mb-8 text-sm">
          {/* Quick Links */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white ">
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px] ">Trade tokens</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px] ">Create airdrop</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px] ">Liquidity pools</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px] ">Docs</a></li>
            </ul>
          </div>
  
          {/* Company */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Company</h4>
            <ul className="space-y-2 text-white">
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px]">About us</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px]">Careers</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px]">Blog</a></li>
            </ul>
          </div>
  
          {/* Support */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px]">Help center</a></li>
              <li className="mb-4"><a href="#" className="font-[400] text-[14px] leading-[20px]">Contact</a></li>
            </ul>
          </div>
  
          {/* Socials */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Socials</h4>
            <ul className="space-y-2 text-white">
              <li className="flex items-center gap-2 mb-4">
                <FaTwitter size={24}/> <a href="#" className="font-[400] text-[14px] leading-[20px]">Twitter</a>
              </li>
              <li className="flex items-center gap-2 mb-4">
                <FaTelegramPlane size={24}/> <a href="#" className="font-[400] text-[14px] leading-[20px]">Telegram</a>
              </li>
              <li className="flex items-center gap-2 mb-4">
                <FaDiscord size={24}/> <a href="#" className="font-[400] text-[14px] leading-[20px]">Discord</a>
              </li>
            </ul>
          </div>
        </div>
  
        <div className="border-t border-[#2e2e2e] pt-6 flex flex-col md:flex-row justify-between text-white text-sm">
          <p className="font-[400] text-[14px] leading-[20px]">© 2025 - Candid Labs</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white font-[400] text-[14px] leading-[20px]">Terms & Conditions</a>
            <a href="#" className="hover:text-white font-[400] text-[14px] leading-[20px]">Privacy policy</a>
          </div>
        </div>
      </footer>
    );
  }
  