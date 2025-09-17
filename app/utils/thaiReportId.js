/**
 * Convert a date and report index to Thai Buddhist Era report ID format
 * Format: SE[YY][MM][DD][###]
 * @param {Date} date - The report date
 * @param {number} index - The report index for that day (starting from 1)
 * @returns {string} Thai-formatted report ID
 */
export function generateThaiReportId(date, index) {
  // Convert to Thai Buddhist Era (BE = Gregorian + 543)
  const thaiYear = date.getFullYear() + 543;
  
  // Get last 2 digits of Thai year
  const yearShort = String(thaiYear).slice(-2);
  
  // Format month and day with leading zeros
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format index with 3 digits
  const counter = String(index).padStart(3, '0');
  
  return `SE${yearShort}${month}${day}${counter}`;
}

/**
 * Group reports by date and assign Thai report IDs
 * @param {Array} reports - Array of report objects
 * @returns {Array} Reports with Thai IDs assigned
 */
export function assignThaiReportIds(reports) {
  // Sort reports by createdAt date
  const sortedReports = [...reports].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  // Group reports by date
  const reportsByDate = {};
  
  sortedReports.forEach(report => {
    const date = new Date(report.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    
    if (!reportsByDate[dateKey]) {
      reportsByDate[dateKey] = [];
    }
    reportsByDate[dateKey].push(report);
  });
  
  // Assign Thai IDs to each report
  const reportsWithThaiIds = [];
  
  Object.keys(reportsByDate).forEach(dateKey => {
    const dayReports = reportsByDate[dateKey];
    dayReports.forEach((report, index) => {
      const date = new Date(report.createdAt);
      reportsWithThaiIds.push({
        ...report,
        thaiReportId: generateThaiReportId(date, index + 1)
      });
    });
  });
  
  return reportsWithThaiIds;
}