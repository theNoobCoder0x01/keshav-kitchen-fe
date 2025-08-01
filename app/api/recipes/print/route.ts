import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";

const prisma = new PrismaClient();

// Simplified HTML template for PDF generation that avoids complex CSS
function generateRecipeHTML(recipe: any) {
  const totalCost = recipe.ingredients.reduce(
    (sum: number, ingredient: any) => sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
    0
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
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ccc;
            padding-bottom: 20px;
          }
          
          .recipe-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 15px;
            margin-top: 0;
          }
          
          .recipe-description {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
          }
          
          .recipe-meta {
            font-size: 14px;
            color: #777;
            margin-bottom: 10px;
          }
          
          .stats-section {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 20px;
            margin: 20px 0;
          }
          
          .stats-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            margin-top: 0;
          }
          
          .stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .stats-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          
          .stats-table td:first-child {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          
          .section {
            margin: 30px 0;
            border: 1px solid #ddd;
            padding: 20px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            margin-top: 0;
            color: #000;
          }
          
          .ingredients-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .ingredients-table th {
            background-color: #f0f0f0;
            padding: 10px;
            border: 1px solid #ddd;
            font-weight: bold;
            text-align: left;
          }
          
          .ingredients-table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
          }
          
          .ingredients-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .total-cost-row {
            border-top: 2px solid #333;
            font-weight: bold;
            background-color: #f0f0f0;
          }
          
          .instructions-list {
            counter-reset: step-counter;
            padding-left: 0;
            list-style: none;
          }
          
          .instruction-item {
            counter-increment: step-counter;
            margin-bottom: 15px;
            position: relative;
            padding-left: 40px;
          }
          
          .instruction-item::before {
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
          
          .footer {
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
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1 class="recipe-title">${encodeTextForPDF(recipe.name)}</h1>
          ${recipe.description ? `<p class="recipe-description">${encodeTextForPDF(recipe.description)}</p>` : ''}
          <div class="recipe-meta">
            <strong>Category:</strong> ${encodeTextForPDF(recipe.category)}
            ${recipe.subcategory ? ` | <strong>Subcategory:</strong> ${encodeTextForPDF(recipe.subcategory)}` : ''}
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-section">
          <h2 class="stats-title">Recipe Information</h2>
          <table class="stats-table">
            ${recipe.servings ? `
              <tr>
                <td>Servings</td>
                <td>${recipe.servings}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Cost per Serving</td>
              <td>$${recipe.servings ? (totalCost / recipe.servings).toFixed(2) : totalCost.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Cost</td>
              <td>$${totalCost.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Ingredients -->
        <div class="section">
          <h2 class="section-title">Ingredients</h2>
          <table class="ingredients-table">
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
              ${recipe.ingredients.map((ingredient: any) => `
                <tr>
                  <td>${encodeTextForPDF(ingredient.name)}</td>
                  <td>${ingredient.quantity}</td>
                  <td>${encodeTextForPDF(ingredient.unit)}</td>
                  <td>${ingredient.costPerUnit ? `$${ingredient.costPerUnit.toFixed(2)}` : 'N/A'}</td>
                  <td>${ingredient.costPerUnit ? `$${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}` : 'N/A'}</td>
                </tr>
              `).join('')}
              <tr class="total-cost-row">
                <td colspan="4"><strong>Total Ingredients Cost</strong></td>
                <td><strong>$${totalCost.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Instructions -->
        ${recipe.instructions ? `
          <div class="section">
            <h2 class="section-title">Instructions</h2>
            <ol class="instructions-list">
              ${recipe.instructions.split('\n')
                .map((instruction: string) => {
                  const trimmed = instruction.trim();
                  if (!trimmed) return '';
                  return `<li class="instruction-item">${encodeTextForPDF(trimmed)}</li>`;
                })
                .filter((item: string) => item)
                .join('')}
            </ol>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>Recipe printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          ${recipe.user?.name ? `<p>Created by: ${encodeTextForPDF(recipe.user.name)}</p>` : ''}
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    // Fetch recipe from database using the same structure as our main API
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Recipe data is already in the correct format
    const recipeData = recipe;

    // Generate HTML
    const html = generateRecipeHTML(recipeData);

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recipe-${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error generating recipe PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}