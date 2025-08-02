import { Report } from "@prisma/client";
import ExcelJS from "exceljs";

export async function createReportWorkbook(
  data: Report[],
  type: string,
  date: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
  );

  // Header row
  sheet.addRow(["Name", "Weight", "Quantity"]);

  // Data rows
  data.forEach((item) => {
    sheet.addRow([
      (item as any).name || "",
      (item as any).weight || "",
      (item as any).quantity || "",
    ]);
  });

  // Format header
  sheet.getRow(1).font = { bold: true };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// CSV export using fast-csv
export async function createReportCSV(
  data: Report[],
  type: string,
  date: string,
): Promise<Buffer> {
  const { writeToString } = await import("fast-csv");
  const rows = [
    ["Name", "Weight", "Quantity"],
    ...data.map((item) => [
      (item as any).name || "",
      (item as any).weight || "",
      (item as any).quantity || "",
    ]),
  ];
  // RFC 4180 compliance and UTF-8 BOM for Excel compatibility
  let csv = await writeToString(rows, {
    headers: false,
    quoteColumns: true,
    writeBOM: true,
  });
  // Ensure all fields are properly quoted and newlines/commas/quotes are escaped
  return Buffer.from(csv, "utf8");
}

// PDF export - disabled due to font loading issues in Next.js
export async function createReportPDF(
  data: Report[],
  type: string,
  date: string,
): Promise<Buffer> {
  // Return a simple error message as PDF is not supported in this API
  throw new Error(
    "PDF generation not supported for this report type. Please use Excel or CSV format.",
  );
}
