

const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#18181a]">
          Trade with confidence on a world-class platform
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#ffb80c] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#18181a]">Multi-Asset Trading</h3>
            <p className="text-gray-700">
              Trade a wide range of markets including Forex, Stocks, Commodities, Indices, and Cryptocurrencies.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#ffb80c] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#18181a]">Lightning-Fast Execution</h3>
            <p className="text-gray-700">
              Experience unmatched trading functionality with fast order execution and real-time market data.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#ffb80c] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#18181a]">Secure & Reliable</h3>
            <p className="text-gray-700">
              Trade with confidence on our secure platform with advanced risk management tools and 24/7 customer support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;