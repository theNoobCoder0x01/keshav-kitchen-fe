"use client";

import { forwardRef } from "react";
import type { RecipeDetailData } from "./recipe-detail-view";

interface RecipePdfTemplateProps {
  recipe: RecipeDetailData;
  isPrintMode?: boolean;
}

export const RecipePdfTemplate = forwardRef<HTMLDivElement, RecipePdfTemplateProps>(
  ({ recipe, isPrintMode = false }, ref) => {
    const totalCost = recipe.ingredients.reduce(
      (sum, ingredient) => sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
      0
    );

    return (
      <div
        ref={ref}
        className={`${
          isPrintMode ? "print-template" : ""
        } max-w-4xl mx-auto bg-white text-black`}
        style={{
          fontFamily: "Arial, sans-serif",
          lineHeight: "1.5",
          color: "#333",
          padding: "20px",
        }}
      >
        {/* Inline styles for PDF compatibility */}
        <style jsx>{`
          .print-template {
            font-family: Arial, sans-serif !important;
            line-height: 1.5 !important;
            color: #333 !important;
            background: white !important;
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
          
          .pdf-instruction-number {
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
            .print-template {
              margin: 0 !important;
              padding: 15px !important;
            }
            .pdf-section {
              break-inside: avoid;
            }
          }
        `}</style>

        {/* Header */}
        <div className="pdf-header">
          <h1 className="pdf-title">{recipe.name}</h1>
          {recipe.description && (
            <p className="pdf-description">{recipe.description}</p>
          )}
          <div className="pdf-meta">
            <strong>Category:</strong> {recipe.category}
            {recipe.subcategory && (
              <span> | <strong>Subcategory:</strong> {recipe.subcategory}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="pdf-stats-section">
          <h2 className="pdf-stats-title">Recipe Information</h2>
          <table className="pdf-stats-table">
            <tbody>
              {recipe.servings && (
                <tr>
                  <td>Servings</td>
                  <td>{recipe.servings}</td>
                </tr>
              )}
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

        {/* Ingredients */}
        <div className="pdf-section">
          <h2 className="pdf-section-title">Ingredients</h2>
          <table className="pdf-ingredients-table">
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
              {recipe.ingredients.map((ingredient, index) => (
                <tr key={ingredient.id || index}>
                  <td>{ingredient.name}</td>
                  <td>{ingredient.quantity}</td>
                  <td>{ingredient.unit}</td>
                  <td>
                    {ingredient.costPerUnit ? `₹${ingredient.costPerUnit.toFixed(2)}` : "N/A"}
                  </td>
                  <td>
                    {ingredient.costPerUnit
                      ? `₹${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}`
                      : "N/A"}
                  </td>
                </tr>
              ))}
              <tr className="pdf-total-cost-row">
                <td colSpan={4}>
                  <strong>Total Ingredients Cost</strong>
                </td>
                <td>
                  <strong>₹${totalCost.toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Instructions</h2>
            <ol className="pdf-instructions-list">
              {recipe.instructions
                .split('\n')
                .map((instruction, index) => {
                  const trimmed = instruction.trim();
                  if (!trimmed) return null;
                  return (
                    <li key={index} className="pdf-instruction-item">
                      <div className="pdf-instruction-number">{index + 1}</div>
                      {trimmed}
                    </li>
                  );
                })
                .filter(Boolean)}
            </ol>
          </div>
        )}

        {/* Footer */}
        <div className="pdf-footer">
          <p><strong>Keshav Kitchen Management System</strong></p>
          <p>
            Recipe printed on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
          {recipe.createdAt && (
            <p>Created: {new Date(recipe.createdAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  }
);

RecipePdfTemplate.displayName = "RecipePdfTemplate";