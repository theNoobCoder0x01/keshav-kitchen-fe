import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";
import * as XLSX from "xlsx";

// Interface for recipe data
interface RecipeExportData {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  servings?: number | null;
  category: string;
  subcategory?: string | null;
  ingredients: Array<{
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number | null;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  user?: {
    name?: string | null;
    email?: string;
  };
}

// Create Excel worksheet for a single recipe
export function createRecipeExcelWorksheet(
  recipe: RecipeExportData,
): XLSX.WorkSheet {
  const data: any[][] = [];

  // Recipe header information
  data.push(["RECIPE DETAILS"]);
  data.push(["Name", recipe.name]);
  data.push(["Category", recipe.category]);
  data.push(["Subcategory", recipe.subcategory || "N/A"]);
  data.push(["Servings", recipe.servings || "N/A"]);
  data.push(["Description", recipe.description || "N/A"]);
  data.push(["Created By", recipe.user?.name || "Unknown"]);
  data.push([
    "Created Date",
    recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : "N/A",
  ]);
  data.push([]); // Empty row

  // Ingredients section
  data.push(["INGREDIENTS"]);
  data.push([
    "Ingredient Name",
    "Quantity",
    "Unit",
    "Cost per Unit",
    "Total Cost",
  ]);

  let totalCost = 0;
  recipe.ingredients.forEach((ingredient) => {
    const itemCost = (ingredient.costPerUnit || 0) * ingredient.quantity;
    totalCost += itemCost;

    data.push([
      ingredient.name,
      ingredient.quantity,
      ingredient.unit,
      ingredient.costPerUnit ? `₹${ingredient.costPerUnit.toFixed(2)}` : "N/A",
      ingredient.costPerUnit ? `₹${itemCost.toFixed(2)}` : "N/A",
    ]);
  });

  // Total cost row
  data.push(["", "", "", "TOTAL COST:", `₹${totalCost.toFixed(2)}`]);
  data.push([]); // Empty row

  // Instructions section
  if (recipe.instructions) {
    data.push(["INSTRUCTIONS"]);
    const instructions = recipe.instructions
      .split("\n")
      .filter((line) => line.trim());
    instructions.forEach((instruction, index) => {
      data.push([`Step ${index + 1}`, instruction.trim()]);
    });
    data.push([]); // Empty row
  }

  // Cost analysis
  data.push(["COST ANALYSIS"]);
  data.push(["Total Recipe Cost", `₹${totalCost.toFixed(2)}`]);
  data.push([
    "Cost per Serving",
    recipe.servings ? `₹${(totalCost / recipe.servings).toFixed(2)}` : "N/A",
  ]);
  data.push(["Number of Ingredients", recipe.ingredients.length]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { width: 20 }, // Column A
    { width: 30 }, // Column B
    { width: 15 }, // Column C
    { width: 15 }, // Column D
    { width: 15 }, // Column E
  ];

  // Style headers (basic styling)
  const headerCells = ["A1", "A10", "A" + (data.length - 7)];
  headerCells.forEach((cell) => {
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true, sz: 14 },
        fill: { fgColor: { rgb: "E6E6FA" } },
      };
    }
  });

  return ws;
}

