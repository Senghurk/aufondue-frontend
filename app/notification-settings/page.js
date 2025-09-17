"use client";

import { useState } from "react";

export default function NotificationSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
      <p className="text-gray-600 mb-4">Manage how you receive notifications about reports.</p>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="email-notifications" className="text-sm font-medium">
            Email Notifications
          </label>
          <input
            id="email-notifications"
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between">
          <label htmlFor="sms-notifications" className="text-sm font-medium">
            SMS Notifications
          </label>
          <input
            id="sms-notifications"
            type="checkbox"
            checked={smsNotifications}
            onChange={(e) => setSmsNotifications(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

        
      </div>
    </div>
  );
}
