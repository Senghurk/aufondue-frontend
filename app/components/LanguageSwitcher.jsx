"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <button
      onClick={() => changeLanguage(language === "en" ? "th" : "en")}
      className="relative inline-flex h-8 w-[72px] items-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 shadow-sm border border-gray-300"
      aria-label="Toggle language"
    >
      {/* Static labels - placed first so they're behind the toggle */}
      <span
        className={`absolute left-[10px] text-[11px] font-semibold transition-colors duration-200 z-10 ${
          language === "en" ? "text-transparent" : "text-gray-600"
        }`}
      >
        EN
      </span>
      <span
        className={`absolute right-[10px] text-[11px] font-semibold transition-colors duration-200 z-10 ${
          language === "th" ? "text-transparent" : "text-gray-600"
        }`}
      >
        TH
      </span>

      {/* Sliding toggle - placed last so it's on top */}
      <span
        className={`absolute w-[32px] h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center z-20 ${
          language === "th" ? "translate-x-[37px]" : "translate-x-[3px]"
        }`}
      >
        <span className="text-[11px] font-bold text-white">
          {language === "en" ? "EN" : "TH"}
        </span>
      </span>
    </button>
  );
}