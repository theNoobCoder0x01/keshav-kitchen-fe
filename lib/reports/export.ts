import { Report } from "@prisma/client";
import ExcelJS from "exceljs";

export async function createReportWorkbook(data: Report[], type: string, date: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);

  // Header row
  sheet.addRow(["Name", "Weight", "Quantity"]);

  // Data rows
  data.forEach((item) => {
    sheet.addRow([
      (item as any).name || '',
      (item as any).weight || '',
      (item as any).quantity || ''
    ]);
  });

  // Format header
  sheet.getRow(1).font = { bold: true };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// CSV export using fast-csv
export async function createReportCSV(data: Report[], type: string, date: string): Promise<Buffer> {
  const { writeToString } = await import("fast-csv");
  const rows = [
    ["Name", "Weight", "Quantity"],
    ...data.map((item) => [
      (item as any).name || '',
      (item as any).weight || '',
      (item as any).quantity || ''
    ]),
  ];
  // RFC 4180 compliance and UTF-8 BOM for Excel compatibility
  let csv = await writeToString(rows, { headers: false, quoteColumns: true, writeBOM: true });
  // Ensure all fields are properly quoted and newlines/commas/quotes are escaped
  return Buffer.from(csv, 'utf8');
}

// PDF export using pdfkit
export async function createReportPDF(data: Report[], type: string, date: string): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {});

  // Header
  doc.fontSize(18).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: "center", underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Date: ${date}`, { align: "center" });
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const colWidths = [140, 100, 100];
  const startX = 60;
  const rowHeight = 24;
  doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fillAndStroke('#f5f5f5', '#cccccc');
  doc.fillColor('#333').fontSize(12).font('Helvetica-Bold');
  doc.text('Name', startX + 8, tableTop + 6, { width: colWidths[0] - 16, continued: true });
  doc.text('Weight', startX + colWidths[0] + 8, tableTop + 6, { width: colWidths[1] - 16, continued: true });
  doc.text('Quantity', startX + colWidths[0] + colWidths[1] + 8, tableTop + 6, { width: colWidths[2] - 16 });
  doc.font('Helvetica').fillColor('#000');

  // Table rows
  let y = tableTop + rowHeight;
  data.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fillAndStroke(isEven ? '#fcfcfc' : '#f0f0f0', '#e0e0e0');
    doc.fillColor('#111');
    doc.text((item as any).name || '', startX + 8, y + 6, { width: colWidths[0] - 16, continued: true });
    doc.text((item as any).weight || '', startX + colWidths[0] + 8, y + 6, { width: colWidths[1] - 16, continued: true });
    doc.text((item as any).quantity || '', startX + colWidths[0] + colWidths[1] + 8, y + 6, { width: colWidths[2] - 16 });
    y += rowHeight;
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }
  });

  // Summary section
  doc.moveDown(2);
  doc.fontSize(11).fillColor('#555').text(`Total items: ${data.length}`, { align: "right" });

  // Footer with page number
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(10).fillColor('#888').text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, { align: "center" });
  }

  doc.end();
  return await new Promise<Buffer>((resolve) => {
    const all = Buffer.concat(buffers);
    resolve(all);
  });
}
