"use client";
import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  return (

    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-0">

      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover "
        src="https://direct-website.azureedge.net/assets/img/svelte-home/hero/buttons/bg-video.webm"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative w-full h-full">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* Right-Side Banner - visible on md+ */}
        <div className="absolute top-12 sm:top-20 md:top-28 right-6 sm:right-16 md:right-24 z-10 text-right text-white hidden md:block">
          <Image
            src="/5-stars-banner.svg"
            alt="Financial Times Investment Awards"
            width={220}
            height={220}
            className="object-contain w-40 sm:w-52 md:w-64"
          />
        </div>

        {/* Centered Hero Content (mobile-first) */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-6">
          <p className="text-sm sm:text-base md:text-lg font-light mb-4 text-center">
            Trusted by Millions of Traders
          </p>

          <div className="text-center space-y-1 md:space-y-2 mb-6 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium leading-tight">
              The World&apos;s
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight">
              Number One Broker
            </h2>
          </div>

          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg transition duration-300 text-base sm:text-lg"
          >
            Trade Like a Pro!
          </Link>
        </div>

        {/* Features Section */}
        {/* <div className="absolute bottom-0 left-0 w-full bg-[#ffb80c] py-6 sm:py-8 z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
              {[
                { title: "✅ Zero Brokerage" },
                { title: "⏰ 24/7 Deposit And Withdrawal" },
                { title: "📈 Upto 500x Margin" },
                { title: "🌎 Indian + US Stocks & Commodities" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center bg-[#1a1a1a] rounded-xl p-4 sm:p-6 shadow-md group"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">
                    <span className="inline-block text-white group-hover:scale-110 transition-transform duration-300">
                      {feature.title.split(" ")[0]}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                    {feature.title.split(" ").slice(1).join(" ")}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    </section>
  
  );
};

export default Hero;