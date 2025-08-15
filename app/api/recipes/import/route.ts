import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  instructions: string;
  servings: number;
}

export const excelToJson = (fileBuffer: ArrayBuffer, userId: string) => {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  // Parse the recipes sheet
  const recipesSheet = XLSX.utils.sheet_to_json<Recipe>(
    workbook.Sheets["recipes"],
    { defval: "" }
  );

  const result = recipesSheet.map((recipe) => {
    // Find the ingredient sheet for this recipe
    const sheetName = recipe.id;

    const ingredients: Ingredient[] = workbook.SheetNames.includes(sheetName)
      ? XLSX.utils.sheet_to_json<Ingredient>(workbook.Sheets[sheetName], {
          defval: "",
        })
      : [];

    return {
      name: recipe.name,
      category: recipe.category,
      subcategory: recipe.subcategory,
      description: recipe.description,
      instructions: recipe.instructions,
      servings: recipe.servings,
      userId,
      ingredients: {
        create: ingredients.map((ingredient) => {
          console.log("Ingredient:", ingredient);

          return {
            name: ingredient.name,
            quantity: parseFloat(ingredient.quantity?.toString() || "0"),
            unit: ingredient.unit,
            costPerUnit: parseFloat(ingredient.costPerUnit?.toString() || "0"),
          };
        }),
      },
    };
  });

  return result;
};

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
        { status: 400 }
      );
    }

    // Read the file
    const buffer = await file.arrayBuffer();
    const recipes = excelToJson(buffer, "");
    if (!recipes) {
      return NextResponse.json(
        {
          error: "Excel file must have at least a header row and one data row",
          sheetData: recipes,
        },
        { status: 400 }
      );
    }

    // Import recipes to database
    const importedRecipes = [];
    const importErrors = [];

    for (const recipe of recipes) {
      try {
        const userId = session?.user?.id ?? "";
        if (userId.length === 0) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        const createdRecipe = await prisma.recipe.create({
          data: {
            name: recipe.name,
            category: recipe.category,
            subcategory: recipe.subcategory,
            description: recipe.description,
            instructions: recipe.instructions,
            servings: recipe.servings,
            userId: userId,
            ingredients: recipe.ingredients,
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
      { status: 500 }
    );
  }
}
