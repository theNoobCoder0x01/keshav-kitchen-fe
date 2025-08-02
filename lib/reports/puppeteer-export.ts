import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { generateReportHTML } from "./pdf-templates";
import { extractUniqueRecipes } from "./recipe-export";

// Interface matching the report data structure
interface ReportData {
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
        name: string;
        quantity: number;
        unit: string;
        costPerUnit?: number;
      }>;
    };
    ingredients?: Array<{
      name: string;
      quantity: number;
      unit: string;
      costPerUnit: number;
    }>;
  }>;
}

// Function to generate recipe HTML using the simplified template
function generateRecipeHTML(recipe: any): string {
  const totalCost = recipe.ingredients.reduce(
    (sum: number, ingredient: any) =>
      sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
    0,
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Recipe: ${encodeTextForPDF(recipe.name)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .pdf-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ccc;
            padding-bottom: 20px;
          }
          
          .pdf-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 15px;
            margin-top: 0;
          }
          
          .pdf-description {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
          }
          
          .pdf-meta {
            font-size: 14px;
            color: #777;
            margin-bottom: 10px;
          }
          
          .pdf-stats-section {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 20px;
            margin: 20px 0;
          }
          
          .pdf-stats-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            margin-top: 0;
          }
          
          .pdf-stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .pdf-stats-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          
          .pdf-stats-table td:first-child {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          
          .pdf-section {
            margin: 30px 0;
            border: 1px solid #ddd;
            padding: 20px;
          }
          
          .pdf-section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            margin-top: 0;
            color: #000;
          }
          
          .pdf-ingredients-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .pdf-ingredients-table th {
            background-color: #f0f0f0;
            padding: 10px;
            border: 1px solid #ddd;
            font-weight: bold;
            text-align: left;
          }
          
          .pdf-ingredients-table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
          }
          
          .pdf-ingredients-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .pdf-total-cost-row {
            border-top: 2px solid #333;
            font-weight: bold;
            background-color: #f0f0f0;
          }
          
          .pdf-instructions-list {
            counter-reset: step-counter;
            padding-left: 0;
            list-style: none;
            margin: 0;
          }
          
          .pdf-instruction-item {
            counter-increment: step-counter;
            margin-bottom: 15px;
            position: relative;
            padding-left: 40px;
          }
          
          .pdf-instruction-item::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            background-color: #333;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
          }
          
          .pdf-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 15px; 
            }
            .pdf-section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="pdf-header">
          <h1 class="pdf-title">${encodeTextForPDF(recipe.name)}</h1>
          ${recipe.description ? `<p class="pdf-description">${encodeTextForPDF(recipe.description)}</p>` : ""}
          <div class="pdf-meta">
            <strong>Category:</strong> ${encodeTextForPDF(recipe.category)}
            ${recipe.subcategory ? ` | <strong>Subcategory:</strong> ${encodeTextForPDF(recipe.subcategory)}` : ""}
          </div>
        </div>

        <!-- Stats -->
        <div class="pdf-stats-section">
          <h2 class="pdf-stats-title">Recipe Information</h2>
          <table class="pdf-stats-table">
            <tbody>
              ${
                recipe.servings
                  ? `
                <tr>
                  <td>Servings</td>
                  <td>${recipe.servings}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td>Cost per Serving</td>
                <td>
                  ₹${recipe.servings ? (totalCost / recipe.servings).toFixed(2) : totalCost.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Total Cost</td>
                <td>₹${totalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Ingredients -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Ingredients</h2>
          <table class="pdf-ingredients-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Cost per Unit</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${recipe.ingredients
                .map(
                  (ingredient: any, index: number) => `
                <tr>
                  <td>${encodeTextForPDF(ingredient.name)}</td>
                  <td>${ingredient.quantity}</td>
                  <td>${encodeTextForPDF(ingredient.unit)}</td>
                  <td>
                    ${ingredient.costPerUnit ? `₹${ingredient.costPerUnit.toFixed(2)}` : "N/A"}
                  </td>
                  <td>
                    ${
                      ingredient.costPerUnit
                        ? `₹${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}`
                        : "N/A"
                    }
                  </td>
                </tr>
              `,
                )
                .join("")}
              <tr class="pdf-total-cost-row">
                <td colspan="4">
                  <strong>Total Ingredients Cost</strong>
                </td>
                <td>
                  <strong>₹${totalCost.toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Instructions -->
        ${
          recipe.instructions
            ? `
          <div class="pdf-section">
            <h2 class="pdf-section-title">Instructions</h2>
            <ol class="pdf-instructions-list">
              ${recipe.instructions
                .split("\n")
                .map((instruction: string) => {
                  const trimmed = instruction.trim();
                  if (!trimmed) return "";
                  return `<li class="pdf-instruction-item">${encodeTextForPDF(trimmed)}</li>`;
                })
                .filter((item: string) => item)
                .join("")}
            </ol>
          </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>
            Recipe printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
          ${recipe.createdAt ? `<p>Created: ${new Date(recipe.createdAt).toLocaleDateString()}</p>` : ""}
        </div>
      </body>
    </html>
  `;
}

export async function createReportPDFWithPuppeteer(
  data: ReportData,
  type: string,
  date: string,
  attachRecipePrints: boolean = false,
): Promise<Buffer> {
  console.log("Creating PDF with Puppeteer for type:", type, "date:", date);

  let browser;
  try {
    // Generate the main report HTML
    const reportHTML = generateReportHTML(data, type);

    // Extract unique recipes if attachments are requested
    let recipeHTMLPages: string[] = [];
    if (attachRecipePrints && data.menus && data.menus.length > 0) {
      console.log(
        `Recipe attachment requested. Processing ${data.menus.length} menus...`,
      );
      console.log(
        "Sample menu structure:",
        JSON.stringify(data.menus[0], null, 2),
      );

      const uniqueRecipes = extractUniqueRecipes(data.menus);
      console.log(
        `Extracted ${uniqueRecipes.length} unique recipes for attachment`,
      );

      if (uniqueRecipes.length > 0) {
        console.log(
          "Sample recipe:",
          JSON.stringify(uniqueRecipes[0], null, 2),
        );
        recipeHTMLPages = uniqueRecipes.map((recipe) =>
          generateRecipeHTML(recipe),
        );
        console.log(`Generated ${recipeHTMLPages.length} recipe HTML pages`);
      }
    }

    // Launch puppeteer with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Generate main report PDF
    await page.setContent(reportHTML, { waitUntil: "networkidle0" });
    let mainPDF = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      preferCSSPageSize: true,
    });

    // If no recipe attachments, return the main PDF
    if (!attachRecipePrints || recipeHTMLPages.length === 0) {
      console.log("PDF generated successfully, size:", mainPDF.length);
      return mainPDF;
    }

    // Generate recipe PDFs and combine them
    const recipePDFs: Buffer[] = [];

    for (let i = 0; i < recipeHTMLPages.length; i++) {
      console.log(`Generating recipe PDF ${i + 1}/${recipeHTMLPages.length}`);
      await page.setContent(recipeHTMLPages[i], { waitUntil: "networkidle0" });

      const recipePDF = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
        preferCSSPageSize: true,
      });

      recipePDFs.push(recipePDF);
    }

    // Combine all PDFs using pdf-lib
    console.log(`Combining main PDF with ${recipePDFs.length} recipe PDFs...`);

    const mergedPdf = await PDFDocument.create();

    // Add main report pages
    const mainPdfDoc = await PDFDocument.load(mainPDF);
    const mainPages = await mergedPdf.copyPages(
      mainPdfDoc,
      mainPdfDoc.getPageIndices(),
    );
    mainPages.forEach((page) => mergedPdf.addPage(page));

    // Add recipe pages
    for (let i = 0; i < recipePDFs.length; i++) {
      console.log(
        `Adding recipe PDF ${i + 1}/${recipePDFs.length} to merged document`,
      );
      const recipePdfDoc = await PDFDocument.load(recipePDFs[i]);
      const recipePages = await mergedPdf.copyPages(
        recipePdfDoc,
        recipePdfDoc.getPageIndices(),
      );
      recipePages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    console.log(
      `PDF generated successfully with ${recipePDFs.length} recipe attachments, total size:`,
      mergedPdfBytes.length,
    );

    return Buffer.from(mergedPdfBytes);
  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper function to create a filename based on report type and date
export function generateReportFilename(type: string, date: string): string {
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const cleanDate = date.replace(/[^0-9-]/g, "");
  return `${cleanType}-report-${cleanDate}.pdf`;
}
