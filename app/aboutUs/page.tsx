"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-[88px]">
      {/* Hero Section */}
      <section className="text-center px-6 py-20 bg-black text-white">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          Zero Brokerage. High Leverage. Smarter Trading.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-lg md:text-xl max-w-3xl mx-auto"
        >
          Trade Indian & Global Markets — NSE F&O, MCX Commodities, Forex, US
          Stocks, Indices & Cryptos — all on one secure platform with zero
          brokerage, up to 500× leverage, and instant deposits & withdrawals.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 flex justify-center gap-4 flex-wrap"
        >
          <button className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl shadow hover:bg-yellow-300 transition">
            👉 Open Live Account in 10 Seconds
          </button>
          <button className="px-6 py-3 rounded-xl bg-white text-black shadow hover:bg-gray-200 transition">
            Try Free Demo
          </button>
          <button className="px-6 py-3 rounded-xl bg-white text-black shadow hover:bg-gray-200 transition">
            Download App
          </button>
        </motion.div>
      </section>

      {/* Why Trade Section */}
      <section className="px-6 py-16 bg-[#F0B100]">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Why Trade with TradeFair.live?
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            "Zero Brokerage Across Markets — Save more with every trade.",
            "Up to 500× Margin — Amplify your strategies with flexible leverage.",
            "Raw Spreads from 0.0 pips — Get competitive pricing and tighter costs.",
            "24/7 Instant Funding — Deposits and withdrawals whenever you need.",
            "Lightning-Fast Execution — Institutional-grade liquidity and ultra-low latency.",
            "Global Market Access — NSE F&O, MCX, Forex, US Stocks, Indices, Cryptos & Commodities in one account.",
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-black text-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {item}
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-black text-[#FDC700] font-semibold px-8 py-4 rounded-xl shadow hover:bg-gray-900 transition"
          >
            🚀 Start Trading Today — Zero Brokerage, High Returns
          </motion.button>
        </div>
      </section>

      {/* What You Can Trade */}
      <section className="px-6 py-16 bg-black text-white">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          What You Can Trade
        </motion.h2>
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            "Forex CFDs – Trade global currency pairs with deep liquidity.",
            "Indices – Access major global indices with leverage.",
            "Commodities (MCX & COMEX) – Gold, silver, crude oil & more.",
            "Stocks (India & US) – Trade shares of top companies worldwide.",
            "Cryptocurrencies – Bitcoin, Ethereum & leading digital assets.",
            "NSE Futures & Options (F&O) – Capitalize on India’s most liquid derivatives market.",
          ].map((item, i) => (
            <motion.li
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-[#F0B100] text-black p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {item}
            </motion.li>
          ))}
        </ul>

        <div className="text-center mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl shadow hover:bg-yellow-300 transition"
          >
            📈 Explore All Instruments
          </motion.button>
        </div>
      </section>

      {/* Trading Accounts */}
      <section className="px-6 py-16 bg-[#F0B100]">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Trading Accounts Made Simple
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Standard Account",
              desc: "Easy entry, zero commission, user-friendly.",
            },
            {
              title: "Pro Account",
              desc: "For advanced traders, raw spreads, low trading costs.",
            },
            {
              title: "Demo Account",
              desc: "Practice risk-free with real market conditions.",
            },
          ].map((acc, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-black text-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <h3 className="font-bold text-xl mb-3">{acc.title}</h3>
              <p>{acc.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-black text-[#FDC700] font-semibold px-8 py-4 rounded-xl shadow hover:bg-gray-900 transition"
          >
            📝 Compare Accounts & Start Now
          </motion.button>
        </div>
      </section>

      {/* Platforms & Tools */}
      <section className="px-6 py-16 bg-black text-white">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Powerful Platforms & Tools
        </motion.h2>
        <ul className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            "Intuitive charts & indicators",
            "Automated & copy trading options",
            "Risk management tools",
            "Economic calendar & live news",
          ].map((tool, i) => (
            <motion.li
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-[#F0B100] text-black p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {tool}
            </motion.li>
          ))}
        </ul>
        <div className="text-center mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl shadow hover:bg-yellow-300 transition"
          >
            📲 Download App & Start Trading Anywhere
          </motion.button>
        </div>
      </section>

      {/* Steps to Start */}
      <section className="px-6 py-16 bg-[#F0B100] text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold mb-10"
        >
          Step-by-Step: Start Trading in Minutes
        </motion.h2>
        <motion.ol
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4 text-lg text-gray-800 max-w-2xl mx-auto"
        >
          <li>1️⃣ Register — Open an account in just 10 seconds.</li>
          <li>2️⃣ Fund Instantly — Deposit with UPI, NEFT, RTGS, or wallets.</li>
          <li>3️⃣ Trade Live — Access global markets with lightning-fast execution.</li>
        </motion.ol>
        <div className="mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-black text-[#FDC700] font-semibold px-8 py-4 rounded-xl shadow hover:bg-gray-900 transition"
          >
            🔑 Open Your Account & Trade Today
          </motion.button>
        </div>
      </section>

      {/* Final Promo Section */}
      <section className="px-6 py-20 text-center bg-black text-white">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-6"
        >
          Ready to Trade Smarter with Zero Brokerage?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
        >
          Open your account today and start trading with zero fees, high
          leverage, and instant withdrawals.
        </motion.p>
        <motion.button
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl shadow hover:bg-yellow-300 transition text-lg"
        >
          🚀 Open Live Account Now
        </motion.button>
      

      {/* Trust Section */}
    <div className="mt-12">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Why Traders Trust TradeFair.live
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            "Regulated, transparent, and secure platform.",
            "Dedicated 24/7 customer support.",
            "Proven reliability and trust from active traders.",
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-[#FDC700] text-black p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center"
            >
              {item}
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <motion.button
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl shadow hover:bg-yellow-300 transition"
          >
            💬 Chat with Support — Available 24/7
          </motion.button>
        </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
