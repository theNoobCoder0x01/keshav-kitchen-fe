import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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

export async function createMenuReportWorkbook(
  data: MenuReportData,
  type: string,
  date: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
  );

  // Add title and metadata
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Date: ${new Date(date).toLocaleDateString()}`;
  sheet.getCell('A2').font = { size: 12 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  let currentRow = 4;

  if (type === 'summary') {
    // Summary report layout
    sheet.getCell(`A${currentRow}`).value = 'Daily Summary';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    sheet.getCell(`A${currentRow}`).value = 'Total Meals:';
    sheet.getCell(`B${currentRow}`).value = data.totalMeals || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Breakfast Count:';
    sheet.getCell(`B${currentRow}`).value = data.breakfastCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Lunch Count:';
    sheet.getCell(`B${currentRow}`).value = data.lunchCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Dinner Count:';
    sheet.getCell(`B${currentRow}`).value = data.dinnerCount || 0;
    currentRow += 2;

    // Detailed breakdown
    sheet.addRow(['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes']);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
  } else {
    // Meal-specific report
    sheet.getCell(`A${currentRow}`).value = `Total Servings: ${data.totalQuantity || 0}`;
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Header row for meal details
    sheet.addRow(['Kitchen', 'Recipe', 'Servings', 'Ghan Factor', 'Status', 'Ingredients']);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
  }

  // Data rows
  if (data.menus && data.menus.length > 0) {
    data.menus.forEach((menu) => {
      if (type === 'summary') {
        sheet.addRow([
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          menu.servings || 0,
          menu.status || 'N/A',
          menu.notes || '',
        ]);
      } else {
        const ingredients = menu.recipe?.ingredients
          ?.map(ing => `${ing.ingredient.name} (${ing.quantity} ${ing.ingredient.unit})`)
          .join(', ') || 'N/A';
        
        sheet.addRow([
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.servings || 0,
          menu.ghanFactor || 1.0,
          menu.status || 'N/A',
          ingredients,
        ]);
      }
    });
  } else {
    // Add a row indicating no data
    if (type === 'summary') {
      sheet.addRow(['No data available for this date', '', '', '', '', '']);
    } else {
      sheet.addRow(['No data available for this date', '', '', '', '', '']);
    }
  }

  // Auto-fit columns
  sheet.columns.forEach((column, index) => {
    let maxLength = 0;
    if (column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
    }
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function createMenuReportCSV(
  data: MenuReportData,
  type: string,
  date: string,
): Promise<Buffer> {
  const { writeToString } = await import("fast-csv");
  
  let rows: string[][];
  
  if (type === 'summary') {
    rows = [
      [`${type.charAt(0).toUpperCase() + type.slice(1)} Report`],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
      ['Summary'],
      ['Total Meals', (data.totalMeals || 0).toString()],
      ['Breakfast Count', (data.breakfastCount || 0).toString()],
      ['Lunch Count', (data.lunchCount || 0).toString()],
      ['Dinner Count', (data.dinnerCount || 0).toString()],
      [],
      ['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes'],
      ...data.menus.map((menu) => [
        menu.kitchen.name,
        menu.recipe.name,
        menu.mealType,
        menu.servings.toString(),
        menu.status,
        menu.notes || '',
      ]),
    ];
  } else {
    rows = [
      [`${type.charAt(0).toUpperCase() + type.slice(1)} Report`],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [`Total Servings: ${data.totalQuantity || 0}`],
      [],
      ['Kitchen', 'Recipe', 'Servings', 'Ghan Factor', 'Status', 'Ingredients'],
      ...data.menus.map((menu) => {
        const ingredients = menu.recipe.ingredients
          ?.map(ing => `${ing.ingredient.name} (${ing.quantity} ${ing.ingredient.unit})`)
          .join('; ') || 'N/A';
        
        return [
          menu.kitchen.name,
          menu.recipe.name,
          menu.servings.toString(),
          menu.ghanFactor.toString(),
          menu.status,
          ingredients,
        ];
      }),
    ];
  }

  const csv = await writeToString(rows, {
    headers: false,
    quoteColumns: true,
    writeBOM: true,
  });
  
  return Buffer.from(csv, "utf8");
}

export async function createMenuReportPDF(
  data: MenuReportData,
  type: string,
  date: string,
): Promise<Buffer> {
  console.log("Starting PDF generation for type:", type, "date:", date);
  console.log("Data received:", { menusCount: data.menus?.length || 0 });
  
  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];
  
  doc.on("data", (chunk) => {
    buffers.push(chunk);
  });
  
  doc.on("error", (error) => {
    console.error("PDF generation error:", error);
  });
  
  console.log("PDF document created, generating content...");

  try {
    // Header
    console.log("Adding PDF header...");
    doc
      .fontSize(18)
      .text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, {
        align: "center",
        underline: true,
      });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Date: ${new Date(date).toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);
    console.log("PDF header added successfully");
  } catch (headerError) {
    console.error("Error adding PDF header:", headerError);
    throw headerError;
  }

  if (type === 'summary') {
    try {
      // Summary statistics
      console.log("Adding summary statistics...");
      doc.fontSize(14).text('Daily Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Meals: ${data.totalMeals || 0}`);
      doc.text(`Breakfast Count: ${data.breakfastCount || 0}`);
      doc.text(`Lunch Count: ${data.lunchCount || 0}`);
      doc.text(`Dinner Count: ${data.dinnerCount || 0}`);
      doc.moveDown(1);
      console.log("Summary statistics added successfully");
    } catch (summaryError) {
      console.error("Error adding summary statistics:", summaryError);
      doc.text("Error generating summary statistics", 50, doc.y);
    }

    // Table for detailed breakdown
    const headers = ['Kitchen', 'Recipe', 'Type', 'Servings', 'Status'];
    const colWidths = [100, 150, 80, 70, 80];
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          (menu.servings || 0).toString(),
          menu.status || 'N/A',
        ])
      : [['No data available for this date', '', '', '', '']];
    
    try {
      console.log("Drawing summary table with", tableData.length, "rows");
      drawTable(doc, headers, colWidths, tableData);
      console.log("Summary table drawn successfully");
    } catch (tableError) {
      console.error("Error drawing summary table:", tableError);
      doc.text("Error generating table data", 50, doc.y);
    }
  } else {
    try {
      // Meal-specific report
      console.log("Adding meal-specific content...");
      doc.fontSize(12).text(`Total Servings: ${data.totalQuantity || 0}`, { align: 'left' });
      doc.moveDown(1);
      console.log("Meal-specific content added successfully");
    } catch (mealError) {
      console.error("Error adding meal-specific content:", mealError);
      doc.text("Error generating meal-specific content", 50, doc.y);
    }

    const headers = ['Kitchen', 'Recipe', 'Servings', 'Status'];
    const colWidths = [120, 200, 80, 80];
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          (menu.servings || 0).toString(),
          menu.status || 'N/A',
        ])
      : [['No data available for this date', '', '', '']];
    
    try {
      console.log("Drawing meal table with", tableData.length, "rows");
      drawTable(doc, headers, colWidths, tableData);
      console.log("Meal table drawn successfully");
    } catch (tableError) {
      console.error("Error drawing meal table:", tableError);
      doc.text("Error generating table data", 50, doc.y);
    }
  }

  // Footer with page number
  try {
    console.log("Adding page numbers...");
    const range = doc.bufferedPageRange();
    console.log("Page range:", range);
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(10)
        .fillColor("#888")
        .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, {
          align: "center",
        });
    }
    console.log("Page numbers added successfully");
  } catch (footerError) {
    console.error("Error adding page numbers:", footerError);
    // Continue without page numbers
  }

  console.log("Finalizing PDF document...");
  doc.end();
  
  return new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timeout after 30 seconds'));
    }, 30000);

    doc.on('end', () => {
      try {
        clearTimeout(timeout);
        const all = Buffer.concat(buffers);
        console.log("PDF generation completed successfully, buffer size:", all.length);
        resolve(all);
      } catch (error) {
        clearTimeout(timeout);
        console.error("Error concatenating PDF buffers:", error);
        reject(error);
      }
    });
    
    doc.on('error', (error) => {
      clearTimeout(timeout);
      console.error("PDF document error:", error);
      reject(error);
    });
  });
}

function drawTable(doc: any, headers: string[], colWidths: number[], rows: string[][]) {
  const startX = 50;
  const rowHeight = 25;
  let y = doc.y;

  // Draw header
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
     .fillAndStroke("#f5f5f5", "#cccccc");
  
  doc.fillColor("#333").fontSize(11);
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 5, y + 7, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  
  y += rowHeight;
  doc.fillColor("#000");

  // Draw data rows
  rows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
       .fillAndStroke(isEven ? "#fcfcfc" : "#f8f8f8", "#e0e0e0");
    
    doc.fillColor("#111").fontSize(10);
    x = startX;
    row.forEach((cell, i) => {
      doc.text(cell || '', x + 5, y + 7, { 
        width: colWidths[i] - 10,
        height: rowHeight - 10,
        ellipsis: true
      });
      x += colWidths[i];
    });
    
    y += rowHeight;
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }
  });

  doc.y = y + 10;
}