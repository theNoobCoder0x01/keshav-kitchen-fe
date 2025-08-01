import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";

const prisma = new PrismaClient();

// HTML template for the recipe PDF
function generateRecipeHTML(recipe: any) {
  const totalCost = recipe.ingredients.reduce(
    (sum: number, ingredient: any) => sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
    0
  );

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Recipe: ${encodeTextForPDF(recipe.name)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 1.5rem;
          }
          
          .recipe-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #111827;
            margin-bottom: 1rem;
          }
          
          .recipe-description {
            font-size: 1.125rem;
            color: #4b5563;
            margin-bottom: 1rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .badges {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            background-color: #f3f4f6;
            color: #374151;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }
          
          .stat-item {
            text-align: center;
            padding: 1rem;
          }
          
          .stat-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            margin: 0 auto 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
          }
          
          .stat-icon.servings { background-color: #3b82f6; }
          .stat-icon.time { background-color: #10b981; }
          .stat-icon.cost-per-serving { background-color: #8b5cf6; }
          .stat-icon.total-cost { background-color: #f59e0b; }
          
          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          
          .stat-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
          }
          
          .section {
            margin: 2rem 0;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            background: white;
          }
          
          .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #111827;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .ingredients-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .ingredient-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }
          
          .ingredient-name {
            font-weight: 500;
            color: #111827;
            flex: 1;
          }
          
          .ingredient-quantity {
            font-weight: 600;
            color: #111827;
            text-align: right;
          }
          
          .ingredient-cost {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }
          
          .total-cost {
            border-top: 2px solid #e5e7eb;
            margin-top: 1rem;
            padding-top: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.125rem;
            font-weight: 600;
          }
          
          .total-cost-value {
            color: #059669;
          }
          
          .instructions-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .instruction-item {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .instruction-number {
            flex-shrink: 0;
            width: 2rem;
            height: 2rem;
            background-color: #2563eb;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 600;
          }
          
          .instruction-text {
            color: #374151;
            padding-top: 0.125rem;
            flex: 1;
          }
          
          .timing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          
          .timing-item {
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }
          
          .timing-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          
          .timing-value {
            font-size: 1.125rem;
            font-weight: 500;
            color: #111827;
          }
          
          .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 0.875rem;
            color: #6b7280;
          }
          
          @media print {
            body { margin: 0; padding: 1rem; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1 class="recipe-title">${encodeTextForPDF(recipe.name)}</h1>
          ${recipe.description ? `<p class="recipe-description">${encodeTextForPDF(recipe.description)}</p>` : ''}
          <div class="badges">
            <span class="badge">📂 ${encodeTextForPDF(recipe.category)}</span>
            ${recipe.subcategory ? `<span class="badge">🏷️ ${encodeTextForPDF(recipe.subcategory)}</span>` : ''}
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          ${recipe.servings ? `
            <div class="stat-item">
              <div class="stat-icon servings">👥</div>
              <div class="stat-label">Servings</div>
              <div class="stat-value">${recipe.servings}</div>
            </div>
          ` : ''}
          
          ${totalTime > 0 ? `
            <div class="stat-item">
              <div class="stat-icon time">⏰</div>
              <div class="stat-label">Total Time</div>
              <div class="stat-value">${totalTime} min</div>
            </div>
          ` : ''}
          
          <div class="stat-item">
            <div class="stat-icon cost-per-serving">💰</div>
            <div class="stat-label">Cost per Serving</div>
            <div class="stat-value">$${recipe.servings ? (totalCost / recipe.servings).toFixed(2) : totalCost.toFixed(2)}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon total-cost">🏷️</div>
            <div class="stat-label">Total Cost</div>
            <div class="stat-value">$${totalCost.toFixed(2)}</div>
          </div>
        </div>

        <!-- Timing Breakdown -->
        ${(recipe.prepTime || recipe.cookTime) ? `
          <div class="section">
            <h2 class="section-title">⏰ Timing</h2>
            <div class="timing-grid">
              ${recipe.prepTime ? `
                <div class="timing-item">
                  <div class="timing-label">Prep Time</div>
                  <div class="timing-value">${recipe.prepTime} minutes</div>
                </div>
              ` : ''}
              ${recipe.cookTime ? `
                <div class="timing-item">
                  <div class="timing-label">Cook Time</div>
                  <div class="timing-value">${recipe.cookTime} minutes</div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Ingredients -->
        <div class="section">
          <h2 class="section-title">🥘 Ingredients</h2>
          <ul class="ingredients-list">
            ${recipe.ingredients.map((ingredient: any) => `
              <li class="ingredient-item">
                <div class="ingredient-name">${encodeTextForPDF(ingredient.name)}</div>
                <div>
                  <div class="ingredient-quantity">${ingredient.quantity} ${encodeTextForPDF(ingredient.unit)}</div>
                  ${ingredient.costPerUnit ? `
                    <div class="ingredient-cost">
                      $${ingredient.costPerUnit.toFixed(2)} per ${encodeTextForPDF(ingredient.unit)}
                      ${ingredient.quantity > 1 ? ` ($${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)} total)` : ''}
                    </div>
                  ` : ''}
                </div>
              </li>
            `).join('')}
          </ul>
          <div class="total-cost">
            <span>Total Ingredients Cost:</span>
            <span class="total-cost-value">$${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <!-- Instructions -->
        ${recipe.instructions ? `
          <div class="section">
            <h2 class="section-title">📝 Instructions</h2>
            <ol class="instructions-list">
              ${recipe.instructions.split('\n')
                .map((instruction: string, index: number) => {
                  const trimmed = instruction.trim();
                  if (!trimmed) return '';
                  return `
                    <li class="instruction-item">
                      <div class="instruction-number">${index + 1}</div>
                      <div class="instruction-text">${encodeTextForPDF(trimmed)}</div>
                    </li>
                  `;
                })
                .filter((item: string) => item)
                .join('')}
            </ol>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>Recipe printed from Keshav Kitchen Management System</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
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

    // Fetch recipe from database
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
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

    // Transform the data to match our interface
    const recipeData = {
      ...recipe,
      ingredients: recipe.ingredients.map((ri) => ({
        id: ri.ingredient.id,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.ingredient.unit,
        costPerUnit: ri.ingredient.costPerUnit,
      })),
    };

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