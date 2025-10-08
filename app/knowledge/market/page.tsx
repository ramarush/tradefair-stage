"use client";

import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const MarketPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-[88px]">
      {/* Market Overview Section */}
      <section className="max-w-full mx-auto px-6 py-16 text-center bg-black text-white rounded-lg shadow-lg">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-6"
        >
          Explore Global & Indian Markets with Confidence
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg max-w-3xl mx-auto text-gray-300 mb-8"
        >
          At TradeFair.live, we give traders seamless access to the world’s most
          liquid markets — from NSE F&O and MCX Commodities to Forex, Indices,
          US Stocks, and Cryptocurrencies. Diversify your portfolio, manage
          risks, and capitalize on opportunities — all from one platform.
        </motion.p>
        <motion.ul
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-left max-w-2xl mx-auto list-disc pl-6 text-gray-300 space-y-2 mb-8"
        >
          <li>Trade Forex CFDs with institutional-grade spreads</li>
          <li>Access MCX Commodities including Gold, Silver & Crude Oil</li>
          <li>Explore NSE Futures & Options with up to 500× margin</li>
          <li>Tap into global indices like NASDAQ, S&P 500, and Nifty 50</li>
          <li>Invest in leading cryptocurrencies like BTC, ETH & more</li>
        </motion.ul>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <a
            href="#start-trading"
            className="bg-[#FFB80C] text-black font-semibold py-3 px-8 rounded-lg shadow hover:bg-yellow-400 transition"
          >
            👉 Start Trading Global Markets Today
          </a>
        </motion.div>
      </section>

      {/* Daily Market Analysis Section */}
      <section className="max-w-full mx-auto px-6 py-16 bg-[#FDC700] mt-0 rounded-lg shadow-lg">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-800 mb-6"
        >
          Stay Ahead with Daily Market Insights
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-gray-700 text-center max-w-3xl mx-auto mb-10"
        >
          Our experts deliver daily market analysis covering Forex, Commodities,
          Indices, and Stocks to help you identify high-potential trading
          opportunities.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
  {[
    {
      title: "Morning Briefings",
      desc: "Key levels, overnight trends, and opening outlook.",
    },
    {
      title: "Technical Analysis",
      desc: "Support, resistance, patterns & momentum indicators.",
    },
    {
      title: "Fundamental Insights",
      desc: "Macro drivers, earnings reports & key news events.",
    },
    {
      title: "Trade Ideas",
      desc: "Actionable intraday & swing trading strategies.",
    },
  ].map((item, i) => (
    <motion.div
      key={i}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
      className="group bg-white rounded-lg shadow p-6 transition duration-300 hover:bg-black"
    >
      <h3 className="font-semibold text-xl text-gray-800 mb-2 transition duration-300 group-hover:text-white">
        {item.title}
      </h3>
      <p className="text-gray-600 transition duration-300 group-hover:text-gray-200">
        {item.desc}
      </p>
    </motion.div>
  ))}
</div>

        <div className="text-center">
          <a
            href="#market-analysis"
            className="bg-black text-white font-semibold py-3 px-8 rounded-lg shadow hover:bg-[#FFB80C] hover:text-black transition"
          >
            👉 Read Today’s Market Analysis
          </a>
        </div>
      </section>

      {/* Economic Calendar Section */}
      <section className="max-w-full mx-auto px-6 py-16 mt-0 text-center bg-black ">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-white mb-6 "
        >
          Track Global Events That Move the Markets
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-white max-w-3xl mx-auto mb-10"
        >
          Use our Economic Calendar to track high-impact events like central
          bank announcements, inflation data, jobs reports & GDP releases.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
  {[
    {
      title: "Real-Time Updates",
      desc: "Get instant alerts for global events.",
    },
    {
      title: "Impact Indicators",
      desc: "Filter events by low, medium, or high volatility.",
    },
    {
      title: "Custom Filters",
      desc: "Focus on the markets & time zones that matter.",
    },
    {
      title: "Instant Reaction",
      desc: "Anticipate volatility and trade with confidence.",
    },
  ].map((item, i) => (
    <motion.div
      key={i}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
      className="group bg-gray-100 rounded-lg shadow p-6 text-left transition duration-300 hover:bg-[#FFB80C]"
    >
      <h3 className="font-semibold text-xl text-gray-800 mb-2 transition duration-300 group-hover:text-black">
        {item.title}
      </h3>
      <p className="text-gray-600 transition duration-300 group-hover:text-black">
        {item.desc}
      </p>
    </motion.div>
  ))}
</div>

        <a
          href="#economic-calendar"
          className="bg-[#FFB80C] text-black font-semibold py-3 px-8 rounded-lg shadow hover:bg-black hover:text-[#FFB80C] transition"
        >
          👉 Check the Live Economic Calendar
        </a>
      </section>

      {/* News & Insight Section */}
      <section className="max-w-full mx-auto px-6 py-16 bg-[#FDC700] mt-0 rounded-lg shadow-lg mb-8">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-800 mb-6"
        >
          Latest News, Market Trends & Expert Opinions
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-gray-700 text-center max-w-3xl mx-auto mb-10"
        >
          Stay informed with real-time financial news, market sentiment, and
          expert commentary — so you never miss an opportunity.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
  {[
    {
      title: "Global Financial News",
      desc: "Updates on currencies, equities, commodities & crypto.",
    },
    {
      title: "Market Sentiment Reports",
      desc: "Understand how traders worldwide are positioning.",
    },
    {
      title: "Expert Commentary",
      desc: "Professional analysis from top market strategists.",
    },
    {
      title: "Educational Insights",
      desc: "Trading strategies, risk management & best practices.",
    },
  ].map((item, i) => (
    <motion.div
      key={i}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
      className="group bg-white rounded-lg shadow p-6 transition duration-300 hover:bg-black"
    >
      <h3 className="font-semibold text-xl text-gray-800 mb-2 transition duration-300 group-hover:text-white">
        {item.title}
      </h3>
      <p className="text-gray-600 transition duration-300 group-hover:text-white">
        {item.desc}
      </p>
    </motion.div>
  ))}
</div>

        <div className="text-center">
          <a
            href="#news-insights"
            className="bg-black text-white font-semibold py-3 px-8 rounded-lg shadow hover:bg-[#FFB80C] hover:text-black transition"
          >
            👉 Explore News & Insights
          </a>
        </div>
      </section>
    </div>
  );
};

export default MarketPage;
