"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";
import TopBar from "./components/Topbar";
import SideBar from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import { GeistSans } from 'geist/font/sans';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [activeTopLink, setActiveTopLink] = useState("/");
  const [activeLink, setActiveLink] = useState(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Update activeLink when pathname changes
  useEffect(() => {
    setActiveLink(pathname);
    // Set activeTopLink based on the pathname
    if (pathname === "/admins" || pathname === "/staff-management") {
      setActiveTopLink("/admins");
    } else {
      setActiveTopLink("/");
    }
  }, [pathname]);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Pages that should NOT have admin layout
  const isPublicPage = pathname === "/" || pathname === "/Log-in" || pathname === "/Sign-up" || pathname === "/change-password" || pathname === "/reset-password";

  return (
    <html lang="en" className={GeistSans.variable}>
      <body className={GeistSans.className}>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
            {isPublicPage ? (
              <div className="w-full min-h-screen">{children}</div>
            ) : (
              <div className="min-h-screen flex flex-col print:min-h-0 print:block">
              {/* Top bar */}
              <TopBar
                activeTopLink={activeTopLink}
                setActiveTopLink={setActiveTopLink}
                setActiveLink={setActiveLink}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                isMobile={isMobile}
              />

              {/* Page layout */}
              <div className="flex-1 flex relative print:block print:w-full bg-gray-100 dark:bg-gray-950">
                {/* Desktop Sidebar */}
                {!isMobile && (
                  <div className="w-80 p-6 pr-3 print:hidden">
                    <SideBar
                      activeTopLink={activeTopLink}
                      activeLink={activeLink}
                      setActiveLink={setActiveLink}
                      isMobile={false}
                    />
                  </div>
                )}

                {/* Mobile Sidebar Overlay */}
                {isMobile && sidebarOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black/50 z-40 lg:hidden print:hidden"
                      onClick={() => setSidebarOpen(false)}
                    />
                    {/* Sidebar */}
                    <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-xl lg:hidden transform transition-transform duration-300 print:hidden">
                      <div className="p-6">
                        <SideBar
                          activeTopLink={activeTopLink}
                          activeLink={activeLink}
                          setActiveLink={setActiveLink}
                          isMobile={true}
                          onNavigate={() => setSidebarOpen(false)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Page content */}
                <main className={`flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto print:bg-white print:rounded-none print:p-0 print:overflow-visible ${
                  isMobile ? 'p-4' : 'p-6 pl-3'
                }`}>
                  {children}
                </main>
              </div>
              </div>
            )}
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
