"use client";

import { useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function ContactForm() {
  const [phone, setPhone] = useState("");

  return (
    <form className="space-y-6">
      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label
            htmlFor="Name"
            className="block text-sm font-medium text-white mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="Name"
            name="Name"
            placeholder="Enter your name"
            className="w-full px-3 py-2 rounded-md shadow-sm bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB80C]"
            required
          />
        </div>

        {/* Phone with Country Code */}
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-white mb-2"
          >
            Mobile Number
          </label>
          <PhoneInput
            defaultCountry="us"
            value={phone}
            onChange={(phone) => setPhone(phone)}
            inputClassName="bg-white text-black placeholder-gray-400 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB80C]"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white mb-2"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          className="w-full px-3 py-2 rounded-md shadow-sm bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB80C]"
          required
        />
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-white mb-2"
        >
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          className="w-full px-3 py-2 rounded-md shadow-sm bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB80C]"
          required
        >
          <option value="">Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="deposits">Deposits & Withdrawals</option>
          <option value="trading">Trading Questions</option>
          <option value="account">Account Issues</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-white mb-2"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Please describe your inquiry in detail..."
          className="w-full px-3 py-2 rounded-md shadow-sm bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB80C]"
          required
        ></textarea>
      </div>

      {/* Button */}
      <button
        type="submit"
        className="w-full  py-3 px-4 rounded-md bg-[#FFB80C] text-black focus:outline-none focus:ring-2 focus:ring-[#FFB80C] focus:ring-offset-2 transition font-medium"
      >
        Send Message
      </button>
    </form>
  );
}
