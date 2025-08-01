import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: "Invalid file type. Please upload an Excel file (.xlsx or .xls)" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ error: "No worksheet found in the Excel file" }, { status: 400 });
    }

    const recipes = [];
    const errors = [];
    let rowNumber = 2; // Start from row 2 (assuming row 1 is header)

    // Process each row
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row

      try {
        const recipeName = row.getCell(1).value?.toString()?.trim();
        const category = row.getCell(2).value?.toString()?.trim();
        const subcategory = row.getCell(3).value?.toString()?.trim();
        const description = row.getCell(4).value?.toString()?.trim();
        const instructions = row.getCell(5).value?.toString()?.trim();
        const servings = row.getCell(6).value;
        const ingredientsData = row.getCell(7).value?.toString()?.trim();

        // Validate required fields
        if (!recipeName) {
          errors.push(`Row ${rowNumber}: Recipe name is required`);
          rowNumber++;
          return;
        }

        if (!category) {
          errors.push(`Row ${rowNumber}: Category is required`);
          rowNumber++;
          return;
        }

        if (!subcategory) {
          errors.push(`Row ${rowNumber}: Subcategory is required`);
          rowNumber++;
          return;
        }

        // Parse ingredients
        let ingredients = [];
        if (ingredientsData) {
          try {
            // Try to parse as JSON first
            if (ingredientsData.startsWith('[') && ingredientsData.endsWith(']')) {
              ingredients = JSON.parse(ingredientsData);
            } else {
              // Parse as semicolon-separated values
              const ingredientStrings = ingredientsData.split(';').map(s => s.trim()).filter(s => s);
              ingredients = ingredientStrings.map(ingStr => {
                const parts = ingStr.split(',').map(p => p.trim());
                if (parts.length >= 3) {
                  return {
                    name: parts[0],
                    quantity: parseFloat(parts[1]) || 0,
                    unit: parts[2],
                    costPerUnit: parts[3] ? parseFloat(parts[3]) : undefined
                  };
                }
                return null;
              }).filter(Boolean);
            }
          } catch (error) {
            errors.push(`Row ${rowNumber}: Invalid ingredients format`);
            rowNumber++;
            return;
          }
        }

        recipes.push({
          name: recipeName,
          category,
          subcategory,
          description: description || null,
          instructions: instructions || null,
          servings: servings ? parseInt(servings.toString()) : null,
          ingredients,
          userId: session.user.id
        });

        rowNumber++;
      } catch (error) {
        errors.push(`Row ${rowNumber}: Error processing row`);
        rowNumber++;
      }
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: "Validation errors found", 
        details: errors 
      }, { status: 400 });
    }

    // Import recipes to database
    const importedRecipes = [];
    for (const recipeData of recipes) {
      try {
        const { ingredients, ...recipeWithoutIngredients } = recipeData;
        
        const recipe = await prisma.recipe.create({
          data: {
            ...recipeWithoutIngredients,
            ingredients: {
              create: ingredients.map((ing: any) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                costPerUnit: ing.costPerUnit
              }))
            }
          },
          include: {
            ingredients: true
          }
        });
        
        importedRecipes.push(recipe);
      } catch (error) {
        console.error(`Error importing recipe ${recipeData.name}:`, error);
        errors.push(`Failed to import recipe: ${recipeData.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedRecipes.length} recipes`,
      importedCount: importedRecipes.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Import recipes API error:", error);
    return NextResponse.json(
      { error: "Failed to import recipes" },
      { status: 500 }
    );
  }
}