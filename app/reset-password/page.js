"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebaseClient";
import { getBackendUrl } from "../config/api";
import { useToast } from "../context/ToastContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const backendUrl = getBackendUrl();
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Get the reset code from URL
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  
  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (verificationStarted) {
      console.log("Verification already started, skipping...");
      return;
    }
    
    // Log parameters for debugging
    console.log("Reset password page loaded");
    console.log("oobCode:", oobCode);
    console.log("mode:", mode);
    console.log("Full URL:", window.location.href);
    
    if (!oobCode) {
      console.error("No oobCode found in URL");
      toast({
        variant: "error",
        title: "Invalid Reset Link",
        description: "Missing reset code. Please use the link from your email.",
      });
      setTimeout(() => router.push("/Log-in"), 3000);
      return;
    }
    
    // Mark verification as started
    setVerificationStarted(true);
    
    // Verify the reset code and get the email
    console.log("Verifying reset code with Firebase...");
    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        console.log("Reset code verified successfully for:", userEmail);
        setEmail(userEmail);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error("Invalid reset code:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        let errorMessage = "This password reset link is invalid or has expired.";
        if (error.code === 'auth/expired-action-code') {
          errorMessage = "This password reset link has expired. Please request a new one.";
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = "Invalid password reset link. Please request a new one.";
        }
        
        toast({
          variant: "error",
          title: "Invalid Reset Link",
          description: errorMessage,
        });
        setTimeout(() => router.push("/Log-in"), 3000);
      });
  }, [oobCode, verificationStarted]);
  
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors[0];
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsResetting(true);
    setErrors({});
    
    try {
      // Reset password using Firebase
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // Update backend to sync password
      try {
        const response = await fetch(`${backendUrl}/staff/update-password-firebase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            newPassword: newPassword
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to sync password with backend");
        }
      } catch (backendError) {
        console.error("Backend sync error:", backendError);
        // Continue even if backend sync fails
      }
      
      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Password Reset Successful
          </div>
        ),
        description: "Your password has been reset successfully. Please login with your new password.",
        duration: 5000,
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/Log-in");
      }, 2000);
    } catch (error) {
      console.error("Password reset failed:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      if (error.code === 'auth/expired-action-code') {
        errorMessage = "This password reset link has expired. Please request a new one.";
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = "Invalid password reset link. Please request a new one.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Password Reset Failed
          </div>
        ),
        description: errorMessage,
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // If no oobCode, show instructions
  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Password Reset Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Please use the link from your email
              </p>
              <p className="text-sm text-amber-700">
                The password reset email contains a secure link that will take you to Firebase's password reset page.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">How to reset your password:</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  Check your email for the password reset message
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  Click the link in the email (it will open Firebase's secure reset page)
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  Enter your new password on Firebase's page
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  Return to the login page to sign in with your new password
                </li>
              </ol>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => router.push("/Log-in")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            {isVerifying ? "Verifying reset link..." : `Create a new password for ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: "" });
                    }
                  }}
                  className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: "" });
                    }
                  }}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            
            {/* Password Requirements */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                  • One number
                </li>
              </ul>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isResetting}
            >
              {isResetting ? "Resetting Password..." : "Reset Password"}
            </Button>
            
            {/* Back to Login */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/Log-in")}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}