"use client";

import { useState } from "react";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { formatDate } from "../utils/dateFormatter";
import { Button } from "../../components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "../../components/ui/pagination";
import { CalendarIcon, Key, Trash2 } from "lucide-react";

export default function UserListPage() {
  // Mock data for staff list - updated to include OM ID format with variable digits and diverse email providers
  const [staff, setStaff] = useState([
    { id: "OM1", name: "Alice Johnson", email: "alice.johnson@gmail.com", addedOn: "2024-01-15" },
    { id: "OM2", name: "Bob Smith", email: "bob.smith@outlook.com", addedOn: "2024-01-20" },
    { id: "OM3", name: "Charlie Davis", email: "charlie.davis@yahoo.com", addedOn: "2024-02-01" },
    { id: "OM12", name: "Diana Lee", email: "diana.lee@university.edu", addedOn: "2024-02-10" },
    { id: "OM15", name: "Ethan Brown", email: "ethan.brown@hotmail.com", addedOn: "2024-02-15" },
    { id: "OM4", name: "Sarah Wilson", email: "sarah.wilson@icloud.com", addedOn: "2024-03-01" },
    { id: "OM5", name: "Michael Chen", email: "michael.chen@techcorp.com", addedOn: "2024-03-05" },
    { id: "OM6", name: "Jennifer Martinez", email: "jmartinez@company.org", addedOn: "2024-03-10" },
    { id: "OM7", name: "David Thompson", email: "d.thompson@freelance.net", addedOn: "2024-03-12" },
    { id: "OM8", name: "Emma Rodriguez", email: "emma.rodriguez@gmail.com", addedOn: "2024-03-15" },
    { id: "OM9", name: "James Anderson", email: "james.anderson@protonmail.com", addedOn: "2024-03-18" },
    { id: "OM10", name: "Lisa Garcia", email: "lisa.garcia@outlook.com", addedOn: "2024-03-20" },
    { id: "OM11", name: "Robert Taylor", email: "robert.taylor@university.edu", addedOn: "2024-03-22" },
    { id: "OM13", name: "Maria Hernandez", email: "maria.h@consulting.biz", addedOn: "2024-03-25" },
    { id: "OM14", name: "Kevin White", email: "kevin.white@yahoo.com", addedOn: "2024-03-28" },
    { id: "OM16", name: "Amanda Clark", email: "amanda@startup.io", addedOn: "2024-04-01" },
    { id: "OM17", name: "Christopher Lewis", email: "chris.lewis@gmail.com", addedOn: "2024-04-03" },
    { id: "OM18", name: "Michelle Walker", email: "mwalker@design.studio", addedOn: "2024-04-05" },
    { id: "OM19", name: "Ryan Hall", email: "ryan.hall@contractor.com", addedOn: "2024-04-08" },
    { id: "OM20", name: "Nicole Young", email: "nicole.young@hotmail.com", addedOn: "2024-04-10" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    id: "",
    name: "",
    email: "",
    addedOn: new Date().toISOString().split('T')[0]
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [idError, setIdError] = useState("");
  const [dateError, setDateError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Function to check if OM ID already exists
  const isIdDuplicate = (id) => {
    return staff.some(member => member.id.toLowerCase() === id.toLowerCase());
  };

  // Function to check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Function to handle date selection with validation
  const handleDateSelect = (date) => {
    if (!date) {
      setDateError("");
      setSelectedDate(null);
      return;
    }

    if (!isToday(date)) {
      setDateError("Invalid date. Please select today's date only.");
      // Don't update selectedDate to prevent invalid selection
      return;
    }

    setDateError("");
    setSelectedDate(date);
  };

  // Handler for reset password
  const handleResetPassword = (staffMember) => {
    // In a real application, this would call an API to reset password using email
    alert(`Reset password request sent to ${staffMember.email} for ${staffMember.name} (${staffMember.id})`);
  };

  // Handler to initiate delete
  const handleDeleteStaff = (staffMember) => {
    setStaffToDelete(staffMember);
    setShowDeleteModal(true);
  };

  // Handler to confirm delete
  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      setStaff(staff.filter(member => member.id !== staffToDelete.id));
      setStaffToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Handler to cancel delete
  const cancelDeleteStaff = () => {
    setStaffToDelete(null);
    setShowDeleteModal(false);
  };


  // Handler to validate and add new staff
  const handleAddStaff = () => {
    // Reset errors
    setIdError("");
    setDateError("");
    
    // Validate required fields
    if (!newStaff.id.trim()) {
      setIdError("Staff ID is required");
      return;
    }
    
    if (!newStaff.name.trim()) {
      return;
    }

    if (!newStaff.email.trim()) {
      return;
    }

    // Email validation - accepts any valid email format (Gmail, Outlook, Yahoo, corporate emails, etc.)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email.trim())) {
      return;
    }
    
    if (!selectedDate) {
      setDateError("Please select today's date");
      return;
    }
    
    // Check for duplicate ID
    if (isIdDuplicate(newStaff.id.trim())) {
      setIdError("This Staff ID already exists. Please use a different ID.");
      return;
    }
    
    // Validate date is today
    if (!isToday(selectedDate)) {
      setDateError("Invalid date. Please select today's date only.");
      return;
    }
    
    // Add staff if all validations pass
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setStaff([...staff, { 
      id: newStaff.id.trim(), 
      name: newStaff.name.trim(), 
      email: newStaff.email.trim(),
      addedOn: formattedDate 
    }]);
    
    // Reset form
    setNewStaff({
      id: "",
      name: "",
      email: "",
      addedOn: new Date().toISOString().split('T')[0]
    });
    setSelectedDate(new Date());
    setIdError("");
    setDateError("");
    setShowAddModal(false);
  };

  // Handler to open add modal
  const handleOpenAddModal = () => {
    setNewStaff({
      id: "",
      name: "",
      email: "",
      addedOn: new Date().toISOString().split('T')[0]
    });
    setSelectedDate(new Date());
    setIdError("");
    setDateError("");
    setShowAddModal(true);
  };

  // Handler to validate ID as user types
  const handleIdChange = (e) => {
    const newId = e.target.value;
    setNewStaff({ ...newStaff, id: newId });
    
    // Clear error if field is empty
    if (!newId.trim()) {
      setIdError("");
      return;
    }
    
    // Check for duplicate ID
    if (isIdDuplicate(newId.trim())) {
      setIdError("This Staff ID already exists. Please use a different ID.");
    } else {
      setIdError("");
    }
  };

  // Filter and search logic for staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6">Staff List</h1>
      <p className="text-gray-600 mb-4">View and manage all staff in the system.</p>

      {/* Search and Add Controls */}
      <div className="mb-4 flex items-center space-x-4">
        {/* Search Box */}
        <input
          type="text"
          placeholder="Search staff by name, ID, or email..."
          value={searchQuery}
          onChange={handleSearch}
          className="border p-2 rounded w-full max-w-sm"
        />

        {/* Add Staff Button */}
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-3 text-sm font-semibold">ID</th>
              <th className="p-3 text-sm font-semibold">Name</th>
              <th className="p-3 text-sm font-semibold">Email</th>
              <th className="p-3 text-sm font-semibold">Added On</th>
              <th className="p-3 text-sm font-semibold text-center">Reset Password</th>
              <th className="p-3 text-sm font-semibold text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStaff.map((member, index) => (
              <tr
                key={member.id}
                className={`border-t ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <td className="p-3 text-sm font-semibold text-blue-600">{member.id}</td>
                <td className="p-3 text-sm">{member.name}</td>
                <td className="p-3 text-sm text-gray-600">{member.email}</td>
                <td className="p-3 text-sm text-gray-600">{member.addedOn}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleResetPassword(member)}
                    className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                    title={`Reset password for ${member.name}`}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Reset
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDeleteStaff(member)}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                    title={`Delete ${member.name}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedStaff.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No staff found.</p>
        )}
      </div>

      {/* Pagination */}
      {filteredStaff.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center space-y-2">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff members
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === currentPage;
                
                // Show first page, last page, current page, and pages around current
                const showPage = pageNum === 1 || 
                                pageNum === totalPages || 
                                Math.abs(pageNum - currentPage) <= 1;
                
                if (!showPage) {
                  // Show ellipsis for gaps
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <PaginationItem key={`ellipsis-${pageNum}`}>
                        <span className="px-3 py-2 text-gray-500">...</span>
                      </PaginationItem>
                    );
                  }
                  return null;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={isCurrentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add New Staff</h2>
            
            <div className="space-y-4">
              {/* ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStaff.id}
                  onChange={handleIdChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${
                    idError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter Staff ID (e.g., OM1, OM12, OM123)"
                />
                {idError && (
                  <p className="text-xs text-red-500 mt-1">{idError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Format: OM + number (e.g., OM1, OM12, OM123)</p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Enter email address (e.g., user@gmail.com, name@company.com)"
                />
                <p className="text-xs text-gray-500 mt-1">Accepts any valid email provider (Gmail, Outlook, Yahoo, corporate emails, etc.)</p>
              </div>

              {/* Added On Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Added On <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        dateError ? 'border-red-500 bg-red-50' : ''
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDate(selectedDate) : "Select today's date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => !isToday(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <p className="text-xs text-red-500 mt-1">{dateError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">You can only select today's date</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={
                  idError || 
                  dateError || 
                  !newStaff.id.trim() || 
                  !newStaff.name.trim() || 
                  !newStaff.email.trim() || 
                  !selectedDate || 
                  !isToday(selectedDate) ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email.trim())
                }
                className={`px-4 py-2 rounded transition-colors ${
                  idError || 
                  dateError || 
                  !newStaff.id.trim() || 
                  !newStaff.name.trim() || 
                  !newStaff.email.trim() || 
                  !selectedDate || 
                  !isToday(selectedDate) ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email.trim())
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && staffToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">Delete Staff Member</h2>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{staffToDelete.name}</span> ({staffToDelete.id})?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteStaff}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStaff}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
