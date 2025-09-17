"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function usePasswordCheck() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if user is logged in and is staff with first login
    if (user && user.userType === 'staff' && user.firstLogin === true) {
      // Redirect to password change page
      router.push("/change-password");
    }
  }, [user, router]);
  
  return { requiresPasswordChange: user?.firstLogin === true };
}