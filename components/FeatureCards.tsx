import React from "react";

const FeatureCards = () => {
  const features = [
    {
      category: "CAPITAL",
      title: "$450M+",
      description: "Join millions who trust Tradefair for secure, regulated, and reliable trading.",
      icon: "shield",
      background: "bg-gray-50",
    },
    {
      category: "TIGHT SPREADS",
      title: "3X Lower",
      description: "On Bitcoin & Ethereum with our Raw+ account",
      icon: "chart-down",
      background: "bg-blue-50",
      badge: "New Offering",
    },
    {
      category: "HIGH LEVERAGE",
      title: "500X",
      description: "Flexible leverage to suit any trading style, from low-risk to high-reward strategies.",
      icon: "chart-up",
      background: "bg-gray-50",
    },
    {
      category: "TRADING APP",
      title: "5* Rated",
      description: "Trade on the go with an intuitive award-winning app packed with features.",
      icon: "star",
      background: "bg-gray-50",
    },
    {
      category: "DEDICATED SUPPORT",
      title: "24/7",
      description: "We are here for guidance and support whenever you need it.",
      icon: "support",
      background: "bg-gray-50",
    },
    {
      category: "ACCESS",
      title: "2100+ Assets",
      description: "Trade any instrument you want! Missing something? Let us know, and we'll add it.",
      icon: "chart-bar",
      background: "bg-gray-50",
    },
  ];

  const renderIcon = (iconName : string) => {
    switch (iconName) {
      case 'shield':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'chart-down':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'chart-up':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'support':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'chart-bar':
        return (
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-16 bg-[#121212]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Why Choose Our Trading Platform
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`${index === 1 ? 'bg-[#1a2035]' : 'bg-[#1a1a1a]'} p-8 rounded-lg relative overflow-hidden group 
                hover:shadow-lg hover:shadow-[#f0b90b]/10 transition-all duration-300 
                transform hover:-translate-y-1 cursor-pointer`}
            >
              {/* Top accent line with hover animation */}
              <div className="h-1 w-16 bg-[#f0b90b] mb-6 group-hover:w-24 transition-all duration-300"></div>
              
              {/* Badge for special features */}
              {feature.badge && (
                <div className="absolute top-8 right-8 group-hover:scale-110 transition-all duration-300">
                  <div className="border border-[#f0b90b] text-[#f0b90b] text-xs font-medium px-3 py-1 rounded-full 
                    group-hover:bg-[#f0b90b] group-hover:text-black transition-colors duration-300">
                    {feature.badge}
                  </div>
                </div>
              )}
              
              {/* Icon in corner with hover animation */}
              <div className="absolute top-8 right-8 opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300">
                {renderIcon(feature.icon)}
              </div>
              
              <div className="mt-2">
                <p className="font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{feature.category}</p>
                <h3 className="text-3xl font-bold my-2 text-white group-hover:text-[#f0b90b] transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
