"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const PlatformPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-[88px] py-12">
      <div className="bg-white text-gray-900">
        {/* Hero Section */}
        <section className="bg-black text-white py-20 px-6 text-center mb-12">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Trade Anywhere, Anytime — With Advanced Tools Built for Every Trader
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-2xl mb-8"
          >
            Experience the power of WebTrader, Mobile Apps (iOS & Android), and
            Advanced Trading Tools including charts, indicators, copy trading,
            and EA support — all designed to help you trade smarter.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-x-4"
          >
            <button className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition">
              🚀 Start Trading Now – Open Live Account
            </button>
            <button className="px-6 py-3 border rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition">
              📱 Download App
            </button>
          </motion.div>
        </section>

        {/* WebTrader Section */}
        <section className="py-16 px-6 max-full mx-auto bg-[#F0B100] rounded-2xl shadow-md mb-12">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-6"
          >
            WebTrader – Trade Directly from Your Browser
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-8"
          >
            Access the markets instantly with TradeFair.live WebTrader — no
            downloads required. Trade Forex, Commodities, Indices, Stocks, and
            Cryptocurrencies directly from your browser with fast execution,
            real-time charts, and full account management.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            {[
              "Secure, browser-based platform with one-click trading",
              "Advanced charting tools and built-in indicators",
              "Works seamlessly across Windows, Mac & Linux",
              "Instant access to your live & demo accounts",
              "Syncs automatically with mobile and desktop apps",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-black text-white rounded-xl shadow hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 bg-black text-[#FDC700] font-semibold rounded-xl shadow-md hover:bg-gray-900 transition">
              🌐 Launch WebTrader Now
            </button>
          </div>
        </section>

        {/* Mobile Trading Apps */}
        <section className="py-16 px-6 max-w-full mx-auto bg-black text-white rounded-2xl shadow-md mb-12">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-6"
          >
            Mobile Trading Apps (iOS & Android)
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-8"
          >
            Trade on the go with the TradeFair.live Mobile App available on both
            iOS and Android. Get the same speed, stability, and advanced tools
            as the desktop platform in the palm of your hand.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            {[
              "Intuitive, user-friendly interface",
              "Real-time quotes, charts & indicators",
              "Place, modify, and close orders instantly",
              "Push notifications for price alerts & trade updates",
              "Secure login with Face ID / Fingerprint authentication",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-[#F0B100] text-black rounded-xl shadow hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10 space-x-4">
            <button className="px-6 py-3 bg-white text-black font-semibold rounded-xl shadow-md hover:bg-gray-200 transition">
              📲 Download on App Store
            </button>
            <button className="px-6 py-3 bg-[#F0B100] text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition">
              🤖 Get it on Google Play
            </button>
          </div>
        </section>

        {/* Advanced Tools */}
        <section className="py-16 px-6 max-w-full mx-auto bg-[#F0B100] rounded-2xl shadow-md mb-12">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-6"
          >
            Advanced Tools for Smarter Trading
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center text-lg mb-10"
          >
            Stay ahead of the markets with professional-grade trading tools
            that give you the edge in decision-making and execution.
          </motion.p>

          {/* Three Blocks */}
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 bg-black text-white rounded-xl shadow hover:-translate-y-2 transition-all duration-500"
            >
              <h3 className="font-bold text-xl mb-4">🔹 Charts & Indicators</h3>
              <ul className="space-y-2 text-left">
                <li>Interactive, multi-timeframe charts</li>
                <li>50+ built-in indicators (RSI, MACD, etc.)</li>
                <li>Drawing tools (trendlines, Fibonacci, channels)</li>
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 bg-black text-white rounded-xl shadow hover:-translate-y-2 transition-all duration-500"
            >
              <h3 className="font-bold text-xl mb-4">🔹 Copy Trading</h3>
              <ul className="space-y-2 text-left">
                <li>Follow and copy top-performing traders</li>
                <li>Build strategy portfolios automatically</li>
                <li>Transparent performance & risk tracking</li>
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 bg-black text-white rounded-xl shadow hover:-translate-y-2 transition-all duration-500"
            >
              <h3 className="font-bold text-xl mb-4">🔹 EA (Expert Advisor) Support</h3>
              <ul className="space-y-2 text-left">
                <li>Automate trades with algorithms</li>
                <li>Back-test with historical data</li>
                <li>Full integration with live & demo accounts</li>
              </ul>
            </motion.div>
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 bg-black text-[#FDC700] font-semibold rounded-xl shadow-md hover:bg-gray-900 transition">
              ⚡ Explore Advanced Tools & Copy Trading Now
            </button>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 px-6 max-w-full mx-auto bg-black text-white rounded-2xl shadow-md mb-12">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-8"
          >
            Why Choose TradeFair.live Platforms?
          </motion.h2>

          <div className="grid md:grid-cols-2  gap-6 text-center">
            {[
              "Seamless Access Across Devices — Web, Mobile & Desktop",
              "Institutional-Grade Execution — Raw spreads from 0.0 pips",
              "Security & Reliability — Encrypted, regulated infrastructure",
              "Beginner-Friendly & Pro-Ready — Easy yet powerful tools",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-[#F0B100] text-black rounded-xl shadow hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-6 py-3 bg-white text-black font-semibold rounded-xl shadow-md hover:bg-gray-200 transition">
              💡 Open Free Demo Account Today
            </button>
          </div>
        </section>

        {/* Final Conversion */}
        <section className="py-20 px-6 text-center bg-[#F0B100] text-black rounded-2xl shadow-md">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Ready to Trade Smarter with the Right Tools?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl mb-8 max-w-3xl mx-auto"
          >
            TradeFair.live provides you with the most advanced trading platforms
            and tools — accessible anytime, anywhere. Whether you’re a beginner
            or a professional trader, our WebTrader, Mobile Apps, and Advanced
            Tools are designed to empower your trading journey.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-x-4"
          >
            <button className="px-8 py-4 bg-black text-white font-semibold rounded-xl shadow-md hover:bg-gray-900 transition">
              🔥 Start Live Trading
            </button>
            <button className="px-8 py-4 bg-white text-black font-semibold rounded-xl shadow-md hover:bg-gray-200 transition">
              🧪 Try Demo for Free
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default PlatformPage;
