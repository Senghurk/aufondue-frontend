"use client";

import { useState, useEffect } from "react";
import { getBackendUrl } from "../config/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatDate, formatDateTime } from "../utils/dateFormatter";
import { useTranslation } from "../hooks/useTranslation";

export default function HistoryPage() {
  const { t, tWithParams } = useTranslation();
  const [completedReports, setCompletedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl = getBackendUrl();

  const fetchCompletedReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching from:", `${backendUrl}/issues/completed`);
      
      const response = await fetch(`${backendUrl}/issues/completed`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched completed reports:", data);
      
      if (Array.isArray(data)) {
        setCompletedReports(data);
      } else {
        setCompletedReports([]);
        console.warn("Expected array but got:", typeof data, data);
      }
    } catch (error) {
      console.error("Error fetching completed reports:", error);
      setError(t("history.error"));
      setCompletedReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;

    if (isNaN(diffMs) || diffMs < 0) return "Invalid";

    const totalMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  // ✅ NEW: Export to Excel using exceljs
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t("history.title"));

    // Define header
    const header = [
      t("history.table.description"),
      t("history.table.category"),
      t("history.table.assignedTo"),
      t("history.table.status"),
      t("history.table.reportedDate"),
      t("history.table.completionDate"),
      t("history.table.duration"),
    ];
    worksheet.addRow(header);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    completedReports.forEach((report) => {
      worksheet.addRow([
        report.description,
        report.category,
        report.assignedTo?.name || "Unassigned",
        t("history.status.completed"),
        formatDateTime(report.createdAt),
        formatDateTime(report.updatedAt),
        getDuration(report.createdAt, report.updatedAt),
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 40 },
      { width: 20 },
      { width: 20 },
      { width: 15 },
      { width: 25 },
      { width: 25 },
      { width: 15 },
    ];

    // Generate file and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "Completed_Reports.xlsx");
  };

  useEffect(() => {
    fetchCompletedReports();
  }, []);

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("history.title")}</h1>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600"
        >
          {t("history.exportExcel")}
        </button>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {t("history.subtitle")}
      </p>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t("history.loading")}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={fetchCompletedReports}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            {t("history.retry")}
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3.5 overflow-x-auto max-w-full">
          {completedReports.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{t("history.noReports")}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t("history.noReportsDesc")}</p>
            </div>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 text-left">
                  <th className="p-3 text-sm font-semibold">{t("history.table.no")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.description")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.category")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.assignedTo")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.status")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.reportedDate")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.completionDate")}</th>
                  <th className="p-3 text-sm font-semibold">{t("history.table.duration")}</th>
                </tr>
              </thead>
              <tbody>
                {completedReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`border-t ${
                      index % 2 === 0 ? "bg-gray-50 dark:bg-gray-700/50" : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <td className="p-3 text-sm">{index + 1}</td>
                    <td className="p-3 text-sm">{report.description}</td>
                    <td className="p-3 text-sm">{report.category}</td>
                    <td className="p-3 text-sm">{report.assignedTo?.name}</td>
                    <td className="p-3 text-sm font-semibold text-green-600">
                      {t("history.status.completed")}
                    </td>
                    <td className="p-3 text-sm">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="p-3 text-sm">
                      {formatDateTime(report.updatedAt)}
                    </td>
                    <td className="p-3 text-sm">
                      {getDuration(report.createdAt, report.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
