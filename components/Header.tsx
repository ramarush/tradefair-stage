'use client';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Tradefairlogo from "../public/logoHeader.jpeg";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react"; // ✅ Hamburger & close icons

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; first_name: string; is_admin?: boolean } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (token && userData && userData !== 'undefined') {
    try {
      setUser(JSON.parse(userData));
    } catch (err) {
      console.error('Error parsing user data:', err);
      localStorage.removeItem('user');
    }
  }
}, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const navLinkClass =
    "relative font-semibold text-black transition duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-black after:transition-all after:duration-300 hover:after:w-full";

  const handleMouseEnter = () => setDropdownOpen(true);
  const handleMouseLeave = () => setDropdownOpen(false);

  // Determine z-index class based on user role
  const zIndexClass = user?.is_admin ? '' : 'z-50';

  return (
    <header
      className={`w-full py-2 md:py-1 fixed top-0 left-0 right-0  transition-all duration-300 ${zIndexClass} ${
        scrolled ? "bg-[#ffb80c] shadow-md  " : "bg-[#ffb80c]/90 "
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={Tradefairlogo}
            alt="Tradefair Logo"
            width={120}
            height={35}
            className="h-14 sm:h-16 md:h-20 w-auto rounded-xl md:rounded-2xl border border-black"
          />
        </Link>

        {/* Center nav links (desktop only) */}
        {!user && (
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-10">
            <Link href="/aboutUs" className={navLinkClass}>About Us</Link>
            <Link href="/trading" className={navLinkClass}>Trading</Link>
            <Link href="/platform" className={navLinkClass}>Platform</Link>

            {/* Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className={navLinkClass}>Knowledge</button>
              <div
                ref={dropdownRef}
                className={`absolute left-1/2 transform -translate-x-1/2 mt-2 bg-black text-white font-semibold rounded-md shadow transition-all duration-300 ease-in-out overflow-hidden ${
                  dropdownOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <Link href="/knowledge/market" className="block px-4 py-2 hover:underline">Market</Link>
                <Link href="/knowledge/education" className="block px-4 py-2 hover:underline">Education</Link>
              </div>
            </div>

            <Link href="/contact" className={navLinkClass}>Contact Us</Link>
          </div>
        )}

        {/* Right side: Auth buttons or menu */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white font-semibold px-4 py-2 rounded-md shadow hover:bg-red-600 hover:scale-105 transition"
            >
              Logout
            </button>
          ) : (
            <>
              {/* Desktop auth buttons */}
              <div className="hidden md:flex space-x-3">
                <Link href="/login" className="bg-black text-[#ffb80c] font-semibold px-4 py-2 rounded-md shadow hover:bg-gray-800 transition">
                  Login
                </Link>
                <Link href="/signup" className="bg-black text-[#ffb80c] font-semibold px-4 py-2 rounded-md shadow hover:bg-gray-800 transition">
                  Register
                </Link>
              </div>

              {/* Mobile Register button (left of hamburger) */}
              <Link href="/signup" className="md:hidden bg-black text-[#ffb80c] font-semibold px-3 py-2 rounded-md shadow mr-2">
                Register
              </Link>

              {/* Mobile menu button */}
              <button className="md:hidden p-2" onClick={toggleMobileMenu} aria-label="Open menu">
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile full-screen panel + overlay (replaces narrow sidebar) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={toggleMobileMenu}
          ></div>

          {/* Full-screen panel */}
          <div className={`absolute top-0 right-0 h-full w-full bg-black transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <Link href="/" className="flex items-center">
                <Image src={Tradefairlogo} alt="Tradefair" width={110} height={32} className="h-8 w-auto" />
              </Link>
              <button onClick={toggleMobileMenu} aria-label="Close menu" className="p-2">
                <X size={28} />
              </button>
            </div>
            <nav className="px-6 py-6 text-2xl font-semibold">
              <div className="py-4">
                <Link href="/trading" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Trading</Link>
              </div>

              <div className="py-4">
                <Link href="/platform" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Platform</Link>
              </div>
              <div className="py-4">
                <Link href="/knowledge/market" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Market</Link>
              </div>
              <div className="py-4">
                <Link href="/knowledge/education" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Education</Link>
              </div>

              {/* <div className="py-4">
                <button className="w-full text-left font-semibold text-[#ffb80c]" onClick={() => {  }}>
                  Knowledge
                </button>
                <div className="mt-2 space-y-2 text-lg">
                  <Link href="/knowledge/market" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Market</Link>
                  <Link href="/knowledge/education" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Education</Link>
                </div>
              </div> */}

              <div className="py-4">
                <Link href="/aboutUs" onClick={toggleMobileMenu} className="block text-[#ffb80c]">About Us</Link>
              </div>

              <div className="py-4">
                <Link href="/contact" onClick={toggleMobileMenu} className="block text-[#ffb80c]">Contact Us</Link>
              </div>
            </nav>

            <div className="px-6 mt-6">
              <Link href="/signup" onClick={toggleMobileMenu} className="block w-full text-center bg-[#ffb80c] text-black py-4 rounded-full font-semibold text-lg">
                Register
              </Link>
              <Link href="/login" onClick={toggleMobileMenu} className="block text-center mt-4 text-[#ffb80c]">
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
