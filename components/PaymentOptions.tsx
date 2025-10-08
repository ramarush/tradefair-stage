/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

export default function PaymentOptions() {
  const cardStyle =
    "bg-white p-3 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm w-24 h-14";


    // const paymentMethods = [
    //     { src: "/payments/mastercard.png", alt: "Mastercard" },
    //     { src: "/payments/visa.png", alt: "Visa" },
    //     { src: "/payments/paypal.png", alt: "PayPal" },
    //     { src: "/payments/skrill.png", alt: "Skrill" },
    //     { src: "/payments/neteller.png", alt: "Neteller" },
    //     { src: "/payments/wire-transfer.png", alt: "Wire Transfer" },
    //   ];

  return (
    <section className="w-full bg-[#121212] py-12">
      <div className="container mx-auto px-4 text-center">
        {/* Top Heading */}
        <h2 className="text-white text-2xl font-bold tracking-wide mb-8 border-b-2 border-yellow-400 inline-block pb-1">
          Payment Methods
        </h2>

        {/* First Row - Cards & UPI */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-10">
          {[

            {
              src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/640px-Google_Pay_Logo.svg.png",
              alt: "Google Pay",
            },
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/UPI_logo.svg/640px-UPI_logo.svg.png",
              alt: "UPI",
            },
            {
              src: "https://cuvette.tech/blog/wp-content/uploads/2024/06/PhonePe-Logo.wine_.png",
              alt: "PhonePe",
            },
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png",
              alt: "Visa",
            },
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png",
              alt: "MasterCard",
            },
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Maestro_logo.png/640px-Maestro_logo.png",
              alt: "Maestro",
            },
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rupay-Logo.png/1600px-Rupay-Logo.png?20200811062726",
              alt: "RuPay",
            },
            
            {
              src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Paytm_logo.png/640px-Paytm_logo.png",
              alt: "Paytm",
            },
            
            
            
          ].map((logo) => (
            <div key={logo.alt} className={cardStyle}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={90}
                height={40}
                className="object-contain max-w-[80px] max-h-[32px]"
              />
            </div>
          ))}
        </div>

        {/* Second Heading */}
        <h3 className="text-white text-2xl font-bold tracking-wide mb-8 border-b-2 border-yellow-400 inline-block pb-1">
          {/* Payment Methods */}
        </h3>

        {/* Second Row - BNPL */}

        <div className="flex flex-wrap justify-center items-center gap-6 mb-10">
          {/* {paymentMethods.map((logo) => (
            <div
              key={logo.alt}
              className="bg-[#1c1c1c] w-[130px] h-[100px] rounded-lg shadow-md flex flex-col items-center justify-center p-2"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={60}
                height={40}
                className="object-contain mb-2"
              />
              <p className="text-white text-sm font-medium">{logo.alt}</p>
            </div>
          ))} */}
        </div>
           <div className="flex flex-wrap justify-center items-center gap-6 mb-10">
  {[
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
      alt: "Mastercard",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png",
      alt: "Visa",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
      alt: "PayPal",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Skrill-Moneybookers.svg",
      alt: "Skrill",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Neteller.svg",
      alt: "Neteller",
    },
    {
      src: "https://as2.ftcdn.net/v2/jpg/14/96/66/91/1000_F_1496669164_EKTKUcSQIHcRXOpa6DwD1o9XNTYDgGL8.jpg",
      alt: "Wire Transfer",
    },
  ].map((logo) => (
    <div
      key={logo.alt}
      className="bg-[#1c1c1c] p-4 rounded-lg flex flex-col items-center justify-center shadow-md w-32"
    >
      <img
        src={logo.src}
        alt={logo.alt}
        width={90}
        height={40}
        className="object-contain max-h-[40px]"
      />
      <p className="text-white text-sm mt-2 text-center">{logo.alt}</p>
    </div>
  ))}
</div>


      </div>
    </section>
  );
}
