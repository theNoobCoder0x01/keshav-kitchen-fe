import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface MenuReportData {
  type: string;
  date: Date;
  totalQuantity?: number;
  totalMeals?: number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  menus: Array<{
    id: string;
    date: Date;
    mealType: string;
    servings: number;
    ghanFactor: number;
    status: string;
    actualCount?: number;
    notes?: string;
    kitchen: {
      name: string;
    };
    recipe: {
      name: string;
      description?: string;
      ingredients?: Array<{
        ingredient: {
          name: string;
          unit: string;
        };
        quantity: number;
      }>;
    };
  }>;
}

export function createMenuReportPDFWithJsPDF(
  data: MenuReportData,
  type: string,
  date: string,
): Buffer {
  console.log("Creating PDF with jsPDF for type:", type, "date:", date);
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set document properties
  doc.setProperties({
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    subject: 'Kitchen Report',
    author: 'Keshav Kitchen',
    creator: 'Keshav Kitchen System'
  });

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  const titleWidth = doc.getTextWidth(title);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  // Add date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(date).toLocaleDateString();
  const dateText = `Date: ${dateStr}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, 30);

  let yPosition = 45;

  if (type === 'summary') {
    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Meals: ${data.totalMeals || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Breakfast Count: ${data.breakfastCount || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Lunch Count: ${data.lunchCount || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Dinner Count: ${data.dinnerCount || 0}`, 20, yPosition);
    yPosition += 15;

    // Create table data for summary
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          (menu.servings || 0).toString(),
          menu.status || 'N/A',
          menu.notes || ''
        ])
      : [['No data available for this date', '', '', '', '', '']];

    doc.autoTable({
      head: [['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [103, 74, 245],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 }
    });

  } else {
    // Meal-specific report
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Servings: ${data.totalQuantity || 0}`, 20, yPosition);
    yPosition += 15;

    // Create table data for meal-specific report
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          (menu.servings || 0).toString(),
          (menu.ghanFactor || 1.0).toString(),
          menu.status || 'N/A'
        ])
      : [['No data available for this date', '', '', '', '']];

    doc.autoTable({
      head: [['Kitchen', 'Recipe', 'Servings', 'Ghan Factor', 'Status']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [103, 74, 245],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 }
    });
  }

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerText = `Page ${i} of ${pageCount}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, doc.internal.pageSize.getHeight() - 10);
  }

  // Convert to buffer
  const pdfData = doc.output('arraybuffer');
  console.log("jsPDF generation completed, buffer size:", pdfData.byteLength);
  
  return Buffer.from(pdfData);
}