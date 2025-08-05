import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

interface ImportedRecipe {
  name: string;
  category: string;
  subcategory: string;
  description?: string;
  instructions?: string;
  servings?: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.",
        },
        { status: 400 },
      );
    }

    // Read the file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return NextResponse.json(
        {
          error: "Excel file must have at least a header row and one data row",
        },
        { status: 400 },
      );
    }

    // Extract headers
    const headers = data[0] as string[];
    const requiredHeaders = ["Recipe Name", "Category", "Subcategory"];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required headers: ${missingHeaders.join(", ")}`,
          expectedHeaders: [
            "Recipe Name",
            "Category",
            "Subcategory",
            "Description (optional)",
            "Instructions (optional)",
            "Servings (optional)",
            "Ingredients (comma-separated)",
            "Quantities (comma-separated)",
            "Units (comma-separated)",
            "Cost Per Unit (comma-separated, optional)",
          ],
        },
        { status: 400 },
      );
    }

    // Process data rows
    const recipes: ImportedRecipe[] = [];
    const errors: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      try {
        const recipeName = String(
          row[headers.indexOf("Recipe Name")] || "",
        ).trim();
        const category = String(row[headers.indexOf("Category")] || "").trim();
        const subcategory = String(
          row[headers.indexOf("Subcategory")] || "",
        ).trim();
        const description = String(
          row[headers.indexOf("Description (optional)")] || "",
        ).trim();
        const instructions = String(
          row[headers.indexOf("Instructions (optional)")] || "",
        ).trim();
        const servings = row[headers.indexOf("Servings (optional)")]
          ? parseInt(String(row[headers.indexOf("Servings (optional)")]))
          : undefined;

        // Parse ingredients
        const ingredientsStr = String(
          row[headers.indexOf("Ingredients (comma-separated)")] || "",
        ).trim();
        const quantitiesStr = String(
          row[headers.indexOf("Quantities (comma-separated)")] || "",
        ).trim();
        const unitsStr = String(
          row[headers.indexOf("Units (comma-separated)")] || "",
        ).trim();
        const costPerUnitStr = String(
          row[headers.indexOf("Cost Per Unit (comma-separated, optional)")] ||
            "",
        ).trim();

        if (!recipeName || !category || !subcategory) {
          errors.push(
            `Row ${i + 1}: Missing required fields (Recipe Name, Category, or Subcategory)`,
          );
          continue;
        }

        // Parse ingredients
        const ingredientNames = ingredientsStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        const quantities = quantitiesStr
          .split(",")
          .map((s) => parseFloat(s.trim()) || 0);
        const units = unitsStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        const costPerUnits = costPerUnitStr.split(",").map((s) => {
          const val = parseFloat(s.trim());
          return isNaN(val) ? undefined : val;
        });

        if (ingredientNames.length === 0) {
          errors.push(`Row ${i + 1}: No ingredients provided`);
          continue;
        }

        if (
          ingredientNames.length !== quantities.length ||
          ingredientNames.length !== units.length
        ) {
          errors.push(
            `Row ${i + 1}: Mismatch in ingredients, quantities, and units count`,
          );
          continue;
        }

        const ingredients = ingredientNames.map((name, index) => ({
          name,
          quantity: quantities[index] || 0,
          unit: units[index] || "pcs",
          costPerUnit: costPerUnits[index],
        }));

        recipes.push({
          name: recipeName,
          category,
          subcategory,
          description: description || undefined,
          instructions: instructions || undefined,
          servings,
          ingredients,
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: Error processing row - ${error}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation errors found",
          errors,
          validRecipes: recipes.length,
        },
        { status: 400 },
      );
    }

    // Import recipes to database
    const importedRecipes = [];
    const importErrors = [];

    for (const recipe of recipes) {
      try {
        const createdRecipe = await prisma.recipe.create({
          data: {
            name: recipe.name,
            category: recipe.category,
            subcategory: recipe.subcategory,
            description: recipe.description,
            instructions: recipe.instructions,
            servings: recipe.servings,
            userId: session.user.id,
            ingredients: {
              create: recipe.ingredients.map((ingredient) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
              })),
            },
          },
          include: {
            ingredients: true,
          },
        });
        importedRecipes.push(createdRecipe);
      } catch (error) {
        importErrors.push(`Failed to import "${recipe.name}": ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: importedRecipes.length,
      totalRecipes: recipes.length,
      errors: importErrors,
      importedRecipes: importedRecipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        subcategory: recipe.subcategory,
        ingredientsCount: recipe.ingredients.length,
      })),
    });
  } catch (error) {
    console.error("Import recipes API error:", error);
    return NextResponse.json(
      { error: "Failed to import recipes" },
      { status: 500 },
    );
  }
}