// Create Excel workbook with multiple recipes
export function createRecipesExcelWorkbook(
  recipes: RecipeExportData[],
): Buffer {
  const wb = XLSX.utils.book_new();

  // Create summary worksheet
  const summaryData: any[][] = [];
  summaryData.push(["RECIPES SUMMARY"]);
  summaryData.push(["Total Recipes", recipes.length]);
  summaryData.push(["Export Date", new Date().toLocaleDateString()]);
  summaryData.push([]); // Empty row

  summaryData.push([
    "Recipe Name",
    "Category",
    "Servings",
    "Ingredients Count",
    "Total Cost",
  ]);

  recipes.forEach((recipe) => {
    const totalCost = recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.costPerUnit || 0) * ing.quantity,
      0,
    );
    summaryData.push([
      recipe.name,
      recipe.category,
      recipe.servings || "N/A",
      recipe.ingredients.length,
      `₹${totalCost.toFixed(2)}`,
    ]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [
    { width: 25 }, // Recipe Name
    { width: 15 }, // Category
    { width: 10 }, // Servings
    { width: 15 }, // Ingredients Count
    { width: 12 }, // Total Cost
  ];

  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Create individual recipe worksheets (limit to first 10 to avoid too many sheets)
  const maxRecipeSheets = Math.min(recipes.length, 10);
  for (let i = 0; i < maxRecipeSheets; i++) {
    const recipe = recipes[i];
    const ws = createRecipeExcelWorksheet(recipe);
    const sheetName = recipe.name.substring(0, 30).replace(/[^\w\s]/gi, ""); // Clean sheet name
    XLSX.utils.book_append_sheet(wb, ws, sheetName || `Recipe ${i + 1}`);
  }

  // If there are more than 10 recipes, add a note in summary
  if (recipes.length > 10) {
    summaryData.splice(3, 0, [
      "Note: Only first 10 recipes shown as individual sheets due to Excel limitations",
    ]);
  }

  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}

// Create CSV for a single recipe
export function createRecipeCSV(recipe: RecipeExportData): string {
  const lines: string[] = [];

  // Recipe header
  lines.push("RECIPE DETAILS");
  lines.push(`Name,"${encodeTextForPDF(recipe.name)}"`);
  lines.push(`Category,"${recipe.category}"`);
  lines.push(`Subcategory,"${recipe.subcategory || "N/A"}"`);
  lines.push(`Servings,${recipe.servings || "N/A"}`);
  lines.push(`Description,"${recipe.description || "N/A"}"`);
  lines.push(`Created By,"${recipe.user?.name || "Unknown"}"`);
  lines.push(
    `Created Date,"${recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : "N/A"}"`,
  );
  lines.push(""); // Empty line

  // Ingredients
  lines.push("INGREDIENTS");
  lines.push("Ingredient Name,Quantity,Unit,Cost per Unit,Total Cost");

  let totalCost = 0;
  recipe.ingredients.forEach((ingredient) => {
    const itemCost = (ingredient.costPerUnit || 0) * ingredient.quantity;
    totalCost += itemCost;

    lines.push(
      [
        `"${encodeTextForPDF(ingredient.name)}"`,
        ingredient.quantity,
        `"${ingredient.unit}"`,
        ingredient.costPerUnit
          ? `₹${ingredient.costPerUnit.toFixed(2)}`
          : "N/A",
        ingredient.costPerUnit ? `₹${itemCost.toFixed(2)}` : "N/A",
      ].join(","),
    );
  });

  lines.push(`"","","",TOTAL COST,₹${totalCost.toFixed(2)}`);
  lines.push(""); // Empty line

  // Instructions
  if (recipe.instructions) {
    lines.push("INSTRUCTIONS");
    const instructions = recipe.instructions
      .split("\n")
      .filter((line) => line.trim());
    instructions.forEach((instruction, index) => {
      lines.push(`Step ${index + 1},"${encodeTextForPDF(instruction.trim())}"`);
    });
    lines.push(""); // Empty line
  }

  // Cost analysis
  lines.push("COST ANALYSIS");
  lines.push(`Total Recipe Cost,₹${totalCost.toFixed(2)}`);
  lines.push(
    `Cost per Serving,${recipe.servings ? `₹${(totalCost / recipe.servings).toFixed(2)}` : "N/A"}`,
  );
  lines.push(`Number of Ingredients,${recipe.ingredients.length}`);

  return lines.join("\n");
}

// Create CSV for multiple recipes
export function createRecipesCSV(recipes: RecipeExportData[]): string {
  const lines: string[] = [];

  // Summary header
  lines.push("RECIPES EXPORT SUMMARY");
  lines.push(`Total Recipes,${recipes.length}`);
  lines.push(`Export Date,"${new Date().toLocaleDateString()}"`);
  lines.push(""); // Empty line

  // Recipes summary table
  lines.push(
    "Recipe Name,Category,Subcategory,Servings,Ingredients Count,Total Cost,Cost per Serving",
  );

  recipes.forEach((recipe) => {
    const totalCost = recipe.ingredients.reduce(
      (sum, ing) => sum + (ing.costPerUnit || 0) * ing.quantity,
      0,
    );
    const costPerServing = recipe.servings
      ? `₹${(totalCost / recipe.servings).toFixed(2)}`
      : "N/A";

    lines.push(
      [
        `"${encodeTextForPDF(recipe.name)}"`,
        `"${recipe.category}"`,
        `"${recipe.subcategory || "N/A"}"`,
        recipe.servings || "N/A",
        recipe.ingredients.length,
        `₹${totalCost.toFixed(2)}`,
        costPerServing,
      ].join(","),
    );
  });

  lines.push(""); // Empty line
  lines.push(""); // Empty line

  // Individual recipe details
  recipes.forEach((recipe, index) => {
    if (index > 0) {
      lines.push(""); // Separator between recipes
      lines.push("=".repeat(80));
      lines.push(""); // Empty line
    }

    lines.push(
      `RECIPE ${index + 1}: ${encodeTextForPDF(recipe.name).toUpperCase()}`,
    );
    lines.push(""); // Empty line

    // Recipe details
    const recipeCSV = createRecipeCSV(recipe);
    lines.push(recipeCSV);
  });

  return lines.join("\n");
}

// Helper function to extract unique recipes from menus
export function extractUniqueRecipes(menus: any[]): RecipeExportData[] {
  const uniqueRecipes = new Map<string, RecipeExportData>();

  menus.forEach((menu, index) => {
    if (menu.recipe && !uniqueRecipes.has(menu.recipe.id || menu.recipeId)) {
      const recipe: RecipeExportData = {
        id: menu.recipe.id || menu.recipeId,
        name: menu.recipe.name,
        description: menu.recipe.description,
        instructions: menu.recipe.instructions,
        servings: menu.servings, // Use menu servings as it might be adjusted
        category: menu.recipe.category || "Unknown",
        subcategory: menu.recipe.subcategory,
        ingredients: menu.ingredients || menu.recipe.ingredients || [],
        createdAt: menu.recipe.createdAt,
        updatedAt: menu.recipe.updatedAt,
        user: menu.recipe.user,
      };

      uniqueRecipes.set(recipe.id, recipe);
    }
  });

  return Array.from(uniqueRecipes.values());
}
