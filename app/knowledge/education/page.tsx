"use client";

import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const EducationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-[90px]">
      {/* Hero Section */}
      <section className="text-center px-6 py-20 bg-black text-white">
        <motion.h1
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Learn. Trade. Grow.
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300"
        >
          At TradeFair.live, we believe successful trading starts with the right
          knowledge. Our Education Hub is designed for both beginners and advanced
          traders, offering guides, strategies, webinars, and FAQs.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8"
        >
          <a
            href="#"
            className="inline-block px-6 py-3 bg-[#FFB80C] text-black font-semibold rounded-lg shadow hover:bg-yellow-400 transition"
          >
            Start Learning Today →
          </a>
        </motion.div>
      </section>

      {/* Beginner's Guide Section */}
      <section className="py-20 px-6 bg-[#FDC700]">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-gray-800 mb-4"
          >
            Your First Step Into Trading
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-gray-600"
          >
            Trading the markets doesn’t have to be complicated. Our Beginner’s
            Guide explains the fundamentals in simple, easy-to-understand language:
          </motion.p>
          <motion.ul
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 space-y-3 text-lg text-gray-700 text-left list-disc list-inside"
          >
            <li>What is trading? (Stocks, Forex, Commodities, Indices, Cryptos)</li>
            <li>How trading works: brokers, spreads, leverage & margin</li>
            <li>Understanding charts and order types (market, limit, stop-loss)</li>
            <li>Managing risk and building confidence before going live</li>
          </motion.ul>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block px-6 py-3 bg-black text-white  rounded-lg text-lg transition"
            >
              Read the Full Beginner’s Guide →
            </a>
          </div>
        </div>
      </section>

      {/* Trading Strategies Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-4 text-center md:text-left"
          >
            Strategies to Trade Smarter
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white"
          >
            Mastering strategies is key to consistent results. Our strategy library
            covers proven techniques:
          </motion.p>
          <motion.ul
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 space-y-3 text-lg text-white list-disc list-inside"
          >
            <li>Day Trading Strategies – Quick trades in high-volume markets</li>
            <li>Swing Trading Strategies – Capturing short- to medium-term moves</li>
            <li>Scalping – Fast-paced trading with small profits per trade</li>
            <li>Risk Management – Using stop-loss and proper position sizing</li>
            <li>
              Technical vs. Fundamental Analysis – Choosing the right approach
            </li>
          </motion.ul>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block px-6 py-3  text-black bg-[#FFB80C] rounded-lg text-lg transition"
            >
              Explore Trading Strategies →
            </a>
          </div>
        </div>
      </section>

      {/* Webinars Section */}
      <section className="py-20 px-6 bg-[#FDC700]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-800 mb-4 text-center md:text-left"
          >
            Learn From Experts — Anytime, Anywhere
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600"
          >
            Join our live webinars and on-demand tutorials hosted by trading
            experts. Learn step-by-step from real market examples and sharpen
            your skills.
          </motion.p>
          <motion.ul
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 space-y-3 text-lg text-gray-700 list-disc list-inside"
          >
            <li>
              Live Webinars: Market trends, risk management, Q&A with experts
            </li>
            <li>
              Video Tutorials: Platform walkthroughs, indicator training,
              execution tips
            </li>
            <li>
              Interactive Learning: Recorded sessions, case studies, and PDF
              guides
            </li>
          </motion.ul>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block px-6 py-3 bg-black text-white  rounded-lg text-lg transition"
            >
              Register for the Next Webinar →
            </a>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-8 text-center md:text-left"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6 text-lg text-white"
          >
            <div>
              <p className="font-semibold text-[#FDC700]">
                Q: Is trading with TradeFair.live really zero brokerage?
              </p>
              <p>
                A: Yes, we offer zero brokerage across multiple instruments. You
                only pay spreads or commissions depending on your account type.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#FDC700]">
                Q: How can I start if I’m a complete beginner?
              </p>
              <p>
                A: Start with our free Demo Account, explore the Beginner’s
                Guide, and then move on to live trading when you’re confident.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#FDC700]">
                Q: What markets can I trade with TradeFair.live?
              </p>
              <p>
                A: You can trade Forex, NSE F&O, MCX Commodities, Stocks (India
                & US), Indices, and Cryptocurrencies all on one platform.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#FDC700]">
                Q: Do you offer support during trading hours?
              </p>
              <p>
                A: Yes, our support is available 24/7 to assist you anytime.
              </p>
            </div>
          </motion.div>
          <div className="mt-8">
            <a
              href="#"
              className="inline-block px-6 py-3  text-black bg-[#FFB80C] rounded-lg text-lg transition"
            >
              View All FAQs →
            </a>
          </div>
          
        </div>
      </section>
      <hr className="border-t-2 border-gray-200  w-11/12 mx-auto" />
      {/* Closing CTA */}
      <section className="px-6 py-20 text-center bg-black text-white">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          Knowledge Is Power. Start Trading With Confidence.
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg max-w-3xl mx-auto"
        >
          Equip yourself with the right knowledge, practice on a demo account,
          and step confidently into live markets. With TradeFair.live, you’re
          never trading alone.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <a
            href="#"
            className="inline-block px-6 py-3 bg-black text-[#FFB80C] rounded-lg text-lg font-semibold shadow hover:opacity-90 transition"
          >
            Open a Free Demo Account
          </a>
          <a
            href="#"
            className="inline-block px-6 py-3 bg-black text-[#FFB80C] rounded-lg text-lg font-semibold shadow hover:opacity-90 transition"
          >
            Join Our Next Webinar
          </a>
          <a
            href="#"
            className="inline-block px-6 py-3 bg-black text-[#FFB80C] rounded-lg text-lg font-semibold shadow hover:opacity-90 transition"
          >
            Read Beginner’s Guide
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default EducationPage;
