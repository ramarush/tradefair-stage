'use client';
import { FaCommentDots } from "react-icons/fa";

const FloatingSocialWidget = () => {
  const handleClick = () => {
    window.open("https://linktr.ee/tradefairofficial", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Direct Link Button */}
      <button
        onClick={handleClick}
        className="w-18 h-18 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-300"
      >
        <FaCommentDots />
      </button>
    </div>
  );
};

export default FloatingSocialWidget;
