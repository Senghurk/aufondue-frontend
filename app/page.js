"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "../app/components/Button";
import { useTranslation } from "./hooks/useTranslation";
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function Home() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userCurrentSlide, setUserCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const totalSlides = 2;
  const userTotalSlides = 2;

  // Handle hydration mismatch by setting client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Auto-swipe every 4 seconds

    return () => clearInterval(interval);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    const userInterval = setInterval(() => {
      setUserCurrentSlide((prev) => (prev + 1) % userTotalSlides);
    }, 5000); // Auto-swipe every 5 seconds (different timing)

    return () => clearInterval(userInterval);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    const carousel = document.getElementById('carousel');
    if (carousel) {
      carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
  }, [currentSlide, isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    const userCarousel = document.getElementById('user-carousel');
    if (userCarousel) {
      userCarousel.style.transform = `translateX(-${userCurrentSlide * 100}%)`;
    }
  }, [userCurrentSlide, isClient]);

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const goToUserSlide = (slideIndex) => {
    setUserCurrentSlide(slideIndex);
  };

  return (
    <main className="min-h-screen bg-[#fdfdfd] text-gray-900">
      {/* Top Navigation Bar */}
      <header className="w-full px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center">
          <a
            href="/"
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight hover:text-red-600 transition-colors"
          >
            {t('landing.title')}
          </a>
        </div>
        <nav className="flex items-center gap-3 sm:gap-8">
          <a
            href="#features"
            className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            {t('landing.nav.features')}
          </a>
          <a
            href="#about"
            className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            {t('landing.nav.about')}
          </a>
          <LanguageSwitcher />
          <Button
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm transition-all duration-200 text-sm sm:text-base"
            onClick={() => (window.location.href = "/Log-in")}
          >
            {t('landing.nav.login')}
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-20 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-50 text-red-700 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            {t('landing.hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-gray-900 tracking-tight">
            {t('landing.hero.title')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
            {t('landing.hero.subtitle')}
          </p>
        </div>


        {/* Platform Overview Cards - Moved up immediately after hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12 px-4">
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-red-100 hover:border-red-300 transition-colors">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.platforms.webDashboard.title')}</h3>
              <div className="text-xs font-semibold text-red-600 mb-2">{t('landing.platforms.webDashboard.subtitle')}</div>
              <p className="text-gray-600 text-sm leading-relaxed">{t('landing.platforms.webDashboard.description')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.platforms.mobileApp.title')}</h3>
              <div className="text-xs font-semibold text-blue-600 mb-2">{t('landing.platforms.mobileApp.subtitle')}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{t('landing.platforms.mobileApp.description')}</p>
              <div className="flex justify-center">
                <a
                  href="https://play.google.com/store/apps/details?id=edu.au.unimend.aufondue&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <div className="bg-black hover:bg-gray-800 text-white rounded-md px-4 py-2 transition-all duration-200 hover:shadow-lg flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#00D4FF" d="M3,20.5V3.5C3,2.9 3.35,2.37 3.84,2.13L13.69,12L3.84,21.87C3.35,21.63 3,21.1 3,20.5Z"/>
                      <path fill="#00FF94" d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                      <path fill="#FFEA00" d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12Z"/>
                      <path fill="#FF4444" d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81Z"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[9px] leading-none">{t('landing.platforms.mobileApp.getItOn')}</span>
                      <span className="text-base font-medium -mt-0.5">{t('landing.platforms.mobileApp.googlePlay')}</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
      </div>

      {/* What is AU Fondue Section with Stats */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            {t('landing.whatIs.subtitle')}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
            {t('landing.whatIs.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto px-2 sm:px-0 mb-8">
            {t('landing.whatIs.description')}
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0 mt-8">
            <div className="text-center p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-1 sm:mb-2">50%</div>
              <div className="text-sm sm:text-base text-gray-600">{t('landing.stats.fasterResolution').replace('50% ', '')}</div>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-1 sm:mb-2">Next-Gen</div>
              <div className="text-sm sm:text-base text-gray-600">{t('landing.stats.nextGen').replace('Next-Gen ', '')}</div>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-1 sm:mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600">{t('landing.stats.realTimeMonitoring').replace('24/7 ', '')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Features Section - Web Platform */}
      <section
        id="features"
        className="bg-gradient-to-br from-gray-50 to-white py-24 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('landing.features.webDashboard.badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {t('landing.adminFeatures.subtitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.features.webDashboard.description')}
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            <div
              id="carousel"
              className="flex transition-transform duration-500 ease-in-out"
            >
              {[
                [
                  {
                    title: t('landing.adminFeatures.reportOverview.title'),
                    desc: t('landing.adminFeatures.reportOverview.description'),
                  },
                  {
                    title: t('landing.adminFeatures.smartAssignment.title'),
                    desc: t('landing.adminFeatures.smartAssignment.description'),
                  },
                  {
                    title: t('landing.adminFeatures.excelExport.title'),
                    desc: t('landing.adminFeatures.excelExport.description'),
                  },
                ],
                [
                  {
                    title: t('landing.adminFeatures.visualStats.title'),
                    desc: t('landing.adminFeatures.visualStats.description'),
                  },
                  {
                    title: t('landing.adminFeatures.analytics.title'),
                    desc: t('landing.adminFeatures.analytics.description'),
                  },
                  {
                    title: t('landing.features.dailyReports.title'),
                    desc: t('landing.features.dailyReports.description'),
                  },
                ],
              ].map((slide, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {slide.map((feature, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                          {/* Dynamic icon based on feature title */}
                          {feature.title === t('landing.adminFeatures.reportOverview.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {feature.title === t('landing.adminFeatures.smartAssignment.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {feature.title === t('landing.adminFeatures.excelExport.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {feature.title === t('landing.adminFeatures.visualStats.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                          {feature.title === t('landing.adminFeatures.analytics.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          )}
                          {feature.title === t('landing.features.dailyReports.title') && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v7m3-2h6m-6 4h6m2 0h.01M5 20h.01" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div
              className="flex justify-center mt-8 gap-2"
              suppressHydrationWarning={true}
            >
              {[0, 1].map((slideIndex) => (
                <button
                  key={slideIndex}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    currentSlide === slideIndex
                      ? "bg-red-600"
                      : "bg-gray-300 hover:bg-red-400"
                  }`}
                  onClick={() => goToSlide(slideIndex)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Features Section - Mobile App */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('landing.features.mobileApp.badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {t('landing.userFeatures.subtitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.features.mobileApp.description')}
            </p>
          </div>

          {/* User Carousel Container */}
          <div className="relative overflow-hidden">
            <div
              id="user-carousel"
              className="flex transition-transform duration-500 ease-in-out"
            >
              {[
                [
                  {
                    title: t('landing.userFeatures.fastReporting.title'),
                    desc: t('landing.userFeatures.fastReporting.description'),
                  },
                  {
                    title: t('landing.userFeatures.liveTracking.title'),
                    desc: t('landing.userFeatures.liveTracking.description'),
                  },
                ],
                [
                  {
                    title: t('landing.userFeatures.history.title'),
                    desc: t('landing.userFeatures.history.description'),
                  },
                  {
                    title: t('landing.userFeatures.intuitiveDesign.title'),
                    desc: t('landing.userFeatures.intuitiveDesign.description'),
                  },
                ],
              ].map((slide, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {slide.map((feature, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                          {/* Dynamic icon based on feature title */}
                          {feature.title === t('landing.userFeatures.fastReporting.title') && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                          {feature.title === t('landing.userFeatures.liveTracking.title') && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                          {feature.title === t('landing.userFeatures.history.title') && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {feature.title === t('landing.userFeatures.intuitiveDesign.title') && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* User Navigation Dots */}
            <div
              className="flex justify-center mt-8 gap-2"
              suppressHydrationWarning={true}
            >
              {[0, 1].map((slideIndex) => (
                <button
                  key={slideIndex}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    userCurrentSlide === slideIndex
                      ? "bg-blue-600"
                      : "bg-gray-300 hover:bg-blue-400"
                  }`}
                  onClick={() => goToUserSlide(slideIndex)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gradient-to-b from-white to-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6">
              {t('landing.about.title')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {t('landing.about.subtitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.about.tagline')}
            </p>
          </div>

          {/* University and Project Information */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-16">
            <div className="flex flex-col items-center mb-12">
              <img
                src="/VMES_logo.gif"
                alt="VMES University Logo"
                className="w-32 h-32 md:w-40 md:h-40 object-contain mb-6"
              />
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Assumption University
              </h3>
              <p className="text-lg text-gray-600 text-center max-w-2xl">
                Vincent Mary School of Engineering, Science and Technology
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('landing.about.description1')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {t('landing.about.description2')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {t('landing.about.description3')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-blue-50 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('landing.aboutAU.builtForAU')}</h3>
                  <p className="text-sm text-gray-600 max-w-xs">{t('landing.aboutAU.builtForAUDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Development Team Section */}
          <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {t('landing.team.title')}
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('landing.team.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Developer 1 */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">SH</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {t('landing.team.developer1')}
                </h4>
                <p className="text-sm text-gray-600 text-center">{t('landing.team.roles.fullStack')}</p>
              </div>

              {/* Developer 2 */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">MT</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {t('landing.team.developer2')}
                </h4>
                <p className="text-sm text-gray-600 text-center">{t('landing.team.roles.frontend')}</p>
              </div>

              {/* Developer 3 */}
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">TH</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {t('landing.team.developer3')}
                </h4>
                <p className="text-sm text-gray-600 text-center">{t('landing.team.roles.frontend')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}