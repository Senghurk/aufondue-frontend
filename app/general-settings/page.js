"use client";

import { formatDate } from "../utils/dateFormatter";
import { useState } from "react";

export default function GeneralSettingsPage() {
  const [testEmail, setTestEmail] = useState("");
  const [testMessage, setTestMessage] = useState(
    "This is a test notification from AU Fondue Admin Dashboard"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const backendUrl =
    "https://aufondue-webtest.kindisland-399ef298.southeastasia.azurecontainerapps.io/api";

  const sendTestNotification = async () => {
    if (!testEmail.trim()) {
      setResult({ type: "error", message: "Please enter an email address" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/users/test-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          type: "success",
          message: "Test notification sent successfully! 📱",
        });
        setTestEmail("");
      } else {
        setResult({
          type: "error",
          message: data.message || "Failed to send test notification",
        });
      }
    } catch (error) {
      setResult({ type: "error", message: "Network error occurred" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  const clearResult = () => setResult(null);

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6">General Settings</h1>

      <div className="space-y-6">
        {/* Notification Test Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Test Push Notifications
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                placeholder="user@student.au.edu"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={sendTestNotification}
              disabled={isLoading || !testEmail.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </div>
              ) : (
                "Send Test Notification"
              )}
            </button>

            {result && (
              <div
                className={`p-3 rounded text-sm relative ${
                  result.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{result.message}</span>
                  <button
                    onClick={clearResult}
                    className="text-current hover:text-gray-600 ml-4 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Instructions:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • Enter the email of a user who has the mobile app installed
              </li>
              <li>
                • The user must have opened the app at least once to register
                their FCM token
              </li>
              <li>• The notification will appear on their mobile device</li>
              <li>
                • Make sure the user has notifications enabled for the AU Fondue
                app
              </li>
            </ul>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Push Notifications
              </label>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Notify users when:
              </label>

              <div className="ml-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 rounded mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Issue status changes
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 rounded mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    New comments are added
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 rounded mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Issues are completed
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Backend URL:</p>
              <p className="text-gray-600 break-all">{backendUrl}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Notification Service:</p>
              <p className="text-gray-600">Firebase Cloud Messaging</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Last Updated:</p>
              <p className="text-gray-600">{formatDate(new Date())}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Version:</p>
              <p className="text-gray-600">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}