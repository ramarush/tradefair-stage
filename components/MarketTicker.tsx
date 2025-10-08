'use client';

import React from "react";

interface MarketItem {
  symbol: string;
  price: string;
  lastPrice: string;
  change: number;
}

const MarketTicker = () => {
  // Mock data - in a real app this would be fetched from an API
  const markets: MarketItem[] = [
    { symbol: "BTCUSD", price: "117791.17", lastPrice: "117673.33", change: -1.5 },
    { symbol: "EURUSD", price: "1.17511", lastPrice: "1.17497", change: -0.4 },
    { symbol: "GBPUSD", price: "1.35589", lastPrice: "1.35573", change: 0.5 },
    { symbol: "WTI", price: "65.097", lastPrice: "65.067", change: -0.8 },
    { symbol: "#US30", price: "44902.97", lastPrice: "44900.92", change: 0.3 },
    { symbol: "GOLD", price: "3385.28", lastPrice: "3384.94", change: -0.2 },
  ];

  // Duplicate the market items to create a seamless animation
  const allMarkets = [...markets, ...markets, ...markets];

  return (
<div>
          <div className=" bottom-0 left-0 w-full bg-[#ffb80c] py-6 sm:py-8">
          <div className="container mx-auto px-4 ">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center ">
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
        </div>
    <div className="w-full bg-[#0a0a0a] overflow-hidden relative py-2 ">
       
      <div className="ticker-container">
        <div className="ticker-animation">
          {allMarkets.map((market, index) => (
            <div
              key={`${market.symbol}-${index}`}
              className="inline-flex items-center mx-3 rounded-full bg-[#1d1d1d] p-4 overflow-hidden"
              style={{ minWidth: '320px' }}
            >
              {/* Circle with arrow indicator */}
              <div className={`w-14 h-14 rounded-full ${market.change >= 0 ? 'bg-green-800/20' : 'bg-red-800/20'} flex items-center justify-center mr-4`}>
                <span className={`text-2xl ${market.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {market.change >= 0 ? '↑' : '↓'}
                </span>
              </div>
              
              {/* Symbol and price information */}
              <div className="flex flex-col mr-4">
                <span className="text-white font-bold text-lg">{market.symbol}</span>
                <span className="text-gray-400 text-sm">{market.price} / {market.lastPrice}</span>
              </div>
              
              {/* Trade button */}
              <button className="bg-[#1e3a8a] hover:bg-blue-700 transition-colors text-white px-6 py-3 rounded-md text-sm font-semibold ml-auto">
                Trade
              </button>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }
        
        .ticker-animation {
          display: inline-flex;
          gap: 24px;
          animation: ticker 60s linear infinite;
          padding: 6px 0;
        }
        
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </div>

    </div>
  );
};

export default MarketTicker;