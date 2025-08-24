import ExcelJS from "exceljs";
import { cookies } from "next/headers";
import puppeteer from "puppeteer";

export async function createReportWorkbook(
  data: any[],
  columns: { header: string; key: string }[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Sheet 1`);

  // Header row
  sheet.addRow(columns.map((c) => c.header));

  // Data rows
  data.forEach((item) => {
    sheet.addRow(columns.map((c) => (item as any)[c.key] || ""));
  });

  // Format header
  sheet.getRow(1).font = { bold: true };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// CSV export using fast-csv
export async function createReportCSV(
  data: any[],
  columns: { header: string; key: string }[],
): Promise<Buffer> {
  const { writeToString } = await import("fast-csv");
  const rows = [
    columns.map((c) => c.header),
    ...data.map((item) => columns.map((c) => (item as any)[c.key] || "")),
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

// PDF export using react-pdf
export async function createReportPDF(url: string): Promise<Buffer> {
  // Launch Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const cookiesRes = await cookies();

  // Get NextAuth session token from cookies
  let sessionToken =
    cookiesRes.get("next-auth.session-token")?.value ||
    cookiesRes.get("__Secure-next-auth.session-token")?.value;
  if (sessionToken) {
    // Set the session token cookie for the page (for localhost:3000)
    await browser.setCookie({
      name: cookiesRes.get("next-auth.session-token")?.value
        ? "next-auth.session-token"
        : "__Secure-next-auth.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
    });
  }

  // Navigate and wait for network to be idle
  await page.goto(url, { waitUntil: "networkidle0" });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
  });
  await browser.close();
  return Buffer.from(pdfBuffer);
}
