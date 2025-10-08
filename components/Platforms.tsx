import Image from "next/image";
import Link from "next/link";
import PaymentOptions from "@/components/PaymentOptions";
import tradingImage  from ".././public/crypto_hero2.png"

const Platforms = () => {
  return (
    <section className="py-16 bg-[#121212]">
      <div className="w-full bg-[#ffb80c] py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-black leading-tight max-w-6xl mx-auto">
            Experience The World Class Trading Platform Which Is Quick, Secure & Reliable
          </h2>
        </div>
      </div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VHJhZGVyfGVufDB8fDB8fHww"
                alt="Tradefair Trader Trading Platform on Multiple Devices"
                width={700}
                height={450}
                className="w-full h-auto rounded-lg shadow-xl"
                priority
              />
              <div className="absolute top-4 left-4 flex items-center space-x-4">

                <div className="flex space-x-2">
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center shadow-md border border-[#252525]">
                    <span className="text-[#f0b90b] text-xl font-bold">W</span>
                  </div>
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center shadow-md border border-[#252525]">
                    <span className="text-gray-300 text-xl font-bold">iOS</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center mb-6">
                <div>
                  <Image src="/logo.jpeg" alt="tradefair Logo" className="h-20 w-auto rounded-2xl " width={150} height={40}/>
                </div><br />

                
                <h3 className="text-3xl font-bold text-[#18181a]"> Tradefair Trader</h3>
              </div>
              <p className="text-[#18181a]/80 text-lg mb-8 leading-relaxed">
                With Tradefair Trader, you can trade a wide range of asset classes including Forex, 
                Shares, Commodities, Indices, and Energies. All from one unified
                platform for a seamless trading experience. It also features advanced
                auto trading systems, technical tools, and copy trading for enhanced
                trading efficiency.
              </p>
              <Link 
                href="" 
                className="inline-flex items-center bg-[#18181a] text-[#ffb80c] font-medium px-8 py-4 rounded-md hover:bg-[#18181a]/90 transition-all duration-300 transform hover:-translate-y-1"
              >
                Get Started <span className="ml-2">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* <>
       <TradingTabs />
      </> */}

     <PaymentOptions />

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center mt-32">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">Tradefair Trading App</h3>
            <p className="text-[#f0b90b] font-medium text-xl mb-6">LAUNCHING SOON...</p>
            <p className="text-gray-400 text-lg mb-6 leading-relaxed max-w-md">
              This powerful, award-winning, multi-asset trading platform is the perfect choice for the modern
              trader. It offers a wide range of features and tools to help you trade
              <br />
              <span className="text-[#f0b90b] font-medium">Stay tuned for updates!</span>
              <br />
              <span className="text-gray-400">More features coming soon!</span>
              <br />
              <span className="text-gray-400">Join our newsletter for the latest news!</span>
              <br />
              <span className="text-gray-400">Stay updated with our latest offers!</span>
            </p>
          </div>
          <div className="relative">
            <Image
              src={tradingImage}
              alt="Tradefair Trader Mobile Trading App Preview"
              width={800}
              height={500}
              className="w-full h-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>

    
  );
};

export default Platforms;