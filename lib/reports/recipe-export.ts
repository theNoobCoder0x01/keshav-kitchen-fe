import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";
import type { RecipeDetailData as RecipeExportData } from "@/types/recipes";

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
  lines.push(`Created By,"Unknown"`);
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
    const { extractStepsFromInstructions } = require("@/lib/utils/rich-text");
    const steps = extractStepsFromInstructions(recipe.instructions);
    steps.forEach((instruction: string, index: number) => {
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
      };

      uniqueRecipes.set(recipe.id, recipe);
    }
  });

  return Array.from(uniqueRecipes.values());
}
