'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeftIcon, BanknotesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getUserCurrency, convertToUSD, formatCurrency, getCurrencyInfo } from '@/lib/currency';

interface PaymentMethod {
  id: number;
  type: 'bank' | 'upi';
  account_holder_name: string;
  min_amount: number;
  max_amount: number;
  expiration_time_minutes: number;
  // Bank fields
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  // UPI fields
  vpa_address?: string;
}

interface DepositFormData {
  amount: number;
  utrNumber: string;
  notes: string;
}

type DepositStep = 'amount' | 'payment_method' | 'payment_details' | 'upload_proof';

export default function DepositRequest() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [formData, setFormData] = useState<DepositFormData>({
    amount: 0,
    utrNumber: '',
    notes: '',
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [currencyInfo, setCurrencyInfo] = useState(getCurrencyInfo('USD'));
  const [exchangeRates, setExchangeRates] = useState<{usdDepositRate?: number}>({});
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get user's preferred currency
    const currency = getUserCurrency();
    setUserCurrency(currency);
    setCurrencyInfo(getCurrencyInfo(currency));
    
    // Fetch exchange rates if user currency is USD
    if (currency === 'USD') {
      fetchExchangeRates();
    }
  }, [router]);

  // Fetch exchange rates from public API
  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(data.exchangeRates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  // Calculate converted amount when amount changes for USD users
  useEffect(() => {
    if (userCurrency === 'USD' && amount > 0 && exchangeRates.usdDepositRate) {
      const converted = amount * exchangeRates.usdDepositRate;
      setConvertedAmount(converted);
    } else {
      setConvertedAmount(null);
    }
  }, [amount, userCurrency, exchangeRates]);

  // Timer for expiration countdown
  useEffect(() => {
    if (!expirationTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = expirationTime.getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Redirect to expiration page
        router.push('/dashboard/deposit/expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationTime, router]);

  // Fetch available payment methods when amount is selected
  const fetchPaymentMethods = async (depositAmount: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/payment-methods?amount=${depositAmount}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePaymentMethods(data.paymentMethods);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Error fetching payment methods');
    }
  };

  // Generate UPI QR code
  const generateQRCode = async (paymentMethod: PaymentMethod, amount: number) => {
    try {
      const response = await fetch('/api/user/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vpa_address: paymentMethod.vpa_address,
          amount: amount,
          account_holder_name: paymentMethod.account_holder_name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCodeData(data.qrCode);
      } else {
        console.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Check if USD user has exchange rate set
    if (userCurrency === 'USD' && !exchangeRates.usdDepositRate) {
      setError('Exchange rate is not set by the admin. Please contact support.');
      return;
    }
    
    setError(null);
    // Use converted amount for payment methods if USD user
    const depositAmount = userCurrency === 'USD' && convertedAmount ? convertedAmount : amount;
    fetchPaymentMethods(depositAmount);
    setCurrentStep('payment_method');
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    
    // Set expiration time
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + method.expiration_time_minutes);
    setExpirationTime(expiry);
    
    // Generate QR code for UPI payments using converted amount for USD users
    if (method.type === 'upi') {
      const qrAmount = userCurrency === 'USD' && convertedAmount ? convertedAmount : amount;
      generateQRCode(method, qrAmount);
    }
    
    setCurrentStep('payment_details');
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      
      setPaymentProof(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPaymentProof(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError(null);
    
    // Validation checks
    if (!formData.utrNumber.trim()) {
      setError('Please enter the UTR number.');
      return;
    }
    
    if (!paymentProof) {
      setError('Please upload payment proof image.');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // First upload the payment proof
      let mediaId = null;
      if (paymentProof) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', paymentProof);
        
        const uploadResponse = await fetch(`/api/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataUpload,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mediaId = uploadData.media.id;
        } else {
          const uploadError = await uploadResponse.text();
          throw new Error(`Failed to upload payment proof: ${uploadError}`);
        }
      }

      const transactionData = {
        type: 'deposit',
        amount: amount,
        mtrNumber: formData.utrNumber,
        notes: formData.notes,
        mediaId: mediaId,
        paymentMethodId: selectedPaymentMethod?.id,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const responseData = await response.json();
        setSuccess(true);
        // Reset form
        setCurrentStep('amount');
        setAmount(0);
        setSelectedPaymentMethod(null);
        setAvailablePaymentMethods([]);
        setQrCodeData(null);
        setExpirationTime(null);
        setFormData({
          amount: 0,
          utrNumber: '',
          notes: '',
        });
        setPaymentProof(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit deposit request');
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      setError(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Deposit Request Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your deposit request has been submitted successfully. Our team will review and process it shortly.
              You will receive updates on the status of your request.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Link>
              <div>
                <Link
                  href="/dashboard/deposits"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View All Deposits
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Make a Deposit</h1>
          <p className="mt-2 text-gray-600">
            Submit a deposit request to add funds to your account.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'amount' ? 'text-indigo-600' : ['payment_method', 'payment_details', 'upload_proof'].includes(currentStep) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'amount' ? 'border-indigo-600 bg-indigo-600 text-white' : 
                ['payment_method', 'payment_details', 'upload_proof'].includes(currentStep) ? 'border-green-600 bg-green-600 text-white' : 
                'border-gray-300 text-gray-400'
              }`}>
                {['payment_method', 'payment_details', 'upload_proof'].includes(currentStep) ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Amount</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'payment_method' || currentStep === 'payment_details' || currentStep === 'upload_proof' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'payment_method' ? 'text-indigo-600' : (currentStep === 'payment_details' || currentStep === 'upload_proof') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'payment_method' ? 'border-indigo-600 bg-indigo-600 text-white' : 
                (currentStep === 'payment_details' || currentStep === 'upload_proof') ? 'border-green-600 bg-green-600 text-white' : 
                'border-gray-300 text-gray-400'
              }`}>
                {(currentStep === 'payment_details' || currentStep === 'upload_proof') ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Payment Method</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'payment_details' || currentStep === 'upload_proof' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'payment_details' || currentStep === 'upload_proof' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'payment_details' || currentStep === 'upload_proof' ? 'border-indigo-600 bg-indigo-600 text-white' : 
                'border-gray-300 text-gray-400'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        {expirationTime && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Time Remaining</h3>
                  <p className="text-sm text-yellow-700">
                    Complete your payment within: <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {currentStep === 'amount' && 'Enter Deposit Amount'}
              {currentStep === 'payment_method' && 'Choose Payment Method'}
              {currentStep === 'payment_details' && 'Payment Details'}
              {currentStep === 'upload_proof' && 'Upload Payment Proof'}
            </h2>
          </div>
          
          <div className="p-6">
            {/* Step 1: Amount Selection */}
            {currentStep === 'amount' && (
              <form onSubmit={handleAmountSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit Amount * ({currencyInfo?.name})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Minimum deposit amount is {formatCurrency(1, userCurrency)}
                  </p>
                  
                  {/* Show converted INR amount for USD users */}
                  {userCurrency === 'USD' && convertedAmount && exchangeRates.usdDepositRate && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center">
                        <div className="text-sm text-blue-800">
                          <strong>Amount to pay in INR: ₹{convertedAmount.toFixed(2)}</strong>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Exchange rate: ₹{exchangeRates.usdDepositRate} per USD
                      </div>
                    </div>
                  )}
                  
                  {/* Warning for USD users without exchange rate */}
                  {userCurrency === 'USD' && amount > 0 && !exchangeRates.usdDepositRate && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="text-sm text-yellow-800">
                        ⚠️ Exchange rate not configured. Please contact support.
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!amount || amount <= 0}
                    className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Payment Method Selection */}
            {currentStep === 'payment_method' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  {userCurrency === 'USD' && convertedAmount && exchangeRates.usdDepositRate ? (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-800">
                        <strong>Deposit Amount:</strong> {formatCurrency(amount, userCurrency)}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Amount to Pay (INR):</strong> ₹{convertedAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-600">
                        Exchange rate: ₹{exchangeRates.usdDepositRate} per USD
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">
                      <strong>Amount:</strong> {formatCurrency(amount, userCurrency)}
                    </p>
                  )}
                </div>
                
                {availablePaymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No payment methods available for this amount.</p>
                    <button
                      onClick={() => setCurrentStep('amount')}
                      className="mt-4 text-indigo-600 hover:text-indigo-500"
                    >
                      ← Back to amount selection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Available Payment Methods:</h3>
                    {availablePaymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method)}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                method.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {method.type.toUpperCase()}
                              </span>
                              <h4 className="font-medium text-gray-900">{method.account_holder_name}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {method.type === 'bank' && `${method.bank_name} - ${method.account_number}`}
                              {method.type === 'upi' && method.vpa_address}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Range: {formatCurrency(method.min_amount, userCurrency)} - {formatCurrency(method.max_amount, userCurrency)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Expires in</p>
                            <p className="text-sm font-medium text-gray-900">{method.expiration_time_minutes} minutes</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-start">
                  <button
                    onClick={() => setCurrentStep('amount')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Details */}
            {currentStep === 'payment_details' && selectedPaymentMethod && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  {userCurrency === 'USD' && convertedAmount && exchangeRates.usdDepositRate ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong style={{
                            fontWeight: 'bold',
                            color: 'blue'
                          }}>Deposit Amount:</strong> {formatCurrency(amount, userCurrency)}
                        </div>
                        <div>
                          <strong style={{
                            fontWeight: 'bold',
                            color: 'blue'
                          }}>Method:</strong> {selectedPaymentMethod.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Amount to Pay (INR):</strong> ₹{convertedAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-blue-600">
                          Exchange rate: ₹{exchangeRates.usdDepositRate} per USD
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Amount:</strong> {formatCurrency(amount, userCurrency)}
                      </div>
                      <div>
                        <strong>Method:</strong> {selectedPaymentMethod.type.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {selectedPaymentMethod.type === 'upi' ? (
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Scan QR Code to Pay</h3>
                    <div className="flex justify-center">
                      {qrCodeData ? (
                        <img src={qrCodeData} alt="UPI QR Code" className="w-64 h-64 border rounded-lg" />
                      ) : (
                        <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-gray-50">
                          <p className="text-gray-500">Generating QR Code...</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2"><strong>UPI ID:</strong> {selectedPaymentMethod.vpa_address}</p>
                      <p className="text-sm text-gray-600 mb-2"><strong>Name:</strong> {selectedPaymentMethod.account_holder_name}</p>
                      <p className="text-sm text-gray-600"><strong>Amount:</strong> ₹{userCurrency === 'USD' && convertedAmount ? convertedAmount.toFixed(2) : amount}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium" style={{
                      fontWeight: 'bold',
                      color: 'blue'
                    }}>Bank Transfer Details</h3>
                    <div className="p-4 rounded-lg space-y-2">
                      <p className="text-sm" style={{
                        fontWeight: 'bold',
                        color: 'blue'
                      }}><strong>Bank Name:</strong> {selectedPaymentMethod.bank_name}</p>
                      <p className="text-sm" style={{
                        fontWeight: 'bold',
                        color: 'blue'
                      }}><strong>Account Holder:</strong> {selectedPaymentMethod.account_holder_name}</p>
                      <p className="text-sm" style={{
                        fontWeight: 'bold',
                        color: 'blue'
                      }}><strong>Account Number:</strong> {selectedPaymentMethod.account_number}</p>
                      <p className="text-sm" style={{
                        fontWeight: 'bold',
                        color: 'blue'
                      }}><strong>IFSC Code:</strong> {selectedPaymentMethod.ifsc_code}</p>
                      <p className="text-sm" style={{
                        fontWeight: 'bold',
                        color:'blue'
                      }}><strong>Amount to Transfer:</strong> ₹{userCurrency === 'USD' && convertedAmount ? convertedAmount.toFixed(2) : amount}</p>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> After making the payment, click &quot;Continue&quot; to upload your payment proof. 
                    You have {selectedPaymentMethod.expiration_time_minutes} minutes to complete this process.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('payment_method')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, amount });
                      setCurrentStep('upload_proof');
                    }}
                    className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Continue to Upload Proof
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Upload Proof (existing form) */}
            {currentStep === 'upload_proof' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                      <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                          <button
                            type="button"
                            onClick={() => setError(null)}
                            className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                          >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div style={{
                      fontWeight: 'bold',
                      color: 'blue'
                    }}><strong>Amount:</strong> {formatCurrency(amount, userCurrency)}</div>
                    <div style={{
                      fontWeight: 'bold',
                      color:'blue'
                    }}><strong>Method:</strong> {selectedPaymentMethod?.type.toUpperCase()}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UTR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.utrNumber}
                    onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                    className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                    placeholder="Enter UTR/Transaction Reference Number"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the UTR number from your bank transfer or transaction reference number.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof *
                  </label>
                  
                  {!imagePreview ? (
                    <div>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a screenshot or photo of your payment confirmation. Only image files are accepted (max 5MB).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Payment proof preview"
                          className="max-w-full h-48 object-contain border rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-green-600">
                        ✓ Image uploaded successfully. You can remove it and upload a different one if needed.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('payment_details')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.utrNumber.trim() || !paymentProof}
                    className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Deposit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}