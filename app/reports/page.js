"use client";

import { useState, useEffect } from "react";
import { getBackendUrl } from "../config/api";
import { useTranslation } from "../hooks/useTranslation";
import ReportDetailsModal from "../components/ReportDetailsModal";
import { Badge } from "@/components/ui/badge";
import { usePasswordCheck } from "../hooks/usePasswordCheck";
import { useAuth } from "../context/AuthContext";
import { authenticatedFetch } from "../utils/apiHelper";
import { formatDate } from "../utils/dateFormatter";

export default function ReportsPage() {
  // Check if password needs to be changed
  usePasswordCheck();
  const { user, isAdmin } = useAuth();
  const { t, tWithParams } = useTranslation();
  const backendUrl = getBackendUrl();
  const sastoken =
    "?sv=2024-11-04&ss=bfqt&srt=co&sp=rwdlacupiytfx&se=2027-07-16T22:11:38Z&st=2025-07-16T13:56:38Z&spr=https,http&sig=5xb1czmfngshEckXBdlhtw%2BVe%2B5htYpCnXyhPw9tnHk%3D";

  // Data
  const [reports, setReports] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [assignments, setAssignments] = useState({});
  const [isAssigning, setIsAssigning] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const [assignmentMessage, setAssignmentMessage] = useState(null);

  // Details modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Delete functionality
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media viewer (images and videos)
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerUrl, setMediaViewerUrl] = useState("");
  const [mediaViewerType, setMediaViewerType] = useState(""); // "image" or "video"
  
  // Track viewed reports locally
  const [viewedReports, setViewedReports] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('unassignedViewedReports');
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing viewed reports:', error);
        }
      }
    }
    return new Set();
  });

  const AssignmentFeedback = ({ message, onClose }) => {
    if (!message) return null;
    
    const getStyles = () => {
      switch(message.type) {
        case "success":
          return {
            bg: "bg-gradient-to-r from-green-500 to-emerald-600",
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          };
        case "error":
          return {
            bg: "bg-gradient-to-r from-red-500 to-rose-600",
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          };
        default:
          return {
            bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          };
      }
    };
    
    const { bg, icon } = getStyles();
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="pointer-events-auto animate-[slideDown_0.3s_ease-out] transform">
          <div className={`${bg} rounded-2xl shadow-2xl px-6 py-4 max-w-md mx-auto`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-2">
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-lg">{message.text}</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-1.5 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch reports immediately
        await fetchReports();
        
        // Fetch staff members after checking user auth
        await fetchStaffMembers();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when we have user info (or confirmed no user)
    // This prevents fetching all staff when the auth context is still loading
    if (user !== undefined) {
      fetchData();
    }
  }, [user]); // Add user as dependency

  const fetchReports = async () => {
    try {
      const res = await fetch(`${backendUrl}/issues/unassigned?page=0&size=100`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      console.log('Unassigned reports from backend:', data); // Debug to see if remarkType is coming
      if (!Array.isArray(data)) return;
      
      setReports(data);
      // initialize per-report assignment selection
      setAssignments(data.reduce((acc, r) => ({ ...acc, [r.id]: "" }), {}));
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  };

  const fetchStaffMembers = async () => {
    try {
      // First check localStorage directly as a fallback
      const userStr = localStorage.getItem('user');
      let currentUser = user;
      
      // If user from context is not available yet, try localStorage
      if (!currentUser && userStr) {
        try {
          currentUser = JSON.parse(userStr);
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      
      // Check if current user is staff
      if (currentUser && (currentUser.userType === 'staff' || currentUser.userType === 'om_staff')) {
        // For staff users, only show their own account in the dropdown
        const currentStaff = {
          id: currentUser.userId,
          name: currentUser.name || currentUser.fullName || currentUser.staffId || 'Current Staff',
          staffId: currentUser.staffId || currentUser.omId
        };
        setStaffMembers([currentStaff]);
        console.log('Staff user detected, showing only current staff:', currentStaff);
      } else {
        // For admins or when no user is logged in, fetch all staff members
        const res = await fetch(`${backendUrl}/staff`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        setStaffMembers(data);
        console.log('Admin/no user detected, showing all staff members');
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      throw error;
    }
  };

  // Assign helpers
  const handleAssignStaff = (id, staffId) => {
    setAssignments((prev) => ({ ...prev, [id]: staffId }));
  };

  const handleConfirmAssign = async (id) => {
    if (!assignments[id]) {
      setAssignmentMessage({
        type: "error",
        text: t('reports.unassigned.assignment.selectStaff'),
      });
      setTimeout(() => setAssignmentMessage(null), 3000);
      return;
    }

    setIsAssigning((prev) => ({ ...prev, [id]: true }));
    setAssignmentMessage(null);

    try {
      // Removed priority from the API call
      const response = await fetch(
        `${backendUrl}/issues/${id}/assign?staffId=${assignments[id]}`,
        { method: "POST" }
      );

      if (response.ok) {
        // Refresh reports first
        await fetchReports();
        
        // Show success message after assignment is complete
        setAssignmentMessage({
          type: "success",
          text: t('reports.unassigned.assignment.successMessage'),
        });
        
        // Clear message after delay
        setTimeout(() => setAssignmentMessage(null), 2000);
      } else {
        throw new Error(`Failed to assign: ${response.status}`);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      setAssignmentMessage({
        type: "error",
        text: error instanceof Error ? `${t('reports.unassigned.assignment.failedMessage')}: ${error.message}` : t('reports.unassigned.assignment.failedMessage'),
      });
      setTimeout(() => setAssignmentMessage(null), 3000);
    } finally {
      setIsAssigning((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Delete report handlers
  const handleDeleteClick = (report, e) => {
    e.stopPropagation(); // Prevent card click event
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      const response = await authenticatedFetch(`${backendUrl}/issues/reports/${reportToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Show success message
        setAssignmentMessage({
          type: "success",
          text: t('reports.unassigned.delete.successMessage'),
        });

        // Refresh the reports list
        await fetchReports();

        // Close dialog and clear state
        setDeleteConfirmOpen(false);
        setReportToDelete(null);

        // Clear message after delay
        setTimeout(() => setAssignmentMessage(null), 2000);
      } else {
        throw new Error(`Failed to delete: ${response.status}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setAssignmentMessage({
        type: "error",
        text: error instanceof Error ? `Failed to delete report: ${error.message}` : "Failed to delete report",
      });
      setTimeout(() => setAssignmentMessage(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setReportToDelete(null);
  };

  // Details modal
  const openModal = async (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    
    // Mark 'new' remark as viewed when opening details
    if (report.remarkType === 'new' && !report.remarkViewed) {
      try {
        const response = await fetch(`${backendUrl}/issues/${report.id}/remark/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminEmail: 'admin@au.edu' // You may want to get this from user session
          })
        });
        
        if (response.ok) {
          // Update the report in the local state to reflect the viewed status
          // Set remarkViewed to true and clear the remarkType for 'new'
          setReports(prevReports => 
            prevReports.map(r => 
              r.id === report.id 
                ? { ...r, remarkType: r.remarkType === 'new' ? null : r.remarkType, remarkViewed: true }
                : r
            )
          );
          
          // Force a re-render by updating the selected report as well
          setSelectedReport(prev => ({ ...report, remarkType: null, remarkViewed: true }));
          
          // Save to localStorage
          const newViewedSet = new Set(viewedReports);
          newViewedSet.add(report.id);
          setViewedReports(newViewedSet);
          localStorage.setItem('unassignedViewedReports', JSON.stringify(Array.from(newViewedSet)));
        }
      } catch (error) {
        console.error('Error marking remark as viewed:', error);
      }
    } else if (isNewReport(report)) {
      // Even if no backend remark, mark time-based new reports as viewed locally
      setReports(prevReports => 
        prevReports.map(r => 
          r.id === report.id 
            ? { ...r, remarkViewed: true }
            : r
        )
      );
      
      // Save to localStorage
      const newViewedSet = new Set(viewedReports);
      newViewedSet.add(report.id);
      setViewedReports(newViewedSet);
      localStorage.setItem('unassignedViewedReports', JSON.stringify(Array.from(newViewedSet)));
    }
  };
  const closeModal = () => {
    setSelectedReport(null);
    setIsModalOpen(false);
  };

  // Media viewer helpers
  const openMediaViewer = (rawUrl, type = "image") => {
    // Ensure inline display for Azure Blob (prevents download behavior)
    const joiner = rawUrl.includes("?") ? "&" : "?";
    const contentType = type === "video" ? "video/mp4" : "image/jpeg";
    const viewUrl = `${rawUrl}${joiner}rscd=inline&rsct=${contentType}`;
    setMediaViewerUrl(viewUrl);
    setMediaViewerType(type);
    setMediaViewerOpen(true);
  };
  
  const closeMediaViewer = () => {
    setMediaViewerUrl("");
    setMediaViewerType("");
    setMediaViewerOpen(false);
  };

  // Filter + Group by category
  const filteredReports = reports.filter(
    (report) =>
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions for rendering badges
  const renderStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100',
      },
      'IN PROGRESS': {
        className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100',
      },
      'COMPLETED': {
        className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100',
      }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    
    return (
      <Badge className={config.className} variant="outline">
        {t(`reports.unassigned.status.${status.toLowerCase().replace(' ', '')}`) || status}
      </Badge>
    );
  };

  const renderNewBadge = () => {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100" variant="outline">
        {t('reports.unassigned.status.new')}
      </Badge>
    );
  };

  // Check if report is new (within last 24 hours or has 'new' remark)
  const isNewReport = (report) => {
    // Check localStorage first
    if (viewedReports.has(report.id)) {
      return false;
    }
    
    // If report has been marked as viewed, it's not new anymore
    if (report.remarkViewed === true) {
      return false;
    }
    
    // Check if report has 'new' remark from backend
    if (report.remarkType === 'new') {
      return true;
    }
    
    // Fallback to time-based check
    const reportDate = new Date(report.createdAt);
    const now = new Date();
    const diffHours = (now - reportDate) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  // Recent reports (only NEW reports within last 24 hours or with 'new' remark)
  const recentReports = [...filteredReports]
    .filter(report => isNewReport(report)) // Only include reports that are actually "new"
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Get IDs of reports in Recent Reports to avoid duplicates
  const recentReportIds = new Set(recentReports.map(report => report.id));

  const groupedReports = filteredReports
    .filter(report => !recentReportIds.has(report.id)) // Exclude reports already in Recent Reports
    .reduce((groups, report) => {
      if (!groups[report.category]) groups[report.category] = [];
      groups[report.category].push(report);
      return groups;
    }, {});

  // Toggle category collapse/expand
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="flex-1 p-4 lg:p-6">
      {assignmentMessage && (
        <AssignmentFeedback
          message={assignmentMessage}
          onClose={() => setAssignmentMessage(null)}
        />
      )}

      <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">{t('reports.unassigned.title')}</h1>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">{t('reports.unassigned.loading')}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Search */}
          <div className="mb-4 lg:mb-6">
            <input
              type="text"
              placeholder={t('reports.unassigned.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Recent Reports Section */}
          {recentReports.length > 0 && (
            <div className="mb-10">
              <div 
                className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg px-4 py-3 mb-4 cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200 border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 shadow-sm hover:shadow-md"
                onClick={() => toggleCategory('Recent')}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('reports.unassigned.recentReports')}</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    {tWithParams('reports.unassigned.reportCount', { count: recentReports.length })}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                    </svg>
                    {t('reports.unassigned.latest')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    {collapsedCategories['Recent'] ? t('reports.unassigned.show') : t('reports.unassigned.hide')}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                      collapsedCategories['Recent'] ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {!collapsedCategories['Recent'] && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-600 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Header with gradient background */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-10">
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                              {report.description?.substring(0, 40)}...
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              {tWithParams('reports.unassigned.reportCard.reportNumber', { id: report.id })}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex flex-col gap-1">
                            {renderStatusBadge(report.status)}
                            {isNewReport(report) && renderNewBadge()}
                          </div>
                        </div>
                      </div>

                      {/* Content section - Same as regular cards */}
                      <div className="p-4">
                        <div className="grid grid-cols-1 gap-2 mb-3">
                          <div className="flex items-center text-sm">
                            <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{report.customLocation}</p>
                              <p className="text-gray-500 text-xs">{t('reports.unassigned.reportCard.location')}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{report.reportedBy?.username}</p>
                              <p className="text-gray-500 text-xs">{t('reports.unassigned.reportCard.reportedBy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatDate(report.createdAt)}</p>
                              <p className="text-gray-500 text-xs">{t('reports.unassigned.reportCard.dateReported')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Media Gallery */}
                        {(report.photoUrls?.length > 0 || report.videoUrls?.length > 0) && (
                          <div className="mb-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm font-semibold text-gray-700">Media Attachments</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {/* Photos */}
                              {report.photoUrls?.slice(0, 3).map((photo, i) => {
                                const base = `${photo}${sastoken}`;
                                const joiner = base.includes("?") ? "&" : "?";
                                const inlineUrl = `${base}${joiner}rscd=inline&rsct=image/jpeg`;
                                return (
                                  <div key={`photo-${i}`} className="relative group">
                                    <img
                                      src={inlineUrl}
                                      alt={`Photo ${i + 1}`}
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 cursor-pointer transition-all duration-200 group-hover:border-purple-300 dark:group-hover:border-purple-500 group-hover:shadow-md"
                                      onClick={() => openMediaViewer(base, "image")}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
                                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Videos */}
                              {report.videoUrls?.slice(0, 3).map((video, i) => {
                                const base = `${video}${sastoken}`;
                                const joiner = base.includes("?") ? "&" : "?";
                                const inlineUrl = `${base}${joiner}rscd=inline&rsct=video/mp4`;
                                return (
                                  <div key={`video-${i}`} className="relative group">
                                    <video
                                      src={inlineUrl}
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 cursor-pointer transition-all duration-200 group-hover:border-purple-300 dark:group-hover:border-purple-500 group-hover:shadow-md"
                                      onClick={() => openMediaViewer(base, "video")}
                                      onMouseEnter={(e) => e.target.play()}
                                      onMouseLeave={(e) => {e.target.pause(); e.target.currentTime = 0;}}
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 group-hover:bg-black/70 transition-all duration-200">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* More items indicator */}
                              {(report.photoUrls?.length > 3 || report.videoUrls?.length > 3) && (
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-gray-600">+{(report.photoUrls?.length || 0) + (report.videoUrls?.length || 0) - 3}</p>
                                    <p className="text-xs text-gray-500">{t('reports.unassigned.reportCard.more')}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Controls */}
                        <div className="border-t border-gray-100 pt-3">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                {t('reports.unassigned.assignment.title')}
                              </label>
                              <div className="relative">
                                <select
                                  value={assignments[report.id] || ""}
                                  onChange={(e) =>
                                    handleAssignStaff(report.id, e.target.value)
                                  }
                                  className="w-full px-3 py-2 text-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm appearance-none cursor-pointer transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 focus:border-purple-500 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                  <option value="" className="text-gray-500">{t('reports.unassigned.assignment.placeholder')}</option>
                                  {staffMembers.map((staff) => (
                                    <option key={staff.id} value={staff.id} className="py-2">
                                      {staff.name}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                  <svg className="w-5 h-5 text-purple-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleConfirmAssign(report.id)}
                                disabled={isAssigning[report.id] || !assignments[report.id]}
                                className={`flex-1 px-3 py-2 rounded-xl font-semibold transition-all duration-200 min-h-[40px] text-sm ${
                                  isAssigning[report.id]
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : !assignments[report.id]
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105"
                                }`}
                              >
                                {isAssigning[report.id] ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('reports.unassigned.assignment.assigning')}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {t('reports.unassigned.assignment.assign')}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => openModal(report)}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 min-h-[40px] text-sm"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  {t('reports.unassigned.reportCard.details')}
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categorized Groups */}
      {Object.keys(groupedReports).length === 0 && recentReports.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500 text-lg">No unassigned reports found.</p>
        </div>
      ) : (
        Object.entries(groupedReports)
          .sort(([a], [b]) => a.localeCompare(b)) // Sort categories alphabetically
          .map(([category, reports]) => (
          <div key={category} className="mb-10">
            <div 
              className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 rounded-lg px-4 py-3 mb-4 cursor-pointer hover:from-gray-100 hover:to-blue-100 dark:hover:from-gray-900/30 dark:hover:to-blue-900/30 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm hover:shadow-md"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{category}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">
                  {collapsedCategories[category] ? 'Show' : 'Hide'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    collapsedCategories[category] ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {!collapsedCategories[category] && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1 relative"
                >
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-10">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                          {report.description?.substring(0, 45)}...
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Report #{report.id}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {renderStatusBadge(report.status)}
                      </div>
                    </div>
                  </div>

                  {/* Content section */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <div className="flex items-center text-sm">
                        <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{report.customLocation}</p>
                          <p className="text-gray-500 text-xs">Location</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{report.reportedBy?.username}</p>
                          <p className="text-gray-500 text-xs">Reported by</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{formatDate(report.createdAt)}</p>
                          <p className="text-gray-500 text-xs">Date reported</p>
                        </div>
                      </div>
                    </div>

                    {/* Media Gallery */}
                    {(report.photoUrls?.length > 0 || report.videoUrls?.length > 0) && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">Media Attachments</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {/* Photos */}
                          {report.photoUrls?.slice(0, 3).map((photo, i) => {
                            const base = `${photo}${sastoken}`;
                            const joiner = base.includes("?") ? "&" : "?";
                            const inlineUrl = `${base}${joiner}rscd=inline&rsct=image/jpeg`;
                            return (
                              <div key={`photo-${i}`} className="relative group">
                                <img
                                  src={inlineUrl}
                                  alt={`Photo ${i + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 cursor-pointer transition-all duration-200 group-hover:border-blue-300 dark:group-hover:border-blue-500 group-hover:shadow-md"
                                  onClick={() => openMediaViewer(base, "image")}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                          {/* Videos */}
                          {report.videoUrls?.slice(0, 3).map((video, i) => {
                            const base = `${video}${sastoken}`;
                            const joiner = base.includes("?") ? "&" : "?";
                            const inlineUrl = `${base}${joiner}rscd=inline&rsct=video/mp4`;
                            return (
                              <div key={`video-${i}`} className="relative group">
                                <video
                                  src={inlineUrl}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 cursor-pointer transition-all duration-200 group-hover:border-blue-300 dark:group-hover:border-blue-500 group-hover:shadow-md"
                                  onClick={() => openMediaViewer(base, "video")}
                                  onMouseEnter={(e) => e.target.play()}
                                  onMouseLeave={(e) => {e.target.pause(); e.target.currentTime = 0;}}
                                  muted
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-2 group-hover:bg-black/70 transition-all duration-200">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* More items indicator */}
                          {(report.photoUrls?.length > 3 || report.videoUrls?.length > 3) && (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                              <div className="text-center">
                                <p className="text-xs font-bold text-gray-600">+{(report.photoUrls?.length || 0) + (report.videoUrls?.length || 0) - 3}</p>
                                <p className="text-xs text-gray-500">more</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Assign Staff Member
                          </label>
                          <div className="relative">
                            <select
                              value={assignments[report.id] || ""}
                              onChange={(e) =>
                                handleAssignStaff(report.id, e.target.value)
                              }
                              className="w-full pl-4 pr-12 py-2.5 text-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm appearance-none cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="" className="text-gray-500">Choose a staff member...</option>
                          {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.id} className="py-2">
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-blue-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmAssign(report.id)}
                              disabled={isAssigning[report.id] || !assignments[report.id]}
                              className={`flex-1 px-3 py-2 rounded-xl font-semibold transition-all duration-200 min-h-[40px] text-sm ${
                                isAssigning[report.id]
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : !assignments[report.id]
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105"
                              }`}
                            >
                              {isAssigning[report.id] ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Assigning...
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Assign
                                </div>
                              )}
                            </button>
                            <button
                              onClick={() => openModal(report)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 min-h-[40px] text-sm"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Details
                              </div>
                            </button>
                          </div>
                          {/* Only show delete button for admins, not OM staff */}
                          {isAdmin() && (
                            <button
                              onClick={(e) => handleDeleteClick(report, e)}
                              className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                              title="Delete Report"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Report
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        report={selectedReport}
        sastoken={sastoken}
        onMediaView={(url, type) => openMediaViewer(url, type)}
        showUpdateHistory={false}
      />

      {/* Media Lightbox Viewer */}
      {mediaViewerOpen && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100]"
          onClick={closeMediaViewer}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              className="absolute -top-12 right-0 w-10 h-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              onClick={closeMediaViewer}
            >
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {mediaViewerType === "image" ? (
              <img
                src={`${mediaViewerUrl}${mediaViewerUrl.includes("?") ? "&" : "?"}rscd=inline&rsct=image/jpeg`}
                alt="Preview"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={`${mediaViewerUrl}${mediaViewerUrl.includes("?") ? "&" : "?"}rscd=inline&rsct=video/mp4`}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              >
                Your browser does not support video playback.
              </video>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                    Are you sure you want to delete this report?
                  </p>
                  <p className="text-sm text-gray-600">
                    Report #{reportToDelete?.id}: {reportToDelete?.description?.substring(0, 50)}...
                  </p>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className={`flex-1 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 ${
                    isDeleting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
