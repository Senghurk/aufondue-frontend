"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getBackendUrl } from "../config/api";

export default function RoleTestPage() {
  const { user, login } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  const backendUrl = getBackendUrl();

  // Test endpoints with different access levels
  const testEndpoints = [
    { name: "Public Endpoint", url: `${backendUrl}/test/public`, access: "public" },
    { name: "Incidents Access", url: `${backendUrl}/test/incidents`, access: "incidents" },
    { name: "Reports Access", url: `${backendUrl}/test/reports`, access: "reports" },
    { name: "Assigned Reports", url: `${backendUrl}/test/assigned-reports`, access: "assigned_reports" },
    { name: "Admin Only", url: `${backendUrl}/test/admin-only`, access: "admin_only" },
    { name: "Daily Reports", url: `${backendUrl}/test/daily-reports`, access: "daily_reports" },
    { name: "History Access", url: `${backendUrl}/test/history`, access: "history" }
  ];

  // Fetch available test users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/auth-test/users`);
        const data = await response.json();
        setAvailableUsers(data.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    
    fetchUsers();
  }, [backendUrl]);

  // Simulate login as a specific user
  const simulateLogin = (testUser) => {
    login({
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    });
  };

  // Test all endpoints with current user
  const testAllEndpoints = async () => {
    if (!user) {
      alert("Please login as a user first!");
      return;
    }

    setLoading(true);
    setTestResults([]);
    
    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint.url, {
          headers: {
            'X-User-Id': user.id.toString(),
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        results.push({
          ...endpoint,
          status: response.status,
          success: response.ok,
          message: data.message || data.error || 'No message',
          data: data
        });
      } catch (error) {
        results.push({
          ...endpoint,
          status: 'ERROR',
          success: false,
          message: error.message,
          data: null
        });
      }
    }
    
    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Role-Based Access Control Test</h1>
        
        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
          ) : (
            <p className="text-gray-600">No user logged in</p>
          )}
        </div>

        {/* Test Users */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableUsers.map((testUser) => (
              <div key={testUser.id} className="border rounded p-4">
                <h3 className="font-medium">{testUser.username}</h3>
                <p className="text-sm text-gray-600">{testUser.email}</p>
                <p className="text-sm font-medium text-blue-600">{testUser.role}</p>
                <button
                  onClick={() => simulateLogin(testUser)}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Login as {testUser.username}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Access Tests</h2>
          <button
            onClick={testAllEndpoints}
            disabled={loading || !user}
            className={`px-6 py-3 rounded font-medium ${
              loading || !user 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? 'Testing...' : 'Test All Endpoints'}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-left">Endpoint</th>
                    <th className="border p-3 text-left">Expected Access</th>
                    <th className="border p-3 text-left">Status</th>
                    <th className="border p-3 text-left">Result</th>
                    <th className="border p-3 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index}>
                      <td className="border p-3">{result.name}</td>
                      <td className="border p-3">{result.access}</td>
                      <td className="border p-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          result.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="border p-3">
                        {result.success ? '✅ Allowed' : '❌ Denied'}
                      </td>
                      <td className="border p-3 text-sm">{result.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}