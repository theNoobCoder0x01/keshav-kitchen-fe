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



