import ExcelJS from "exceljs";

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
      title: string;
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
  data.menus.forEach((menu) => {
    if (type === 'summary') {
      sheet.addRow([
        menu.kitchen.name,
        menu.recipe.title,
        menu.mealType,
        menu.servings,
        menu.status,
        menu.notes || '',
      ]);
    } else {
      const ingredients = menu.recipe.ingredients
        ?.map(ing => `${ing.ingredient.name} (${ing.quantity} ${ing.ingredient.unit})`)
        .join(', ') || 'N/A';
      
      sheet.addRow([
        menu.kitchen.name,
        menu.recipe.title,
        menu.servings,
        menu.ghanFactor,
        menu.status,
        ingredients,
      ]);
    }
  });

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
        menu.recipe.title,
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
          menu.recipe.title,
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
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {});

  // Header
  doc
    .fontSize(18)
    .text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, {
      align: "center",
      underline: true,
    });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Date: ${new Date(date).toLocaleDateString()}`, { align: "center" });
  doc.moveDown(1);

  if (type === 'summary') {
    // Summary statistics
    doc.fontSize(14).text('Daily Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Total Meals: ${data.totalMeals || 0}`);
    doc.text(`Breakfast Count: ${data.breakfastCount || 0}`);
    doc.text(`Lunch Count: ${data.lunchCount || 0}`);
    doc.text(`Dinner Count: ${data.dinnerCount || 0}`);
    doc.moveDown(1);

    // Table for detailed breakdown
    const headers = ['Kitchen', 'Recipe', 'Type', 'Servings', 'Status'];
    const colWidths = [100, 150, 80, 70, 80];
    drawTable(doc, headers, colWidths, data.menus.map(menu => [
      menu.kitchen.name,
      menu.recipe.title,
      menu.mealType,
      menu.servings.toString(),
      menu.status,
    ]));
  } else {
    // Meal-specific report
    doc.fontSize(12).text(`Total Servings: ${data.totalQuantity || 0}`, { align: 'left' });
    doc.moveDown(1);

    const headers = ['Kitchen', 'Recipe', 'Servings', 'Status'];
    const colWidths = [120, 200, 80, 80];
    drawTable(doc, headers, colWidths, data.menus.map(menu => [
      menu.kitchen.name,
      menu.recipe.title,
      menu.servings.toString(),
      menu.status,
    ]));
  }

  // Footer with page number
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(10)
      .fillColor("#888")
      .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, {
        align: "center",
      });
  }

  doc.end();
  return await new Promise<Buffer>((resolve) => {
    const all = Buffer.concat(buffers);
    resolve(all);
  });
}

function drawTable(doc: any, headers: string[], colWidths: number[], rows: string[][]) {
  const startX = 50;
  const rowHeight = 25;
  let y = doc.y;

  // Draw header
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
     .fillAndStroke("#f5f5f5", "#cccccc");
  
  doc.fillColor("#333").fontSize(11).font("Helvetica-Bold");
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 5, y + 7, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  
  y += rowHeight;
  doc.font("Helvetica").fillColor("#000");

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