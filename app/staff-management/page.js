"use client";

import { useEffect, useState } from "react";
import { getBackendUrl } from "../config/api";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/dateFormatter";
import { useTranslation } from "../hooks/useTranslation";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Calendar, 
  Shield, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Key,
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Pencil
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseClient";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function StaffManagementPage() {
  const { t, tWithParams } = useTranslation();
  const backendUrl = getBackendUrl();
  const { toast } = useToast();
  
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    staffId: "",
    name: "",
    email: ""
  });
  const [validationErrors, setValidationErrors] = useState({
    staffId: "",
    email: ""
  });
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [resetPasswordStaffId, setResetPasswordStaffId] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [staffDeletionInfo, setStaffDeletionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isRenamingStaff, setIsRenamingStaff] = useState(false);
  const [staffToRename, setStaffToRename] = useState(null);
  const [newStaffName, setNewStaffName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch staff list
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/staff`);
      const data = await response.json();
      setStaffList(data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast({
        variant: "error",
        title: t("common.error"),
        description: t("staff.messages.fetchError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Automatically sync with Firebase when page loads
    // This will also fetch staff list after syncing
    syncWithFirebase();
  }, []);

  const filteredStaff = staffList.filter((staff) =>
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.staffId?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Natural sort by staffId (e.g., OM01, OM02, OM10, OM100)
    const aMatch = a.staffId?.match(/^([A-Z]+)(\d+)$/);
    const bMatch = b.staffId?.match(/^([A-Z]+)(\d+)$/);
    
    if (aMatch && bMatch) {
      // Compare prefix first (e.g., "OM")
      const prefixCompare = aMatch[1].localeCompare(bMatch[1]);
      if (prefixCompare !== 0) return prefixCompare;
      
      // Compare numeric part
      return parseInt(aMatch[2]) - parseInt(bMatch[2]);
    }
    
    // Fallback to regular string comparison if pattern doesn't match
    return (a.staffId || '').localeCompare(b.staffId || '');
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Add new staff
  // Check if OM ID already exists
  const checkDuplicateOMID = async (omId) => {
    if (!omId.trim()) return;
    
    setIsCheckingDuplicate(true);
    try {
      // Check if OM ID already exists in current staff list
      const exists = staffList.some(staff => staff.staffId === omId);
      if (exists) {
        setValidationErrors(prev => ({
          ...prev,
          staffId: tWithParams("staff.messages.omIdExists", { id: omId })
        }));
      } else {
        setValidationErrors(prev => ({ ...prev, staffId: "" }));
      }
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleAddStaff = async () => {
    // Clear previous validation errors
    setValidationErrors({ staffId: "", email: "" });

    if (!newStaff.staffId.trim() || !newStaff.name.trim() || !newStaff.email.trim()) {
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("staff.messages.missingInfo")}
          </div>
        ),
        description: t("staff.messages.fillRequired"),
      });
      return;
    }

    // Check for validation errors before submitting
    if (validationErrors.staffId || validationErrors.email) {
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("staff.messages.validationError")}
          </div>
        ),
        description: t("staff.messages.fixErrors"),
      });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error types from backend
        if (data.errorType === "DUPLICATE_OM_ID") {
          setValidationErrors(prev => ({ ...prev, staffId: data.message }));
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("staff.messages.duplicateOmId")}
              </div>
            ),
            description: data.message,
          });
        } else if (data.errorType === "DUPLICATE_EMAIL") {
          setValidationErrors(prev => ({ ...prev, email: data.message }));
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("staff.messages.duplicateEmail")}
              </div>
            ),
            description: data.message,
          });
        } else {
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("staff.messages.addFailed")}
              </div>
            ),
            description: data.message || t("staff.messages.addFailedDesc"),
          });
        }
        return;
      }

      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t("staff.messages.addSuccess")}
          </div>
        ),
        description: tWithParams("staff.messages.addSuccessDesc", { name: newStaff.name }),
      });

      fetchStaff();
      setIsAddingStaff(false);
      setNewStaff({ staffId: "", name: "", email: "" });
      setValidationErrors({ staffId: "", email: "" });
    } catch (error) {
      console.error("Failed to add staff:", error);
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("staff.messages.addFailed")}
          </div>
        ),
        description: error.message || t("staff.messages.addFailedDesc"),
      });
    }
  };

  // Reset staff password
  const handleResetPassword = async (staff) => {
    setIsResetting(true);
    console.log("Starting password reset for:", staff.email);
    
    try {
      // First, ensure staff exists in Firebase through backend
      console.log("Ensuring staff exists in Firebase...");
      const ensureResponse = await fetch(`${backendUrl}/staff/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          staffEmail: staff.email
        }),
      });

      if (!ensureResponse.ok) {
        const errorData = await ensureResponse.json();
        throw new Error(errorData.message || "Failed to prepare password reset");
      }

      console.log("Staff confirmed in Firebase, sending reset email...");
      
      // Now send password reset email via Firebase Client SDK
      // Firebase will use the URL configured in email template
      // Do NOT use action code settings - let Firebase use the template configuration
      await sendPasswordResetEmail(auth, staff.email);
      
      console.log("Firebase sendPasswordResetEmail completed successfully");

      // Success toast with professional design
      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t("staff.resetPassword.successTitle")}
          </div>
        ),
        description: (
          <div className="space-y-1">
            <p>{tWithParams("staff.resetPassword.successMessage", { email: staff.email })}</p>
            <p className="text-sm text-gray-500">{t("staff.resetPassword.successNote")}</p>
          </div>
        ),
        duration: 5000,
      });
    } catch (error) {
      console.error("Password reset failed:", error);
      
      // Handle specific Firebase errors
      let errorMessage = "Failed to send reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        // Staff doesn't exist in Firebase yet
        errorMessage = `No Firebase account found for ${staff.email}. This staff member needs to be re-added to create their authentication account.`;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = `Invalid email address format: ${staff.email}`;
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many reset attempts. Please try again later.";
      } else if (error.message && error.message.includes("Firebase")) {
        errorMessage = error.message;
      } else if (error.message && error.message.includes("Failed to prepare")) {
        errorMessage = `Unable to setup password reset for ${staff.email}. The staff member may need to be re-added.`;
      }
      
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("staff.resetPassword.failedTitle")}
          </div>
        ),
        description: errorMessage,
      });
    } finally {
      setIsResetting(false);
      setResetPasswordStaffId(null);
      setResetPasswordDialogOpen(false);
      setSelectedStaffForReset(null);
    }
  };

  // Sync staff with Firebase (silent auto-sync)
  const syncWithFirebase = async () => {
    try {
      const response = await fetch(`${backendUrl}/staff/sync-firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to sync with Firebase");
      }

      // Silent sync - only log to console
      console.log(`Firebase sync complete: ${result.synced || 0} staff members synced`);
      
      // Refresh staff list after sync
      fetchStaff();
    } catch (error) {
      console.error("Firebase sync failed:", error);
      // Only show error if sync fails
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("common.error")}
          </div>
        ),
        description: "Failed to sync with Firebase. Some features may be limited.",
      });
    }
  };

  // Check if staff can be deleted
  const checkStaffDeletion = async (staff) => {
    try {
      const response = await fetch(`${backendUrl}/staff/${staff.id}/can-delete`);
      const data = await response.json();
      
      setStaffDeletionInfo({
        canDelete: data.canDelete,
        incompleteReports: data.incompleteReports || 0
      });
      
      if (data.canDelete) {
        setStaffToDelete(staff);
        setDeleteConfirmOpen(true);
      } else {
        toast({
          variant: "error",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t("staff.deleteDialog.cannotDeleteTitle")}
            </div>
          ),
          description: tWithParams("staff.deleteDialog.cannotDeleteMessage", { name: staff.name, count: data.incompleteReports }),
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Failed to check deletion eligibility:", error);
      // Fallback to direct deletion attempt
      setStaffToDelete(staff);
      setDeleteConfirmOpen(true);
    }
  };

  // Rename staff
  const handleRenameStaff = async () => {
    if (!staffToRename || !newStaffName.trim()) {
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("common.error")}
          </div>
        ),
        description: t("validation.required"),
      });
      return;
    }

    // Check if name is the same
    if (newStaffName.trim() === staffToRename.name) {
      setIsRenamingStaff(false);
      setStaffToRename(null);
      setNewStaffName("");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`${backendUrl}/staff/${staffToRename.id}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStaffName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update staff name");
      }

      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t("staff.rename.successTitle")}
          </div>
        ),
        description: tWithParams("staff.rename.successMessage", { oldName: staffToRename.name, newName: newStaffName.trim() }),
        duration: 5000,
      });

      // Refresh staff list
      fetchStaff();
      setIsRenamingStaff(false);
      setStaffToRename(null);
      setNewStaffName("");
    } catch (error) {
      console.error("Failed to update staff name:", error);
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("common.error")}
          </div>
        ),
        description: error.message || t("common.error"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete staff
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    
    setIsDeleting(true);

    try {
      const response = await fetch(`${backendUrl}/staff/${staffToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if the error is about incomplete reports
        if (data.message && data.message.includes("assigned report")) {
          toast({
            variant: "error",
            title: (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("staff.deleteDialog.cannotDeleteTitle")}
              </div>
            ),
            description: tWithParams("staff.deleteDialog.cannotDeleteMessage", { name: staffToDelete.name, count: data.message.match(/\d+/)?.[0] || 1 }),
            duration: 7000,
          });
        } else {
          throw new Error(data.message || "Failed to delete staff");
        }
        return;
      }

      toast({
        variant: "success",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t("staff.messages.deleteSuccess")}
          </div>
        ),
        description: tWithParams("staff.messages.deleteSuccessDesc", { name: staffToDelete.name }),
      });

      fetchStaff();
      setDeleteConfirmOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast({
        variant: "error",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("staff.messages.deleteFailed")}
          </div>
        ),
        description: error.message || t("staff.messages.deleteFailedDesc"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("staff.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("staff.subtitle")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("staff.stats.totalStaff")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffList.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("staff.stats.activeStaff")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{t("staff.list.title")}</CardTitle>
                <CardDescription>
                  {t("staff.list.subtitle")}
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsAddingStaff(true)}
                className="bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {t("staff.list.addStaff")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t("staff.list.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Staff Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{t("staff.list.table.no")}</TableHead>
                    <TableHead>{t("staff.list.table.omId")}</TableHead>
                    <TableHead>{t("staff.list.table.name")}</TableHead>
                    <TableHead>{t("staff.list.table.email")}</TableHead>
                    <TableHead>{t("staff.list.table.dateAdded")}</TableHead>
                    <TableHead className="text-right">{t("staff.list.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {t("common.noDataFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((staff, index) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell>
                          {staff.staffId ? (
                            <div className="inline-flex items-center">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <span className="font-semibold text-blue-900 tracking-wide text-sm">
                                  {staff.staffId}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-sm">
                              <svg className="w-4 h-4 mr-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t("common.notAssigned")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{staff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {staff.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(staff.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setStaffToRename(staff);
                                setNewStaffName(staff.name);
                                setIsRenamingStaff(true);
                              }}
                              className="hover:bg-gray-100"
                              title="Rename staff"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStaffForReset(staff);
                                setResetPasswordDialogOpen(true);
                              }}
                              title="Reset password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => checkStaffDeletion(staff)}
                              title="Delete staff"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredStaff.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {tWithParams("staff.pagination.showing", {
                    start: startIndex + 1,
                    end: Math.min(endIndex, filteredStaff.length),
                    total: filteredStaff.length
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("staff.pagination.previous")}
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrentPage = pageNum === currentPage;
                      
                      // Show first page, last page, current page, and pages around current
                      const showPage = pageNum === 1 || 
                                      pageNum === totalPages || 
                                      Math.abs(pageNum - currentPage) <= 1;
                      
                      if (!showPage && pageNum === 2 && currentPage > 3) {
                        return <span key={i} className="px-1 text-gray-400">...</span>;
                      }
                      
                      if (!showPage && pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key={i} className="px-1 text-gray-400">...</span>;
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <Button
                          key={i}
                          variant={isCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={isCurrentPage ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t("staff.pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Staff Dialog */}
        <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("staff.addDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("staff.addDialog.subtitle")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="staffId">{t("staff.addDialog.omIdLabel")}</Label>
                <Input
                  id="staffId"
                  placeholder={t("staff.addDialog.omIdPlaceholder")}
                  value={newStaff.staffId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewStaff({ ...newStaff, staffId: value });
                    // Check for duplicate on blur or after a delay
                    if (value.trim()) {
                      checkDuplicateOMID(value);
                    } else {
                      setValidationErrors(prev => ({ ...prev, staffId: "" }));
                    }
                  }}
                  onBlur={() => checkDuplicateOMID(newStaff.staffId)}
                  className={validationErrors.staffId ? "border-red-500" : ""}
                />
                {validationErrors.staffId && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.staffId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("staff.addDialog.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("staff.addDialog.namePlaceholder")}
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("staff.addDialog.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("staff.addDialog.emailPlaceholder")}
                  value={newStaff.email}
                  onChange={(e) => {
                    setNewStaff({ ...newStaff, email: e.target.value });
                    // Clear email error when user types
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: "" }));
                    }
                  }}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>{t("common.note")}:</strong> {t("staff.addDialog.note")}
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => {
                setIsAddingStaff(false);
                setNewStaff({ staffId: "", name: "", email: "" });
                setValidationErrors({ staffId: "", email: "" });
              }}>
                {t("staff.addDialog.cancel")}
              </Button>
              <Button 
                onClick={handleAddStaff} 
                className="bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"
                disabled={isCheckingDuplicate || !!validationErrors.staffId || !!validationErrors.email}
              >
                {t("staff.addDialog.addButton")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("staff.resetPassword.title")}</DialogTitle>
              <DialogDescription>
                {tWithParams("staff.resetPassword.message", { name: selectedStaffForReset?.name })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="bg-amber-50 p-3 rounded-md">
                <p className="text-sm text-amber-800">
                  {t("staff.resetPassword.emailInfo")}
                </p>
                <p className="font-medium text-amber-900 mt-1">{selectedStaffForReset?.email}</p>
              </div>
              <p className="text-sm text-gray-600">
                {t("staff.resetPassword.instructions")}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResetPasswordDialogOpen(false);
                    setSelectedStaffForReset(null);
                  }}
                >
                  {t("staff.resetPassword.cancel")}
                </Button>
                <Button 
                  onClick={() => {
                    handleResetPassword(selectedStaffForReset);
                    setResetPasswordDialogOpen(false);
                    setSelectedStaffForReset(null);
                  }}
                  className="bg-black hover:bg-gray-800"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t("staff.resetPassword.sending")}
                    </>
                  ) : (
                    t("staff.resetPassword.sendButton")
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                {t("staff.deleteDialog.title")}
              </DialogTitle>
              <DialogDescription className="pt-3">
                <div className="space-y-3">
                  <p>{t("staff.deleteDialog.message")}</p>
                  {staffToDelete && (
                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t("staff.deleteDialog.nameLabel")}</span>
                        <span>{staffToDelete.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t("staff.deleteDialog.omIdLabel")}</span>
                        {staffToDelete.staffId ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                            <svg className="w-3.5 h-3.5 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="font-semibold text-blue-900 tracking-wide text-xs">
                              {staffToDelete.staffId}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">{t("common.notAssigned")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t("staff.deleteDialog.emailLabel")}</span>
                        <span>{staffToDelete.email}</span>
                      </div>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>{t("common.warning")}:</strong> {t("staff.deleteDialog.warning")}
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setStaffToDelete(null);
                }}
                disabled={isDeleting}
              >
                {t("staff.deleteDialog.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("staff.deleteDialog.deleting")}
                  </>
                ) : (
                  t("staff.deleteDialog.deleteButton")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Staff Dialog */}
        <Dialog open={isRenamingStaff} onOpenChange={(open) => {
          if (!open) {
            setIsRenamingStaff(false);
            setStaffToRename(null);
            setNewStaffName("");
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                {t("staff.rename.title")}
              </DialogTitle>
              <DialogDescription>
                {tWithParams("staff.rename.subtitle", { name: staffToRename?.name })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newStaffName">{t("staff.rename.newNameLabel")}</Label>
                <Input
                  id="newStaffName"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder={t("staff.rename.newNamePlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isUpdating) {
                      handleRenameStaff();
                    }
                  }}
                />
              </div>
              {staffToRename?.staffId && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>OM ID:</strong> {tWithParams("staff.rename.omIdInfo", { id: staffToRename.staffId })}
                  </p>
                </div>
              )}
              <div className="bg-amber-50 p-3 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>{t("common.note")}:</strong> {t("staff.rename.note")}
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsRenamingStaff(false);
                  setStaffToRename(null);
                  setNewStaffName("");
                }}
                disabled={isUpdating}
              >
                {t("staff.rename.cancel")}
              </Button>
              <Button 
                onClick={handleRenameStaff}
                className="bg-black hover:bg-gray-800"
                disabled={isUpdating || !newStaffName.trim() || newStaffName.trim() === staffToRename?.name}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("staff.rename.updating")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t("staff.rename.updateButton")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}