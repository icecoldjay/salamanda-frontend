import {
    FaTwitter,
    FaTelegramPlane,
    FaDiscord,
  } from "react-icons/fa";
  
  export default function Footer() {
    return (
      <footer className=" text-white px-6 py-12 lg:px-6 font-[Archivo]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm mb-8">
          {/* Quick Links */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Trade tokens</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Create airdrop</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Liquidity pools</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Docs</a></li>
            </ul>
          </div>
  
          {/* Company */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">About us</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Careers</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Blog</a></li>
            </ul>
          </div>
  
          {/* Support */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Help center</a></li>
              <li><a href="#" className="font-[400] text-[14px] leading-[20px]">Contact</a></li>
            </ul>
          </div>
  
          {/* Socials */}
          <div>
            <h4 className="font-[600] text-[24px] leading-[32px] mb-4">Socials</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <FaTwitter /> <a href="#" className="font-[400] text-[14px] leading-[20px]">Twitter</a>
              </li>
              <li className="flex items-center gap-2">
                <FaTelegramPlane /> <a href="#" className="font-[400] text-[14px] leading-[20px]">Telegram</a>
              </li>
              <li className="flex items-center gap-2">
                <FaDiscord /> <a href="#" className="font-[400] text-[14px] leading-[20px]">Discord</a>
              </li>
            </ul>
          </div>
        </div>
  
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between text-gray-500 text-sm">
          <p className="font-[400] text-[14px] leading-[20px]">© 2025 - Candid Labs</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white font-[400] text-[14px] leading-[20px]">Terms & Conditions</a>
            <a href="#" className="hover:text-white font-[400] text-[14px] leading-[20px]">Privacy policy</a>
          </div>
        </div>
      </footer>
    );
  }
  