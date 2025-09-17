"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getBackendUrl } from "../config/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function ChangePasswordPage() {
  const { t, tWithParams } = useTranslation();
  const router = useRouter();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const backendUrl = getBackendUrl();
  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChanging, setIsChanging] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Check if user is logged in and needs to change password
  useEffect(() => {
    if (!user) {
      router.push("/Log-in");
      return;
    }
    
    // Only allow access if it's first login
    if (user.userType === 'staff' && !user.firstLogin) {
      router.push("/reports");
      return;
    }
  }, [user, router]);
  
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push(t("changePassword.requirements.length"));
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(t("changePassword.requirements.uppercase"));
    }
    if (!/[a-z]/.test(password)) {
      errors.push(t("changePassword.requirements.lowercase"));
    }
    if (!/[0-9]/.test(password)) {
      errors.push(t("changePassword.requirements.number"));
    }
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    
    if (!passwords.currentPassword) {
      newErrors.currentPassword = t("changePassword.validation.currentRequired");
    }
    
    if (!passwords.newPassword) {
      newErrors.newPassword = t("changePassword.validation.newRequired");
    } else {
      const passwordErrors = validatePassword(passwords.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors.join(", ");
      }
    }
    
    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = t("changePassword.validation.confirmRequired");
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = t("changePassword.validation.passwordsMismatch");
    }
    
    // Check if new password is same as current
    if (passwords.currentPassword === passwords.newPassword) {
      newErrors.newPassword = t("changePassword.validation.sameasCurrent");
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsChanging(true);
    setErrors({});
    
    try {
      const response = await fetch(`${backendUrl}/auth/staff/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: user.staffId || user.omId,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update user context to reflect password has been changed
        const updatedUser = {
          ...user,
          firstLogin: false
        };
        login(updatedUser);
        
        toast({
          variant: "success",
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t("changePassword.messages.successTitle")}
            </div>
          ),
          description: t("changePassword.messages.successMessage"),
          duration: 3000,
        });
        
        // Redirect to appropriate page after password change
        setTimeout(() => {
          if (user.userType === 'staff') {
            router.push("/reports");
          } else {
            router.push("/dashboard");
          }
        }, 1500);
      } else {
        throw new Error(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change failed:", error);
      
      // Check if it's wrong current password
      if (error.message.includes("incorrect") || error.message.includes("wrong")) {
        setErrors({ currentPassword: t("changePassword.messages.incorrectCurrent") });
      } else {
        toast({
          variant: "error",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t("changePassword.messages.failedTitle")}
            </div>
          ),
          description: error.message || t("changePassword.messages.failed"),
        });
      }
    } finally {
      setIsChanging(false);
    }
  };
  
  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">{t("common.loading")}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t("changePassword.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("changePassword.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* First Login Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">{t("changePassword.alert.title")}</p>
                <p className="mt-1">{t("changePassword.alert.message")}</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("changePassword.form.currentPassword")}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder={t("changePassword.form.currentPasswordPlaceholder")}
                  value={passwords.currentPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, currentPassword: e.target.value });
                    if (errors.currentPassword) {
                      setErrors({ ...errors, currentPassword: "" });
                    }
                  }}
                  className={errors.currentPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-500">{errors.currentPassword}</p>
              )}
              <p className="text-xs text-gray-500">{t("changePassword.form.currentPasswordHint")}</p>
            </div>
            
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("changePassword.form.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder={t("changePassword.form.newPasswordPlaceholder")}
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, newPassword: e.target.value });
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: "" });
                    }
                  }}
                  className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("changePassword.form.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder={t("changePassword.form.confirmPasswordPlaceholder")}
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, confirmPassword: e.target.value });
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: "" });
                    }
                  }}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            
            {/* Password Requirements */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">{t("changePassword.requirements.title")}</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={passwords.newPassword.length >= 8 ? "text-green-600" : ""}>
                  {t("changePassword.requirements.length")}
                </li>
                <li className={/[A-Z]/.test(passwords.newPassword) ? "text-green-600" : ""}>
                  {t("changePassword.requirements.uppercase")}
                </li>
                <li className={/[a-z]/.test(passwords.newPassword) ? "text-green-600" : ""}>
                  {t("changePassword.requirements.lowercase")}
                </li>
                <li className={/[0-9]/.test(passwords.newPassword) ? "text-green-600" : ""}>
                  {t("changePassword.requirements.number")}
                </li>
              </ul>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isChanging}
            >
              {isChanging ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-pulse" />
                  {t("changePassword.buttons.changing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t("changePassword.buttons.changePassword")}
                </>
              )}
            </Button>
            
            {/* Note about logging out */}
            <p className="text-xs text-center text-gray-500 mt-4">
              {t("changePassword.messages.cannotSkip")}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}