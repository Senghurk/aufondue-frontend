"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { getBackendUrl } from "../config/api";
import { formatDate } from "../utils/dateFormatter";

import {
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function HomePage() {
  const router = useRouter();
  const backendUrl = getBackendUrl();
  const { user } = useAuth();
  const { t, tWithParams } = useTranslation();

  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State
  const [stats, setStats] = useState([
    {
      label: t('dashboard.stats.totalReports'),
      value: 0,
      color: "bg-blue-500",
      icon: <FileText size={32} />,
    },
    {
      label: t('dashboard.stats.pendingAssignments'),
      value: 0,
      color: "bg-yellow-500",
      icon: <Clock size={32} />,
    },
    {
      label: t('dashboard.stats.completedTasks'),
      value: 0,
      color: "bg-green-500",
      icon: <CheckCircle size={32} />,
    },
  ]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [reportsOverTime, setReportsOverTime] = useState([]);

  // Check if user is authenticated and set user name
  useEffect(() => {
    if (!user) {
      router.push("/Log-in");
      return;
    }
    
    // Set user name from auth context
    setUserName(user.name || user.email);
  }, [user, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([fetchStats(), fetchCategoryCounts(), fetchReportsOverTime()]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(t('dashboard.errorDesc'));
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(`${backendUrl}/admin/issues/stats`);
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        const data = await response.json();

        setStats([
          {
            label: t('dashboard.stats.totalReports'),
            value: data.totalIssues,
            color: "bg-blue-500",
            icon: <FileText size={32} />,
          },
          {
            label: t('dashboard.stats.incompleteTasks'),
            value: data.incompleteIssues,
            color: "bg-yellow-500",
            icon: <Clock size={32} />,
          },
          {
            label: t('dashboard.stats.completedTasks'),
            value: data.completedIssues,
            color: "bg-green-500",
            icon: <CheckCircle size={32} />,
          },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set default stats on error
        setStats([
          {
            label: t('dashboard.stats.totalReports'),
            value: 0,
            color: "bg-blue-500",
            icon: <FileText size={32} />,
          },
          {
            label: t('dashboard.stats.incompleteTasks'), 
            value: 0,
            color: "bg-yellow-500",
            icon: <Clock size={32} />,
          },
          {
            label: t('dashboard.stats.completedTasks'),
            value: 0,
            color: "bg-green-500",
            icon: <CheckCircle size={32} />,
          },
        ]);
      }
    };

    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch(`${backendUrl}/issues?page=0&size=1000`);
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
        
        // Handle ApiResponse format from IssueController
        const allIssues = result.data || result;
        
        if (Array.isArray(allIssues)) {
          const counts = allIssues.reduce((acc, issue) => {
            acc[issue.category] = (acc[issue.category] || 0) + 1;
            return acc;
          }, {});
          setCategoryCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching issues for categories:", error);
        // Set empty category counts on error
        setCategoryCounts({});
      }
    };

    const fetchReportsOverTime = async () => {
      try {
        const response = await fetch(`${backendUrl}/issues?page=0&size=1000`);
        if (!response.ok) {
          throw new Error(`Backend responded with ${response.status}`);
        }
        const result = await response.json();

        // Handle ApiResponse format from IssueController
        const allIssues = result.data || result;

        if (Array.isArray(allIssues)) {
          const dateCounts = {};

          allIssues.forEach((issue) => {
            const date = formatDate(issue.createdAt); // "DD/MM/YYYY"
            dateCounts[date] = (dateCounts[date] || 0) + 1;
          });

          const formattedData = Object.entries(dateCounts)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, count]) => ({ date, count }));

          setReportsOverTime(formattedData);
        }
      } catch (error) {
        console.error("Error fetching reports over time:", error);
        // Set empty reports over time on error
        setReportsOverTime([]);
      }
    };

    fetchData();
  }, []);

  // Quick links
  const quickLinks = [
    {
      label: t('dashboard.quickActions.viewReports'),
      description: t('dashboard.quickActions.viewReportsDesc'),
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      path: "/reports",
      icon: <FileText size={28} />,
    },
    {
      label: t('dashboard.quickActions.assignedReports'),
      description: t('dashboard.quickActions.assignedReportsDesc'),
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      path: "/assignedReports",
      icon: <Clock size={28} />,
    },
    {
      label: t('dashboard.quickActions.viewHistory'),
      description: t('dashboard.quickActions.viewHistoryDesc'),
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      path: "/history",
      icon: <CheckCircle size={28} />,
    },
  ];

  const handleNavigate = (path) => {
    router.push(path);
  };

  // Pie Chart Data
  const pieData = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent truncate pr-2">
                {userName ? tWithParams('dashboard.welcome', { name: userName }) : t('dashboard.welcomeAdmin')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('dashboard.systemOnline')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* Enhanced Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
              </div>
              <span className="text-gray-600 dark:text-gray-400 text-lg">{t('dashboard.loading')}</span>
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{t('dashboard.error')}</span>
            </div>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Redesigned Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="group relative">
                  <div className={`absolute inset-0 ${stat.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  <Card className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">{stat.label}</p>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-2xl ${stat.color} shadow-lg flex-shrink-0`}>
                          <div className="text-white">
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${stat.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, (stat.value / Math.max(...stats.map(s => s.value))) * 100)}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Redesigned Quick Actions Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  {t('dashboard.quickActions.title')}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  {t('dashboard.quickActions.subtitle')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickLinks.map((link, index) => (
                  <Card
                    key={index}
                    className="group cursor-pointer bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    onClick={() => handleNavigate(link.path)}
                  >
                    <CardContent className="p-6 relative">
                      {/* Animated Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Floating Action Indicator */}
                      <div className="absolute top-4 right-4 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white group-hover:shadow-xl transition-shadow duration-300">
                            {link.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {link.label}
                            </h3>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {link.description}
                        </p>
                        
                        {/* Enhanced Action Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {t('dashboard.quickActions.readyToAccess')}
                          </span>
                          <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Enhanced Analytics Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Enhanced Pie Chart */}
              {pieData.length > 0 && (
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                      {t('dashboard.charts.reportsByCategory')}
                      <div className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        {tWithParams('dashboard.charts.categoriesCount', { count: pieData.length })}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Line Chart */}
              {reportsOverTime.length > 0 && (
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      {t('dashboard.charts.reportsOverTime')}
                      <div className="ml-auto text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {tWithParams('dashboard.charts.daysTracked', { count: reportsOverTime.length })}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={reportsOverTime}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" className="dark:opacity-30" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
