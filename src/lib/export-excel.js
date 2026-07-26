import * as XLSX from "xlsx";

/**
 * Download an array of plain objects as an .xlsx file.
 * @param {Record<string, unknown>[]} rows
 * @param {string} filename - without extension
 * @param {string} [sheetName]
 */
export function downloadExcel(rows, filename, sheetName = "Sheet1") {
  const data = Array.isArray(rows) ? rows : [];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-ish column widths from header + first rows
  const keys = data.length ? Object.keys(data[0]) : [];
  worksheet["!cols"] = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.slice(0, 50).map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
