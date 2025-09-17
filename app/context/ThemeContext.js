"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Hydrate theme from localStorage after mount
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    const isLoggedIn = userData && userData !== "null";
    
    if (isLoggedIn) {
      // Force light theme for logged-in users (admin or staff)
      setTheme("light");
    } else {
      // For non-logged-in users, use their preference
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (prefersDark) {
        setTheme("dark");
      }
    }
    
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Force light theme (called when user logs in)
  const setLightTheme = () => {
    setTheme("light");
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    isDark: theme === "dark"
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values if not within provider (for SSR/build compatibility)
    return {
      theme: "light",
      setTheme: () => {},
      toggleTheme: () => {},
      setLightTheme: () => {},
      isDark: false
    };
  }
  return context;
}