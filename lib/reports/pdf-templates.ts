import { encodeTextForPDF } from "@/lib/fonts/gujarati-font";
import type { MenuReportData as ReportData } from "@/types/menus";

// Base CSS styles for all PDF reports - PDF-compatible only
const basePdfStyles = `
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
    border-bottom: 2px solid #333;
    padding-bottom: 20px;
  }
  
  .pdf-title {
    font-size: 24px;
    font-weight: bold;
    color: #000;
    margin-bottom: 10px;
    margin-top: 0;
  }
  
  .pdf-subtitle {
    font-size: 16px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .pdf-meta {
    font-size: 14px;
    color: #777;
    margin-bottom: 10px;
  }
  
  .pdf-summary-section {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    padding: 20px;
    margin: 20px 0;
  }
  
  .pdf-summary-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    margin-top: 0;
    color: #000;
  }
  
  .pdf-stats-grid {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }
  
  .pdf-stats-row {
    display: table-row;
  }
  
  .pdf-stats-cell {
    display: table-cell;
    padding: 8px 15px;
    border: 1px solid #ddd;
    text-align: center;
    vertical-align: middle;
  }
  
  .pdf-stats-cell:first-child {
    font-weight: bold;
    background-color: #f0f0f0;
    text-align: left;
  }
  
  .pdf-section {
    margin: 30px 0;
    border: 1px solid #ddd;
    padding: 20px;
  }
  
  .pdf-section-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    margin-top: 0;
    color: #000;
  }
  
  .pdf-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
  }
  
  .pdf-table th {
    background-color: #f0f0f0;
    padding: 10px;
    border: 1px solid #ddd;
    font-weight: bold;
    text-align: left;
  }
  
  .pdf-table td {
    padding: 8px 10px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  
  .pdf-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  .pdf-total-row {
    border-top: 2px solid #333;
    font-weight: bold;
    background-color: #f0f0f0;
  }
  
  .pdf-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ccc;
    text-align: center;
    font-size: 12px;
    color: #777;
  }
  
  .text-right {
    text-align: right;
  }
  
  .text-center {
    text-align: center;
  }
  
  .font-bold {
    font-weight: bold;
  }
  
  .text-success {
    color: #059669;
  }
  
  .text-warning {
    color: #d97706;
  }
  
  .text-error {
    color: #dc2626;
  }
  
  @media print {
    body { 
      margin: 0; 
      padding: 15px; 
    }
    .pdf-section {
      break-inside: avoid;
    }
    .pdf-table {
      break-inside: auto;
    }
    .pdf-table tr {
      break-inside: avoid;
    }
  }
`;

