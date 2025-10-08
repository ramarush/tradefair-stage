

import { PhoneIcon, EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us - TradeFair",
  description:
    "Get in touch with TradeFair. Contact our support team for assistance with trading, deposits, withdrawals, and more.",
};

export default function ContactPage() {
  
  return (
    <div className="min-h-screen bg-gray-50 pt-[88px]">
      {/* Hero Section */}
      <section className="text-center px-6 py-16 bg-black text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto">
          Have questions? We&apos;re here to help. Our team is available 24/7 to
          assist you with trading, deposits, withdrawals, and more.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="bg-[#FFB80C] rounded-2xl shadow-lg p-8 text-black">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <PhoneIcon className="h-6 w-6 text-black mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Phone Support</h3>
                  <p className="text-black/80 mt-1">+1 (555) 123-4567</p>
                  <p className="text-sm text-black/70 mt-1">
                    Monday - Friday, 9 AM - 6 PM EST
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <EnvelopeIcon className="h-6 w-6 text-black mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Email Support</h3>
                  <p className="text-black/80 mt-1">support@tradefair.com</p>
                  <span className="text-sm italic text-black/70 mt-1 block">
                    "Excellent customer service and fast response times."
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="h-6 w-6 text-black mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Office Address</h3>
                  <p className="text-black/80 mt-1">
                    123 Trading Street
                    <br />
                    Financial District
                    <br />
                    New York, NY 10004
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-black/30">
              <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-black text-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Send us a Message
            </h2>

            <ContactForm />


            <div className="mt-6 text-sm text-white">
              <p>
                By submitting this form, you agree to our{" "}
                <a
                  href="/privacy"
                  className="text-[#FFB80C]  font-medium"
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="/terms"
                  className="text-[#FFB80C]  font-medium"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 ">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Quick answers to common questions about our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {[
    {
      q: "How long do deposits take to process?",
      a: "Most deposits are processed within 1-2 business hours. Bank transfers may take 1-3 business days depending on your bank.",
    },
    {
      q: "What are the withdrawal processing times?",
      a: "Withdrawals are typically processed within 24-48 hours. You'll receive an MTR number once approved.",
    },
    {
      q: "Is my personal information secure?",
      a: "Yes, we use industry-standard encryption and security measures to protect all user data and financial information.",
    },
    {
      q: "How can I reset my password?",
      a: "From the login page, click 'Forgot Password' and follow the instructions sent to your email.",
    },
  ].map((faq, i) => (
    <div
      key={i}
      className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition hover:bg-black group"
    >
      <h3 className="text-lg font-semibold text-black mb-3 group-hover:text-white">
        {faq.q}
      </h3>
      <p className="text-gray-700 group-hover:text-gray-200">{faq.a}</p>
    </div>
  ))}
</div>

        </div>
      </div>
    </div>
  );
}
