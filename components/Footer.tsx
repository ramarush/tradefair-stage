import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#ffb80c] text-[#18181a]">
      <div className="container mx-auto px-4 py-12">
        {/* Grid Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.jpeg"
                alt="TradeFair Logo"
                width={150}
                height={40}
                className="h-20 w-auto rounded-2xl border border-black"
              />
            </Link>
          </div>

        
        </div>

        {/* Divider & Disclaimer */}
        <div className="border-t border-[#18181a]/20 mt-12 pt-8 text-center text-sm">
          <p>
            © 2025 Tradefair Ltd. All rights reserved. Trading involves risk. Past
            performance is no guarantee of future results.
          </p>
          <p className="mt-2 text-[#18181a]/80">
            <span className="text-black font-semibold">Risk Warning:</span> Trading
            financial instruments carries a high level of risk to your capital with
            the possibility of losing more than your initial investment.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
