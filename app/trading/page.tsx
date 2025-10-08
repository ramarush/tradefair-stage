"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const TradingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-[88px] py-12">
      <div className="bg-white text-gray-900">
        {/* Hero Section */}
        <section className="bg-black text-white py-20 px-6 text-center">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Experience Seamless Trading with TradeFair.live
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-2xl mb-8"
          >
            Trade across global markets with zero brokerage, raw spreads from
            0.0 pips, 500× leverage, and lightning-fast execution.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <button className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition">
              Start Trading Now – Open Your Account in 10 Seconds
            </button>
          </motion.div>
        </section>

        {/* Trading Conditions */}
        <section className="py-16 px-6 max-w-full mx-auto bg-[#F0B100]">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-8"
          >
            Transparent, Fair & Competitive Trading Conditions
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-12"
          >
            At TradeFair.live, we believe in keeping trading conditions clear,
            fair, and cost-effective. With zero brokerage, competitive spreads,
            and institutional-grade liquidity, you enjoy maximum value on every
            trade.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            {[
              "Spreads from 0.0 pips on major instruments",
              "Leverage up to 500× to amplify opportunities",
              "Ultra-fast execution with minimal slippage",
              "Zero brokerage on trades, saving you money",
              "Instant deposits & withdrawals, 24/7",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 rounded-2xl shadow-sm bg-black text-white 
                           hover:shadow-xl hover:-translate-y-2 
                           transition-all duration-500 ease-in-out"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 border rounded-xl font-semibold text-[#FDC700] transition bg-black">
              View Full Trading Conditions
            </button>
          </div>
        </section>

        {/* Trading Instruments */}
        <section className="bg-black text-white py-16 px-6">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-8"
          >
            Access Multiple Markets, All in One Platform
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-12"
          >
            Expand your portfolio with a wide range of trading instruments —
            from Indian exchanges like NSE F&O and MCX to global Forex,
            Commodities, Stocks, Indices, and Cryptocurrencies.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            {[
              "Forex — Trade major, minor & exotic currency pairs",
              "Indices — Access global indices (NIFTY, S&P500, NASDAQ, Dow Jones)",
              "Commodities — Gold, Silver, Crude Oil, and MCX contracts",
              "Stocks — Indian equities + US tech giants like Apple, Tesla, Google",
              "Cryptocurrencies — Bitcoin, Ethereum, and more",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 border rounded-2xl shadow-sm bg-[#F0B100] text-black
                           hover:shadow-xl hover:-translate-y-2 
                           transition-all duration-500 ease-in-out"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 border rounded-xl font-semibold bg-[#F0B100] text-black transition">
              Explore All Instruments
            </button>
          </div>
        </section>

        {/* Platforms & Tools */}
        <section className="py-16 px-6 max-w-full mx-auto bg-[#F0B100]">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-8"
          >
            Powerful Trading Platforms, Anytime, Anywhere
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-12"
          >
            Whether you prefer to trade on desktop, web, or mobile,
            TradeFair.live offers modern platforms packed with advanced tools
            for professionals and beginners alike.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            {[
              "WebTrader — Trade directly from your browser, no downloads required",
              "Mobile Apps — iOS & Android apps for trading on the go",
              "Advanced Tools — Technical indicators, real-time charts, economic calendar",
              "Copy Trading — Mirror the strategies of successful traders",
              "Demo Account — Practice in a risk-free environment before going live",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 rounded-2xl shadow-sm bg-black text-white 
                           hover:shadow-xl hover:-translate-y-2 
                           transition-all duration-500 ease-in-out"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 border rounded-xl font-semibold bg-black text-[#FDC700] transition">
              Download Our Platform
            </button>
          </div>
        </section>

        {/* Account Types */}
        <section className="bg-black text-white py-16 px-6">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-8"
          >
            Choose the Right Account for Your Trading Style
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-12"
          >
            We offer flexible account options designed to meet the needs of both
            beginner and professional traders.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              "Standard Account — Best for new traders; zero commission and easy access",
              "Pro Account — Tight raw spreads, deep liquidity, and advanced features",
              "Demo Account — Practice with virtual funds before trading live",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 border rounded-2xl shadow-sm bg-[#F0B100] text-black 
                           hover:shadow-xl hover:-translate-y-2 
                           transition-all duration-500 ease-in-out"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <ul className="text-center mt-8 space-y-2">
            <li>✔ Zero brokerage</li>
            <li>✔ Fast funding & withdrawals</li>
            <li>✔ 24/7 customer support</li>
            <li>✔ Advanced risk management tools</li>
          </ul>
          <div className="text-center mt-10">
            <button className="px-6 py-3 border rounded-xl font-semibold bg-[#F0B100] text-black transition">
              Open an Account Today
            </button>
          </div>
        </section>

        {/* Closing Section */}
        <section className="py-20 px-6 text-center bg-black text-white -mb-12">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Trade with Confidence on TradeFair.live
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl mb-8"
          >
            Join thousands of traders worldwide who trust TradeFair.live for
            its zero brokerage model, advanced technology, diverse instruments,
            and world-class support.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <button className="px-8 py-4 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition">
              Start Trading Now – Register in 10 Seconds
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default TradingPage;
