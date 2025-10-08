/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from "react";

const TradingTabs = () => {
  const tabs = [
    {
      name: "Forex",
      title: "Forex",
      description: "Trade global currencies with tight spreads & high liquidity.",
      buttonText: "Trade Forex",
      image: "https://images.unsplash.com/photo-1629961235777-4fbcf4e4e319?w=800", // replace with your forex image
    },
    {
      name: "Metals",
      title: "Metals",
      description: "Trade metal commodities such as Gold, Silver & Platinum.",
      buttonText: "Trade Metals",
      image: "https://images.unsplash.com/photo-1584713503693-bb386ec95d8a?w=800", // gold & silver image
    },
    {
      name: "Crypto",
      title: "Crypto",
      description: "Buy & sell cryptocurrencies like Bitcoin, Ethereum & more.",
      buttonText: "Trade Crypto",
      image: "https://images.unsplash.com/photo-1621416905121-d9b8e7f02d44?w=800", // crypto coins
    },
    {
      name: "Indices",
      title: "Indices",
      description: "Trade top global indices such as S&P 500, Nasdaq, and Dow Jones.",
      buttonText: "Trade Indices",
      image: "https://images.unsplash.com/photo-1581091012184-5c7b9180a9db?w=800",
    },
    {
      name: "Shares",
      title: "Shares",
      description: "Invest in global stocks across multiple exchanges worldwide.",
      buttonText: "Trade Shares",
      image: "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800",
    },
    {
      name: "Energy",
      title: "Energy",
      description: "Trade crude oil, natural gas & renewable energy markets.",
      buttonText: "Trade Energy",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    },
    {
      name: "ETFs",
      title: "ETFs",
      description: "Diversify your portfolio with leading global ETFs.",
      buttonText: "Trade ETFs",
      image: "https://images.unsplash.com/photo-1581093588401-7c58efc72cb4?w=800",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[1]); // Default Metals

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* ✅ Left Tabs + Content */}
        <div>
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  activeTab.name === tab.name
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 rounded-t-md"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="transition-all duration-500 ease-in-out">
            <h2 className="text-3xl font-bold mb-3">{activeTab.title}</h2>
            <p className="text-gray-700 mb-5">{activeTab.description}</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300">
              {activeTab.buttonText}
            </button>
          </div>
        </div>

        {/* ✅ Right Image with Animation */}
        <div className="relative overflow-hidden rounded-xl shadow-lg">
          <img
            key={activeTab.image}
            src={activeTab.image}
            alt={activeTab.title}
            className="w-full h-80 object-cover transition-opacity duration-500 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
};

export default TradingTabs;
