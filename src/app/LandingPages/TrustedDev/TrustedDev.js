import React from 'react'

const TrustedDev = () => {
  return (
          <section className="bg-black font-[Archivo] text-white py-20 my-10 px-3 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-15">
              {/* Left Side */}
              <div className="flex flex-col justify-center">
                <h2 className="text-[56px]  font-[800] leading-[64px] mb-30">
                  Trusted by <br /> Developers
                </h2>
                <p className="text-[20px] text-[#c7c3c3] font-[400] leading-[24px] max-w-xl">
                  From innovative startups to large-scale projects, Salamanda powers crypto builders across the world with
                  intuitive tools, reliable security, and deep liquidity access.
                  <br />
                  Join a global community of developers turning ideas into live projects.
                </p>
              </div>
      
              {/* Right Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Box 1 */}
                <div className="bg-[#141414] rounded-lg p-6">
                  <p className="text-[#4a4a4a] text-[18px] mb-2">All time volume</p>
                  <p className="text-[56px] font-[800] leading-[64px] mt-12">$20.1K</p>
                </div>
      
                {/* Box 2 */}
                <div className="bg-[#141414] rounded-lg p-6">
                  <p className="text-[#4a4a4a] text-[18px] mb-2">Tokens distributed</p>
                  <p className="text-[56px] font-[800] leading-[64px] mt-12">1.8M</p>
                </div>
      
                {/* Box 3 (Duplicate of 1 for symmetry) */}
                <div className="bg-[#141414] rounded-lg p-6">
                  <p className="text-[#4a4a4a] text-[18px]mb-2">All time volume</p>
                  <p className="text-[56px] font-[800] leading-[64px] mt-12">$20.1K</p>
                </div>
      
                {/* Box 4 */}
                <div className="bg-[#190101] rounded-lg p-6">
                  <p className="font-[600] text-[18px] mb-2 text-[#C50404]">24H volume</p>
                  <p className="text-[56px] text-[#C50404]  font-[800] leading-[64px] mt-12">$9.3K</p>
                </div>
              </div>
            </div>
          </section>
      

  )
}

export default TrustedDev