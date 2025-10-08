
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "../components/Header";
import Hero from "../components/Hero";
import MarketTicker from "../components/MarketTicker";
import FeatureCards from "../components/FeatureCards";
import Platforms from "../components/Platforms";
import Footer from "../components/Footer";
import FloatingContactButton from "../components/FloatingContactButton";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is valid by making a quick API call
      fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (response.ok) {
          // Token is valid, redirect to dashboard
          router.push('/dashboard');
        }
        // If token is invalid, stay on home page (token will be cleared by other components)
      })
      .catch(error => {
        console.error('Error verifying token:', error);
        // On error, stay on home page
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* <Header /> */}
      <Hero />
      {/* <MarketTicker /> */}
      <FeatureCards />
      <Platforms />
      {/* <Footer /> */}
      <FloatingContactButton />
    </div>
  );
}
