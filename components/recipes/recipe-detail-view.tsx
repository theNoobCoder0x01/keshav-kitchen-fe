"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Clock, DollarSign, Tag, Users, Utensils } from "lucide-react";
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
  prepTime?: number;
  cookTime?: number;
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
    0
  );

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div
      ref={ref}
      className={`${
        isPrintMode
          ? "print:p-8 print:bg-white print:text-black"
          : "p-8"
      } space-y-8`}
    >
      {/* Header Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gradient">
            {recipe.name}
          </h1>

          {recipe.description && (
            <p className="body-large text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <Tag className="w-3 h-3 mr-1" />
            {recipe.category}
          </Badge>
          {recipe.subcategory && (
            <Badge variant="outline" className="border-primary/20 text-primary">
              <ChefHat className="w-3 h-3 mr-1" />
              {recipe.subcategory}
            </Badge>
          )}
        </div>
      </div>

      {/* Recipe Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recipe.servings && (
          <Card className="glass border-0 shadow-modern text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-500/10">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="body-small text-muted-foreground mb-1">Servings</p>
              <p className="text-2xl font-bold">{recipe.servings}</p>
            </CardContent>
          </Card>
        )}

        {totalTime > 0 && (
          <Card className="glass border-0 shadow-modern text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-green-500/10">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <p className="body-small text-muted-foreground mb-1">Total Time</p>
              <p className="text-2xl font-bold">{totalTime} min</p>
            </CardContent>
          </Card>
        )}

        <Card className="glass border-0 shadow-modern text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-500/10">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <p className="body-small text-muted-foreground mb-1">Cost per Serving</p>
            <p className="text-2xl font-bold">
              ₹{recipe.servings ? (totalCost / recipe.servings).toFixed(2) : totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-modern text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-orange-500/10">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
            <p className="body-small text-muted-foreground mb-1">Total Cost</p>
            <p className="text-2xl font-bold">₹{totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Breakdown */}
      {(recipe.prepTime || recipe.cookTime) && (
        <Card className="glass border-0 shadow-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Timing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipe.prepTime && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg flex items-center justify-center border border-blue-500/10">
                    <ChefHat className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="body-small text-muted-foreground">Prep Time</p>
                    <p className="text-lg font-semibold">{recipe.prepTime} minutes</p>
                  </div>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg flex items-center justify-center border border-orange-500/10">
                    <Utensils className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="body-small text-muted-foreground">Cook Time</p>
                    <p className="text-lg font-semibold">{recipe.cookTime} minutes</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredients Section */}
      <Card className="glass border-0 shadow-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Ingredients ({recipe.ingredients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id || index}
                className="flex items-center justify-between p-4 glass rounded-xl border-0 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                    <span className="text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {ingredient.name}
                    </span>
                    <p className="body-small text-muted-foreground">
                      {ingredient.quantity} {ingredient.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {ingredient.costPerUnit && (
                    <div className="space-y-1">
                      <p className="body-small text-muted-foreground">
                        ₹{ingredient.costPerUnit.toFixed(2)} per {ingredient.unit}
                      </p>
                      <p className="font-semibold text-foreground">
                        ₹{(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />
          
          <div className="flex justify-between items-center p-4 glass rounded-xl border border-primary/10">
            <span className="text-lg font-semibold text-foreground">Total Ingredients Cost:</span>
            <span className="text-xl font-bold text-primary">₹{totalCost.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Section */}
      {recipe.instructions && (
        <Card className="glass border-0 shadow-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              Cooking Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recipe.instructions.split("\n").map((instruction, index) => {
                const trimmedInstruction = instruction.trim();
                if (!trimmedInstruction) return null;

                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="body-large text-foreground leading-relaxed">
                        {trimmedInstruction}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Metadata */}
      {!isPrintMode && (recipe.createdAt || recipe.updatedAt) && (
        <Card className="glass border-0 shadow-modern">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center body-small text-muted-foreground">
              {recipe.createdAt && (
                <p>
                  Created on {new Date(recipe.createdAt).toLocaleDateString()}
                </p>
              )}
              {recipe.updatedAt && (
                <p>
                  Last updated on {new Date(recipe.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Footer */}
      {isPrintMode && (
        <div className="mt-12 pt-8 border-t border-border text-center body-small text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ChefHat className="w-4 h-4" />
            <span className="font-semibold">Keshav Kitchen Management System</span>
          </div>
          <p>Recipe printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
});

RecipeDetailView.displayName = "RecipeDetailView";