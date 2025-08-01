import ExcelJS from "exceljs";

interface MenuReportData {
  type: string;
  date: Date;
  totalQuantity?: number;
  totalMeals?: number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  combinedIngredients?: Array<{
    name: string;
    totalQuantity: number;
    unit: string;
    totalCost: number;
    sources: Array<{
      kitchen: string;
      mealType: string;
      recipe: string;
      quantity: number;
      servings: number;
    }>;
  }>;
  summary?: {
    totalIngredients: number;
    totalCost: number;
    uniqueIngredients: number;
    mealTypesCombined: boolean;
    kitchensCombined: boolean;
  };
  selectedMealTypes?: string[];
  combineKitchens?: boolean;
  combineMealTypes?: boolean;
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
  
  // Determine report title
  let reportTitle: string;
  if (type === 'ingredients') {
    reportTitle = 'Combined Ingredients Report';
  } else if (type === 'combined-meals') {
    reportTitle = 'Combined Meal Types Report';
  } else {
    reportTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }
  
  const sheet = workbook.addWorksheet(reportTitle);

  // Add title and metadata
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = reportTitle;
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Date: ${new Date(date).toLocaleDateString()}`;
  sheet.getCell('A2').font = { size: 12 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  let currentRow = 4;

  if (type === 'ingredients') {
    // Combined Ingredients Report
    if (data.summary) {
      sheet.getCell(`A${currentRow}`).value = 'Ingredients Summary';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.getCell(`A${currentRow}`).value = 'Total Ingredients:';
      sheet.getCell(`B${currentRow}`).value = data.summary.totalIngredients;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = 'Unique Ingredients:';
      sheet.getCell(`B${currentRow}`).value = data.summary.uniqueIngredients;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = 'Total Cost:';
      sheet.getCell(`B${currentRow}`).value = `$${data.summary.totalCost.toFixed(2)}`;
      currentRow++;

      if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'Meal Types:';
        sheet.getCell(`B${currentRow}`).value = data.selectedMealTypes.join(', ');
        currentRow++;
      }

      if (data.summary.mealTypesCombined) {
        sheet.getCell(`A${currentRow}`).value = 'Meal Types Combined: Yes';
        currentRow++;
      }

      if (data.summary.kitchensCombined) {
        sheet.getCell(`A${currentRow}`).value = 'Kitchens Combined: Yes';
        currentRow++;
      }

      currentRow += 2;
    }

    // Combined Ingredients Table
    sheet.addRow(['Ingredient', 'Total Quantity', 'Unit', 'Total Cost', 'Source Count', 'Source Details']);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      data.combinedIngredients.forEach((ingredient) => {
        const sourceDetails = ingredient.sources
          .map(s => `${s.kitchen} - ${s.mealType} - ${s.recipe} (${s.quantity} for ${s.servings} servings)`)
          .join('; ');

        sheet.addRow([
          ingredient.name,
          Math.round(ingredient.totalQuantity * 100) / 100,
          ingredient.unit,
          `$${Math.round(ingredient.totalCost * 100) / 100}`,
          ingredient.sources.length,
          sourceDetails
        ]);
      });
    } else {
      sheet.addRow(['No ingredients found for the selected criteria', '', '', '', '', '']);
    }

  } else if (type === 'combined-meals') {
    // Combined Meal Types Report
    sheet.getCell(`A${currentRow}`).value = 'Combined Meals Summary';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    sheet.getCell(`A${currentRow}`).value = 'Total Meals:';
    sheet.getCell(`B${currentRow}`).value = data.totalMeals || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Total Servings:';
    sheet.getCell(`B${currentRow}`).value = data.totalQuantity || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Breakfast Count:';
    sheet.getCell(`B${currentRow}`).value = data.breakfastCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Lunch Count:';
    sheet.getCell(`B${currentRow}`).value = data.lunchCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Dinner Count:';
    sheet.getCell(`B${currentRow}`).value = data.dinnerCount || 0;
    currentRow++;

    if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Selected Meal Types:';
      sheet.getCell(`B${currentRow}`).value = data.selectedMealTypes.join(', ');
      currentRow++;
    }

    currentRow += 2;

    // Combined Ingredients Section
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Combined Ingredients';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.addRow(['Ingredient', 'Total Quantity', 'Unit', 'Total Cost', 'Sources']);
      const ingredientsHeaderRow = sheet.lastRow;
      if (ingredientsHeaderRow) {
        ingredientsHeaderRow.font = { bold: true };
        ingredientsHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0FF' }
        };
      }

      data.combinedIngredients.forEach((ingredient) => {
        sheet.addRow([
          ingredient.name,
          Math.round(ingredient.totalQuantity * 100) / 100,
          ingredient.unit,
          `$${Math.round(ingredient.totalCost * 100) / 100}`,
          ingredient.sources.length
        ]);
      });

      currentRow = sheet.lastRow!.number + 3;
    }

    // Detailed Menus Table
    if (data.menus && data.menus.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Detailed Menu Items';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.addRow(['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes']);
      const menusHeaderRow = sheet.lastRow;
      if (menusHeaderRow) {
        menusHeaderRow.font = { bold: true };
        menusHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      data.menus.forEach((menu) => {
        sheet.addRow([
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          menu.servings || 0,
          menu.status || 'N/A',
          menu.notes || '',
        ]);
      });
    }

  } else if (type === 'summary') {
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

    if (data.menus && data.menus.length > 0) {
      data.menus.forEach((menu) => {
        sheet.addRow([
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          menu.servings || 0,
          menu.status || 'N/A',
          menu.notes || '',
        ]);
      });
    } else {
      sheet.addRow(['No data available for this date', '', '', '', '', '']);
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

    if (data.menus && data.menus.length > 0) {
      data.menus.forEach((menu) => {
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
      });
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
  
  // Determine report title
  let reportTitle: string;
  if (type === 'ingredients') {
    reportTitle = 'Combined Ingredients Report';
  } else if (type === 'combined-meals') {
    reportTitle = 'Combined Meal Types Report';
  } else {
    reportTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }
  
  if (type === 'ingredients') {
    rows = [
      [reportTitle],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
    ];

    if (data.summary) {
      rows.push(
        ['Ingredients Summary'],
        ['Total Ingredients', data.summary.totalIngredients.toString()],
        ['Unique Ingredients', data.summary.uniqueIngredients.toString()],
        ['Total Cost', `$${data.summary.totalCost.toFixed(2)}`],
      );

      if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
        rows.push(['Meal Types', data.selectedMealTypes.join(', ')]);
      }

      if (data.summary.mealTypesCombined) {
        rows.push(['Meal Types Combined', 'Yes']);
      }

      if (data.summary.kitchensCombined) {
        rows.push(['Kitchens Combined', 'Yes']);
      }

      rows.push([]);
    }

    rows.push(['Ingredient', 'Total Quantity', 'Unit', 'Total Cost', 'Source Count', 'Source Details']);
    
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      rows.push(...data.combinedIngredients.map((ingredient) => {
        const sourceDetails = ingredient.sources
          .map(s => `${s.kitchen} - ${s.mealType} - ${s.recipe} (${s.quantity} for ${s.servings} servings)`)
          .join('; ');

        return [
          ingredient.name,
          (Math.round(ingredient.totalQuantity * 100) / 100).toString(),
          ingredient.unit,
          `$${(Math.round(ingredient.totalCost * 100) / 100)}`,
          ingredient.sources.length.toString(),
          sourceDetails
        ];
      }));
    } else {
      rows.push(['No ingredients found for the selected criteria', '', '', '', '', '']);
    }

  } else if (type === 'combined-meals') {
    rows = [
      [reportTitle],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
      ['Combined Meals Summary'],
      ['Total Meals', (data.totalMeals || 0).toString()],
      ['Total Servings', (data.totalQuantity || 0).toString()],
      ['Breakfast Count', (data.breakfastCount || 0).toString()],
      ['Lunch Count', (data.lunchCount || 0).toString()],
      ['Dinner Count', (data.dinnerCount || 0).toString()],
    ];

    if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
      rows.push(['Selected Meal Types', data.selectedMealTypes.join(', ')]);
    }

    rows.push([]);

    // Combined Ingredients Section
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      rows.push(
        ['Combined Ingredients'],
        ['Ingredient', 'Total Quantity', 'Unit', 'Total Cost', 'Sources'],
        ...data.combinedIngredients.map((ingredient) => [
          ingredient.name,
          (Math.round(ingredient.totalQuantity * 100) / 100).toString(),
          ingredient.unit,
          `$${(Math.round(ingredient.totalCost * 100) / 100)}`,
          ingredient.sources.length.toString()
        ]),
        []
      );
    }

    // Detailed Menus
    rows.push(
      ['Detailed Menu Items'],
      ['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes'],
      ...data.menus.map((menu) => [
        menu.kitchen.name,
        menu.recipe.name,
        menu.mealType,
        menu.servings.toString(),
        menu.status,
        menu.notes || '',
      ])
    );

  } else if (type === 'summary') {
    rows = [
      [reportTitle],
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
      [reportTitle],
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



