"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { getBackendUrl } from "../config/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Shield, Users, ArrowLeft, AlertCircle, X, CheckCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { auth } from "../firebaseClient";
import { signInWithPopup, OAuthProvider } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { setLightTheme } = useTheme();
  const { toast, clearAllToasts } = useToast();
  const { t, tWithParams } = useTranslation();
  const [loginType, setLoginType] = useState(null); // null, 'admin', 'staff'
  const [staffCredentials, setStaffCredentials] = useState({
    omId: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // System developer accounts are now handled automatically by the backend

  const handleMicrosoftLoginPopup = async () => {
    setIsLoading(true);

    try {
      // Initialize Microsoft OAuth provider
      const provider = new OAuthProvider('microsoft.com');
      
      // Configure the provider for organizational accounts
      provider.setCustomParameters({
        // Use 'organizations' for any organizational account
        // Or use AU's specific tenant ID if you have it
        tenant: 'organizations', // Changed from 'consumers' to 'organizations'
        prompt: 'select_account',
        // Optional: Add domain hint to pre-select AU domain
        domain_hint: 'au.edu'
      });
      
      // Add the AU email domain hint
      provider.addScope('email');
      provider.addScope('profile');
      
      // Sign in with Microsoft using Firebase
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // Immediately handle popup errors
        setIsLoading(false);
        
        if (popupError.code === 'auth/popup-closed-by-user') {
          toast({
            variant: "error",
            title: t('login.messages.signInCancelled'),
            description: t('login.messages.signInCancelledDesc'),
          });
          return;
        } else if (popupError.code === 'auth/cancelled-popup-request') {
          toast({
            variant: "error",
            title: t('login.messages.popupError'),
            description: t('login.messages.popupErrorDesc'),
          });
          return;
        } else if (popupError.code === 'auth/popup-blocked') {
          toast({
            variant: "error",
            title: t('login.messages.popupBlocked'),
            description: t('login.messages.popupBlockedDesc'),
          });
          return;
        }
        throw popupError; // Re-throw for other errors
      }
      
      const user = result.user;
      
      // Extract the email from the Microsoft account
      const adminEmail = user.email;
      
      if (!adminEmail) {
        toast({
          variant: "error",
          title: t('login.messages.authFailed'),
          description: t('login.messages.noEmail'),
        });
        setIsLoading(false);
        return;
      }
      
      // Verify it's an @au.edu email
      if (!adminEmail.endsWith("@au.edu")) {
        toast({
          variant: "error",
          title: t('login.messages.invalidDomain'),
          description: t('login.messages.invalidDomainDesc'),
        });
        // Sign out from Firebase
        await auth.signOut();
        setIsLoading(false);
        return;
      }
      
      // Get the ID token for backend verification
      const idToken = await user.getIdToken();
      
      // Verify with backend that this user is registered as an admin
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          accessToken: idToken,
          displayName: user.displayName,
          uid: user.uid
        })
      });

      const backendResult = await response.json();
      
      if (!response.ok || !backendResult.success) {
        console.log("Admin authentication failed:", backendResult.message);
        toast({
          variant: "error",
          title: t('login.messages.accessDenied'),
          description: backendResult.message || t('login.messages.adminAuthFailed'),
        });
        setIsLoading(false);
        return;
      }

      console.log("Admin authentication successful:", backendResult.data);
      
      // Extract user data from backend response
      const { userType, userId, name, email, firstLogin, token } = backendResult.data;
      
      // Clear any existing toasts on successful login
      clearAllToasts();
      
      // Show success toast
      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('login.messages.loginSuccess')}
          </div>
        ),
        description: tWithParams('login.messages.welcomeBack', { name }),
      });
      
      // Update auth context with user data from backend
      const userData = {
        userId: userId,
        email: email,
        name: name,
        role: 'ADMIN',
        userType: 'admin',
        token: token
      };
      login(userData);

      // Set theme to light for admin users
      setLightTheme();

      // Success — redirect to dashboard (with slight delay for toast visibility)
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      
      let errorMessage = error.message || "";
      
      toast({
        variant: "error",
        title: t('login.messages.connectionError'),
        description: t('login.messages.connectionErrorDesc'),
      });
      
      // Sign out from Firebase if login failed
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error("Error signing out:", signOutError);
      }
    }
  };

  const handleStaffLogin = async () => {
    setIsLoading(true);
    
    try {
      if (!staffCredentials.omId.trim() || !staffCredentials.password) {
        toast({
          variant: "error",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('login.messages.missingInfo')}
            </div>
          ),
          description: !staffCredentials.omId.trim() 
            ? t('login.messages.enterStaffId') 
            : t('login.messages.enterPassword'),
        });
        setIsLoading(false);
        return;
      }

      // Validate staff credentials
      console.log("Authenticating staff:", staffCredentials.omId);
      
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/auth/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          omId: staffCredentials.omId.toUpperCase(),
          password: staffCredentials.password
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        // Check if this is a default password security warning
        if (result.errorType === "DEFAULT_PASSWORD_EXPIRED") {
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                {t('login.messages.securityAlert')}
              </div>
            ),
            description: (
              <div className="space-y-1">
                <p className="font-semibold text-red-700">{t('login.messages.defaultPasswordInvalid')}</p>
                <p className="text-sm">{t('login.messages.passwordChanged')}</p>
                <p className="text-xs text-gray-600 mt-2">{t('login.messages.securityReason')}</p>
              </div>
            ),
            duration: 8000, // Show for longer since it's important
          });
        } else {
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {t('login.messages.loginFailed')}
              </div>
            ),
            description: result.message || t('login.messages.staffLoginFailed'),
          });
        }
        setIsLoading(false);
        return;
      }

      // Extract user data from backend response
      const { userType, userId, staffId, name, email, firstLogin, token } = result.data;
      
      const userData = {
        userId: userId,
        omId: staffCredentials.omId,
        staffId: staffId || staffCredentials.omId,
        name: name || `Staff ${staffCredentials.omId}`,
        email: email,
        role: 'OM_STAFF',
        userType: 'staff',
        firstLogin: firstLogin,
        token: token
      };
      
      // Clear any existing toasts on successful login
      clearAllToasts();
      
      // Check if it's first login
      if (firstLogin) {
        // Show first login toast
        toast({
          variant: "warning",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('login.messages.passwordChangeRequired')}
            </div>
          ),
          description: t('login.messages.mustChangePassword'),
        });
        
        login(userData);
        setLightTheme();
        
        // Redirect to password change page for first login
        setTimeout(() => {
          router.push("/change-password");
        }, 1000);
      } else {
        // Show success toast for regular login
        toast({
          variant: "success",
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('login.messages.loginSuccess')}
            </div>
          ),
          description: tWithParams('login.messages.welcomeBack', { name: userData.name }),
        });
        
        login(userData);
        setLightTheme();
        
        // Redirect to reports page for normal login
        setTimeout(() => {
          router.push("/reports");
        }, 1500);
      }
      
    } catch (error) {
      console.error("Staff login failed:", error);
      toast({
        variant: "error",
        title: t('login.messages.connectionError'),
        description: t('login.messages.connectionErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login type selection screen
  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-lg mx-auto">
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent mb-3">
                {t('login.title')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('login.subtitle')}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {t('login.chooseAccess')}
              </p>
            </div>

            {/* Login Options Card */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* Admin Login Option */}
                  <div 
                    onClick={() => setLoginType('admin')}
                    className="group relative cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 transition-all duration-300 transform group-hover:scale-[1.02]">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Shield className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{t('login.admin.title')}</h3>
                            <p className="text-blue-100 text-sm">{t('login.admin.subtitle')}</p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Staff Login Option */}
                  <div 
                    onClick={() => setLoginType('staff')}
                    className="group relative cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gray-100 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl p-6 transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{t('login.staff.title')}</h3>
                            <p className="text-gray-600 text-sm">{t('login.staff.subtitle')}</p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>{t('login.securedBy')}</span>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {t('login.termsText')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                {t('login.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin login screen
  if (loginType === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Full Screen Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">{t('login.admin.loggingIn')}</p>
                <p className="text-sm text-gray-600 mt-1">{t('login.admin.authenticating')}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-lg mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setLoginType(null)}
              className="mb-6 p-2 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('login.backToLogin')}
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                {t('login.admin.loginTitle')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('login.admin.loginSubtitle')}
              </p>
            </div>

            {/* Login Card */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Microsoft Login Button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-75"></div>
                    <Button
                      onClick={handleMicrosoftLoginPopup}
                      disabled={isLoading}
                      className="relative w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] min-h-[64px]"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          {t('login.admin.loggingIn')}
                        </>
                      ) : (
                        <>
                          <Shield className="h-6 w-6 mr-3 flex-shrink-0" />
                          {t('login.admin.continueAs')}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Development Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-semibold text-sm">{t('login.admin.microsoftAuth')}</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          {t('login.admin.microsoftDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">{t('login.admin.secureAccess')}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">{t('login.admin.enterpriseGrade')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                {t('login.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff login screen
  if (loginType === 'staff') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Full Screen Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-transparent absolute top-0"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">{t('login.staff.loggingIn')}</p>
                <p className="text-sm text-gray-600 mt-1">{tWithParams('login.staff.verifying', { omId: staffCredentials.omId })}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-lg mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setLoginType(null)}
              className="mb-6 p-2 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('login.backToLogin')}
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl shadow-xl mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent mb-3">
                {t('login.staff.loginTitle')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('login.staff.loginSubtitle')}
              </p>
            </div>

            {/* Login Card */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-5">
                  {/* Form Fields */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="omId" className="text-sm font-semibold text-gray-700">
                        {t('login.staff.omId')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="omId"
                          type="text"
                          placeholder={t('login.staff.omIdPlaceholder')}
                          value={staffCredentials.omId}
                          onChange={(e) => setStaffCredentials({ ...staffCredentials, omId: e.target.value })}
                          className="text-lg py-4 pl-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        {t('login.staff.password')}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          placeholder={t('login.staff.passwordPlaceholder')}
                          value={staffCredentials.password}
                          onChange={(e) => setStaffCredentials({ ...staffCredentials, password: e.target.value })}
                          className="text-lg py-4 pl-12"
                          required
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Default Password Info - with proper spacing */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm">
                            <p className="text-blue-800 dark:text-blue-300 font-medium">{t('login.staff.defaultPassword')}</p>
                            <p className="text-blue-700 dark:text-blue-400">{t('login.staff.defaultPasswordDesc')}</p>
                            <p className="text-blue-600 dark:text-blue-500 text-xs mt-1">{t('login.staff.passwordChangeNote')}</p>
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* Development Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-amber-800 font-semibold text-sm">{t('login.staff.authNote')}</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          {t('login.staff.authDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login Button */}
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-xl blur opacity-75 ${
                      staffCredentials.omId.trim() && staffCredentials.password ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gray-300'
                    }`}></div>
                    <Button
                      onClick={handleStaffLogin}
                      disabled={isLoading || !staffCredentials.omId.trim() || !staffCredentials.password}
                      className={`relative w-full text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] min-h-[64px] ${
                        staffCredentials.omId.trim() && staffCredentials.password
                          ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          {t('login.staff.loggingIn')}
                        </>
                      ) : (
                        <>
                          <Users className="h-5 w-5 mr-3 flex-shrink-0" />
                          {t('login.staff.continueAs')}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">{t('login.staff.taskManagement')}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600">{t('login.staff.realTimeUpdates')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                {t('login.copyright')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
