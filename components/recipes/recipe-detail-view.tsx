"use client";

import { LexicalViewer } from "@/components/rich-text/lexical-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateRecipeSummaryObject } from "@/lib/utils/meal-calculations";
import {
  calculateGroupCost,
  getSortedGroupNames,
  groupIngredientsByGroup,
  hasCustomGroups,
} from "@/lib/utils/recipe-utils";
import {
  extractStepsFromInstructions,
  isLexicalSerialized,
} from "@/lib/utils/rich-text";
import { ChefHat, Package, Tag, Users } from "lucide-react";
import { forwardRef } from "react";

import type { RecipeDetailData } from "@/types";

interface RecipeDetailViewProps {
  recipe: RecipeDetailData;
  isPrintMode?: boolean;
}

export const RecipeDetailView = forwardRef<
  HTMLDivElement,
  RecipeDetailViewProps
>(({ recipe, isPrintMode = false }, ref) => {
  const totalCost = recipe.ingredients.reduce(
    (sum, ingredient) =>
      sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
    0,
  );

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Group ingredients by their groups
  const groupedIngredients = groupIngredientsByGroup(
    recipe.ingredients,
    recipe.ingredientGroups,
  );
  const sortedGroupNames = getSortedGroupNames(groupedIngredients);
  const showGroupHeaders = hasCustomGroups(recipe.ingredientGroups);

  // Get calculated summary
  const recipeSummary = generateRecipeSummaryObject(
    {
      display: {
        preparedQuantity: recipe.preparedQuantity,
        preparedQuantityUnit: recipe.preparedQuantityUnit,
        servingQuantity: recipe.servingQuantity,
        servingQuantityUnit: recipe.servingQuantityUnit,
        quantityPerPiece: recipe.quantityPerPiece,
      },
    },
    recipe.name,
  );

  return (
    <div
      ref={ref}
      className={`${
        isPrintMode
          ? "print:p-8 print:bg-white print:text-black"
          : "max-w-4xl mx-auto p-6"
      } space-y-6`}
    >
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1
          className={`${isPrintMode ? "text-3xl" : "text-4xl"} font-bold text-foreground`}
        >
          {recipe.name}
        </h1>

        {recipe.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {recipe.description}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {recipe.category}
          </Badge>
          {recipe.subcategory && (
            <Badge variant="outline" className="flex items-center gap-1">
              <ChefHat className="w-3 h-3" />
              {recipe.subcategory}
            </Badge>
          )}
        </div>
      </div>

      {/* Calculation Section */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground">Prepared Quantity</p>
              <p className="text-xl font-semibold text-foreground">
                {recipeSummary.preparedQuantity} {recipeSummary.preparedUnit}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-2">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground">Serving Quantity</p>
              <p className="text-xl font-semibold text-foreground">
                {recipeSummary.servingQuantity} {recipeSummary.servingUnit}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Number of Servings
              </p>
              <p className="text-xl font-semibold text-foreground">
                {recipeSummary.numberOfServings}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mx-auto mb-2">
                <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-sm text-muted-foreground">Extra Quantity</p>
              <p className="text-xl font-semibold text-foreground">
                {recipeSummary.extraQuantity} {recipeSummary.preparedUnit}
              </p>
            </div>

            {recipe.quantityPerPiece && (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Quantity Per Piece
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {recipe.quantityPerPiece} {recipe.preparedQuantityUnit}
                </p>
              </div>
            )}
          </div>

          {/* Ingredients Summary */}
          <Separator className="my-4" />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-foreground">Total Ingredients Cost:</span>
            <span className="text-green-600 dark:text-green-400">
              ₹{totalCost.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedGroupNames.map((groupName) => {
              const group = groupedIngredients[groupName];
              const groupCost = calculateGroupCost(group.ingredients);

              return (
                <div key={groupName} className="space-y-3">
                  {/* Group Header - only show if there are custom groups */}
                  {showGroupHeaders && (
                    <div className="flex items-center gap-2 pb-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground text-lg">
                        {groupName}
                      </h4>
                      {groupCost > 0 && (
                        <span className="text-sm text-muted-foreground ml-auto">
                          ₹{groupCost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ingredients in this group */}
                  <div className="space-y-2">
                    {group.ingredients.map((ingredient, index) => (
                      <div
                        key={ingredient.id || index}
                        className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg ${
                          showGroupHeaders ? "ml-6" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-medium text-foreground">
                            {ingredient.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {ingredient.quantity} {ingredient.unit}
                          </div>
                          {ingredient.costPerUnit && (
                            <div className="text-sm text-muted-foreground">
                              ₹{ingredient.costPerUnit.toFixed(2)} per{" "}
                              {ingredient.unit}
                              {ingredient.quantity > 1 && (
                                <span className="ml-1">
                                  (₹
                                  {(
                                    ingredient.costPerUnit * ingredient.quantity
                                  ).toFixed(2)}{" "}
                                  total)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ingredients Summary */}
          <Separator className="my-4" />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-foreground">Total Ingredients Cost:</span>
            <span className="text-green-600 dark:text-green-400">
              ₹{totalCost.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Section */}
      {recipe.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {isLexicalSerialized(recipe.instructions) ? (
                <LexicalViewer value={recipe.instructions} />
              ) : (
                extractStepsFromInstructions(recipe.instructions).map(
                  (step, index) => (
                    <div key={index} className="flex gap-4 mb-4">
                      <div className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-foreground leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ),
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Metadata */}
      {!isPrintMode && (recipe.createdAt || recipe.updatedAt) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              {recipe.createdAt && (
                <p>
                  Created: {new Date(recipe.createdAt).toLocaleDateString()}
                </p>
              )}
              {recipe.updatedAt && (
                <p>
                  Last Updated:{" "}
                  {new Date(recipe.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Footer */}
      {isPrintMode && (
        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Recipe printed from Keshav Kitchen Management System</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
});

RecipeDetailView.displayName = "RecipeDetailView";
