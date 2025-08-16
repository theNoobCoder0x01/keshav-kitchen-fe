import ExcelJS from "exceljs";
import type { CombinedIngredient } from "@/types/menus";

import type { MenuReportData } from "@/types";

// Helper function to safely get text with Unicode support
function encodeTextForExport(text: string): string {
  try {
    // Ensure proper UTF-8 encoding for Excel/CSV
    return decodeURIComponent(encodeURIComponent(text));
  } catch (error) {
    console.warn("Text encoding failed, using original text:", error);
    return text;
  }
}

export async function createMenuReportWorkbook(
  data: MenuReportData,
  type: string,
  date: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Determine report title
  let reportTitle: string;
  if (type === "ingredients") {
    reportTitle = "Combined Ingredients Report";
  } else if (type === "combined-meals") {
    reportTitle = "Combined Meal Types Report";
  } else {
    reportTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }

  const sheet = workbook.addWorksheet(encodeTextForExport(reportTitle));

  // Add title and metadata
  sheet.mergeCells("A1:F1");
  sheet.getCell("A1").value = encodeTextForExport(reportTitle);
  sheet.getCell("A1").font = { size: 16, bold: true };
  sheet.getCell("A1").alignment = { horizontal: "center" };

  sheet.mergeCells("A2:F2");
  sheet.getCell("A2").value = `Date: ${new Date(date).toLocaleDateString()}`;
  sheet.getCell("A2").font = { size: 12 };
  sheet.getCell("A2").alignment = { horizontal: "center" };

  let currentRow = 4;

  if (type === "ingredients") {
    // Combined Ingredients Report
    if (data.summary) {
      sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
        "Ingredients Summary",
      );
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.getCell(`A${currentRow}`).value =
        encodeTextForExport("Total Ingredients:");
      sheet.getCell(`B${currentRow}`).value = data.summary.totalIngredients;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
        "Unique Ingredients:",
      );
      sheet.getCell(`B${currentRow}`).value = data.summary.uniqueIngredients;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value =
        encodeTextForExport("Total Cost:");
      sheet.getCell(`B${currentRow}`).value =
        `₹${data.summary.totalCost.toFixed(2)}`;
      currentRow++;

      if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
        sheet.getCell(`A${currentRow}`).value =
          encodeTextForExport("Meal Types:");
        sheet.getCell(`B${currentRow}`).value = encodeTextForExport(
          data.selectedMealTypes.join(", "),
        );
        currentRow++;
      }

      if (data.summary.mealTypesCombined) {
        sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
          "Meal Types Combined: Yes",
        );
        currentRow++;
      }

      if (data.summary.kitchensCombined) {
        sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
          "Kitchens Combined: Yes",
        );
        currentRow++;
      }

      currentRow += 2;
    }

    // Combined Ingredients Table
    sheet.addRow([
      encodeTextForExport("Ingredient"),
      encodeTextForExport("Total Quantity"),
      encodeTextForExport("Unit"),
      encodeTextForExport("Total Cost"),
      encodeTextForExport("Source Count"),
      encodeTextForExport("Source Details"),
    ]);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    }

    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      data.combinedIngredients.forEach((ingredient) => {
        const sourceDetails = ingredient.sources
          .map((s) =>
            encodeTextForExport(
              `${s.kitchen} - ${s.mealType} - ${s.recipe} (${s.quantity} for ${s.servings} servings)`,
            ),
          )
          .join("; ");

        sheet.addRow([
          encodeTextForExport(ingredient.name),
          Math.round(ingredient.totalQuantity * 100) / 100,
          encodeTextForExport(ingredient.unit),
          `₹${Math.round(ingredient.totalCost * 100) / 100}`,
          ingredient.sources.length,
          sourceDetails,
        ]);
      });
    } else {
      sheet.addRow([
        encodeTextForExport("No ingredients found for the selected criteria"),
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  } else if (type === "combined-meals") {
    // Combined Meal Types Report
    sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
      "Combined Meals Summary",
    );
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    sheet.getCell(`A${currentRow}`).value = encodeTextForExport("Total Meals:");
    sheet.getCell(`B${currentRow}`).value = data.totalMeals || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Total Servings:");
    sheet.getCell(`B${currentRow}`).value = data.totalQuantity || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Breakfast Count:");
    sheet.getCell(`B${currentRow}`).value = data.breakfastCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = encodeTextForExport("Lunch Count:");
    sheet.getCell(`B${currentRow}`).value = data.lunchCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Dinner Count:");
    sheet.getCell(`B${currentRow}`).value = data.dinnerCount || 0;
    currentRow++;

    if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
      sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
        "Selected Meal Types:",
      );
      sheet.getCell(`B${currentRow}`).value = encodeTextForExport(
        data.selectedMealTypes.join(", "),
      );
      currentRow++;
    }

    currentRow += 2;

    // Combined Ingredients Section
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
        "Combined Ingredients",
      );
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.addRow([
        encodeTextForExport("Ingredient"),
        encodeTextForExport("Total Quantity"),
        encodeTextForExport("Unit"),
        encodeTextForExport("Total Cost"),
        encodeTextForExport("Sources"),
      ]);
      const ingredientsHeaderRow = sheet.lastRow;
      if (ingredientsHeaderRow) {
        ingredientsHeaderRow.font = { bold: true };
        ingredientsHeaderRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD0D0FF" },
        };
      }

      data.combinedIngredients.forEach((ingredient) => {
        sheet.addRow([
          encodeTextForExport(ingredient.name),
          Math.round(ingredient.totalQuantity * 100) / 100,
          encodeTextForExport(ingredient.unit),
          `₹${Math.round(ingredient.totalCost * 100) / 100}`,
          ingredient.sources.length,
        ]);
      });

      currentRow = sheet.lastRow!.number + 3;
    }

    // Detailed Menus Table
    if (data.menus && data.menus.length > 0) {
      sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
        "Detailed Menu Items",
      );
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.addRow([
        encodeTextForExport("Kitchen"),
        encodeTextForExport("Recipe"),
        encodeTextForExport("Meal Type"),
        encodeTextForExport("Servings"),
        encodeTextForExport("Status"),
        encodeTextForExport("Notes"),
      ]);
      const menusHeaderRow = sheet.lastRow;
      if (menusHeaderRow) {
        menusHeaderRow.font = { bold: true };
        menusHeaderRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
      }

      data.menus.forEach((menu) => {
        sheet.addRow([
          encodeTextForExport(menu.kitchen?.name || "N/A"),
          encodeTextForExport(menu.recipe?.name || "N/A"),
          encodeTextForExport(menu.mealType || "N/A"),
          menu.servings || 0,
          encodeTextForExport(menu.status || "N/A"),
          encodeTextForExport(menu.notes || ""),
        ]);
      });
    }
  } else if (type === "summary") {
    // Summary report layout
    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Daily Summary");
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    sheet.getCell(`A${currentRow}`).value = encodeTextForExport("Total Meals:");
    sheet.getCell(`B${currentRow}`).value = data.totalMeals || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Breakfast Count:");
    sheet.getCell(`B${currentRow}`).value = data.breakfastCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = encodeTextForExport("Lunch Count:");
    sheet.getCell(`B${currentRow}`).value = data.lunchCount || 0;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value =
      encodeTextForExport("Dinner Count:");
    sheet.getCell(`B${currentRow}`).value = data.dinnerCount || 0;
    currentRow += 2;

    // Detailed breakdown
    sheet.addRow([
      encodeTextForExport("Kitchen"),
      encodeTextForExport("Recipe"),
      encodeTextForExport("Meal Type"),
      encodeTextForExport("Servings"),
      encodeTextForExport("Status"),
      encodeTextForExport("Notes"),
    ]);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    }

    if (data.menus && data.menus.length > 0) {
      data.menus.forEach((menu) => {
        sheet.addRow([
          encodeTextForExport(menu.kitchen?.name || "N/A"),
          encodeTextForExport(menu.recipe?.name || "N/A"),
          encodeTextForExport(menu.mealType || "N/A"),
          menu.servings || 0,
          encodeTextForExport(menu.status || "N/A"),
          encodeTextForExport(menu.notes || ""),
        ]);
      });
    } else {
      sheet.addRow([
        encodeTextForExport("No data available for this date"),
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  } else {
    // Meal-specific report
    sheet.getCell(`A${currentRow}`).value = encodeTextForExport(
      `Total Servings: ${data.totalQuantity || 0}`,
    );
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Header row for meal details
    sheet.addRow([
      encodeTextForExport("Kitchen"),
      encodeTextForExport("Recipe"),
      encodeTextForExport("Servings"),
      encodeTextForExport("Ghan Factor"),
      encodeTextForExport("Status"),
      encodeTextForExport("Ingredients"),
    ]);
    const headerRow = sheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    }

    if (data.menus && data.menus.length > 0) {
      data.menus.forEach((menu) => {
        const ingredients =
          menu.recipe?.ingredients
            ?.map((ing) =>
              encodeTextForExport(
                `${ing.ingredient?.name || "N/A"} (${ing.quantity} ${ing.ingredient?.unit || ""})`,
              ),
            )
            .join(", ") || "N/A";

        sheet.addRow([
          encodeTextForExport(menu.kitchen?.name || "N/A"),
          encodeTextForExport(menu.recipe?.name || "N/A"),
          menu.servings || 0,
          menu.ghanFactor || 1.0,
          encodeTextForExport(menu.status || "N/A"),
          ingredients,
        ]);
      });
    } else {
      sheet.addRow([
        encodeTextForExport("No data available for this date"),
        "",
        "",
        "",
        "",
        "",
      ]);
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
  if (type === "ingredients") {
    reportTitle = "Combined Ingredients Report";
  } else if (type === "combined-meals") {
    reportTitle = "Combined Meal Types Report";
  } else {
    reportTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }

  if (type === "ingredients") {
    rows = [
      [encodeTextForExport(reportTitle)],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
    ];

    if (data.summary) {
      rows.push(
        [encodeTextForExport("Ingredients Summary")],
        [
          encodeTextForExport("Total Ingredients"),
          data.summary.totalIngredients.toString(),
        ],
        [
          encodeTextForExport("Unique Ingredients"),
          data.summary.uniqueIngredients.toString(),
        ],
        [
          encodeTextForExport("Total Cost"),
          `₹${data.summary.totalCost.toFixed(2)}`,
        ],
      );

      if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
        rows.push([
          encodeTextForExport("Meal Types"),
          encodeTextForExport(data.selectedMealTypes.join(", ")),
        ]);
      }

      if (data.summary.mealTypesCombined) {
        rows.push([
          encodeTextForExport("Meal Types Combined"),
          encodeTextForExport("Yes"),
        ]);
      }

      if (data.summary.kitchensCombined) {
        rows.push([
          encodeTextForExport("Kitchens Combined"),
          encodeTextForExport("Yes"),
        ]);
      }

      rows.push([]);
    }

    rows.push([
      encodeTextForExport("Ingredient"),
      encodeTextForExport("Total Quantity"),
      encodeTextForExport("Unit"),
      encodeTextForExport("Total Cost"),
      encodeTextForExport("Source Count"),
      encodeTextForExport("Source Details"),
    ]);

    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      rows.push(
        ...data.combinedIngredients.map((ingredient) => {
          const sourceDetails = ingredient.sources
            .map((s) =>
              encodeTextForExport(
                `${s.kitchen} - ${s.mealType} - ${s.recipe} (${s.quantity} for ${s.servings} servings)`,
              ),
            )
            .join("; ");

          return [
            encodeTextForExport(ingredient.name),
            (Math.round(ingredient.totalQuantity * 100) / 100).toString(),
            encodeTextForExport(ingredient.unit),
            `₹${Math.round(ingredient.totalCost * 100) / 100}`,
            ingredient.sources.length.toString(),
            sourceDetails,
          ];
        }),
      );
    } else {
      rows.push([
        encodeTextForExport("No ingredients found for the selected criteria"),
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  } else if (type === "combined-meals") {
    rows = [
      [encodeTextForExport(reportTitle)],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
      [encodeTextForExport("Combined Meals Summary")],
      [encodeTextForExport("Total Meals"), (data.totalMeals || 0).toString()],
      [
        encodeTextForExport("Total Servings"),
        (data.totalQuantity || 0).toString(),
      ],
      [
        encodeTextForExport("Breakfast Count"),
        (data.breakfastCount || 0).toString(),
      ],
      [encodeTextForExport("Lunch Count"), (data.lunchCount || 0).toString()],
      [encodeTextForExport("Dinner Count"), (data.dinnerCount || 0).toString()],
    ];

    if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
      rows.push([
        encodeTextForExport("Selected Meal Types"),
        encodeTextForExport(data.selectedMealTypes.join(", ")),
      ]);
    }

    rows.push([]);

    // Combined Ingredients Section
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      rows.push(
        [encodeTextForExport("Combined Ingredients")],
        [
          encodeTextForExport("Ingredient"),
          encodeTextForExport("Total Quantity"),
          encodeTextForExport("Unit"),
          encodeTextForExport("Total Cost"),
          encodeTextForExport("Sources"),
        ],
        ...data.combinedIngredients.map((ingredient) => [
          encodeTextForExport(ingredient.name),
          (Math.round(ingredient.totalQuantity * 100) / 100).toString(),
          encodeTextForExport(ingredient.unit),
          `₹${Math.round(ingredient.totalCost * 100) / 100}`,
          ingredient.sources.length.toString(),
        ]),
        [],
      );
    }

    // Detailed Menus
    if (data.menus && data.menus.length > 0) {
      rows.push(
        [encodeTextForExport("Detailed Menu Items")],
        [
          encodeTextForExport("Kitchen"),
          encodeTextForExport("Recipe"),
          encodeTextForExport("Meal Type"),
          encodeTextForExport("Servings"),
          encodeTextForExport("Status"),
          encodeTextForExport("Notes"),
        ],
        ...data.menus.map((menu) => [
          encodeTextForExport(menu.kitchen?.name || "N/A"),
          encodeTextForExport(menu.recipe?.name || "N/A"),
          encodeTextForExport(menu.mealType || "N/A"),
          (menu.servings || 0).toString(),
          encodeTextForExport(menu.status || "N/A"),
          encodeTextForExport(menu.notes || ""),
        ]),
      );
    } else {
      rows.push(
        [encodeTextForExport("Detailed Menu Items")],
        [
          encodeTextForExport("Kitchen"),
          encodeTextForExport("Recipe"),
          encodeTextForExport("Meal Type"),
          encodeTextForExport("Servings"),
          encodeTextForExport("Status"),
          encodeTextForExport("Notes"),
        ],
        [encodeTextForExport("No data available"), "", "", "", "", ""],
      );
    }
  } else if (type === "summary") {
    rows = [
      [encodeTextForExport(reportTitle)],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [],
      [encodeTextForExport("Summary")],
      [encodeTextForExport("Total Meals"), (data.totalMeals || 0).toString()],
      [
        encodeTextForExport("Breakfast Count"),
        (data.breakfastCount || 0).toString(),
      ],
      [encodeTextForExport("Lunch Count"), (data.lunchCount || 0).toString()],
      [encodeTextForExport("Dinner Count"), (data.dinnerCount || 0).toString()],
      [],
      [
        encodeTextForExport("Kitchen"),
        encodeTextForExport("Recipe"),
        encodeTextForExport("Meal Type"),
        encodeTextForExport("Servings"),
        encodeTextForExport("Status"),
        encodeTextForExport("Notes"),
      ],
    ];

    if (data.menus && data.menus.length > 0) {
      rows.push(
        ...data.menus.map((menu) => [
          encodeTextForExport(menu.kitchen?.name || "N/A"),
          encodeTextForExport(menu.recipe?.name || "N/A"),
          encodeTextForExport(menu.mealType || "N/A"),
          (menu.servings || 0).toString(),
          encodeTextForExport(menu.status || "N/A"),
          encodeTextForExport(menu.notes || ""),
        ]),
      );
    } else {
      rows.push([
        encodeTextForExport("No data available for this date"),
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  } else {
    rows = [
      [encodeTextForExport(reportTitle)],
      [`Date: ${new Date(date).toLocaleDateString()}`],
      [encodeTextForExport(`Total Servings: ${data.totalQuantity || 0}`)],
      [],
      [
        encodeTextForExport("Kitchen"),
        encodeTextForExport("Recipe"),
        encodeTextForExport("Servings"),
        encodeTextForExport("Ghan Factor"),
        encodeTextForExport("Status"),
        encodeTextForExport("Ingredients"),
      ],
    ];

    if (data.menus && data.menus.length > 0) {
      rows.push(
        ...data.menus.map((menu) => {
          const ingredients =
            menu.recipe?.ingredients
              ?.map((ing) =>
                encodeTextForExport(
                  `${ing.ingredient?.name || "N/A"} (${ing.quantity} ${ing.ingredient?.unit || ""})`,
                ),
              )
              .join("; ") || "N/A";

          return [
            encodeTextForExport(menu.kitchen?.name || "N/A"),
            encodeTextForExport(menu.recipe?.name || "N/A"),
            (menu.servings || 0).toString(),
            (menu.ghanFactor || 1.0).toString(),
            encodeTextForExport(menu.status || "N/A"),
            ingredients,
          ];
        }),
      );
    } else {
      rows.push([
        encodeTextForExport("No data available for this date"),
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  const csv = await writeToString(rows, {
    headers: false,
    quoteColumns: true,
    writeBOM: true,
  });

  return Buffer.from(csv, "utf8");
}
