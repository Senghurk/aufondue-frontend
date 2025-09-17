"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseClient";
import { getBackendUrl } from "../config/api";
import { useTranslation } from "../hooks/useTranslation";
import { Button } from "../../components/ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { User, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ activeTopLink, setActiveTopLink, setActiveLink, sidebarOpen, setSidebarOpen, isMobile }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout, isAdmin, isOMStaff } = useAuth();
  const { t } = useTranslation();

  const backendUrl = getBackendUrl();

  const handleLinkClick = (link) => {
    setActiveTopLink(link);
  };

  const handleDefaultLink = (link) => {
    setActiveLink(link);
  };

  const handleLogout = async () => {
    try {
      // Bypass Firebase logout - just clear local auth
      logout();
      router.push("/Log-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm print:hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Mobile Menu Button & App Title */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href={isOMStaff() ? "/reports" : "/dashboard"} className="group">
            <h1 className={`font-semibold transition-colors duration-200 ${
              isMobile ? 'text-lg' : 'text-2xl'
            }`}>
              <span className="text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">AU Fondue </span>
              <span className={isOMStaff() ? "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300" : "text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"}>
                {isOMStaff() ? t('topbar.auFondueStaff') : t('topbar.auFondueAdmin')}
              </span>
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8">
          {/* Navigation Links - Show for Admin users on all screen sizes */}
          {isAdmin() && (
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              <Link
                href="/dashboard"
                className={`px-2 lg:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTopLink === "/dashboard" || activeTopLink === "/"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => {
                  handleLinkClick("/dashboard");
                  handleDefaultLink("/dashboard");
                }}
              >
                <span className="hidden sm:inline">{t('topbar.dashboard')}</span>
                <span className="sm:hidden">{t('topbar.home')}</span>
              </Link>
              <Link
                href="/admins"
                className={`px-2 lg:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTopLink === "/admins"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => {
                  handleLinkClick("/admins");
                  handleDefaultLink("/admins");
                }}
              >
                {t('topbar.users')}
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 pl-2 sm:pl-4 lg:pl-6 border-l border-gray-300 dark:border-gray-600">
            {/* Username Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 lg:gap-2 px-1 sm:px-2 lg:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  size="sm"
                >
                  <div className="w-6 sm:w-7 h-6 sm:h-7 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-3 sm:h-4 w-3 sm:w-4 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium hidden md:block text-xs sm:text-sm">
                    {user ? user.name : t('topbar.user')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700">
                  {t('topbar.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? (
                <Sun className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-500" />
              ) : (
                <Moon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-slate-600" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
