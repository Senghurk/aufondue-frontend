"use client";

import { useEffect, useMemo, useState } from "react";
import { getBackendUrl } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfDay, endOfDay, isAfter, startOfToday } from "date-fns";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { generateThaiReportId } from "../utils/thaiReportId";
import { useTranslation } from "../hooks/useTranslation";

function diffHM(startISO, endISO) {
  const s = new Date(startISO);
  const e = new Date(endISO ?? Date.now());
  const ms = Math.max(0, e - s);
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}


export default function DailyReportsPage() {
  const { t, tWithParams } = useTranslation();
  const backendUrl = getBackendUrl();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [zone, setZone] = useState("");
  const [department, setDepartment] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Today at midnight for comparison
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Initialize zone and department with translations
  useEffect(() => {
    setZone(t("dailyReport.zone"));
    setDepartment(t("dailyReport.department"));
  }, [t]);

  // Handle date selection
  const handleDateSelect = (newDate) => {
    if (newDate) {
      setSelectedDate(newDate);
      setDate(format(newDate, "yyyy-MM-dd"));
      setIsCalendarOpen(false);
    }
  };

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch only assigned reports
        const res = await fetch(
          `${backendUrl}/issues/assigned?page=0&size=1000`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        const selectedDateStart = startOfDay(new Date(date));
        const selectedDateEnd = endOfDay(new Date(date));
        const thirtyDaysAgo = new Date(selectedDateStart);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get current month and year for ID generation
        const currentMonth = selectedDateStart.getMonth() + 1;
        const currentYear = selectedDateStart.getFullYear();

        // Separate today's reports and RF/PR reports from last 30 days
        let todaysReports = [];
        let carryOverReports = [];

        (Array.isArray(data) ? data : []).forEach(r => {
          if (r.createdAt) {
            const reportDate = new Date(r.createdAt);

            // Today's reports
            if (reportDate >= selectedDateStart && reportDate <= selectedDateEnd) {
              todaysReports.push(r);
            }
            // RF/PR reports from last 30 days (excluding today)
            else if ((r.remarkType === 'RF' || r.remarkType === 'PR') &&
                     reportDate >= thirtyDaysAgo &&
                     reportDate < selectedDateStart) {
              carryOverReports.push(r);
            }
          }
        });

        // Sort carry-over reports by date (most recent first)
        carryOverReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Combine: carry-over RF/PR first, then today's reports
        const allReports = [...carryOverReports, ...todaysReports];

        // Map reports with sequential numbering for the month
        let reportCounter = 1;
        let mapped = allReports.map((r) => {
          const reportNum = reportCounter++;
          return {
            no: reportNum,
            id: r.id ?? reportNum,
            thaiReportId: generateThaiReportId(new Date(date), reportNum),
            reportedTime: r.createdAt
              ? format(new Date(r.createdAt), "dd/MM/yyyy HH:mm")
              : "-",
            isCarryOver: carryOverReports.includes(r), // Mark if it's a carry-over report
            location: r.customLocation || r.location || "-",
            problem: r.description || "-",
            requester: r.reportedBy?.username || "-",
            supervisor: r.assignedTo?.staffId || r.assignedTo?.name || "-",
            status: r.status || "-",
            category: r.category || "-",
            remarkType: r.remarkType || "",
            priority: r.priority || "",
            // Determine resolution status
            isOK: r.status === "COMPLETED" && (r.remarkType === "OK" || !r.remarkType),
            isPR: r.remarkType === "PR",
            isRF: r.remarkType === "RF",
            // Only show if assigned
            assigned: r.assigned === true && r.assignedTo != null,
          };
        });

        // Only show assigned reports
        mapped = mapped.filter(r => r.supervisor && r.supervisor !== "-");

        setRows(mapped);
      } catch (e) {
        console.error('Error fetching daily reports:', e);
        console.error('Error details:', e.message);
        setError("Failed to load assigned reports. Please try again later.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, [date, backendUrl]);

  const columns = useMemo(
    () => [
      { key: "no", label: t("dailyReport.table.no"), width: "w-10" },
      { key: "id", label: t("dailyReport.table.reportId"), width: "w-16" },
      { key: "reportedTime", label: t("dailyReport.table.assignedDateTime"), width: "w-32" },
      { key: "problem", label: t("dailyReport.table.description"), width: "w-64" },
      { key: "location", label: t("dailyReport.table.location"), width: "w-40" },
      { key: "requester", label: t("dailyReport.table.reportedBy"), width: "w-24" },
      { key: "supervisor", label: t("dailyReport.table.assignedTo"), width: "w-24" },
      { key: "resolution", label: t("dailyReport.table.resultStatus"), width: "w-32" },
    ],
    []
  );

  const handlePrint = () => window.print();

  const handlePdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    // Compact Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t("dailyReport.printHeader.title"), margin, 35);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(t("dailyReport.printHeader.university"), margin + 200, 35);
    
    // Department, date and zone on same line
    doc.setFontSize(9);
    doc.text(`${t("dailyReport.printHeader.department")}: ${department}`, margin, 50);
    doc.text(`${t("dailyReport.printHeader.date")}: ${format(new Date(date), "dd/MM/yyyy")}`, margin + 200, 50);

    // Zone box (smaller)
    doc.rect(pageWidth - margin - 60, 42, 60, 18);
    doc.setFont("helvetica", "bold");
    doc.text(`${t("dailyReport.printHeader.zone")}: ${zone}`, pageWidth - margin - 30, 53, { align: "center" });

    // Table headers
    const tableHeaders = [
      [t("dailyReport.table.no"), t("dailyReport.table.reportId"), t("dailyReport.table.assignedDateTime"), t("dailyReport.table.description"), t("dailyReport.table.location"), t("dailyReport.table.reportedBy"), t("dailyReport.table.assignedTo"), t("dailyReport.table.ok"), t("dailyReport.table.pr"), t("dailyReport.table.rf")]
    ];

    // Table body
    const tableBody = rows.map((r) => [
      r.no,
      r.thaiReportId,
      r.reportedTime,
      r.problem,
      r.location,
      r.requester,
      r.supervisor || "-",
      r.isOK ? "✓" : "",
      r.isPR ? "✓" : "",
      r.isRF ? "✓" : ""
    ]);

    // Column widths
    const columnStyles = {
      0: { cellWidth: 25, halign: 'center' },  // No.
      1: { cellWidth: 70, halign: 'center' },  // Report ID
      2: { cellWidth: 85 },  // Date/Time
      3: { cellWidth: 180 }, // Description
      4: { cellWidth: 120 }, // Location
      5: { cellWidth: 70 },  // Reported By
      6: { cellWidth: 70 },  // Assigned To
      7: { cellWidth: 30, halign: 'center' }, // OK
      8: { cellWidth: 30, halign: 'center' }, // PR
      9: { cellWidth: 30, halign: 'center' }, // RF
    };

    autoTable(doc, {
      startY: 65,
      head: tableHeaders,
      body: tableBody,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: { 
        fillColor: [230, 230, 230], 
        textColor: 0,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles,
      tableWidth: contentWidth,
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageNumber = data.pageNumber;
        
        // Add header on each page (except first which already has it)
        if (pageNumber > 1) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`${t("dailyReport.printHeader.title")} (Continued)`, margin, 25);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(`${t("dailyReport.printHeader.date")}: ${format(new Date(date), "dd/MM/yyyy")}`, margin, 38);
          doc.text(`Page ${pageNumber}`, pageWidth - margin - 40, 38);
        }
        
        // Compact footer on every page
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        
        // Signature line
        doc.text(`${t("dailyReport.footer.preparedBy")}: __________`, margin, pageHeight - 20);
        doc.text(`${t("dailyReport.footer.reviewedBy")}: __________`, margin + 180, pageHeight - 20);
        doc.text(`${t("dailyReport.footer.approvedBy")}: __________`, margin + 360, pageHeight - 20);
        
        // Page number
        doc.text(
          tWithParams("dailyReport.footer.page", { current: pageNumber, total: pageCount }),
          pageWidth - margin - 40,
          pageHeight - 20
        );
      },
    });

    doc.save(`Daily_Maintenance_Reports_${date}.pdf`);
  };

  return (
    <div className="flex-1 p-6 print:p-4">
      {/* Controls - Hidden when printing */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dailyReport.title")}</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] sm:w-[240px] justify-start text-left font-normal h-10 border-gray-300 hover:bg-gray-50",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd MMM yyyy") : <span>{t("dailyReport.pickDate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  // Disable dates after today
                  return isAfter(date, today);
                }}
                initialFocus
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={handlePrint}
            className="rounded bg-gray-700 text-white px-4 py-2 h-10 text-sm hover:bg-gray-800 transition-colors"
          >
            {t("dailyReport.print")}
          </button>
          <button
            onClick={handlePdf}
            className="rounded bg-blue-600 text-white px-4 py-2 h-10 text-sm hover:bg-blue-700 transition-colors"
          >
            {t("dailyReport.downloadPdf")}
          </button>
        </div>
      </div>

      {/* Compact Print Header - Appears on every page */}
      <div className="hidden print:block print:fixed print:top-0 print:left-0 print:right-0 print:bg-white print:z-50">
        <div className="border-b-2 border-black px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-base font-bold">{t("dailyReport.printHeader.title")}</h1>
              <span className="text-sm">{t("dailyReport.printHeader.university")}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span><strong>Dept:</strong> {department}</span>
              <span><strong>Date:</strong> {format(new Date(date), "dd/MM/yyyy")}</span>
              <span className="border border-black px-2 py-0.5 font-bold">{zone}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add padding for fixed header in print */}
      <div className="hidden print:block print:h-12"></div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">{t("dailyReport.loading")}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
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
      {!loading && (
        <div className="bg-white rounded-lg shadow-md print:shadow-none p-4 print:p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="text-center py-16 print:hidden">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-gray-600 text-xl font-semibold mb-2">{t("dailyReport.noReports")}</h3>
              <p className="text-gray-500 text-base mb-1">{tWithParams("dailyReport.noReportsDesc", { date: format(new Date(date), "MMMM d, yyyy") })}</p>
              <p className="text-gray-400 text-sm">{t("dailyReport.noReportsHint")}</p>
            </div>
          ) : (
          <table className="w-full border-collapse text-xs print:text-[10px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.no")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.reportId")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.assignedDateTime")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.description")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.location")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.reportedBy")}</th>
                <th className="border-2 border-black p-2 text-left font-bold">{t("dailyReport.table.assignedTo")}</th>
                <th className="border-2 border-black p-2 text-center font-bold" colSpan={3}>{t("dailyReport.table.resultStatus")}</th>
              </tr>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border-2 border-black" colSpan={7}></th>
                <th className="border-2 border-black p-1 text-center text-[10px] font-bold">OK</th>
                <th className="border-2 border-black p-1 text-center text-[10px] font-bold">PR</th>
                <th className="border-2 border-black p-1 text-center text-[10px] font-bold">RF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className={`${idx % 2 ? "bg-white" : "bg-gray-50 print:bg-white"} ${r.isCarryOver ? "bg-yellow-50 print:bg-yellow-50" : ""}`}>
                  <td className="border border-black p-1.5 text-center">{r.no}</td>
                  <td className="border border-black p-1.5 text-center">
                    {r.thaiReportId}
                    {r.isCarryOver && <span className="text-xs text-orange-600 ml-1 print:hidden">*</span>}
                  </td>
                  <td className="border border-black p-1.5">{r.reportedTime}</td>
                  <td className="border border-black p-1.5">{r.problem}</td>
                  <td className="border border-black p-1.5">{r.location}</td>
                  <td className="border border-black p-1.5">{r.requester}</td>
                  <td className="border border-black p-1.5">{r.supervisor || "-"}</td>
                  <td className="border border-black p-1.5 text-center w-10">
                    <div className="flex justify-center">
                      {r.isOK ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="inline-block w-4 h-4 border border-gray-400"></span>
                      )}
                    </div>
                  </td>
                  <td className="border border-black p-1.5 text-center w-10">
                    <div className="flex justify-center">
                      {r.isPR ? (
                        <span className="text-orange-600 font-bold">✓</span>
                      ) : (
                        <span className="inline-block w-4 h-4 border border-gray-400"></span>
                      )}
                    </div>
                  </td>
                  <td className="border border-black p-1.5 text-center w-10">
                    <div className="flex justify-center">
                      {r.isRF ? (
                        <span className="text-purple-600 font-bold">✓</span>
                      ) : (
                        <span className="inline-block w-4 h-4 border border-gray-400"></span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {rows.some(r => r.isCarryOver) && (
            <div className="mt-4 text-xs text-gray-600 print:text-black">
              <span className="font-semibold">{t("dailyReport.note")}:</span> {t("dailyReport.carryOverNote")}
            </div>
          )}
        </div>
      )}

      {/* Compact Print Footer - Appears on every page */}
      <div className="hidden print:block print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white print:z-50">
        <div className="border-t border-black px-4 py-2">
          <div className="flex justify-between items-center text-[9px]">
            <span>{t("dailyReport.footer.preparedBy")}: ______________</span>
            <span>{t("dailyReport.footer.reviewedBy")}: ______________</span>
            <span>{t("dailyReport.footer.approvedBy")}: ______________</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm 10mm 20mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Arial', sans-serif;
          }
          thead { 
            display: table-header-group;
          }
          tr { 
            page-break-inside: avoid;
          }
          .print\:fixed {
            position: fixed !important;
          }
          .print\:top-0 {
            top: 0 !important;
          }
          .print\:bottom-0 {
            bottom: 0 !important;
          }
          .print\:left-0 {
            left: 0 !important;
          }
          .print\:right-0 {
            right: 0 !important;
          }
          .print\:z-50 {
            z-index: 50 !important;
          }
          .print\:h-12 {
            height: 3rem !important;
          }
          .print\:text-\[9px\] {
            font-size: 9px !important;
          }
          .print\:text-\[10px\] {
            font-size: 10px !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
          .print\:p-0 {
            padding: 0 !important;
          }
          .print\:p-4 {
            padding: 1rem !important;
          }
          .print\:block {
            display: block !important;
          }
          .print\:hidden {
            display: none !important;
          }
          .print\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
          .print\:bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}