// Ingredients Report Template
export function generateIngredientsReportHTML(data: ReportData): string {
  const dateStr = new Date(data.date).toLocaleDateString();
  const mealTypesText = data.selectedMealTypes?.join(", ") || "All Meal Types";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Ingredients Report - ${dateStr}</title>
        <style>${basePdfStyles}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="pdf-header">
          <h1 class="pdf-title">Combined Ingredients Report</h1>
          <p class="pdf-subtitle">Date: ${dateStr}</p>
          <p class="pdf-meta">Meal Types: ${mealTypesText}</p>
          ${data.combineMealTypes ? '<p class="pdf-meta">✓ Meal types combined</p>' : ""}
          ${data.combineKitchens ? '<p class="pdf-meta">✓ Kitchens combined</p>' : ""}
        </div>

        <!-- Summary -->
        ${
          data.summary
            ? `
          <div class="pdf-summary-section">
            <h2 class="pdf-summary-title">Summary</h2>
            <div class="pdf-stats-grid">
              <div class="pdf-stats-row">
                <div class="pdf-stats-cell">Total Ingredients</div>
                <div class="pdf-stats-cell">${data.summary.totalIngredients}</div>
                <div class="pdf-stats-cell">Unique Ingredients</div>
                <div class="pdf-stats-cell">${data.summary.uniqueIngredients}</div>
              </div>
              <div class="pdf-stats-row">
                <div class="pdf-stats-cell">Total Cost</div>
                <div class="pdf-stats-cell font-bold text-success">₹${data.summary.totalCost.toFixed(2)}</div>
                <div class="pdf-stats-cell">Total Menus</div>
                <div class="pdf-stats-cell">${data.menus.length}</div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Ingredients Table -->
        ${
          data.combinedIngredients && data.combinedIngredients.length > 0
            ? `
          <div class="pdf-section">
            <h2 class="pdf-section-title">Combined Ingredients</h2>
            <table class="pdf-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Total Quantity</th>
                  <th>Unit</th>
                  <th>Total Cost</th>
                  <th>Sources</th>
                  <th>Kitchen Details</th>
                </tr>
              </thead>
              <tbody>
                ${data.combinedIngredients
                  .map(
                    (ingredient) => `
                  <tr>
                    <td class="font-bold">${encodeTextForPDF(ingredient.name)}</td>
                    <td class="text-right">${ingredient.totalQuantity.toFixed(2)}</td>
                    <td>${encodeTextForPDF(ingredient.unit)}</td>
                    <td class="text-right">₹${ingredient.totalCost.toFixed(2)}</td>
                    <td class="text-center">${ingredient.sources.length}</td>
                    <td style="font-size: 11px;">
                      ${ingredient.sources
                        .map(
                          (source) =>
                            `${encodeTextForPDF(source.kitchen)} - ${source.mealType} (${source.quantity})`,
                        )
                        .join("<br>")}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="pdf-total-row">
                  <td colspan="3"><strong>Total Cost</strong></td>
                  <td class="text-right"><strong>₹${data.summary?.totalCost.toFixed(2) || "0.00"}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>Ingredients Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `;
}

// Combined Meals Report Template
export function generateCombinedMealsReportHTML(data: ReportData): string {
  const dateStr = new Date(data.date).toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Combined Meals Report - ${dateStr}</title>
        <style>${basePdfStyles}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="pdf-header">
          <h1 class="pdf-title">Combined Meal Types Report</h1>
          <p class="pdf-subtitle">Date: ${dateStr}</p>
          ${data.combineKitchens ? '<p class="pdf-meta">✓ Kitchens combined</p>' : ""}
        </div>

        <!-- Summary -->
        <div class="pdf-summary-section">
          <h2 class="pdf-summary-title">Meal Summary</h2>
          <div class="pdf-stats-grid">
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Total Meals</div>
              <div class="pdf-stats-cell">${data.totalMeals || 0}</div>
              <div class="pdf-stats-cell">Total Servings</div>
              <div class="pdf-stats-cell">${data.totalQuantity || 0}</div>
            </div>
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Breakfast</div>
              <div class="pdf-stats-cell">${data.breakfastCount || 0}</div>
              <div class="pdf-stats-cell">Lunch</div>
              <div class="pdf-stats-cell">${data.lunchCount || 0}</div>
            </div>
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Dinner</div>
              <div class="pdf-stats-cell">${data.dinnerCount || 0}</div>
              <div class="pdf-stats-cell">Other</div>
              <div class="pdf-stats-cell">${(data.totalMeals || 0) - (data.breakfastCount || 0) - (data.lunchCount || 0) - (data.dinnerCount || 0)}</div>
            </div>
          </div>
        </div>

        <!-- Meals Table -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">All Meals</h2>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Kitchen</th>
                <th>Recipe</th>
                <th>Meal Type</th>
                <th>Servings</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${data.menus
                .map(
                  (menu) => `
                <tr>
                  <td>${encodeTextForPDF(menu.kitchen.name)}</td>
                  <td>${encodeTextForPDF(menu.recipe.name)}</td>
                  <td class="text-center">
                    <span class="${menu.mealType === "BREAKFAST" ? "text-warning" : menu.mealType === "LUNCH" ? "text-success" : "text-error"}">
                      ${menu.mealType}
                    </span>
                  </td>
                  <td class="text-center">${menu.servings}</td>
                  <td class="text-center">${menu.status}</td>
                  <td style="font-size: 11px;">${menu.notes ? encodeTextForPDF(menu.notes) : "-"}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="pdf-total-row">
                <td colspan="3"><strong>Total</strong></td>
                <td class="text-center"><strong>${data.menus.reduce((sum, menu) => sum + menu.servings, 0)}</strong></td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Combined Ingredients -->
        ${
          data.combinedIngredients && data.combinedIngredients.length > 0
            ? `
          <div class="pdf-section">
            <h2 class="pdf-section-title">Combined Ingredients</h2>
            <table class="pdf-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Total Quantity</th>
                  <th>Unit</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${data.combinedIngredients
                  .map(
                    (ingredient) => `
                  <tr>
                    <td>${encodeTextForPDF(ingredient.name)}</td>
                    <td class="text-right">${ingredient.totalQuantity.toFixed(2)}</td>
                    <td>${encodeTextForPDF(ingredient.unit)}</td>
                    <td class="text-right">₹${ingredient.totalCost.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="pdf-total-row">
                  <td colspan="3"><strong>Total Cost</strong></td>
                  <td class="text-right"><strong>₹${data.combinedIngredients.reduce((sum, ing) => sum + ing.totalCost, 0).toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>Combined Meals Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `;
}

// Summary Report Template
export function generateSummaryReportHTML(data: ReportData): string {
  const dateStr = new Date(data.date).toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Daily Summary Report - ${dateStr}</title>
        <style>${basePdfStyles}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="pdf-header">
          <h1 class="pdf-title">Daily Summary Report</h1>
          <p class="pdf-subtitle">Date: ${dateStr}</p>
        </div>

        <!-- Summary -->
        <div class="pdf-summary-section">
          <h2 class="pdf-summary-title">Daily Overview</h2>
          <div class="pdf-stats-grid">
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Total Meals Planned</div>
              <div class="pdf-stats-cell font-bold">${data.totalMeals || 0}</div>
              <div class="pdf-stats-cell">Total Servings</div>
              <div class="pdf-stats-cell font-bold">${data.menus.reduce((sum, menu) => sum + menu.servings, 0)}</div>
            </div>
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Breakfast Meals</div>
              <div class="pdf-stats-cell text-warning">${data.breakfastCount || 0}</div>
              <div class="pdf-stats-cell">Lunch Meals</div>
              <div class="pdf-stats-cell text-success">${data.lunchCount || 0}</div>
            </div>
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Dinner Meals</div>
              <div class="pdf-stats-cell text-error">${data.dinnerCount || 0}</div>
              <div class="pdf-stats-cell">Unique Kitchens</div>
              <div class="pdf-stats-cell">${new Set(data.menus.map((m) => m.kitchen.name)).size}</div>
            </div>
          </div>
        </div>

        <!-- Meals by Kitchen -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Meals by Kitchen</h2>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Kitchen</th>
                <th>Recipe</th>
                <th>Meal Type</th>
                <th>Servings</th>
                <th>Status</th>
                <th>Actual Count</th>
              </tr>
            </thead>
            <tbody>
              ${data.menus
                .map(
                  (menu) => `
                <tr>
                  <td>${encodeTextForPDF(menu.kitchen.name)}</td>
                  <td>${encodeTextForPDF(menu.recipe.name)}</td>
                  <td class="text-center">
                    <span class="${menu.mealType === "BREAKFAST" ? "text-warning" : menu.mealType === "LUNCH" ? "text-success" : "text-error"}">
                      ${menu.mealType}
                    </span>
                  </td>
                  <td class="text-center">${menu.servings}</td>
                  <td class="text-center">
                    <span class="${menu.status === "COMPLETED" ? "text-success" : menu.status === "IN_PROGRESS" ? "text-warning" : ""}">
                      ${menu.status}
                    </span>
                  </td>
                  <td class="text-center">${menu.actualCount || "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Status Summary -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Status Summary</h2>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const statusCounts = data.menus.reduce(
                  (acc, menu) => {
                    acc[menu.status] = (acc[menu.status] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                );

                return Object.entries(statusCounts)
                  .map(
                    ([status, count]) => `
                  <tr>
                    <td class="${status === "COMPLETED" ? "text-success" : status === "IN_PROGRESS" ? "text-warning" : ""}">${status}</td>
                    <td class="text-center">${count}</td>
                    <td class="text-center">${((count / data.menus.length) * 100).toFixed(1)}%</td>
                  </tr>
                `,
                  )
                  .join("");
              })()}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>Daily Summary Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `;
}

// Meal Type Report Template (for breakfast, lunch, dinner, etc.)
export function generateMealTypeReportHTML(
  data: ReportData,
  mealType: string,
): string {
  const dateStr = new Date(data.date).toLocaleDateString();
  const filteredMenus = data.menus.filter(
    (menu) => menu.mealType.toLowerCase() === mealType.toLowerCase(),
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${mealType} Report - ${dateStr}</title>
        <style>${basePdfStyles}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="pdf-header">
          <h1 class="pdf-title">${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Report</h1>
          <p class="pdf-subtitle">Date: ${dateStr}</p>
        </div>

        <!-- Summary -->
        <div class="pdf-summary-section">
          <h2 class="pdf-summary-title">${mealType} Summary</h2>
          <div class="pdf-stats-grid">
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Total ${mealType} Meals</div>
              <div class="pdf-stats-cell font-bold">${filteredMenus.length}</div>
              <div class="pdf-stats-cell">Total Servings</div>
              <div class="pdf-stats-cell font-bold">${filteredMenus.reduce((sum, menu) => sum + menu.servings, 0)}</div>
            </div>
            <div class="pdf-stats-row">
              <div class="pdf-stats-cell">Unique Kitchens</div>
              <div class="pdf-stats-cell">${new Set(filteredMenus.map((m) => m.kitchen.name)).size}</div>
              <div class="pdf-stats-cell">Unique Recipes</div>
              <div class="pdf-stats-cell">${new Set(filteredMenus.map((m) => m.recipe.name)).size}</div>
            </div>
          </div>
        </div>

        <!-- Meals Table -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">${mealType} Meals</h2>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>Kitchen</th>
                <th>Recipe</th>
                <th>Servings</th>
                <th>Ghan Factor</th>
                <th>Status</th>
                <th>Actual Count</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMenus
                .map(
                  (menu) => `
                <tr>
                  <td>${encodeTextForPDF(menu.kitchen.name)}</td>
                  <td>${encodeTextForPDF(menu.recipe.name)}</td>
                  <td class="text-center">${menu.servings}</td>
                  <td class="text-center">${menu.ghanFactor}</td>
                  <td class="text-center">
                    <span class="${menu.status === "COMPLETED" ? "text-success" : menu.status === "IN_PROGRESS" ? "text-warning" : ""}">
                      ${menu.status}
                    </span>
                  </td>
                  <td class="text-center">${menu.actualCount || "-"}</td>
                  <td style="font-size: 11px;">${menu.notes ? encodeTextForPDF(menu.notes) : "-"}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="pdf-total-row">
                <td colspan="2"><strong>Total</strong></td>
                <td class="text-center"><strong>${filteredMenus.reduce((sum, menu) => sum + menu.servings, 0)}</strong></td>
                <td colspan="4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Ingredients for this meal type -->
        ${(() => {
          const allIngredients: any[] = [];
          filteredMenus.forEach((menu) => {
            if (menu.ingredients) {
              menu.ingredients.forEach((ing) => {
                const existing = allIngredients.find(
                  (ai) => ai.name === ing.name && ai.unit === ing.unit,
                );
                if (existing) {
                  existing.totalQuantity += ing.quantity;
                  existing.totalCost += (ing.costPerUnit || 0) * ing.quantity;
                } else {
                  allIngredients.push({
                    name: ing.name,
                    totalQuantity: ing.quantity,
                    unit: ing.unit,
                    costPerUnit: ing.costPerUnit || 0,
                    totalCost: (ing.costPerUnit || 0) * ing.quantity,
                  });
                }
              });
            }
          });

          if (allIngredients.length === 0) return "";

          return `
            <div class="pdf-section">
              <h2 class="pdf-section-title">Ingredients Summary</h2>
              <table class="pdf-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Total Quantity</th>
                    <th>Unit</th>
                    <th>Avg Cost/Unit</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${allIngredients
                    .map(
                      (ingredient) => `
                    <tr>
                      <td>${encodeTextForPDF(ingredient.name)}</td>
                      <td class="text-right">${ingredient.totalQuantity.toFixed(2)}</td>
                      <td>${encodeTextForPDF(ingredient.unit)}</td>
                      <td class="text-right">₹${ingredient.costPerUnit.toFixed(2)}</td>
                      <td class="text-right">₹${ingredient.totalCost.toFixed(2)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                  <tr class="pdf-total-row">
                    <td colspan="4"><strong>Total Cost</strong></td>
                    <td class="text-right"><strong>₹${allIngredients.reduce((sum, ing) => sum + ing.totalCost, 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        })()}

        <!-- Footer -->
        <div class="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>${mealType} Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `;
}

// Main function to generate HTML based on report type
export function generateReportHTML(data: ReportData, type: string): string {
  switch (type.toLowerCase()) {
    case "ingredients":
      return generateIngredientsReportHTML(data);
    case "combined-meals":
      return generateCombinedMealsReportHTML(data);
    case "summary":
      return generateSummaryReportHTML(data);
    case "breakfast":
    case "lunch":
    case "dinner":
    case "snack":
      return generateMealTypeReportHTML(data, type);
    default:
      return generateSummaryReportHTML(data);
  }
}
