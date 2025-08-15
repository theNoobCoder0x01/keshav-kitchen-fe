const xlsx = require("xlsx");
const fs = require("fs");

function preparePrismaExcel(inputPath, outputPath) {
  const wb = xlsx.readFile(inputPath);
  const sheetNames = wb.SheetNames;

  // First sheet is the recipe index
  const recipeIndexSheet = xlsx.utils.sheet_to_json(wb.Sheets[sheetNames[0]], { header: 1 });
  // Second column (index 1) contains recipe names (skip first row)
  const recipesList = recipeIndexSheet.slice(1).map(r => r[1]).filter(Boolean);
  const recipeIds = recipesList.map((_, i) => `r${i + 1}`);

  // Build recipes sheet
  const recipesSheetData = [
    ["id", "name", "description", "instructions", "servings", "category", "subcategory", "userId"],
    ...recipesList.map((name, i) => [
      recipeIds[i],
      name,
      "",
      "",
      "",
      "Liquid Sweet",
      "Milk Based",
      "user1" // placeholder
    ])
  ];

  // Add cleaned ingredient sheets
  const newWb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(recipesSheetData), "recipes");

  recipesList.forEach((recipeName, idx) => {
    if (!sheetNames.includes(recipeName)) return;
    const rawSheet = xlsx.utils.sheet_to_json(wb.Sheets[recipeName], { header: 1 });

    // Find header row with "ક્રમ"
    const headerRowIdx = rawSheet.findIndex(row => row.some(cell => String(cell || "").includes("ક્રમ")));
    if (headerRowIdx === -1) return;

    // Data starts 2 rows after header row
    const dataRows = rawSheet.slice(headerRowIdx + 2);
    const ingredients = dataRows
      .map(row => {
        const name = row[1];
        const quantityRaw = row[2];
        if (!name) return null;

        let quantity = null;
        let unit = null;

        if (typeof quantityRaw === "string") {
          const parts = quantityRaw.split(" ");
          if (!isNaN(parts[0])) {
            quantity = parseFloat(parts[0]);
            unit = parts.slice(1).join(" ") || null;
          } else {
            unit = quantityRaw;
          }
        } else if (typeof quantityRaw === "number") {
          quantity = quantityRaw;
        }

        return [name, quantity, unit, null]; // costPerUnit null
      })
      .filter(Boolean);

    const ingSheetData = [["name", "quantity", "unit", "costPerUnit"], ...ingredients];
    xlsx.utils.book_append_sheet(newWb, xlsx.utils.aoa_to_sheet(ingSheetData), recipeIds[idx]);
  });

  xlsx.writeFile(newWb, outputPath);
  console.log(`✅ Prisma-ready Excel created at: ${outputPath}`);
}

// Run the script
preparePrismaExcel("/Users/thenoob0x01/Downloads/liquid.xlsx", "/Users/thenoob0x01/Downloads/liquid_prisma_ready.xlsx");