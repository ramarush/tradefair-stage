'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DepositExpired() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Session Expired
            </h1>
            
            <div className="mb-6">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-4">
                Your deposit request session has expired. This happens to ensure security and prevent unauthorized transactions.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">What happened?</h3>
                <ul className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>• You took too long to complete the payment process</li>
                  <li>• Payment sessions expire for security reasons</li>
                  <li>• No charges were made to your account</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What can you do now?</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/deposit"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Start New Deposit
                </Link>
                
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Need help?{' '}
                  <Link href="/contact" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}