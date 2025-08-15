"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Clock, DollarSign, Tag, Users } from "lucide-react";
import { forwardRef } from "react";

export interface RecipeDetailData {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  servings?: number | null;
  category: string;
  subcategory?: string | null;
  cost?: number;
  ingredients: Array<{
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number | null;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
}

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

      {/* Recipe Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recipe.servings && (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-muted-foreground">Servings</p>
                <p className="text-xl font-semibold text-foreground">
                  {recipe.servings}
                </p>
              </div>
            )}

            {totalTime > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-xl font-semibold text-foreground">
                  {totalTime} min
                </p>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground">Cost per Serving</p>
              <p className="text-xl font-semibold text-foreground">
                ₹
                {recipe.servings
                  ? (totalCost / recipe.servings).toFixed(2)
                  : totalCost.toFixed(2)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mx-auto mb-2">
                <ChefHat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-semibold text-foreground">
                ₹{totalCost.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Breakdown */}
      {(recipe.prepTime || recipe.cookTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipe.prepTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Prep Time
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {recipe.prepTime} minutes
                  </p>
                </div>
              )}
              {recipe.cookTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Cook Time
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {recipe.cookTime} minutes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredients Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id || index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                      {ingredient.costPerUnit.toFixed(2)} per {ingredient.unit}
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
              {recipe.instructions.split("\n").map((instruction, index) => {
                const trimmedInstruction = instruction.trim();
                if (!trimmedInstruction) return null;

                return (
                  <div key={index} className="flex gap-4 mb-4">
                    <div className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-foreground leading-relaxed pt-1">
                      {trimmedInstruction}
                    </p>
                  </div>
                );
              })}
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
