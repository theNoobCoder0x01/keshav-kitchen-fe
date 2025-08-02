import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMenuReportCSV,
  createMenuReportWorkbook,
} from "@/lib/reports/menu-export";
import {
  createReportPDFWithPuppeteer,
  generateReportFilename,
} from "@/lib/reports/puppeteer-export";
import {
  createRecipesCSV,
  createRecipesExcelWorkbook,
  extractUniqueRecipes,
} from "@/lib/reports/recipe-export";
import {
  combineIngredients,
  generateIngredientSummary,
} from "@/lib/utils/ingredient-combiner";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/reports/generate?type=TYPE&date=YYYY-MM-DD&format=xlsx|csv|pdf&kitchenIds=ID1,ID2&mealTypes=breakfast,lunch&combineMealTypes=true&combineKitchens=true
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "breakfast";
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const format = searchParams.get("format") || "pdf";
  const kitchenIdsParam = searchParams.get("kitchenIds");
  const mealTypesParam = searchParams.get("mealTypes");
  const combineMealTypes = searchParams.get("combineMealTypes") === "true";
  const combineKitchens = searchParams.get("combineKitchens") === "true";
  const attachRecipePrints = searchParams.get("attachRecipePrints") === "true";

  // Parse kitchen IDs and meal types
  const kitchenIds = kitchenIdsParam ? kitchenIdsParam.split(",") : [];
  const selectedMealTypes = mealTypesParam ? mealTypesParam.split(",") : [];

  console.log("Generate report params:", {
    type,
    date,
    format,
    kitchenIds,
    selectedMealTypes,
    combineMealTypes,
    combineKitchens,
    attachRecipePrints,
  });

  // Get kitchen data and menu data based on date, type, and filters
  let data;
  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where conditions
    const whereConditions: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Add kitchen filter if specified
    if (kitchenIds.length > 0) {
      whereConditions.kitchenId = { in: kitchenIds };
    }

    // Add meal type filter based on report type and selected meal types
    if (type === "ingredients" || type === "combined-meals") {
      // For ingredients and combined meals, use selectedMealTypes
      if (selectedMealTypes.length > 0) {
        whereConditions.mealType = {
          in: selectedMealTypes.map((mt) => mt.toUpperCase()),
        };
      }
    } else if (type !== "summary") {
      // For specific meal type reports
      whereConditions.mealType = type.toUpperCase();
    }

    // Fetch menus with ingredients
    const menus = await prisma.menu.findMany({
      where: whereConditions,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            instructions: true,
            servings: true,
            category: true,
            subcategory: true,
            createdAt: true,
            updatedAt: true,
            ingredients: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
                costPerUnit: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${menus.length} menus for the query`);

    if (type === "ingredients") {
      // Generate combined ingredients report
      const combinedIngredients = combineIngredients(menus as any, {
        combineMealTypes,
        combineKitchens,
        selectedMealTypes,
        selectedKitchens: kitchenIds,
      });

      const summary = generateIngredientSummary(combinedIngredients, {
        combineMealTypes,
        combineKitchens,
      });

      data = {
        type: "ingredients",
        date: targetDate,
        combinedIngredients,
        summary,
        menus: menus, // Keep original menus for context
        kitchenIds,
        selectedMealTypes,
        combineMealTypes,
        combineKitchens,
      };
    } else if (type === "combined-meals") {
      // Generate combined meal types report
      const combinedIngredients = combineIngredients(menus as any, {
        combineMealTypes: true, // Always combine meals for this report type
        combineKitchens,
        selectedMealTypes,
        selectedKitchens: kitchenIds,
      });

      data = {
        type: "combined-meals",
        date: targetDate,
        totalQuantity: menus.reduce(
          (sum, menu) => sum + (menu.servings || 0),
          0,
        ),
        totalMeals: menus.length,
        breakfastCount: menus.filter((m) => m.mealType === "BREAKFAST").length,
        lunchCount: menus.filter((m) => m.mealType === "LUNCH").length,
        dinnerCount: menus.filter((m) => m.mealType === "DINNER").length,
        menus: menus,
        combinedIngredients,
        selectedMealTypes,
        combineKitchens,
      };
    } else if (type === "summary") {
      // For summary report, get all data for the day
      data = {
        type: "summary",
        date: targetDate,
        totalMeals: menus.length,
        breakfastCount: menus.filter((m) => m.mealType === "BREAKFAST").length,
        lunchCount: menus.filter((m) => m.mealType === "LUNCH").length,
        dinnerCount: menus.filter((m) => m.mealType === "DINNER").length,
        menus: menus,
      };
    } else {
      // For specific meal type reports
      const mealType = type.toUpperCase();
      data = {
        type: mealType,
        date: targetDate,
        totalQuantity: menus.reduce(
          (sum, menu) => sum + (menu.servings || 0),
          0,
        ),
        menus: menus,
      };
    }
  } catch (err) {
    console.error("Failed to fetch menu data:", err);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch menu data",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let buffer, contentType, fileExt;
  try {
    console.log(`Generating ${format} report for type: ${type}, date: ${date}`);
    console.log(`Data structure:`, {
      type: data.type,
      menusCount: data.menus?.length || 0,
      combinedIngredientsCount: data.combinedIngredients?.length || 0,
      sampleMenu: data.menus?.[0]
        ? {
            kitchen: data.menus[0].kitchen?.name,
            recipe: data.menus[0].recipe?.name,
            mealType: data.menus[0].mealType,
          }
        : null,
    });

    if (format === "csv") {
      buffer = await createMenuReportCSV(data, type, date);
      contentType = "text/csv";
      fileExt = "csv";
    } else if (format === "pdf") {
      console.log("Attempting to generate PDF with Puppeteer...");
      buffer = await createReportPDFWithPuppeteer(
        data,
        type,
        date,
        attachRecipePrints,
      );
      console.log(
        "PDF generation completed, buffer size:",
        buffer?.length || 0,
      );
      contentType = "application/pdf";
      fileExt = "pdf";
    } else if (format === "xlsx") {
      // Generate Excel report
      const mainBuffer = await createMenuReportWorkbook(data, type, date);

      // If recipe attachments are requested, create a combined workbook
      if (attachRecipePrints && data.menus && data.menus.length > 0) {
        console.log("Adding recipe attachments to Excel report...");
        const uniqueRecipes = extractUniqueRecipes(data.menus);
        if (uniqueRecipes.length > 0) {
          console.log(
            `Combining Excel report with ${uniqueRecipes.length} unique recipes`,
          );

          // For now, we'll create the recipes workbook separately
          // TODO: Implement proper Excel workbook merging by combining worksheets
          const recipesBuffer = createRecipesExcelWorkbook(uniqueRecipes);

          // Use the recipes workbook as it includes both summary and individual recipes
          buffer = recipesBuffer;
          console.log(
            `Excel report with ${uniqueRecipes.length} unique recipes attached`,
          );
        } else {
          buffer = mainBuffer;
        }
      } else {
        buffer = mainBuffer;
      }

      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExt = "xlsx";
    } else {
      // CSV format
      buffer = await createMenuReportCSV(data, type, date);

      // If recipe attachments are requested, append recipes to CSV
      if (attachRecipePrints && data.menus && data.menus.length > 0) {
        console.log("Adding recipe attachments to CSV report...");
        const uniqueRecipes = extractUniqueRecipes(data.menus);
        if (uniqueRecipes.length > 0) {
          const mainCSV = buffer.toString();
          const recipesCSV = createRecipesCSV(uniqueRecipes);

          // Combine CSVs with separator
          const combinedCSV =
            mainCSV +
            "\n\n" +
            "=".repeat(100) +
            "\n" +
            "ATTACHED RECIPES\n" +
            "=".repeat(100) +
            "\n\n" +
            recipesCSV;

          buffer = Buffer.from(combinedCSV);
          console.log(
            `CSV report with ${uniqueRecipes.length} unique recipes attached`,
          );
        }
      }

      contentType = "text/csv";
      fileExt = "csv";
    }
  } catch (err) {
    console.error("Failed to generate report file:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate report file",
        details: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const filename =
    format === "pdf"
      ? generateReportFilename(type, date)
      : `${type}-report-${date}.${fileExt}`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
